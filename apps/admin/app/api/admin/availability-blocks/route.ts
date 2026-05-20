import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  vehicle_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*, vehicle:vehicles(make, model, year, registration_plate)')
    .order('start_date', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('availability_blocks').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
