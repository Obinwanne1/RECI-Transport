import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, city')
    .order('city')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
