'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MAINT_THRESHOLDS = { warning: 8000, alert: 12000, critical: 18000 }

function getMaintenanceSeverity(mileage: number, lastServiceMileage: number | null): 'warning' | 'alert' | 'critical' | null {
  if (mileage == null) return null
  const km = mileage - (lastServiceMileage ?? 0)
  if (km >= MAINT_THRESHOLDS.critical) return 'critical'
  if (km >= MAINT_THRESHOLDS.alert)    return 'alert'
  if (km >= MAINT_THRESHOLDS.warning)  return 'warning'
  return null
}

const MAINT_STYLE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  alert:    'bg-orange-50 text-orange-700 border-orange-200',
  warning:  'bg-yellow-50 text-yellow-700 border-yellow-200',
}

function FleetSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 animate-pulse space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
              <div className="h-3 w-24 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-16 bg-[#F3F4F6] dark:bg-gray-800 rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-20 bg-[#F3F4F6] dark:bg-gray-800 rounded-md" />
            <div className="h-5 w-14 bg-[#F3F4F6] dark:bg-gray-800 rounded-md" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 flex-1 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
            <div className="h-8 flex-1 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FleetPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function loadVehicles() {
    setLoading(true)
    const res = await fetch('/admin/api/admin/vehicles')
    const data = await res.json()
    setVehicles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadVehicles() }, [])

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/admin/api/admin/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    setConfirmId(null)
    loadVehicles()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Fleet</h1>
          {!loading && (
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">
              {vehicles.filter(v => v.is_active).length} active
              {vehicles.filter(v => !v.is_active).length > 0 && ` · ${vehicles.filter(v => !v.is_active).length} inactive`}
            </p>
          )}
        </div>
        <Link
          href="/fleet/new"
          className="inline-flex items-center gap-2 bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add vehicle
        </Link>
      </div>

      {loading ? <FleetSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const cat = Array.isArray(v.category) ? v.category[0] : v.category
            const loc = Array.isArray(v.location) ? v.location[0] : v.location
            const isConfirming = confirmId === v.id
            return (
              <div
                key={v.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all ${
                  v.is_active
                    ? 'border-[#E5E7EB] dark:border-gray-700 hover:border-[#D1D5DB] dark:hover:border-gray-600 hover:shadow-sm'
                    : 'border-red-200 dark:border-red-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[#1A1A1A] dark:text-gray-100 text-sm leading-snug">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 font-mono mt-0.5">{v.registration_plate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    v.is_active
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cat?.name && (
                    <span className="bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md">{cat.name}</span>
                  )}
                  {v.color && (
                    <span className="bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md">{v.color}</span>
                  )}
                  {v.transmission && (
                    <span className="bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md capitalize">{v.transmission}</span>
                  )}
                  {loc?.name && (
                    <span className="bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 text-[10px] font-medium px-2 py-0.5 rounded-md">📍 {loc.name}</span>
                  )}
                </div>

                {/* Maintenance badge */}
                {(() => {
                  const sev = getMaintenanceSeverity(v.mileage, v.last_service_mileage)
                  if (!sev) return null
                  const km = (v.mileage ?? 0) - (v.last_service_mileage ?? 0)
                  return (
                    <Link href="/maintenance" className={`flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide w-fit ${MAINT_STYLE[sev]}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
                      {sev} — {km.toLocaleString()} km overdue
                    </Link>
                  )
                })()}

                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 flex-1">
                      {v.is_active ? 'Deactivate?' : 'Reactivate?'}
                    </p>
                    <button onClick={() => toggleActive(v.id, v.is_active)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Confirm</button>
                    <button onClick={() => setConfirmId(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/fleet/${v.id}`)}
                      className="flex-1 border border-[#407E3C] text-[#407E3C] text-xs font-semibold py-2 rounded-lg hover:bg-[#F0FDF4] dark:hover:bg-[#407E3C]/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmId(v.id)}
                      className="flex-1 border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400 text-xs font-semibold py-2 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
                    >
                      {v.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
