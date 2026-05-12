import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('extras')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('extras query error:', error)
    return NextResponse.json({ error: 'Failed to fetch extras' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
