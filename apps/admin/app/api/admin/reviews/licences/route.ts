import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'
import { SUPABASE_CONFIGURED } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ licences: [], total: 0 })
  }

  const session = await assertAdminSession()
  if (!session.authorized) return session.response

  const supabase = createAdminClient()

  const { data, error, count } = await supabase
    .from('licence_verifications')
    .select(
      `id, user_id, confidence, status, created_at, extracted_data,
       profile:user_profiles!inner(first_name, last_name, email)`,
      { count: 'exact' }
    )
    .eq('status', 'pending')
    .is('admin_override', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ licences: data ?? [], total: count ?? 0 })
}
