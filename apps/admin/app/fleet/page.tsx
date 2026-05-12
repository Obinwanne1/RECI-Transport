'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FleetPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadVehicles() {
    setLoading(true)
    const res = await fetch('/api/admin/vehicles')
    const data = await res.json()
    setVehicles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadVehicles() }, [])

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    loadVehicles()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Fleet</h1>
        <Link href="/fleet/new" className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          + Add vehicle
        </Link>
      </div>

      {loading ? (
        <div className="text-[#6B7280]">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const cat = Array.isArray(v.category) ? v.category[0] : v.category
            const loc = Array.isArray(v.location) ? v.location[0] : v.location
            return (
              <div key={v.id} className={`bg-white border rounded-lg p-4 ${v.is_active ? 'border-[#E5E7EB]' : 'border-[#FCA5A5] opacity-60'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-[#6B7280]">{v.registration_plate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mb-3">{cat?.name} · {v.color} · {v.transmission}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/fleet/${v.id}`)}
                    className="flex-1 border border-[#407E3C] text-[#407E3C] text-xs font-semibold py-1.5 rounded hover:bg-[#F0FDF4] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(v.id, v.is_active)}
                    className="flex-1 border border-[#E5E7EB] text-[#6B7280] text-xs font-semibold py-1.5 rounded hover:bg-[#F9FAFB] transition-colors"
                  >
                    {v.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
