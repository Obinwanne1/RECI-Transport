import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch all active vehicle categories
  const { data: categories, error: catError } = await supabase
    .from('vehicle_categories')
    .select('id, name')

  if (catError || !categories) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }

  // Compute signals for next 60 days
  const today = new Date()
  const upserts: Array<{
    category_id: string
    date: string
    demand_score: number
    signal_type: 'normal' | 'high' | 'peak'
    vehicles_remaining: number
    computed_at: string
  }> = []

  // Batch-fetch all active vehicles in one query
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('id, category_id')
    .eq('is_active', true)

  // Group vehicle IDs by category
  const fleetByCategory = new Map<string, string[]>()
  for (const v of allVehicles ?? []) {
    const arr = fleetByCategory.get(v.category_id) ?? []
    arr.push(v.id)
    fleetByCategory.set(v.category_id, arr)
  }

  // Batch-fetch all relevant bookings for the full 60-day window
  const windowEnd = new Date(today)
  windowEnd.setDate(today.getDate() + 60)
  const allVehicleIds = (allVehicles ?? []).map((v) => v.id)

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('vehicle_id, pickup_datetime, dropoff_datetime')
    .not('status', 'in', '("cancelled","no_show")')
    .lt('pickup_datetime', windowEnd.toISOString())
    .gt('dropoff_datetime', today.toISOString())
    .in('vehicle_id', allVehicleIds.length > 0 ? allVehicleIds : ['00000000-0000-0000-0000-000000000000'])

  for (const category of categories) {
    const vehicleIds = fleetByCategory.get(category.id) ?? []
    const fleetSize = vehicleIds.length
    if (fleetSize === 0) continue

    const vehicleIdSet = new Set(vehicleIds)

    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date(today)
      date.setDate(today.getDate() + dayOffset)
      const dateStr = date.toISOString().split('T')[0]
      const nextDateStr = new Date(date.getTime() + 86_400_000).toISOString().split('T')[0]

      // Count bookings overlapping this date using in-memory data
      const bookingCount = (allBookings ?? []).filter(
        (b) =>
          vehicleIdSet.has(b.vehicle_id) &&
          b.pickup_datetime < nextDateStr &&
          b.dropoff_datetime > dateStr
      ).length

      const booked = bookingCount ?? 0
      const demandScore = fleetSize > 0 ? booked / fleetSize : 0
      const vehiclesRemaining = Math.max(0, fleetSize - booked)

      let signalType: 'normal' | 'high' | 'peak' = 'normal'
      if (demandScore >= 0.8) signalType = 'peak'
      else if (demandScore >= 0.5) signalType = 'high'

      upserts.push({
        category_id: category.id,
        date: dateStr,
        demand_score: demandScore,
        signal_type: signalType,
        vehicles_remaining: vehiclesRemaining,
        computed_at: new Date().toISOString(),
      })
    }
  }

  // Batch upsert in chunks of 100
  const CHUNK = 100
  let inserted = 0
  for (let i = 0; i < upserts.length; i += CHUNK) {
    const chunk = upserts.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('pricing_signals')
      .upsert(chunk, { onConflict: 'category_id,date' })

    if (error) {
      console.error('[cron/pricing-signals] upsert error:', error)
    } else {
      inserted += chunk.length
    }
  }

  // Daily reset of api_keys request counter
  await supabase
    .from('api_keys')
    .update({ requests_today: 0, last_reset_at: today.toISOString().split('T')[0] })
    .lt('last_reset_at', today.toISOString().split('T')[0])

  return NextResponse.json({
    success: true,
    categories: categories.length,
    signals_upserted: inserted,
  })
}
