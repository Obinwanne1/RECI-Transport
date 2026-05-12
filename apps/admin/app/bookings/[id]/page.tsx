'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-purple-100 text-purple-700',
  payment_failed: 'bg-red-100 text-red-700',
}

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled', 'no_show'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  payment_failed: ['pending', 'cancelled'],
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/bookings/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d)
        setNotes(d.notes ?? '')
        setNewStatus(d.status)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleUpdate() {
    setSaving(true)
    setSaveError(null)
    const res = await fetch(`/api/admin/bookings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus !== booking.status ? newStatus : undefined, notes }),
    })
    const data = await res.json()
    if (!res.ok) {
      setSaveError(data.error ?? 'Failed to update')
    } else {
      setBooking({ ...booking, ...data })
    }
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-[#6B7280]">Loading…</div>
  if (!booking) return <div className="p-6 text-[#DC2626]">Booking not found.</div>

  const vehicle = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle
  const extras = Array.isArray(booking.extras) ? booking.extras : []
  const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
  const allowedStatuses = NEXT_STATUSES[booking.status] ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/bookings" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-4 inline-block">← Back to bookings</Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A] font-mono">{booking.booking_ref}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[booking.status] ?? 'bg-gray-100'}`}>
          {booking.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Vehicle */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Vehicle</p>
          <p className="font-semibold">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p>
          <p className="text-sm text-[#6B7280]">{vehicle?.category?.name} · {vehicle?.registration_plate}</p>
        </div>

        {/* Booking details */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Driver</p>
            <p className="text-sm font-semibold">{booking.driver_first_name} {booking.driver_last_name}</p>
            <p className="text-sm text-[#6B7280]">{booking.driver_email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Dates</p>
            <p className="text-sm">{new Date(booking.pickup_datetime).toLocaleString('en-DE')} →</p>
            <p className="text-sm">{new Date(booking.dropoff_datetime).toLocaleString('en-DE')}</p>
          </div>
        </div>

        {/* Extras */}
        {extras.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Extras</p>
            {extras.map((e: any, i: number) => {
              const ex = Array.isArray(e.extra) ? e.extra[0] : e.extra
              return (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-[#6B7280]">{ex?.name}{e.quantity > 1 ? ` ×${e.quantity}` : ''}</span>
                  <span>€{Number(e.price_snapshot).toFixed(2)}</span>
                </div>
              )
            })}
            <div className="flex justify-between font-semibold pt-2 border-t mt-2">
              <span>Total</span>
              <span className="text-[#407E3C]">€{Number(booking.total_price).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment */}
        {payment && (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Payment</p>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Status</span>
              <span className="font-medium">{payment.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Amount</span>
              <span>€{Number(payment.amount).toFixed(2)}</span>
            </div>
            {payment.stripe_payment_intent_id && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Stripe PI</span>
                <span className="font-mono text-xs">{payment.stripe_payment_intent_id}</span>
              </div>
            )}
          </div>
        )}

        {/* AI policy decision */}
        {booking.ai_policy_decision && (
          <details className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <summary className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer">AI Policy Decision</summary>
            <pre className="mt-2 text-xs text-[#1A1A1A] whitespace-pre-wrap">{JSON.stringify(booking.ai_policy_decision, null, 2)}</pre>
          </details>
        )}

        {/* Status update */}
        {allowedStatuses.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Update Status</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
            >
              <option value={booking.status}>{booking.status} (current)</option>
              {allowedStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)…"
              rows={2}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
            />
            {saveError && <p className="text-sm text-[#DC2626]">{saveError}</p>}
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="bg-[#407E3C] hover:bg-[#356834] text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
