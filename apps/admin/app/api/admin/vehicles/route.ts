import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CreateVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(2000).max(2030),
  registration_plate: z.string().min(1),
  category_id: z.string().uuid(),
  location_id: z.string().uuid(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic']),
  color: z.string().min(1),
  seats: z.number().int().min(1).max(20).optional(),
  mileage: z.number().int().min(0).optional(),
  image_url: z.string().url().optional(),
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, category:vehicle_categories(name, tier), location:locations(name)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateVehicleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...parsed.data, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
