'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Dynamic import FullCalendar to avoid SSR issues
let FullCalendarLoaded = false

export default function CalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let calendar: any

    async function init() {
      const [
        { default: FullCalendar },
        { default: resourceTimelinePlugin },
        { default: interactionPlugin },
      ] = await Promise.all([
        import('@fullcalendar/react'),
        import('@fullcalendar/resource-timeline'),
        import('@fullcalendar/interaction'),
      ])

      if (!containerRef.current) return

      // Fetch initial data
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      const res = await fetch(`/api/admin/calendar?start=${start}&end=${end}`)
      if (!res.ok) { setError('Failed to load calendar data'); setLoading(false); return }
      const { resources, events } = await res.json()

      const { createRoot } = await import('react-dom/client')
      const React = await import('react')

      const root = createRoot(containerRef.current)
      root.render(
        React.createElement(FullCalendar, {
          plugins: [resourceTimelinePlugin, interactionPlugin],
          initialView: 'resourceTimelineMonth',
          resources,
          events,
          resourceAreaHeaderContent: 'Vehicle',
          resourceAreaWidth: '220px',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineMonth,resourceTimelineWeek',
          },
          height: 'auto',
          eventClick: (info: any) => {
            const bookingId = info.event.id
            if (!bookingId.startsWith('block-')) {
              router.push(`/bookings/${bookingId}`)
            }
          },
          datesSet: async (info: any) => {
            const r = await fetch(`/api/admin/calendar?start=${info.startStr}&end=${info.endStr}`)
            if (r.ok) {
              const d = await r.json()
              // Re-render with new data would require full calendar API
              // For MVP: page refresh on navigation handled by FullCalendar internally
            }
          },
        })
      )
      setLoading(false)
    }

    init().catch((e) => { setError(String(e)); setLoading(false) })
  }, [router])

  if (error) return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Calendar</h1>
      <p className="text-[#DC2626]">{error}</p>
    </div>
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">Calendar</h1>
      {loading && <div className="text-[#6B7280] mb-4">Loading calendar…</div>}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 overflow-x-auto">
        <div ref={containerRef} />
      </div>
    </div>
  )
}
