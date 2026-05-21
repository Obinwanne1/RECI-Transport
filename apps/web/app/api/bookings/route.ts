import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/server'
import { CreateBookingSchema } from '@/lib/schemas'
import { calculatePrice } from '@reci/utils'
import { runCorporateAgent } from '@/lib/corporate-agent'

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

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data

  // Get session user (optional — guest checkout supported)
  const { supabase, user } = await getUserFromRequest(request)

  // Re-check availability (TOCTOU guard)
  const { data: conflictingBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', data.vehicle_id)
    .not('status', 'in', '("cancelled")')
    .lt('pickup_datetime', data.dropoff_datetime)
    .gt('dropoff_datetime', data.pickup_datetime)

  if (conflictingBookings && conflictingBookings.length > 0) {
    return NextResponse.json(
      { error: 'Vehicle no longer available for these dates' },
      { status: 409 }
    )
  }

  const { data: blockConflicts } = await supabase
    .from('availability_blocks')
    .select('id')
    .eq('vehicle_id', data.vehicle_id)
    .lt('start_date', data.dropoff_datetime)
    .gt('end_date', data.pickup_datetime)

  if (blockConflicts && blockConflicts.length > 0) {
    return NextResponse.json(
      { error: 'Vehicle is blocked for these dates' },
      { status: 409 }
    )
  }

  // Fetch vehicle + pricing rule
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, category_id, pricing:pricing_rules(base_rate_per_day)')
    .eq('id', data.vehicle_id)
    .eq('is_active', true)
    .single()

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  const pricingArr = vehicle.pricing as Array<{ base_rate_per_day: number }> | null
  let base_rate_per_day = pricingArr?.[0]?.base_rate_per_day
  if (!base_rate_per_day) {
    return NextResponse.json({ error: 'Pricing not configured for this vehicle' }, { status: 422 })
  }

  // Corporate pricing: if logged-in user has a corporate account, check for custom rate
  let corporateAccountId: string | null = null
  let corporateDiscountPct = 0

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('corporate_account_id')
      .eq('id', user.id)
      .single()

    if (profile?.corporate_account_id) {
      corporateAccountId = profile.corporate_account_id

      // Check for a specific corporate rate for this category
      const { data: corpRate } = await supabase
        .from('corporate_pricing')
        .select('rate_per_day')
        .eq('corporate_account_id', corporateAccountId)
        .eq('category_id', vehicle.category_id)
        .lte('effective_from', new Date().toISOString().split('T')[0])
        .or('effective_to.is.null,effective_to.gte.' + new Date().toISOString().split('T')[0])
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (corpRate) {
        base_rate_per_day = corpRate.rate_per_day
      } else {
        // Fall back to percentage discount from corporate_accounts
        const { data: corpAccount } = await supabase
          .from('corporate_accounts')
          .select('discount_pct')
          .eq('id', corporateAccountId)
          .single()

        corporateDiscountPct = corpAccount?.discount_pct ?? 0
      }
    }
  }

  // Fetch extra details for price calculation
  const extraIds = data.extras.map((e) => e.extra_id)
  const { data: extraRows } = extraIds.length
    ? await supabase.from('extras').select('id, price_per_day, is_one_time_fee').in('id', extraIds)
    : { data: [] }

  const extrasForCalc = (extraRows ?? []).map((row) => {
    const match = data.extras.find((e) => e.extra_id === row.id)
    return {
      price_per_day: row.price_per_day,
      is_one_time_fee: row.is_one_time_fee,
      quantity: match?.quantity ?? 1,
    }
  })

  // Server-side canonical price
  const pricing = calculatePrice({
    base_rate_per_day: base_rate_per_day!,
    pickup_datetime: data.pickup_datetime,
    dropoff_datetime: data.dropoff_datetime,
    extras: extrasForCalc,
    corporate_discount_pct: corporateDiscountPct,
  })

  // Points redemption — only for authenticated users
  const POINTS_TO_EUR = 100
  const MAX_REDEEM_PCT = 0.20
  let pointsRedeemed = 0
  let pointsDiscountEur = 0

  if (user && data.points_redeemed && data.points_redeemed > 0) {
    // Fetch user's current balance
    const { data: loyaltyAccount } = await supabase
      .from('loyalty_accounts')
      .select('points_balance')
      .eq('user_id', user.id)
      .maybeSingle()

    const balance = loyaltyAccount?.points_balance ?? 0
    const maxAllowed = Math.floor((pricing.total * MAX_REDEEM_PCT) * POINTS_TO_EUR)
    pointsRedeemed = Math.min(data.points_redeemed, balance, maxAllowed)
    pointsDiscountEur = pointsRedeemed / POINTS_TO_EUR
  }

  const finalTotal = Math.max(0, pricing.total - pointsDiscountEur)

  // Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      vehicle_id: data.vehicle_id,
      pickup_datetime: data.pickup_datetime,
      dropoff_datetime: data.dropoff_datetime,
      pickup_location_id: data.pickup_location_id,
      dropoff_location_id: data.dropoff_location_id,
      driver_first_name: data.driver_first_name,
      driver_last_name: data.driver_last_name,
      driver_email: data.driver_email,
      driver_phone: data.driver_phone,
      driver_licence_number: data.driver_licence_number ?? null,
      base_price: pricing.base_subtotal,
      extras_price: pricing.extras_subtotal,
      total_price: finalTotal,
      points_redeemed: pointsRedeemed,
      status: 'pending',
      user_id: user?.id ?? null,
      corporate_account_id: corporateAccountId,
    })
    .select('id, booking_ref')
    .single()

  if (bookingError || !booking) {
    console.error('booking insert error:', bookingError)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  // Insert booking_extras
  if (data.extras.length > 0) {
    const extrasInsert = data.extras.map((e) => ({
      booking_id: booking.id,
      extra_id: e.extra_id,
      quantity: e.quantity,
      price_snapshot: e.price_snapshot,
    }))
    const { error: extrasError } = await supabase.from('booking_extras').insert(extrasInsert)
    if (extrasError) {
      console.error('booking_extras insert error:', extrasError)
    }
  }

  // Deduct redeemed points atomically — non-blocking
  if (user && pointsRedeemed > 0) {
    void supabase.rpc('deduct_loyalty_points', {
      p_user_id: user.id,
      p_points: pointsRedeemed,
      p_booking_id: booking.id,
    })
  }

  // Corporate AI policy check — non-blocking, runs after booking is created
  if (corporateAccountId) {
    runCorporateAgent(booking.id).catch((err) =>
      console.error('[bookings] corporate agent error:', err)
    )
  }

  return NextResponse.json(
    {
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      total_price: pricing.total,
      pricing,
    },
    { status: 201 }
  )
}
