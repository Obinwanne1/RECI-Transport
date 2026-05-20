import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { DamageDetectionRequestSchema, DamageReportSchema } from '@/lib/schemas'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'
import { logAICall } from '@/lib/ai-logger'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const ipCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const SYSTEM_PROMPT = `You are an expert automotive damage inspector for a vehicle rental company.
Your job is to carefully compare vehicle photos and identify any new damage.

Return ONLY valid JSON with this exact shape:
{
  "new_damage": true or false,
  "severity": "none" | "minor" | "major",
  "locations": ["specific location descriptions"],
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation of your assessment",
  "needs_human_review": true or false
}

Rules:
- new_damage: true only if you can identify damage that was NOT present in the baseline (pickup) photos
- For pickup inspection (no baseline): assess existing condition, new_damage should be false
- severity: "none" = no damage; "minor" = scratches <5cm, small scuffs; "major" = dents, cracks, broken parts
- locations: be specific, e.g. "front left bumper", "rear right door panel", "windscreen lower left"
- confidence: 0.9+ if damage is clearly visible, 0.6-0.89 if partially visible/ambiguous, <0.6 if photos are unclear
- needs_human_review: true if confidence < 0.7, or if damage is borderline minor/major
- Be conservative — only flag damage you are highly confident about. Dust, reflections, and normal wear are NOT damage.
- Do NOT include markdown, code fences, or any text outside the JSON`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Damage inspection unavailable' }, { status: 503 })
  }

  const { user } = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again in a moment.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const input = DamageDetectionRequestSchema.safeParse(body)
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid request', details: input.error.flatten() }, { status: 400 })
  }

  const { booking_id, inspection_type, photo_urls, baseline_photo_urls } = input.data

  // Verify booking exists and belongs to user
  const supabase = createAdminClient()
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, user_id')
    .eq('id', booking_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build vision message content
  const angles = ['front', 'back', 'left', 'right']
  type MessageContent = Anthropic.ImageBlockParam | Anthropic.TextBlockParam

  const messageContent: MessageContent[] = []

  if (inspection_type === 'return' && baseline_photo_urls && baseline_photo_urls.length > 0) {
    messageContent.push({
      type: 'text',
      text: 'PICKUP photos (baseline — vehicle condition at start of rental):',
    })
    baseline_photo_urls.forEach((url, i) => {
      const angle = angles[i] ?? `angle-${i + 1}`
      messageContent.push({ type: 'text', text: `PICKUP - ${angle.toUpperCase()}:` })
      messageContent.push({ type: 'image', source: { type: 'url', url } })
    })

    messageContent.push({
      type: 'text',
      text: 'RETURN photos (compare against pickup photos above to identify NEW damage):',
    })
    photo_urls.forEach((url, i) => {
      const angle = angles[i] ?? `angle-${i + 1}`
      messageContent.push({ type: 'text', text: `RETURN - ${angle.toUpperCase()}:` })
      messageContent.push({ type: 'image', source: { type: 'url', url } })
    })

    messageContent.push({
      type: 'text',
      text: 'Compare the PICKUP and RETURN photos carefully. Identify any new damage that was NOT present at pickup.',
    })
  } else {
    messageContent.push({
      type: 'text',
      text: `Vehicle ${inspection_type} inspection photos. Document current condition:`,
    })
    photo_urls.forEach((url, i) => {
      const angle = angles[i] ?? `angle-${i + 1}`
      messageContent.push({ type: 'text', text: `${angle.toUpperCase()}:` })
      messageContent.push({ type: 'image', source: { type: 'url', url } })
    })
    messageContent.push({
      type: 'text',
      text: 'Assess the current vehicle condition. This is a pickup inspection so there is no baseline for comparison.',
    })
  }

  const client = new Anthropic()
  let rawText: string

  try {
    const message = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
      },
      { signal: AbortSignal.timeout(30_000) }
    )

    const block = message.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    rawText = block.text
  } catch (err) {
    console.error('[ai/damage] Claude API error:', err)
    return NextResponse.json({ error: 'Damage inspection failed' }, { status: 502 })
  }

  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText, (_, v) => (v === null ? undefined : v))
  } catch {
    console.error('[ai/damage] Non-JSON response:', rawText)
    return NextResponse.json({ error: 'AI returned malformed response' }, { status: 422 })
  }

  const result = DamageReportSchema.safeParse(parsed)
  if (!result.success) {
    console.error('[ai/damage] Schema mismatch:', result.error)
    return NextResponse.json({ error: 'AI response schema mismatch' }, { status: 422 })
  }

  const report = result.data
  const needsReview = report.confidence < 0.7 || report.needs_human_review === true
  const autoDispute = report.new_damage && report.confidence >= 0.7

  // Save inspection record
  const { error: insertError } = await supabase.from('vehicle_inspections').insert({
    booking_id,
    inspection_type,
    photo_urls,
    ai_damage_report: {
      ...report,
      needs_human_review: needsReview,
      auto_dispute_raised: autoDispute,
    },
  })

  if (insertError) {
    console.error('[ai/damage] Failed to save inspection:', insertError)
  }

  // Raise dispute flag on booking
  if (autoDispute) {
    const disputeNote = `DISPUTE: AI detected ${report.severity} damage at return (${Math.round(report.confidence * 100)}% confidence). Locations: ${report.locations.join(', ')}`
    await supabase
      .from('bookings')
      .update({ notes: disputeNote })
      .eq('id', booking_id)
  } else if (needsReview && report.new_damage) {
    await supabase
      .from('bookings')
      .update({ notes: `REVIEW NEEDED: AI flagged possible damage (${Math.round(report.confidence * 100)}% confidence)` })
      .eq('id', booking_id)
  }

  void logAICall({
    bookingId: booking_id,
    context: `damage_detection_${inspection_type}`,
    decision: {
      new_damage: report.new_damage,
      severity: report.severity,
      confidence: report.confidence,
      auto_dispute: autoDispute,
    },
    confidence: report.confidence,
  })

  return NextResponse.json({
    ...report,
    needs_human_review: needsReview,
    dispute_raised: autoDispute,
  })
}
