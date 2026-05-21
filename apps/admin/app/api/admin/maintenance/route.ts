import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// Thresholds (km since last service)
const THRESHOLD_WARNING  = 8_000
const THRESHOLD_ALERT    = 12_000
const THRESHOLD_CRITICAL = 18_000

type Severity = 'warning' | 'alert' | 'critical'

interface FlaggedVehicle {
  id: string
  make: string
  model: string
  year: number
  registration_plate: string
  fuel_type: string
  mileage: number
  last_service_mileage: number | null
  last_service_date: string | null
  km_since_service: number
  severity: Severity
  category: { name: string } | null
  location: { name: string } | null
  ai_note?: string
}

function getSeverity(km: number): Severity | null {
  if (km >= THRESHOLD_CRITICAL) return 'critical'
  if (km >= THRESHOLD_ALERT)    return 'alert'
  if (km >= THRESHOLD_WARNING)  return 'warning'
  return null
}

async function generateAiNote(vehicles: FlaggedVehicle[]): Promise<Map<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const notes = new Map<string, string>()
  if (!apiKey || vehicles.length === 0) return notes

  const client = new Anthropic({ apiKey })

  // Batch all vehicles in one call to save latency
  const vehicleList = vehicles.map((v, i) =>
    `${i + 1}. ${v.year} ${v.make} ${v.model} (${v.fuel_type}, ${v.mileage.toLocaleString()} km total, ` +
    `${v.km_since_service.toLocaleString()} km since last service, severity: ${v.severity})`
  ).join('\n')

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are a fleet maintenance advisor. For each vehicle below, write one concise sentence (max 20 words) recommending the most urgent maintenance action. Reply as a JSON array of strings in the same order as the input list.

Vehicles:
${vehicleList}

Reply with only a JSON array, no extra text. Example: ["Oil change overdue — schedule immediately.", "Full service required — book within 1 week."]`,
      }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '[]'
    const parsed: string[] = JSON.parse(text)
    vehicles.forEach((v, i) => {
      if (parsed[i]) notes.set(v.id, parsed[i])
    })
  } catch (err) {
    console.error('[maintenance] AI note generation failed:', err)
  }

  return notes
}

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id, make, model, year, registration_plate, fuel_type,
      mileage, last_service_mileage, last_service_date, is_active,
      category:vehicle_categories(name),
      location:locations(name)
    `)
    .eq('is_active', true)
    .order('mileage', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flag vehicles exceeding thresholds
  const flagged: FlaggedVehicle[] = []

  for (const v of vehicles ?? []) {
    const mileage = v.mileage ?? 0
    const lastService = v.last_service_mileage ?? 0
    const kmSince = mileage - lastService
    const severity = getSeverity(kmSince)
    if (!severity) continue

    const cat = Array.isArray(v.category) ? v.category[0] : v.category
    const loc = Array.isArray(v.location) ? v.location[0] : v.location

    flagged.push({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      registration_plate: v.registration_plate,
      fuel_type: v.fuel_type,
      mileage,
      last_service_mileage: v.last_service_mileage,
      last_service_date: v.last_service_date,
      km_since_service: kmSince,
      severity,
      category: cat ?? null,
      location: loc ?? null,
    })
  }

  // Sort: critical first, then alert, then warning
  const ORDER: Record<Severity, number> = { critical: 0, alert: 1, warning: 2 }
  flagged.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])

  // Generate AI notes for flagged vehicles (cap at 20 to avoid long latency)
  const aiNotes = await generateAiNote(flagged.slice(0, 20))
  flagged.forEach((v) => { v.ai_note = aiNotes.get(v.id) })

  // Summary counts
  const summary = {
    total_flagged: flagged.length,
    critical: flagged.filter((v) => v.severity === 'critical').length,
    alert: flagged.filter((v) => v.severity === 'alert').length,
    warning: flagged.filter((v) => v.severity === 'warning').length,
    thresholds: { warning: THRESHOLD_WARNING, alert: THRESHOLD_ALERT, critical: THRESHOLD_CRITICAL },
  }

  return NextResponse.json({ summary, vehicles: flagged })
}

// PATCH: resolve an alert (mark vehicle serviced)
export async function PATCH(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { vehicle_id } = body as { vehicle_id?: string }
  if (!vehicle_id) return NextResponse.json({ error: 'vehicle_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('mileage')
    .eq('id', vehicle_id)
    .single()

  if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

  const { error } = await supabase
    .from('vehicles')
    .update({
      last_service_mileage: vehicle.mileage,
      last_service_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', vehicle_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
