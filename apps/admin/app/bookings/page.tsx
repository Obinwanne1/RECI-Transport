'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const STATUSES = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled']

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-purple-100 text-purple-700',
  payment_failed: 'bg-red-100 text-red-700',
}

function BookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [bookings, setBookings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search) params.set('search', search)
    params.set('page', String(page))

    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [status, page, search])

  function setStatus(s: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('status', s)
    p.set('page', '1')
    router.push(`/bookings?${p}`)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Bookings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              status === s
                ? 'bg-[#407E3C] text-white'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#407E3C] hover:text-[#407E3C]'
            }`}
          >
            {s}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search ref or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
        />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['Ref', 'Vehicle', 'Driver', 'Pick-up', 'Status', 'Total'].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">Loading…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">No bookings found.</td></tr>
            ) : bookings.map((b: any) => {
              const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
              return (
                <tr key={b.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer" onClick={() => router.push(`/bookings/${b.id}`)}>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#407E3C]">{b.booking_ref}</td>
                  <td className="px-4 py-2.5 text-[#1A1A1A]">{v ? `${v.make} ${v.model}` : '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{b.driver_first_name} {b.driver_last_name}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] whitespace-nowrap">{new Date(b.pickup_datetime).toLocaleDateString('en-DE')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold">€{Number(b.total_price).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6B7280]">{total} total</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/bookings?status=${status}&page=${page - 1}`} className="px-3 py-1.5 border border-[#E5E7EB] rounded text-sm hover:bg-[#F9FAFB]">
                ← Prev
              </Link>
            )}
            <span className="px-3 py-1.5 text-sm text-[#6B7280]">{page} / {totalPages}</span>
            {page < totalPages && (
              <Link href={`/bookings?status=${status}&page=${page + 1}`} className="px-3 py-1.5 border border-[#E5E7EB] rounded text-sm hover:bg-[#F9FAFB]">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingsPage() {
  return <Suspense><BookingsContent /></Suspense>
}
