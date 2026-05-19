'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  pending:        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed:      'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:         'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  cancelled:      'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show:        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  payment_failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const NEXT_STATUSES: Record<string, string[]> = {
  pending:        ['confirmed', 'cancelled'],
  confirmed:      ['active', 'cancelled', 'no_show'],
  active:         ['completed', 'cancelled'],
  completed:      [],
  cancelled:      [],
  no_show:        [],
  payment_failed: ['pending', 'cancelled'],
}

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 space-y-2">
          <div className="h-3 w-24 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
          <div className="h-4 w-40 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
          <div className="h-3 w-32 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-3">{children}</p>
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
    fetch(`/admin/api/admin/bookings/${params.id}`)
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
    const res = await fetch(`/admin/api/admin/bookings/${params.id}`, {
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 mb-5 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to bookings
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : !booking ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400">Booking not found.</p>
        </div>
      ) : (() => {
        const vehicle = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle
        const extras = Array.isArray(booking.extras) ? booking.extras : []
        const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
        const allowedStatuses = NEXT_STATUSES[booking.status] ?? []

        return (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 font-mono tracking-tight">{booking.booking_ref}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[booking.status] ?? 'bg-gray-100 dark:bg-gray-800'}`}>
                {booking.status}
              </span>
            </div>

            <div className="space-y-4">
              {/* Vehicle */}
              <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5">
                <SectionLabel>Vehicle</SectionLabel>
                <p className="font-semibold text-[#1A1A1A] dark:text-gray-100">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p>
                <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{vehicle?.category?.name} · <span className="font-mono">{vehicle?.registration_plate}</span></p>
              </div>

              {/* Driver + Dates */}
              <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 grid grid-cols-2 gap-6">
                <div>
                  <SectionLabel>Driver</SectionLabel>
                  <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">{booking.driver_first_name} {booking.driver_last_name}</p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{booking.driver_email}</p>
                </div>
                <div>
                  <SectionLabel>Dates</SectionLabel>
                  <p className="text-sm text-[#1A1A1A] dark:text-gray-200">{new Date(booking.pickup_datetime).toLocaleString('en-DE')}</p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">→ {new Date(booking.dropoff_datetime).toLocaleString('en-DE')}</p>
                </div>
              </div>

              {/* Extras */}
              {extras.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5">
                  <SectionLabel>Extras</SectionLabel>
                  <div className="space-y-1.5">
                    {extras.map((e: any, i: number) => {
                      const ex = Array.isArray(e.extra) ? e.extra[0] : e.extra
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-[#6B7280] dark:text-gray-400">{ex?.name}{e.quantity > 1 ? ` ×${e.quantity}` : ''}</span>
                          <span className="text-[#1A1A1A] dark:text-gray-200">€{Number(e.price_snapshot).toFixed(2)}</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between font-semibold pt-2 border-t border-[#F3F4F6] dark:border-gray-800 mt-1">
                      <span className="text-[#1A1A1A] dark:text-gray-100">Total</span>
                      <span className="text-[#407E3C]">€{Number(booking.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              {payment && (
                <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5">
                  <SectionLabel>Payment</SectionLabel>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280] dark:text-gray-400">Status</span>
                      <span className="font-medium text-[#1A1A1A] dark:text-gray-200">{payment.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280] dark:text-gray-400">Amount</span>
                      <span className="text-[#1A1A1A] dark:text-gray-200">€{Number(payment.amount).toFixed(2)}</span>
                    </div>
                    {payment.stripe_payment_intent_id && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280] dark:text-gray-400">Stripe PI</span>
                        <span className="font-mono text-xs text-[#6B7280] dark:text-gray-400">{payment.stripe_payment_intent_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI policy */}
              {booking.ai_policy_decision && (
                <details className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5">
                  <summary className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest cursor-pointer">AI Policy Decision</summary>
                  <pre className="mt-3 text-xs text-[#1A1A1A] dark:text-gray-300 whitespace-pre-wrap bg-[#F9FAFB] dark:bg-gray-800 rounded-lg p-3 overflow-auto">{JSON.stringify(booking.ai_policy_decision, null, 2)}</pre>
                </details>
              )}

              {/* Status update */}
              {allowedStatuses.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 space-y-3">
                  <SectionLabel>Update Status</SectionLabel>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputCls}>
                    <option value={booking.status}>{booking.status} (current)</option>
                    {allowedStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)…"
                    rows={2}
                    className={inputCls}
                  />
                  {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="bg-[#407E3C] hover:bg-[#356834] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving ? 'Saving…' : 'Update booking'}
                  </button>
                </div>
              )}
            </div>
          </>
        )
      })()}
    </div>
  )
}
