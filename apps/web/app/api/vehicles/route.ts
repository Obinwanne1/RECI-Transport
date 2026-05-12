import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pickup_date = searchParams.get('pickup_date')
  const dropoff_date = searchParams.get('dropoff_date')
  const location_id = searchParams.get('location_id')
  const category_slug = searchParams.get('category_slug')

  const { supabase, user } = await getUserFromRequest(request)

  // Check if authed user has corporate account (for custom rates)
  let corporateAccountId: string | null = null
  let corporateDiscountPct = 0
  let corporatePricingMap: Map<string, number> = new Map() // category_id → rate

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('corporate_account_id')
      .eq('id', user.id)
      .single()

    if (profile?.corporate_account_id) {
      corporateAccountId = profile.corporate_account_id

      const { data: corpAccount } = await supabase
        .from('corporate_accounts')
        .select('discount_pct')
        .eq('id', corporateAccountId)
        .single()
      corporateDiscountPct = corpAccount?.discount_pct ?? 0

      const { data: corpRates } = await supabase
        .from('corporate_pricing')
        .select('category_id, rate_per_day')
        .eq('corporate_account_id', corporateAccountId)
        .lte('effective_from', new Date().toISOString().split('T')[0])
        .or('effective_to.is.null,effective_to.gte.' + new Date().toISOString().split('T')[0])

      corporatePricingMap = new Map(
        (corpRates ?? []).map((r) => [r.category_id, r.rate_per_day])
      )
    }
  }

  // Base query — join category + pricing_rules for daily_rate
  let query = supabase
    .from('vehicles')
    .select(`
      *,
      category:vehicle_categories(*),
      pricing:pricing_rules(base_rate_per_day)
    `)
    .eq('is_active', true)

  if (location_id) query = query.eq('location_id', location_id)

  const { data: vehicles, error } = await query

  if (error) {
    console.error('vehicles query error:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }

  let available = vehicles ?? []

  if (pickup_date && dropoff_date) {
    const pickupTs = new Date(pickup_date).toISOString()
    const dropoffTs = new Date(dropoff_date).toISOString()

    const { data: bookedRows } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .not('status', 'in', '("cancelled")')
      .lt('pickup_datetime', dropoffTs)
      .gt('dropoff_datetime', pickupTs)

    const { data: blockedRows } = await supabase
      .from('availability_blocks')
      .select('vehicle_id')
      .lt('start_date', dropoffTs)
      .gt('end_date', pickupTs)

    const unavailableIds = new Set([
      ...(bookedRows ?? []).map((r) => r.vehicle_id),
      ...(blockedRows ?? []).map((r) => r.vehicle_id),
    ])

    available = available.filter((v) => !unavailableIds.has(v.id))
  }

  // Attach daily_rate — corporate rate takes precedence over pricing_rules
  const result = available.map((v) => {
    const pricingArr = v.pricing as Array<{ base_rate_per_day: number }> | null
    const baseRate = pricingArr?.[0]?.base_rate_per_day ?? null

    let daily_rate = baseRate
    if (corporateAccountId && baseRate !== null) {
      const corpSpecificRate = corporatePricingMap.get(v.category_id)
      if (corpSpecificRate !== undefined) {
        daily_rate = corpSpecificRate
      } else if (corporateDiscountPct > 0) {
        daily_rate = Math.round(baseRate * (1 - corporateDiscountPct / 100) * 100) / 100
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pricing, ...vehicle } = v
    return { ...vehicle, daily_rate }
  })

  const filtered = category_slug
    ? result.filter((v) => (v.category as { slug: string } | null)?.slug === category_slug)
    : result

  return NextResponse.json(filtered)
}
