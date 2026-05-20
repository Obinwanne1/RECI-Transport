import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ConversationalSearchResponseSchema } from '@/lib/schemas'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
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

const SYSTEM_PROMPT = `You are a vehicle rental search assistant for RECI Transport.
Extract structured search parameters from natural language queries.

Today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY valid JSON matching this exact schema:
{
  "params": {
    "pickup_date": "YYYY-MM-DD or null",
    "dropoff_date": "YYYY-MM-DD or null",
    "category_slug": "economy|compact|suv|van or null",
    "passenger_capacity": number or null,
    "fuel_type": "petrol|diesel|electric|hybrid or null",
    "transmission": "manual|automatic or null"
  },
  "message": "friendly confirmation of what you understood (1 sentence, match user language)",
  "confidence": 0.0-1.0
}

Rules:
- Infer category from context: "van", "Transporter", "moving" → van; "family", "SUV", "space" → suv; "city", "small", "cheap" → economy
- Relative dates: "next Friday" → calculate from today; "this weekend" → next Sat to Sun
- If user mentions people count, set passenger_capacity
- Confidence < 0.5 if query is very ambiguous
- message language must match user's language (German query → German reply)
- Return null for fields you cannot determine
- Do NOT include pickup_location_id (always Berlin HQ for now)`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI search unavailable' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: { query?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }
  if (query.length > 500) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  const client = new Anthropic()

  let rawText: string
  try {
    const message = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: query }],
      },
      { signal: AbortSignal.timeout(15_000) }
    )
    const block = message.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }
    rawText = block.text
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'AI search failed' }, { status: 502 })
  }

  // Strip markdown code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    // Strip null values — schema uses .optional() which accepts undefined, not null
    parsed = JSON.parse(jsonText, (_, v) => (v === null ? undefined : v))
  } catch {
    console.error('Claude returned non-JSON:', rawText)
    return NextResponse.json({ error: 'AI returned malformed response' }, { status: 422 })
  }

  const result = ConversationalSearchResponseSchema.safeParse(parsed)
  if (!result.success) {
    console.error('Claude response failed schema validation:', result.error)
    return NextResponse.json({ error: 'AI response schema mismatch' }, { status: 422 })
  }

  return NextResponse.json(result.data)
}
