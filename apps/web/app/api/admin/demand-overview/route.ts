import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

export async function GET() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pricing_signals')
    .select('category_id, demand_score, signal_type, vehicles_remaining, computed_at, vehicle_categories(name)')
    .eq('date', today)
    .order('demand_score', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch demand' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
