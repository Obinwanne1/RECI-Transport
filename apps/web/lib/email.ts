import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin-server'

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'bookings@recitransport.de'

interface BookingEmailData {
  booking_id: string
  booking_ref: string
  driver_first_name: string
  driver_last_name: string
  driver_email: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  pickup_datetime: string
  dropoff_datetime: string
  total_price: number
  extras: Array<{ name: string; price_snapshot: number; quantity: number }>
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('en-DE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })
}

function buildHtml(data: BookingEmailData): string {
  const extrasRows =
    data.extras.length > 0
      ? data.extras
          .map(
            (e) =>
              `<tr>
                <td style="padding:6px 0;color:#6B7280;font-size:14px;">${e.name}${e.quantity > 1 ? ` ×${e.quantity}` : ''}</td>
                <td style="padding:6px 0;color:#1A1A1A;font-size:14px;text-align:right;">€${e.price_snapshot.toFixed(2)}</td>
              </tr>`
          )
          .join('')
      : `<tr><td colspan="2" style="padding:6px 0;color:#6B7280;font-size:14px;">No extras selected</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">

        <!-- Header -->
        <tr>
          <td style="background:#407E3C;border-radius:8px 8px 0 0;padding:24px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">RECI Transport</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Booking Confirmed</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;">

            <p style="margin:0 0 8px;font-size:16px;color:#1A1A1A;">Hi ${data.driver_first_name},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
              Your booking is confirmed. Here's a summary of your reservation.
            </p>

            <!-- Booking Ref -->
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:16px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#407E3C;text-transform:uppercase;letter-spacing:0.5px;">Booking Reference</p>
              <p style="margin:0;font-size:24px;font-weight:700;color:#1A1A1A;font-family:monospace;">${data.booking_ref}</p>
            </div>

            <!-- Vehicle -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding-bottom:12px;border-bottom:1px solid #E5E7EB;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Vehicle</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1A1A1A;">${data.vehicle_year} ${data.vehicle_make} ${data.vehicle_model}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #E5E7EB;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:50%;padding-right:8px;">
                        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Pick-up</p>
                        <p style="margin:0;font-size:14px;color:#1A1A1A;">${formatDatetime(data.pickup_datetime)}</p>
                      </td>
                      <td style="width:50%;padding-left:8px;">
                        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Drop-off</p>
                        <p style="margin:0;font-size:14px;color:#1A1A1A;">${formatDatetime(data.dropoff_datetime)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Extras -->
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Extras</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              ${extrasRows}
            </table>

            <!-- Total -->
            <div style="background:#F9FAFB;border-radius:6px;padding:16px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:15px;font-weight:700;color:#1A1A1A;">Total Charged</td>
                  <td style="font-size:18px;font-weight:700;color:#407E3C;text-align:right;">€${data.total_price.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Next steps -->
            <div style="border-left:3px solid #407E3C;padding-left:16px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1A1A1A;">What happens next</p>
              <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#6B7280;line-height:1.8;">
                <li>Your vehicle will be ready at RECI HQ, Berlin at the pick-up time.</li>
                <li>Please bring your driving licence and this confirmation email.</li>
                <li>Questions? Reply to this email or call us at +49 30 0000 0000.</li>
              </ul>
            </div>

            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">Safe travels,<br><strong style="color:#1A1A1A;">RECI Transport Team</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">RECI Transport Ltd · Berlin, Germany</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendBookingConfirmation(bookingId: string): Promise<void> {
  const supabase = createAdminClient()

  // Fetch booking + vehicle + extras
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      id, booking_ref, driver_first_name, driver_last_name, driver_email,
      pickup_datetime, dropoff_datetime, total_price,
      vehicle:vehicles(make, model, year),
      extras:booking_extras(quantity, price_snapshot, extra:extras(name))
    `
    )
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    console.error('[email] Failed to fetch booking for confirmation email:', error)
    return
  }

  const vehicleArr = booking.vehicle as unknown as Array<{
    make: string
    model: string
    year: number
  }>
  const vehicle = Array.isArray(vehicleArr) ? vehicleArr[0] : (vehicleArr as { make: string; model: string; year: number })

  const extras = (
    booking.extras as unknown as Array<{
      quantity: number
      price_snapshot: number
      extra: { name: string } | null
    }>
  )
    .filter((e) => e.extra)
    .map((e) => ({
      name: e.extra!.name,
      quantity: e.quantity,
      price_snapshot: e.price_snapshot,
    }))

  const emailData: BookingEmailData = {
    booking_id: booking.id,
    booking_ref: booking.booking_ref,
    driver_first_name: booking.driver_first_name,
    driver_last_name: booking.driver_last_name,
    driver_email: booking.driver_email,
    vehicle_make: vehicle?.make ?? 'Vehicle',
    vehicle_model: vehicle?.model ?? '',
    vehicle_year: vehicle?.year ?? new Date().getFullYear(),
    pickup_datetime: booking.pickup_datetime,
    dropoff_datetime: booking.dropoff_datetime,
    total_price: booking.total_price,
    extras,
  }

  try {
    const result = await getResend().emails.send({
      from: FROM,
      to: booking.driver_email,
      subject: `Booking Confirmed — ${booking.booking_ref}`,
      html: buildHtml(emailData),
    })

    // Log to email_logs table
    await supabase.from('email_logs').insert({
      booking_id: bookingId,
      to_email: booking.driver_email,
      subject: `Booking Confirmed — ${booking.booking_ref}`,
      template: 'booking_confirmation',
      resend_id: result.data?.id ?? null,
      status: 'sent',
    })
  } catch (err) {
    // Email failure must never throw — booking is already confirmed
    console.error('[email] Failed to send booking confirmation:', err)
  }
}

