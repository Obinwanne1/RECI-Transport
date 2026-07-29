import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'
import { SUPABASE_CONFIGURED } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ inspections: [], total: 0 })
  }

  const session = await assertAdminSession()
  if (!session.authorized) return session.response

  const supabase = createAdminClient()

  // Fetch inspections where AI detected damage (pending_review=true) and staff hasn't acted yet
  const { data, error, count } = await supabase
    .from('vehicle_inspections')
    .select(
      `id, booking_id, inspection_type, photo_urls, ai_damage_report, created_at,
       booking:bookings!inner(booking_ref, driver_first_name, driver_last_name, driver_email, notes,
         vehicle:vehicles(make, model, year, registration_plate))`,
      { count: 'exact' }
    )
    .eq('ai_damage_report->>pending_review', 'true')
    .is('admin_override', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inspections: data ?? [], total: count ?? 0 })
}
