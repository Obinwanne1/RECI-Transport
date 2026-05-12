'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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

    fetch(`/api/admin/customers?${params}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Customers</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
        />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['Name', 'Email', 'Role', 'Corporate', 'Licence', 'Joined'].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7280]">No customers found.</td></tr>
            ) : customers.map((c: any) => {
              const corp = Array.isArray(c.corporate) ? c.corporate[0] : c.corporate
              return (
                <tr key={c.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer"
                  onClick={() => router.push(`/bookings?search=${encodeURIComponent(c.email)}`)}>
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{c.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      c.role === 'corporate_manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>{c.role}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{corp?.company_name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {c.licence_verified
                      ? <span className="text-[#407E3C] font-medium text-xs">✓ Verified</span>
                      : <span className="text-[#6B7280] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7280] text-xs">{new Date(c.created_at).toLocaleDateString('en-DE')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6B7280]">{total} total</p>
          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={() => router.push(`/customers?page=${page - 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] rounded text-sm hover:bg-[#F9FAFB]">← Prev</button>
            )}
            <span className="px-3 py-1.5 text-sm text-[#6B7280]">{page} / {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => router.push(`/customers?page=${page + 1}`)} className="px-3 py-1.5 border border-[#E5E7EB] rounded text-sm hover:bg-[#F9FAFB]">Next →</button>
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
