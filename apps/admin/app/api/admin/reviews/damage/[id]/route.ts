import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  action: z.enum(['confirm_dispute', 'dismiss', 'partial']),
  note: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await assertAdminSession()
  if (!session.authorized) return session.response

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = createAdminClient()

  const { data: inspection, error: fetchErr } = await supabase
    .from('vehicle_inspections')
    .select('id, booking_id, ai_damage_report, inspection_type')
    .eq('id', params.id)
    .single()

  if (fetchErr || !inspection) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  }

  const { action, note } = parsed.data
  const report = inspection.ai_damage_report as {
    severity?: string; confidence?: number; locations?: string[]
  }

  const now = new Date().toISOString()

  if (action === 'confirm_dispute') {
    const disputeNote = `DISPUTE: Staff confirmed ${report.severity ?? 'unknown'} damage at return (AI ${Math.round((report.confidence ?? 0) * 100)}% confidence). Locations: ${(report.locations ?? []).join(', ')}${note ? `. Staff note: ${note}` : ''}`

    const [inspectionUpdate, bookingUpdate] = await Promise.all([
      supabase
        .from('vehicle_inspections')
        .update({
          admin_override: true,
          admin_override_note: note ?? null,
          admin_override_at: now,
        })
        .eq('id', params.id),
      supabase
        .from('bookings')
        .update({ notes: disputeNote })
        .eq('id', inspection.booking_id),
    ])

    if (inspectionUpdate.error) {
      return NextResponse.json({ error: inspectionUpdate.error.message }, { status: 500 })
    }
    if (bookingUpdate.error) {
      console.error('[reviews/damage] Failed to update booking notes:', bookingUpdate.error)
      return NextResponse.json(
        { error: 'Inspection marked but booking notes failed to save — damage context may be lost.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, action: 'dispute_confirmed' })
  }

  if (action === 'partial') {
    const partialNote = `PARTIAL DISPUTE: Staff found minor damage at return requiring assessment${note ? `. Note: ${note}` : ''}`

    const [inspectionUpdate, bookingUpdate] = await Promise.all([
      supabase
        .from('vehicle_inspections')
        .update({
          admin_override: true,
          admin_override_note: note ?? null,
          admin_override_at: now,
        })
        .eq('id', params.id),
      supabase
        .from('bookings')
        .update({ notes: partialNote })
        .eq('id', inspection.booking_id),
    ])

    if (inspectionUpdate.error) {
      return NextResponse.json({ error: inspectionUpdate.error.message }, { status: 500 })
    }
    if (bookingUpdate.error) {
      console.error('[reviews/damage] Failed to update booking notes:', bookingUpdate.error)
      return NextResponse.json(
        { error: 'Inspection marked but booking notes failed to save — damage context may be lost.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, action: 'partial_dispute' })
  }

  // dismiss — clear any notes, mark as reviewed with no dispute
  const [inspectionUpdate, bookingUpdate] = await Promise.all([
    supabase
      .from('vehicle_inspections')
      .update({
        admin_override: false,
        admin_override_note: note ?? null,
        admin_override_at: now,
      })
      .eq('id', params.id),
    supabase
      .from('bookings')
      .update({ notes: null })
      .eq('id', inspection.booking_id),
  ])

  if (inspectionUpdate.error) {
    return NextResponse.json({ error: inspectionUpdate.error.message }, { status: 500 })
  }
  if (bookingUpdate.error) {
    console.error('[reviews/damage] Failed to clear booking notes:', bookingUpdate.error)
    return NextResponse.json(
      { error: 'Inspection dismissed but booking notes failed to clear.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, action: 'dismissed' })
}
