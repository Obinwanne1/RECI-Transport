import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from('vehicle_categories').select('id, name, tier').order('tier'),
    supabase.from('locations').select('id, name').order('name'),
  ])
  return NextResponse.json({ categories: categories ?? [], locations: locations ?? [] })
}
