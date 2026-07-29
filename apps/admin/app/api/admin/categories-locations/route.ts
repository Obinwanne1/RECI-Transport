import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await assertAdminSession()
  if (!session.authorized) return session.response

  const supabase = createAdminClient()
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from('vehicle_categories').select('id, name, tier').order('tier'),
    supabase.from('locations').select('id, name').order('name'),
  ])
  return NextResponse.json({ categories: categories ?? [], locations: locations ?? [] })
}
