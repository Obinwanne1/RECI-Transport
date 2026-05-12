import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: pickupsToday },
    { data: revenueData },
    { count: activeBookings },
    { count: fleetTotal },
    { count: pendingPayment },
    { data: vehiclesData },
    { data: blockedData },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('pickup_datetime', `${todayStr}T00:00:00`)
      .lte('pickup_datetime', `${todayStr}T23:59:59`)
      .in('status', ['confirmed', 'active']),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', monthStart),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'active']),
    supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('vehicles').select('id').eq('is_active', true),
    supabase
      .from('availability_blocks')
      .select('vehicle_id')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr),
  ])

  const revenueThisMonth = (revenueData ?? []).reduce(
    (sum, r) => sum + Number(r.amount),
    0
  )

  const blockedVehicleIds = new Set((blockedData ?? []).map((b) => b.vehicle_id))
  const activeBookingVehicles = new Set<string>()
  // Count vehicles with active bookings today
  const { data: activeTodayVehicles } = await supabase
    .from('bookings')
    .select('vehicle_id')
    .in('status', ['active'])
    .lte('pickup_datetime', `${todayStr}T23:59:59`)
    .gte('dropoff_datetime', `${todayStr}T00:00:00`)
  ;(activeTodayVehicles ?? []).forEach((b) => activeBookingVehicles.add(b.vehicle_id))

  const totalActive = fleetTotal ?? 0
  const unavailable = blockedVehicleIds.size + activeBookingVehicles.size
  const fleetAvailableToday = Math.max(0, totalActive - unavailable)
  const utilisationPct = totalActive > 0
    ? Math.round(((totalActive - fleetAvailableToday) / totalActive) * 100)
    : 0

  return NextResponse.json({
    pickups_today: pickupsToday ?? 0,
    revenue_this_month: revenueThisMonth,
    active_bookings: activeBookings ?? 0,
    fleet_total: fleetTotal ?? 0,
    fleet_available_today: fleetAvailableToday,
    utilisation_pct: utilisationPct,
    pending_payment: pendingPayment ?? 0,
  })
}
