import { NextRequest, NextResponse } from 'next/server'
import { LicenceOCRResponseSchema } from '@/lib/schemas'
import { callVisionAI } from '@/lib/ai-vision-adapter'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'
import { logAICall, hashInput } from '@/lib/ai-logger'

import { checkDbRateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `You are a driving licence OCR specialist. Extract information from EU/German driving licence photos.

Return ONLY valid JSON with this exact shape:
{
  "name": "full name as printed or null",
  "licence_number": "licence number string or null",
  "expiry_date": "YYYY-MM-DD or null",
  "categories": ["B", "BE"],
  "issuing_country": "DE or null",
  "confidence": 0.0-1.0,
  "name_match": true or false
}

Rules:
- confidence: 0.9+ if all fields clearly readable, 0.6-0.89 if partially readable, <0.6 if image is unclear
- name_match: compare extracted name against the provided booking_first_name and booking_last_name (case-insensitive)
- categories: common EU categories: A, A1, A2, AM, B, B1, BE, C, C1, CE, D, D1, DE
- expiry_date: look for field "4b" or "Ablaufdatum" on EU licences
- issuing_country: field "4a" on EU licences (2-letter ISO code)
- If image is not a driving licence, return confidence: 0.0 and all fields null
- Do NOT include markdown, code fences, or any text outside the JSON`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Licence verification unavailable' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!(await checkDbRateLimit(ip, 'ai/licence', 5, 60_000))) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 })
  }

  let body: {
    image_base64?: string
    media_type?: string
    booking_first_name?: string
    booking_last_name?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { image_base64, media_type, booking_first_name, booking_last_name } = body

  if (!image_base64 || !media_type) {
    return NextResponse.json({ error: 'image_base64 and media_type are required' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(media_type)) {
    return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }

  // Rough size check: base64 is ~4/3 of original; 5MB → ~6.67MB base64
  if (image_base64.length > 7_000_000) {
    return NextResponse.json({ error: 'Image too large. Maximum 5MB.' }, { status: 413 })
  }

  const { user } = await getUserFromRequest(request)

  const userContext = booking_first_name && booking_last_name
    ? `\n\nBooking driver name to match against: "${booking_first_name} ${booking_last_name}"`
    : '\n\nNo booking name provided — set name_match to false.'

  let rawText: string

  try {
    rawText = await callVisionAI({
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: media_type as 'image/jpeg' | 'image/png' | 'image/webp',
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: `Extract driving licence information from this image.${userContext}`,
            },
          ],
        },
      ],
    })
  } catch (err) {
    console.error('[ai/licence] Vision AI error:', err)
    return NextResponse.json({ error: 'AI verification failed' }, { status: 502 })
  }

  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText, (_, v) => (v === null ? undefined : v))
  } catch {
    console.error('[ai/licence] Non-JSON response:', rawText)
    return NextResponse.json({ error: 'AI returned malformed response' }, { status: 422 })
  }

  const result = LicenceOCRResponseSchema.safeParse(parsed)
  if (!result.success) {
    console.error('[ai/licence] Schema mismatch:', result.error)
    return NextResponse.json({ error: 'AI response schema mismatch' }, { status: 422 })
  }

  const ocr = result.data
  const confidence = ocr.confidence ?? 0

  // Staff must approve — AI never auto-verifies regardless of confidence
  // 'pending' = readable, awaiting staff approval; 'failed' = unreadable
  const status: 'pending' | 'failed' = confidence >= 0.6 ? 'pending' : 'failed'

  // Persist OCR result for staff review — do NOT update user_profiles here
  const supabase = createAdminClient()
  const inputHash = await hashInput(image_base64.slice(0, 100))

  if (user) {
    void supabase.from('licence_verifications').insert({
      user_id: user.id,
      extracted_data: ocr,
      confidence,
      status,
      verified_at: null,
    })
  }

  void logAICall({
    context: 'licence_ocr',
    decision: { status, confidence, name_match: ocr.name_match },
    confidence,
    inputHash,
  })

  // Never return raw extracted_data to client (PII)
  return NextResponse.json({
    status,
    confidence,
    name_match: ocr.name_match,
    licence_number: null,
    expiry_date: status === 'pending' ? ocr.expiry_date : null,
    message:
      status === 'pending'
        ? `Licence submitted for review — staff will verify before your pickup`
        : `Could not read licence clearly — please enter your number manually`,
  })
}
