'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventStats {
  confirmed: number
  pending: number
  active: number
  completed: number
  blocked: number
  vehicles: number
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  confirmed: { label: 'Confirmed', color: '#407E3C', dot: 'bg-[#407E3C]' },
  pending:   { label: 'Pending',   color: '#F97316', dot: 'bg-[#F97316]' },
  active:    { label: 'Active',    color: '#3B82F6', dot: 'bg-[#3B82F6]' },
  completed: { label: 'Completed', color: '#9CA3AF', dot: 'bg-[#9CA3AF]' },
  blocked:   { label: 'Blocked',   color: '#374151', dot: 'bg-[#374151]' },
}

function StatCard({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 whitespace-nowrap">{label}</span>
      <span className="text-sm font-bold text-[#1A1A1A] dark:text-gray-100 ml-1">{value}</span>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-2.5 p-1">
      <div className="flex items-center justify-between mb-5">
        <div className="h-5 w-32 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
          <div className="h-8 w-28 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
          <div className="h-8 w-20 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
      <div className="h-9 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg w-full" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <div className="h-12 w-48 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg shrink-0" />
          <div className="h-12 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg flex-1" style={{ opacity: 1 - i * 0.1 }} />
        </div>
      ))}
    </div>
  )
}

function computeStats(events: any[], resources: any[]): EventStats {
  const stats: EventStats = { confirmed: 0, pending: 0, active: 0, completed: 0, blocked: 0, vehicles: resources.length }
  for (const e of events) {
    if (e.id?.startsWith('block-')) { stats.blocked++; continue }
    const s = e.extendedProps?.status
    if (s === 'confirmed') stats.confirmed++
    else if (s === 'pending') stats.pending++
    else if (s === 'active') stats.active++
    else if (s === 'completed') stats.completed++
  }
  return stats
}

export default function CalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const [
        { default: FullCalendar },
        { default: resourceTimelinePlugin },
        { default: interactionPlugin },
        { createRoot },
        React,
      ] = await Promise.all([
        import('@fullcalendar/react'),
        import('@fullcalendar/resource-timeline'),
        import('@fullcalendar/interaction'),
        import('react-dom/client'),
        import('react'),
      ])

      if (!containerRef.current) return

      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      const res = await fetch(`/api/admin/calendar?start=${start}&end=${end}`)
      if (!res.ok) { setError('Failed to load calendar data'); setLoading(false); return }
      const { resources, events } = await res.json()

      setStats(computeStats(events, resources))

      const root = createRoot(containerRef.current)
      root.render(
        React.createElement(FullCalendar, {
          plugins: [resourceTimelinePlugin, interactionPlugin],
          initialView: 'resourceTimelineMonth',
          resources,
          events,
          resourceAreaHeaderContent: 'Vehicle',
          resourceAreaWidth: '210px',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineMonth,resourceTimelineWeek',
          },
          height: 'auto',
          eventClick: (info: any) => {
            const bookingId = info.event.id
            if (!bookingId.startsWith('block-')) router.push(`/bookings/${bookingId}`)
          },
          datesSet: async (info: any) => {
            const r = await fetch(`/api/admin/calendar?start=${info.startStr}&end=${info.endStr}`)
            if (r.ok) {
              const d = await r.json()
              setStats(computeStats(d.events, d.resources))
            }
          },
        })
      )
      setLoading(false)
    }

    init().catch((e) => { setError(String(e)); setLoading(false) })
  }, [router])

  const visibleStats = stats
    ? Object.entries(STATUS_META).filter(([key]) => (stats[key as keyof EventStats] as number) > 0)
    : []

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight leading-none">Fleet Calendar</h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1.5">Live vehicle schedule &amp; booking overview</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(STATUS_META).map(([key, { label, dot }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
              <span className="text-xs text-[#6B7280] dark:text-gray-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex gap-2.5 flex-wrap">
          <StatCard label="Vehicles" value={stats.vehicles} dot="bg-[#407E3C]" />
          {visibleStats.map(([key, { label, dot }]) => (
            <StatCard key={key} label={label} value={stats[key as keyof EventStats] as number} dot={dot} />
          ))}
        </div>
      )}

      {/* Calendar card */}
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load calendar</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-6">
            {loading && <CalendarSkeleton />}
            <div ref={containerRef} className={loading ? 'hidden' : ''} />
          </div>
        </div>
      )}
    </div>
  )
}
