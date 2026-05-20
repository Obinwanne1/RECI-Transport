import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category_id = searchParams.get('category_id')
  const start_date = searchParams.get('start_date')
  const end_date = searchParams.get('end_date')

  if (!category_id || !start_date || !end_date) {
    return NextResponse.json({ signal: 'normal', surcharge_pct: 0, message: null })
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(category_id)) {
    return NextResponse.json({ signal: 'normal', surcharge_pct: 0, message: null })
  }

  const supabase = await createClient()

  // Count active bookings in window for this category
  const [{ count: bookingCount }, { data: fleet }, { data: overrides }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("cancelled")')
      .lt('pickup_datetime', end_date)
      .gt('dropoff_datetime', start_date)
      .in(
        'vehicle_id',
        // subquery not supported — fetch vehicle IDs for category first
        (
          await supabase
            .from('vehicles')
            .select('id')
            .eq('category_id', category_id)
            .eq('is_active', true)
        ).data?.map((v) => v.id) ?? []
      ),

    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category_id)
      .eq('is_active', true),

    supabase
      .from('pricing_overrides')
      .select('surcharge_pct, name')
      .or(`category_id.eq.${category_id},category_id.is.null`)
      .lte('start_date', end_date)
      .gte('end_date', start_date)
      .order('surcharge_pct', { ascending: false })
      .limit(1),
  ])

  const fleetSize = (fleet as unknown as { count: number } | null)?.count ?? 0
  const booked = bookingCount ?? 0
  const realtimeDemandRatio = fleetSize > 0 ? booked / fleetSize : 0
  const vehiclesRemaining = Math.max(0, fleetSize - booked)

  // Check pre-computed signals (higher confidence from batch computation)
  const { data: precomputed } = await supabase
    .from('pricing_signals')
    .select('demand_score, signal_type, vehicles_remaining')
    .eq('category_id', category_id)
    .gte('date', start_date)
    .lte('date', end_date)
    .order('demand_score', { ascending: false })
    .limit(1)

  const precomputedSignal = precomputed?.[0]
  const demandRatio = precomputedSignal
    ? Math.max(realtimeDemandRatio, precomputedSignal.demand_score)
    : realtimeDemandRatio

  const remaining = precomputedSignal?.vehicles_remaining ?? vehiclesRemaining

  const topOverride = overrides?.[0]
  const surchargePct = topOverride?.surcharge_pct ?? 0

  let signal: 'normal' | 'high' | 'peak' = 'normal'
  let message: string | null = null

  if (demandRatio >= 0.8 || surchargePct > 15) {
    signal = 'peak'
    message = remaining <= 3
      ? `Peak demand — only ${remaining} left for these dates`
      : `Peak demand — prices are at their highest for these dates`
  } else if (demandRatio >= 0.5 || surchargePct > 0) {
    signal = 'high'
    message = topOverride?.name
      ? `${topOverride.name} — prices elevated for these dates`
      : remaining <= 3
      ? `High demand — only ${remaining} available for these dates`
      : `High demand for these dates — lock in your rate now`
  }

  return NextResponse.json({ signal, surcharge_pct: surchargePct, message, vehicles_remaining: remaining })
}
