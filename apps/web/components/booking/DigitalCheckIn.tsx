'use client'

import { useState } from 'react'

interface DigitalCheckInProps {
  bookingRef: string
  driverName: string
  licenceVerified?: boolean
}

const CHECKLIST = [
  { id: 'payment', label: 'Payment confirmed', auto: true },
  { id: 'licence', label: 'Driving licence (original)', auto: false },
  { id: 'qr', label: 'This QR code or booking ref', auto: false },
  { id: 'card', label: 'Payment card for deposit hold (€300–€500)', auto: false },
]

export default function DigitalCheckIn({ bookingRef, driverName, licenceVerified }: DigitalCheckInProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set(['payment', ...(licenceVerified ? ['licence'] : [])]))
  const [expanded, setExpanded] = useState(true)

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(bookingRef)}&size=180x180&format=png&margin=8&color=1A2E18&bgcolor=F0FDF4`

  const toggle = (id: string) => {
    if (id === 'payment') return // always checked
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allReady = CHECKLIST.every((item) => checked.has(item.id))

  return (
    <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 bg-[#F0FDF4] dark:bg-green-900/30 border border-[#BBF7D0] dark:border-green-800 rounded-lg flex items-center justify-center text-base">
            📱
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Digital Check-in</p>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">Show QR at pickup · Skip the counter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allReady && (
            <span className="text-xs font-semibold text-[#407E3C] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
              Ready ✓
            </span>
          )}
          <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E5E7EB] dark:border-gray-700 px-5 py-5">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Left: checklist */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-3">
                Pre-arrival checklist
              </p>
              <ul className="space-y-2.5">
                {CHECKLIST.map((item) => {
                  const done = checked.has(item.id)
                  return (
                    <li key={item.id}>
                      <label className={`flex items-center gap-3 ${item.auto ? 'cursor-default' : 'cursor-pointer group'}`}>
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          done
                            ? 'bg-[#407E3C] border-[#407E3C]'
                            : 'border-[#D1D5DB] dark:border-gray-600 group-hover:border-[#407E3C]'
                        }`}>
                          {done && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm transition-colors ${done ? 'text-[#407E3C] line-through' : 'text-[#1A1A1A] dark:text-gray-200'}`}
                          onClick={() => toggle(item.id)}
                        >
                          {item.label}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 p-3 bg-[#F0FDF4] dark:bg-green-900/20 border border-[#BBF7D0] dark:border-green-800 rounded-lg">
                <p className="text-xs text-[#407E3C] font-medium">
                  Hi {driverName.split(' ')[0]} — show the QR code to our team at pickup and go straight to your vehicle. No paperwork queue.
                </p>
              </div>
            </div>

            {/* Right: QR code */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="p-2 bg-[#F0FDF4] dark:bg-gray-800 border border-[#BBF7D0] dark:border-gray-700 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`QR code for ${bookingRef}`}
                  width={160}
                  height={160}
                  className="rounded-lg"
                  onError={(e) => {
                    // Fallback: hide QR if API unavailable
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p className="text-xs font-mono font-semibold text-[#407E3C] tracking-wider">{bookingRef}</p>
              <button
                onClick={() => window.print()}
                className="text-xs text-[#9CA3AF] hover:text-[#407E3C] transition-colors"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
