import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      id, booking_ref, status,
      driver_first_name, driver_last_name, driver_email,
      pickup_datetime, dropoff_datetime, total_price,
      vehicle:vehicles(make, model, year, fuel_type, category:vehicle_categories(name)),
      extras:booking_extras(quantity, price_snapshot, extra:extras(name))
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Normalise Supabase join shapes
  type VehicleShape = { make: string; model: string; year: number; fuel_type?: string; category: Array<{ name: string }> | { name: string } | null }
  const vehicleRaw = booking.vehicle as unknown as Array<VehicleShape> | VehicleShape

  const vehicleObj = Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw
  const catRaw = vehicleObj?.category
  const catObj = Array.isArray(catRaw) ? catRaw[0] : catRaw

  const extrasRaw = booking.extras as unknown as Array<{
    quantity: number
    price_snapshot: number
    extra: Array<{ name: string }> | { name: string } | null
  }>

  const extras = (extrasRaw ?? [])
    .filter((e) => e.extra)
    .map((e) => {
      const extraObj = Array.isArray(e.extra) ? e.extra[0] : e.extra
      return {
        name: extraObj?.name ?? '',
        quantity: e.quantity,
        price_snapshot: e.price_snapshot,
      }
    })

  return NextResponse.json({
    id: booking.id,
    booking_ref: booking.booking_ref,
    status: booking.status,
    driver_first_name: booking.driver_first_name,
    driver_last_name: booking.driver_last_name,
    driver_email: booking.driver_email,
    pickup_datetime: booking.pickup_datetime,
    dropoff_datetime: booking.dropoff_datetime,
    total_price: booking.total_price,
    vehicle: {
      make: vehicleObj?.make ?? '',
      model: vehicleObj?.model ?? '',
      year: vehicleObj?.year ?? 0,
      fuel_type: vehicleObj?.fuel_type,
      category: catObj ? { name: catObj.name } : undefined,
    },
    extras,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id')
    .eq('id', params.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cancellableStatuses = ['pending', 'confirmed']
  if (!cancellableStatuses.includes(booking.status)) {
    return NextResponse.json(
      { error: `Cannot cancel booking with status: ${booking.status}` },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })

  return NextResponse.json({ success: true })
}
