import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

// GDPR Article 17 — right to erasure
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Check for active/upcoming bookings — cannot delete during active rental
  const { data: activeBookings } = await admin
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed', 'active'])
    .limit(1)

  if (activeBookings && activeBookings.length > 0) {
    return NextResponse.json(
      { error: 'Account cannot be deleted while bookings are pending, confirmed, or active. Contact support@reci-transport.com.' },
      { status: 409 }
    )
  }

  // Anonymise PII in historical bookings (legal retention obligation — keep booking records, remove identity)
  const { error: bookingErr } = await admin
    .from('bookings')
    .update({ user_id: null })
    .eq('user_id', user.id)

  if (bookingErr) {
    return NextResponse.json({ error: 'Failed to anonymise booking records' }, { status: 500 })
  }

  // Delete user profile
  const { error: profileErr } = await admin
    .from('user_profiles')
    .delete()
    .eq('id', user.id)

  if (profileErr) {
    return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 })
  }

  // Delete auth account (must be last — this invalidates the session)
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id)

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete auth account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
