'use client'

import { useEffect, useState } from 'react'

interface DemandRow {
  category_id: string
  demand_score: number
  signal_type: 'normal' | 'high' | 'peak'
  vehicles_remaining: number | null
  computed_at: string
  vehicle_categories: { name: string } | Array<{ name: string }> | null
}

const SIGNAL_COLOR = {
  normal: { bar: '#407E3C', label: 'text-[#407E3C]', bg: 'bg-[#407E3C]' },
  high: { bar: '#EA580C', label: 'text-orange-600', bg: 'bg-orange-500' },
  peak: { bar: '#DC2626', label: 'text-[#DC2626]', bg: 'bg-[#DC2626]' },
}

function getCategoryName(raw: DemandRow['vehicle_categories']): string {
  if (!raw) return 'Unknown'
  return Array.isArray(raw) ? (raw[0]?.name ?? 'Unknown') : raw.name
}

export default function DemandCard() {
  const [rows, setRows] = useState<DemandRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/demand-overview')
      .then((r) => r.json())
      .then((data: DemandRow[]) => {
        if (Array.isArray(data)) {
          setRows(data)
          if (data[0]?.computed_at) setLastUpdate(data[0].computed_at)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Fleet Demand Today</h3>
        <div className="flex gap-3 text-xs text-[#6B7280] dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#407E3C]" />Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626]" />Peak</span>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#6B7280] text-center py-4">
          No demand data yet — run pricing cron first.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => {
            const colors = SIGNAL_COLOR[row.signal_type]
            const pct = Math.round(row.demand_score * 100)
            return (
              <div key={row.category_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#1A1A1A] dark:text-gray-100">
                    {getCategoryName(row.vehicle_categories)}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.vehicles_remaining != null && row.signal_type !== 'normal' && (
                      <span className="text-xs text-[#6B7280] dark:text-gray-400">{row.vehicles_remaining} left</span>
                    )}
                    <span className={`text-xs font-semibold ${colors.label}`}>{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#E5E7EB] dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors.bg}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lastUpdate && (
        <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-4">
          Last computed: {new Date(lastUpdate).toLocaleString('en-DE', { timeZone: 'Europe/Berlin' })}
        </p>
      )}
    </div>
  )
}
