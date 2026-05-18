import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TripCopilotRequestSchema, TripCopilotResponseSchema } from '@/lib/schemas'
import { logAICall } from '@/lib/ai-logger'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
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

const SYSTEM_PROMPT = `You are a Berlin-based travel planning assistant for RECI Transport.
You help customers plan their rental trip with practical, specific advice.

Return ONLY valid JSON with this exact shape:
{
  "route_summary": "2-3 sentence overview of the trip starting from RECI HQ Berlin",
  "estimated_fuel_cost_eur": number or null,
  "top_stops": [
    { "name": "stop name", "description": "1 sentence why it's worth a visit" },
    { "name": "stop name", "description": "..." },
    { "name": "stop name", "description": "..." }
  ],
  "parking_tips": "practical parking advice for the destination or Berlin return",
  "fuel_note": "relevant fuel/charging note or null"
}

Rules:
- estimated_fuel_cost_eur: estimate based on ~100km round trip if no destination given, null if electric
- For electric vehicles: set estimated_fuel_cost_eur to null, fuel_note should mention charging stations
- top_stops: always exactly 3, relevant to Germany/Berlin area day trips
- parking_tips: specific and practical (e.g. "Parkhaus Am Sandtorkai, Hamburg — €2/hr, close to waterfront")
- Do NOT include markdown, code fences, or any text outside the JSON`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Trip planning unavailable' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const input = TripCopilotRequestSchema.safeParse(body)
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid request', details: input.error.flatten() }, { status: 400 })
  }

  const { booking_id, pickup_location, fuel_type, pickup_date, dropoff_date, vehicle_name } = input.data

  const userMessage = `Plan a trip for this rental:
Vehicle: ${vehicle_name} (${fuel_type})
Pickup: ${pickup_location}
Rental period: ${pickup_date} to ${dropoff_date}
Fuel type: ${fuel_type}

Please provide a route summary from Berlin, fuel cost estimate, 3 recommended stops, parking tips, and any relevant fuel notes.`

  const client = new Anthropic()
  let rawText: string

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = message.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    rawText = block.text
  } catch (err) {
    console.error('[ai/trip] Claude API error:', err)
    return NextResponse.json({ error: 'Trip planning failed' }, { status: 502 })
  }

  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText, (_, v) => (v === null ? undefined : v))
  } catch {
    console.error('[ai/trip] Non-JSON response:', rawText)
    return NextResponse.json({ error: 'AI returned malformed response' }, { status: 422 })
  }

  const result = TripCopilotResponseSchema.safeParse(parsed)
  if (!result.success) {
    console.error('[ai/trip] Schema mismatch:', result.error)
    return NextResponse.json({ error: 'AI response schema mismatch' }, { status: 422 })
  }

  void logAICall({
    bookingId: booking_id,
    context: 'trip_copilot',
    decision: { fuel_type, vehicle_name },
  })

  return NextResponse.json(result.data)
}
