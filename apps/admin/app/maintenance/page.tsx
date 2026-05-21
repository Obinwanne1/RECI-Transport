'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Severity = 'warning' | 'alert' | 'critical'

interface FlaggedVehicle {
  id: string
  make: string
  model: string
  year: number
  registration_plate: string
  fuel_type: string
  mileage: number
  last_service_mileage: number | null
  last_service_date: string | null
  km_since_service: number
  severity: Severity
  category: { name: string } | null
  location: { name: string } | null
  ai_note?: string
}

interface Summary {
  total_flagged: number
  critical: number
  alert: number
  warning: number
  thresholds: { warning: number; alert: number; critical: number }
}

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  alert: {
    label: 'Alert',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  warning: {
    label: 'Warning',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-400',
  },
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function MaintenancePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [vehicles, setVehicles] = useState<FlaggedVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/api/admin/maintenance')
      const data = await res.json()
      setSummary(data.summary)
      setVehicles(data.vehicles ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markServiced(vehicleId: string) {
    setResolvingId(vehicleId)
    await fetch('/admin/api/admin/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId }),
    })
    setResolvedIds((prev) => new Set([...prev, vehicleId]))
    setResolvingId(null)
  }

  const visibleVehicles = vehicles.filter((v) => !resolvedIds.has(v.id))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Predictive Maintenance</h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">AI-powered service alerts based on mileage</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors text-[#374151] dark:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Flagged', value: summary.total_flagged, color: 'text-[#1A1A1A] dark:text-gray-100' },
            { label: 'Critical', value: summary.critical, color: 'text-red-600 dark:text-red-400' },
            { label: 'Alert', value: summary.alert, color: 'text-orange-600 dark:text-orange-400' },
            { label: 'Warning', value: summary.warning, color: 'text-yellow-600 dark:text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs text-[#6B7280] dark:text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Threshold legend */}
      {summary && (
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-[#6B7280] dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Warning ≥ {summary.thresholds.warning.toLocaleString()} km since service</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Alert ≥ {summary.thresholds.alert.toLocaleString()} km since service</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical ≥ {summary.thresholds.critical.toLocaleString()} km since service</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : visibleVehicles.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-[#F0FDF4] dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-1">All clear</p>
          <p className="text-sm text-[#6B7280] dark:text-gray-400">No vehicles require maintenance at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleVehicles.map((v) => {
            const cfg = SEVERITY_CONFIG[v.severity]
            return (
              <div
                key={v.id}
                className={`bg-white dark:bg-gray-900 border-l-4 border rounded-xl p-5 transition-all ${cfg.border}`}
                style={{ borderLeftColor: v.severity === 'critical' ? '#DC2626' : v.severity === 'alert' ? '#EA580C' : '#EAB308' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-semibold text-[#1A1A1A] dark:text-gray-100">
                        {v.year} {v.make} {v.model}
                      </p>
                      <span className="font-mono text-xs text-[#6B7280] dark:text-gray-400">{v.registration_plate}</span>
                      <SeverityBadge severity={v.severity} />
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#6B7280] dark:text-gray-400 mb-3">
                      <span>{v.mileage.toLocaleString()} km total</span>
                      <span className={`font-semibold ${cfg.text}`}>
                        {v.km_since_service.toLocaleString()} km since last service
                      </span>
                      {v.last_service_date && (
                        <span>Last serviced: {new Date(v.last_service_date).toLocaleDateString('en-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      )}
                      {v.category && <span>{v.category.name}</span>}
                      {v.location && <span>📍 {v.location.name}</span>}
                    </div>

                    {/* AI recommendation */}
                    {v.ai_note && (
                      <div className="flex items-start gap-2 p-2.5 bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-lg">
                        <span className="text-sm shrink-0 mt-0.5">🤖</span>
                        <p className="text-xs text-[#374151] dark:text-gray-300">{v.ai_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link
                      href={`/fleet/${v.id}`}
                      className="text-xs font-medium text-[#407E3C] hover:underline"
                    >
                      Edit vehicle
                    </Link>
                    <button
                      onClick={() => markServiced(v.id)}
                      disabled={resolvingId === v.id}
                      className="text-xs font-semibold px-3 py-1.5 bg-[#407E3C] hover:bg-[#356834] text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {resolvingId === v.id ? 'Saving…' : 'Mark Serviced'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
