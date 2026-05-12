import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { CreatePaymentIntentSchema } from '@/lib/schemas'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
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
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreatePaymentIntentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { booking_id } = parsed.data
  const supabase = createAdminClient()

  // Fetch booking — must exist and be pending
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, booking_ref, status, total_price, driver_email')
    .eq('id', booking_id)
    .single()

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: `Booking is already ${booking.status}` },
      { status: 409 }
    )
  }

  // Check if a PaymentIntent already exists for this booking (idempotency)
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('stripe_payment_intent_id, amount')
    .eq('booking_id', booking_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingPayment?.stripe_payment_intent_id) {
    // Retrieve and return existing intent (handles page refresh)
    const intent = await stripe.paymentIntents.retrieve(
      existingPayment.stripe_payment_intent_id
    )
    return NextResponse.json({
      client_secret: intent.client_secret,
      amount: existingPayment.amount,
      currency: 'eur',
    })
  }

  // Amount in cents — use server-stored total_price, never client value
  const amountCents = Math.round(Number(booking.total_price) * 100)

  // Create PaymentIntent
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    receipt_email: booking.driver_email,
    metadata: {
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
    },
    description: `RECI Transport — ${booking.booking_ref}`,
  })

  // Insert payment row
  const { error: paymentErr } = await supabase.from('payments').insert({
    booking_id: booking.id,
    amount: booking.total_price,
    currency: 'EUR',
    method: 'stripe',
    status: 'pending',
    stripe_payment_intent_id: intent.id,
  })

  if (paymentErr) {
    console.error('[payments/intent] insert error:', paymentErr)
    // Cancel the intent to avoid orphaned charges
    await stripe.paymentIntents.cancel(intent.id)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  return NextResponse.json({
    client_secret: intent.client_secret,
    amount: Number(booking.total_price),
    currency: 'eur',
  })
}
