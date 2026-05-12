import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled', 'no_show'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  payment_failed: ['pending', 'cancelled'],
}

const PatchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles(*, category:vehicle_categories(name)),
      extras:booking_extras(quantity, price_snapshot, extra:extras(name, price)),
      payment:payments(amount, status, stripe_payment_intent_id, paid_at)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', params.id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (parsed.data.status) {
    const allowed = VALID_TRANSITIONS[existing.status] ?? []
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 409 }
      )
    }
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
