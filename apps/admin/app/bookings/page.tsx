'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const STATUSES = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled']

const STATUS_BADGE: Record<string, string> = {
  pending:        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed:      'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:         'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  cancelled:      'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show:        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  payment_failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function BookingsSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-[#F3F4F6] dark:border-gray-800">
          {[80, 120, 100, 80, 70, 60].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 bg-[#F3F4F6] dark:bg-gray-800 rounded animate-pulse" style={{ width: w, opacity: 1 - i * 0.09 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Bookings</h1>
          {!loading && <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{total} total</p>}
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              status === s
                ? 'bg-[#407E3C] text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400 hover:border-[#407E3C] hover:text-[#407E3C] dark:hover:text-[#5a9e56]'
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto relative">
          <svg className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search ref or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] w-52 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
              {['Ref', 'Vehicle', 'Driver', 'Pick-up', 'Status', 'Total'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <BookingsSkeleton />
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">No bookings found.</p>
                  <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-1">Try a different filter or search term.</p>
                </td>
              </tr>
            ) : bookings.map((b: any) => {
              const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
              return (
                <tr
                  key={b.id}
                  className="border-b border-[#F3F4F6] dark:border-gray-800 hover:bg-[#F9FAFB] dark:hover:bg-gray-800/40 cursor-pointer transition-colors last:border-0"
                  onClick={() => router.push(`/bookings/${b.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#407E3C]">{b.booking_ref}</td>
                  <td className="px-4 py-3 text-[#1A1A1A] dark:text-gray-200">{v ? `${v.make} ${v.model}` : '—'}</td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400">{b.driver_first_name} {b.driver_last_name}</td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 whitespace-nowrap text-xs">{new Date(b.pickup_datetime).toLocaleDateString('en-DE')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A] dark:text-gray-100">€{Number(b.total_price).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6B7280] dark:text-gray-400">{total} total</p>
          <div className="flex gap-2 items-center">
            {page > 1 && (
              <Link href={`/bookings?status=${status}&page=${page - 1}`} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">
                ← Prev
              </Link>
            )}
            <span className="px-3 py-1.5 text-xs text-[#6B7280] dark:text-gray-400">{page} / {totalPages}</span>
            {page < totalPages && (
              <Link href={`/bookings?status=${status}&page=${page + 1}`} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">
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
