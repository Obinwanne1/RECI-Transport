'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CustomersSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-[#F3F4F6] dark:border-gray-800">
          {[140, 180, 70, 100, 60, 70].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 bg-[#F3F4F6] dark:bg-gray-800 rounded animate-pulse" style={{ width: w, opacity: 1 - i * 0.09 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function CustomersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))

    fetch(`/admin/api/admin/customers?${params}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Customers</h1>
          {!loading && <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{total} total</p>}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative inline-block">
          <svg className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm w-64 bg-white dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
              {['Name', 'Email', 'Role', 'Corporate', 'Licence', 'Joined'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <CustomersSkeleton />
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">No customers found.</p>
                  <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-1">Try a different search term.</p>
                </td>
              </tr>
            ) : customers.map((c: any) => {
              const corp = Array.isArray(c.corporate) ? c.corporate[0] : c.corporate
              const initials = `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
              return (
                <tr
                  key={c.id}
                  className="border-b border-[#F3F4F6] dark:border-gray-800 hover:bg-[#F9FAFB] dark:hover:bg-gray-800/40 cursor-pointer transition-colors last:border-0"
                  onClick={() => router.push(`/bookings?search=${encodeURIComponent(c.email)}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#407E3C]/10 dark:bg-[#407E3C]/20 flex items-center justify-center text-[#407E3C] text-[10px] font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-[#1A1A1A] dark:text-gray-100">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.role === 'admin'             ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      c.role === 'corporate_manager' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{c.role}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-sm">{corp?.company_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.licence_verified
                      ? <span className="text-[#407E3C] font-semibold text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#407E3C]" />Verified</span>
                      : <span className="text-[#9CA3AF] dark:text-gray-500 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString('en-DE')}</td>
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
              <button onClick={() => router.push(`/customers?page=${page - 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">← Prev</button>
            )}
            <span className="px-3 py-1.5 text-xs text-[#6B7280] dark:text-gray-400">{page} / {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => router.push(`/customers?page=${page + 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-lg text-sm text-[#6B7280] dark:text-gray-400 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">Next →</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomersPage() {
  return <Suspense><CustomersContent /></Suspense>
}
