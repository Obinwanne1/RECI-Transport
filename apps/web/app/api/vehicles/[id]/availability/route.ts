import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vehicleId = params.id
  const supabase = await createClient()

  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    supabase
      .from('bookings')
      .select('pickup_datetime, dropoff_datetime')
      .eq('vehicle_id', vehicleId)
      .not('status', 'in', '("cancelled")'),
    supabase
      .from('availability_blocks')
      .select('start_date, end_date')
      .eq('vehicle_id', vehicleId),
  ])

  const blocked = [
    ...(bookings ?? []).map((b) => ({ start: b.pickup_datetime, end: b.dropoff_datetime })),
    ...(blocks ?? []).map((b) => ({ start: b.start_date, end: b.end_date })),
  ]

  return NextResponse.json(blocked)
}
