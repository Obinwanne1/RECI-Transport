'use client'

import { useState } from 'react'
import type { TripCopilotResponse } from '@/lib/schemas'

interface TripCopilotProps {
  bookingId: string
  pickupLocation: string
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  pickupDate: string
  dropoffDate: string
  vehicleName: string
}

type State =
  | { kind: 'collapsed' }
  | { kind: 'loading' }
  | { kind: 'loaded'; data: TripCopilotResponse }
  | { kind: 'error' }

export default function TripCopilot({
  bookingId,
  pickupLocation,
  fuelType,
  pickupDate,
  dropoffDate,
  vehicleName,
}: TripCopilotProps) {
  const [state, setState] = useState<State>({ kind: 'collapsed' })

  async function expand() {
    if (state.kind !== 'collapsed') return
    setState({ kind: 'loading' })

    try {
      const res = await fetch('/api/ai/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          pickup_location: pickupLocation,
          fuel_type: fuelType,
          pickup_date: pickupDate.split('T')[0],
          dropoff_date: dropoffDate.split('T')[0],
          vehicle_name: vehicleName,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const data: TripCopilotResponse = await res.json()
      setState({ kind: 'loaded', data })
    } catch {
      setState({ kind: 'error' })
    }
  }

  function collapse() {
    setState({ kind: 'collapsed' })
  }

  // Collapsed button
  if (state.kind === 'collapsed') {
    return (
      <button
        onClick={expand}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-card hover:border-primary/40 hover:bg-[#F0FDF4] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Plan Your Trip</p>
            <p className="text-xs text-[#6B7280] dark:text-gray-400">AI route guide, fuel estimate & top stops</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  // Loading
  if (state.kind === 'loading') {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-card">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
        <p className="text-sm text-[#6B7280]">Planning your trip…</p>
      </div>
    )
  }

  // Error
  if (state.kind === 'error') {
    return (
      <div className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-card">
        <p className="text-sm text-[#6B7280]">
          Trip planning unavailable —{' '}
          <a
            href="https://www.adac.de"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            check ADAC
          </a>{' '}
          for route info.
        </p>
      </div>
    )
  }

  // Loaded
  const { data } = state
  return (
    <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-card overflow-hidden">
      {/* Header */}
      <button
        onClick={collapse}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Your Trip Plan</p>
        </div>
        <svg className="w-4 h-4 text-[#6B7280] rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="px-4 pb-4 space-y-4 border-t border-[#E5E7EB] dark:border-gray-700">
        {/* Route summary */}
        <div className="pt-3">
          <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1">Route</p>
          <p className="text-sm text-[#1A1A1A] dark:text-gray-200">{data.route_summary}</p>
        </div>

        {/* Fuel cost */}
        {data.estimated_fuel_cost_eur != null && (
          <div className="flex items-center gap-2">
            <span className="text-lg">⛽</span>
            <div>
              <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">Est. Fuel Cost</p>
              <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">
                ~€{data.estimated_fuel_cost_eur.toFixed(0)}
                <span className="text-xs font-normal text-[#6B7280] ml-1">(estimate)</span>
              </p>
            </div>
          </div>
        )}

        {data.fuel_note && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
            <span className="text-base mt-0.5">🔋</span>
            <p className="text-xs text-blue-700 dark:text-blue-400">{data.fuel_note}</p>
          </div>
        )}

        {/* Top stops */}
        {data.top_stops.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-2">Recommended Stops</p>
            <div className="space-y-2">
              {data.top_stops.map((stop, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#407E3C] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-100">{stop.name}</p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400">{stop.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parking */}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1">Parking Tips</p>
          <p className="text-sm text-[#6B7280] dark:text-gray-400">{data.parking_tips}</p>
        </div>
      </div>
    </div>
  )
}
