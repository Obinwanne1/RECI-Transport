import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPABASE_CONFIGURED, MOCK_BOOKINGS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  if (!SUPABASE_CONFIGURED) {
    let results = MOCK_BOOKINGS
    if (status && status !== 'all') results = results.filter((b) => b.status === status)
    if (search) results = results.filter((b) => b.booking_ref.includes(search) || b.driver_email.includes(search))
    return NextResponse.json({ bookings: results.slice(from, to + 1), total: results.length, page, per_page: perPage })
  }

  const supabase = createAdminClient()

  let query = supabase
    .from('bookings')
    .select(
      `id, booking_ref, status, total_price, pickup_datetime, dropoff_datetime, created_at,
       driver_first_name, driver_last_name, driver_email,
       vehicle:vehicles(make, model, year, registration_plate)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const safe = search.replace(/[,()]/g, '')
    query = query.or(`booking_ref.ilike.%${safe}%,driver_email.ilike.%${safe}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data, total: count ?? 0, page, per_page: perPage })
}
