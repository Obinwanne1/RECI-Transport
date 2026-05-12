'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface BookingRow {
  id: string
  booking_ref: string
  status: string
  pickup_datetime: string
  dropoff_datetime: string
  total_price: number
  vehicle: { make: string; model: string; year: number } | Array<{ make: string; model: string; year: number }> | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-[#F0FDF4] text-[#407E3C] border-[#BBF7D0]',
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
  cancelled: 'bg-red-50 text-[#DC2626] border-red-200',
  no_show: 'bg-red-50 text-[#DC2626] border-red-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function getVehicle(raw: BookingRow['vehicle']) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] : raw
}

export default function AccountBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/bookings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookings(data)
        else setError(data.error ?? 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card text-center py-10">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (error) {
    return <div className="card text-center py-10 text-[#DC2626]">{error}</div>
  }

  if (bookings.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-[#6B7280] mb-4">No bookings yet.</p>
        <Link href="/" className="btn-primary px-6 py-2 text-sm inline-block">
          Search vehicles
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1A1A1A]">My Bookings</h1>
      {bookings.map((b) => {
        const v = getVehicle(b.vehicle)
        return (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-[#1A1A1A]">{b.booking_ref}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium capitalize ${STATUS_STYLES[b.status] ?? STATUS_STYLES.pending}`}>
                    {b.status}
                  </span>
                </div>
                {v && (
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {v.year} {v.make} {v.model}
                  </p>
                )}
                <p className="text-xs text-[#6B7280] mt-1">
                  {formatDate(b.pickup_datetime)} → {formatDate(b.dropoff_datetime)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-primary">€{Number(b.total_price).toFixed(2)}</p>
                {b.status === 'confirmed' && (
                  <Link
                    href={`/book/confirmation?booking_id=${b.id}`}
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