// ─── Corporate Invoice Email ──────────────────────────────────────────────────

export async function sendCorporateInvoice(bookingId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_ref, total_price, base_price, extras_price,
      pickup_datetime, dropoff_datetime, created_at,
      driver_first_name, driver_last_name,
      vehicle:vehicles(make, model, year),
      extras:booking_extras(quantity, price_snapshot, extra:extras(name)),
      corporate:corporate_accounts(company_name, vat_number, billing_address, billing_email, discount_pct)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    console.error('[email] Failed to fetch booking for invoice:', error)
    return
  }

  const corpArr = booking.corporate as unknown as Array<{
    company_name: string; vat_number: string | null
    billing_address: string; billing_email: string; discount_pct: number
  }>
  const corporate = Array.isArray(corpArr) ? corpArr[0] : corpArr
  if (!corporate) return

  const vehicleArr = booking.vehicle as unknown as Array<{ make: string; model: string; year: number }>
  const vehicle = Array.isArray(vehicleArr) ? vehicleArr[0] : vehicleArr

  const extrasRaw = booking.extras as unknown as Array<{
    quantity: number; price_snapshot: number
    extra: Array<{ name: string }> | { name: string } | null
  }>
  const extras = extrasRaw.filter((e) => e.extra).map((e) => {
    const ex = Array.isArray(e.extra) ? e.extra[0] : e.extra
    return { name: ex?.name ?? '', quantity: e.quantity, price_snapshot: e.price_snapshot }
  })

  const vatRate = 0.19
  const netAmount = Number(booking.total_price) / (1 + vatRate)
  const vatAmount = Number(booking.total_price) - netAmount

  const extrasRows = extras.length
    ? extras.map((e) => `<tr>
        <td style="padding:6px 0;color:#6B7280;font-size:13px;">${e.name}${e.quantity > 1 ? ` ×${e.quantity}` : ''}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">€${e.price_snapshot.toFixed(2)}</td>
      </tr>`).join('')
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="background:#407E3C;border-radius:8px 8px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">RECI Transport</p>
    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Corporate Invoice</p>
  </td></tr>
  <tr><td style="background:#fff;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="vertical-align:top;width:50%">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Invoice to</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;">${corporate.company_name}</p>
          ${corporate.vat_number ? `<p style="margin:2px 0 0;font-size:12px;color:#6B7280;">VAT: ${corporate.vat_number}</p>` : ''}
          <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${corporate.billing_address}</p>
        </td>
        <td style="vertical-align:top;text-align:right">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Booking ref</p>
          <p style="margin:0;font-size:14px;font-weight:700;font-family:monospace;color:#1A1A1A;">${booking.booking_ref}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${new Date(booking.created_at).toLocaleDateString('en-DE')}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;padding:12px 0;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Vehicle</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">${vehicle?.year} ${vehicle?.make} ${vehicle?.model}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Rental period</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">${formatDatetime(booking.pickup_datetime)} → ${formatDatetime(booking.dropoff_datetime)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Driver</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">${booking.driver_first_name} ${booking.driver_last_name}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6B7280;">Base rental</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">€${Number(booking.base_price).toFixed(2)}</td>
      </tr>
      ${extrasRows}
      ${corporate.discount_pct > 0 ? `<tr>
        <td style="padding:6px 0;font-size:13px;color:#407E3C;">Corporate discount (${corporate.discount_pct}%)</td>
        <td style="padding:6px 0;font-size:13px;color:#407E3C;text-align:right;">−€${(Number(booking.base_price) * corporate.discount_pct / 100).toFixed(2)}</td>
      </tr>` : ''}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#6B7280;">Net amount</td>
        <td style="padding:4px 0;font-size:13px;text-align:right;">€${netAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#6B7280;">VAT (19%)</td>
        <td style="padding:4px 0;font-size:13px;text-align:right;">€${vatAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 4px;font-size:15px;font-weight:700;color:#1A1A1A;border-top:2px solid #1A1A1A;">Total (incl. VAT)</td>
        <td style="padding:8px 0 4px;font-size:15px;font-weight:700;color:#407E3C;text-align:right;border-top:2px solid #1A1A1A;">€${Number(booking.total_price).toFixed(2)}</td>
      </tr>
    </table>

    <p style="font-size:12px;color:#6B7280;margin:0;">RECI Transport Ltd · Berlin, Germany · bookings@recitransport.de</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  try {
    const result = await getResend().emails.send({
      from: FROM,
      to: corporate.billing_email,
      subject: `Invoice — ${booking.booking_ref} — RECI Transport`,
      html,
    })

    await supabase.from('email_logs').insert({
      booking_id: bookingId,
      to_email: corporate.billing_email,
      subject: `Invoice — ${booking.booking_ref} — RECI Transport`,
      template: 'corporate_invoice',
      resend_id: result.data?.id ?? null,
      status: 'sent',
    })
  } catch (err) {
    console.error('[email] Failed to send corporate invoice:', err)
  }
}
