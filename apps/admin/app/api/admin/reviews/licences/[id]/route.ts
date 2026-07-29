import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
  // Staff-corrected fields (approve only)
  name: z.string().optional(),
  licence_number: z.string().optional(),
  expiry_date: z.string().optional(),
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

  const { data: existing, error: fetchErr } = await supabase
    .from('licence_verifications')
    .select('id, user_id, extracted_data, status')
    .eq('id', params.id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Licence verification not found' }, { status: 404 })
  }

  const { action, note, name, licence_number, expiry_date } = parsed.data

  if (action === 'approve') {
    // Merge any staff corrections into extracted_data
    const corrected = {
      ...existing.extracted_data,
      ...(name ? { name } : {}),
      ...(licence_number ? { licence_number } : {}),
      ...(expiry_date ? { expiry_date } : {}),
    }

    const { error: updateErr } = await supabase
      .from('licence_verifications')
      .update({
        status: 'verified',
        admin_override: true,
        admin_note: note ?? null,
        verified_at: new Date().toISOString(),
        extracted_data: corrected,
      })
      .eq('id', params.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Now mark user profile as verified
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({ licence_verified: true })
      .eq('id', existing.user_id)

    if (profileErr) {
      console.error('[reviews/licences] Failed to update user_profiles:', profileErr)
      return NextResponse.json(
        { error: 'Licence marked verified in system but user profile update failed — user not yet verified. Retry or update manually.' },
        { status: 500 }
      )
    }

    void logAudit({ adminId: session.userId, adminEmail: session.email, action: 'licence.approved', resource: 'licence_verifications', resourceId: params.id })
    return NextResponse.json({ success: true, action: 'approved' })
  }

  // Reject
  const { error: rejectErr } = await supabase
    .from('licence_verifications')
    .update({
      status: 'failed',
      admin_override: false,
      admin_note: note ?? null,
    })
    .eq('id', params.id)

  if (rejectErr) {
    return NextResponse.json({ error: rejectErr.message }, { status: 500 })
  }

  void logAudit({ adminId: session.userId, adminEmail: session.email, action: 'licence.rejected', resource: 'licence_verifications', resourceId: params.id, details: { note } })
  return NextResponse.json({ success: true, action: 'rejected' })
}
