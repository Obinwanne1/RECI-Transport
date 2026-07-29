import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await assertAdminSession()
  if (!session.authorized) return session.response

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = createAdminClient()

  let query = supabase
    .from('user_profiles')
    .select(
      `id, first_name, last_name, email, role, phone, licence_verified, created_at,
       corporate:corporate_accounts(company_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    const safe = search.replace(/[^a-zA-Z0-9 @.\-]/g, '').slice(0, 100)
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ customers: data, total: count ?? 0, page, per_page: perPage })
}
