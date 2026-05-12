import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      category:vehicle_categories(*),
      pricing:pricing_rules(base_rate_per_day)
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  const pricingArr = data.pricing as Array<{ base_rate_per_day: number }> | null
  const daily_rate = pricingArr?.[0]?.base_rate_per_day ?? null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pricing, ...vehicle } = data

  return NextResponse.json({ ...vehicle, daily_rate })
}
