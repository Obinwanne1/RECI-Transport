import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify admin/staff role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pricing_signals')
    .select('category_id, demand_score, signal_type, vehicles_remaining, computed_at, vehicle_categories(name)')
    .eq('date', today)
    .order('demand_score', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch demand' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
