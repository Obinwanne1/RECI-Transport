import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { booking_id?: string; inspection_type?: string; angle?: string; data_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { booking_id, inspection_type, angle, data_url } = body
  if (!booking_id || !inspection_type || !angle || !data_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allowedAngles = ['front', 'back', 'left', 'right']
  const allowedTypes = ['pickup', 'return']
  if (!allowedAngles.includes(angle) || !allowedTypes.includes(inspection_type)) {
    return NextResponse.json({ error: 'Invalid angle or inspection_type' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify booking belongs to user
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Decode base64 data URL
  const matches = data_url.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!matches) return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 })

  const [, , base64Data] = matches
  const buffer = Buffer.from(base64Data, 'base64')
  const path = `${booking_id}/${inspection_type}/${angle}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('vehicle-inspections')
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('[inspections/upload] Storage error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Get a signed URL valid for 7 days (for AI vision calls)
  const { data: signed } = await supabase.storage
    .from('vehicle-inspections')
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
