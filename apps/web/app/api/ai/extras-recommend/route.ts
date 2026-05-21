import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserFromRequest } from '@/lib/supabase/server'

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

export type ExtraRecommendation = {
  extra_id: string
  priority: 'high' | 'medium'
  reason: string
}

export type ExtrasRecommendResponse = {
  recommendations: ExtraRecommendation[]
}

type ExtraInput = {
  id: string
  name: string
  description: string | null
  exclusive_group: string | null
}

type RequestBody = {
  vehicle_category: string   // economy | compact | suv | van
  fuel_type: string          // petrol | diesel | electric | hybrid
  days: number
  passenger_count?: number
  extras: ExtraInput[]
}

const SYSTEM_PROMPT = `You are a car rental extras advisor. Given a customer's trip profile and the available add-ons, recommend the most relevant extras.

Return ONLY valid JSON with this exact shape:
{
  "recommendations": [
    { "extra_id": "string", "priority": "high" | "medium", "reason": "one short sentence why this fits their trip" }
  ]
}

Rules:
- Only include extras that genuinely suit the trip — do not recommend everything
- "high" priority: strongly suits this specific trip profile
- "medium" priority: useful but optional
- reason: ≤ 10 words, specific to their trip (e.g. "Essential for 7-day van move", "Useful for SUV family road trip")
- Never recommend the basic/cheapest insurance if a better one exists — recommend the best fit
- Electric vehicles: always high-priority any charging/EV related extras
- Vans: always high-priority any cargo/loading extras
- 3+ days: GPS and full insurance become high priority
- Do NOT include markdown, code fences, or any text outside the JSON`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ recommendations: [] })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ recommendations: [] }) // Soft fail — extras page still works without AI
  }

  const { user } = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ recommendations: [] })
  }

  const { vehicle_category, fuel_type, days, passenger_count, extras } = body

  if (!extras || extras.length === 0) return NextResponse.json({ recommendations: [] })

  const tripProfile = `Vehicle: ${vehicle_category} (${fuel_type})
Rental duration: ${days} day${days !== 1 ? 's' : ''}
Passengers: ${passenger_count ?? 'unknown'}

Available extras (return recommendations using exact extra_id values):
${extras.map((e) => `- id="${e.id}" name="${e.name}" group="${e.exclusive_group ?? 'addon'}" description="${e.description ?? ''}"`).join('\n')}`

  const client = new Anthropic()
  let rawText: string

  try {
    const message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001', // Fast + cheap — this runs on every extras page load
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: tripProfile }],
      },
      { signal: AbortSignal.timeout(10_000) }
    )
    const block = message.content[0]
    if (block.type !== 'text') return NextResponse.json({ recommendations: [] })
    rawText = block.text
  } catch (err) {
    console.error('[ai/extras-recommend] Claude error:', err)
    return NextResponse.json({ recommendations: [] }) // Soft fail
  }

  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    console.error('[ai/extras-recommend] Non-JSON:', rawText)
    return NextResponse.json({ recommendations: [] })
  }

  const data = parsed as ExtrasRecommendResponse
  if (!Array.isArray(data?.recommendations)) {
    return NextResponse.json({ recommendations: [] })
  }

  // Validate each recommendation references a real extra_id
  const validIds = new Set(extras.map((e) => e.id))
  const safe = data.recommendations.filter(
    (r) =>
      typeof r.extra_id === 'string' &&
      validIds.has(r.extra_id) &&
      (r.priority === 'high' || r.priority === 'medium') &&
      typeof r.reason === 'string'
  )

  return NextResponse.json({ recommendations: safe } satisfies ExtrasRecommendResponse)
}
