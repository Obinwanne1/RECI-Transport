import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/server'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

const MOCK_VEHICLES = [
  { id: 'mock-1', make: 'Volkswagen', model: 'Golf', year: 2023, fuel_type: 'petrol', transmission: 'manual', image_urls: [], daily_rate: 49, is_active: true, location_id: null, features: [], category_id: 'cat-1', category: { id: 'cat-1', name: 'Economy', slug: 'economy', passenger_capacity: 5, luggage_capacity: 2 } },
  { id: 'mock-2', make: 'BMW', model: '3 Series', year: 2023, fuel_type: 'diesel', transmission: 'automatic', image_urls: [], daily_rate: 89, is_active: true, location_id: null, features: ['GPS', 'Heated seats'], category_id: 'cat-2', category: { id: 'cat-2', name: 'Compact', slug: 'compact', passenger_capacity: 5, luggage_capacity: 3 } },
  { id: 'mock-3', make: 'Toyota', model: 'RAV4', year: 2022, fuel_type: 'hybrid', transmission: 'automatic', image_urls: [], daily_rate: 119, is_active: true, location_id: null, features: ['GPS', 'Roof rails'], category_id: 'cat-3', category: { id: 'cat-3', name: 'SUV', slug: 'suv', passenger_capacity: 7, luggage_capacity: 4 } },
  { id: 'mock-4', make: 'Mercedes', model: 'Sprinter', year: 2022, fuel_type: 'diesel', transmission: 'manual', image_urls: [], daily_rate: 149, is_active: true, location_id: null, features: ['Cargo space'], category_id: 'cat-4', category: { id: 'cat-4', name: 'Van', slug: 'van', passenger_capacity: 3, luggage_capacity: 12 } },
  { id: 'mock-5', make: 'Renault', model: 'Clio', year: 2023, fuel_type: 'electric', transmission: 'automatic', image_urls: [], daily_rate: 59, is_active: true, location_id: null, features: ['Fast charge'], category_id: 'cat-1', category: { id: 'cat-1', name: 'Economy', slug: 'economy', passenger_capacity: 5, luggage_capacity: 2 } },
  { id: 'mock-6', make: 'Audi', model: 'Q5', year: 2023, fuel_type: 'petrol', transmission: 'automatic', image_urls: [], daily_rate: 139, is_active: true, location_id: null, features: ['GPS', 'Panoramic roof'], category_id: 'cat-3', category: { id: 'cat-3', name: 'SUV', slug: 'suv', passenger_capacity: 5, luggage_capacity: 4 } },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pickup_date = searchParams.get('pickup_date')
  const dropoff_date = searchParams.get('dropoff_date')
  const location_id = searchParams.get('location_id')
  const category_slug = searchParams.get('category_slug')

  if (!SUPABASE_CONFIGURED) {
    const filtered = category_slug
      ? MOCK_VEHICLES.filter((v) => v.category.slug === category_slug)
      : MOCK_VEHICLES
    return NextResponse.json(filtered)
  }

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
      category:vehicle_categories(
        *,
        pricing:pricing_rules(base_rate_per_day)
      )
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
    const cat = v.category as { pricing?: Array<{ base_rate_per_day: number }> } | null
    const baseRate = cat?.pricing?.[0]?.base_rate_per_day ?? null

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
