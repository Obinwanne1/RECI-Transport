'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import ConversationalSearch from '@/components/search/ConversationalSearch'
import SearchWidget from '@/components/search/SearchWidget'
import CategoryFilter from '@/components/search/CategoryFilter'
import VehicleGrid from '@/components/vehicles/VehicleGrid'
import { useVehicleSearch } from '@/hooks/useVehicleSearch'
import type { SearchParams } from '@/lib/schemas'

export default function HomePage() {
  const { search } = useVehicleSearch()
  const [aiPrefill, setAiPrefill] = useState<SearchParams | undefined>()

  useEffect(() => {
    search()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1A2E18 0%, #2d4d29 50%, #407E3C 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-[#5a9e56] translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[#5a9e56] text-sm font-semibold uppercase tracking-widest mb-4">
              <span className="w-6 h-px bg-[#5a9e56]" />
              Berlin&apos;s AI-Native Rental
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Find your<br />
              <span className="text-[#5a9e56]">perfect vehicle</span>
            </h1>
            <p className="text-[#9CA3AF] text-lg">
              Search by typing what you need — our AI understands you.
            </p>
          </div>
        </div>
      </div>

      {/* Search Card — overlaps hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 mb-10">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-[#F3F4F6] dark:border-gray-800">
            <ConversationalSearch onResult={(params) => {
              setAiPrefill(params)
              search(params)
            }} />
          </div>
          <div className="px-6 py-5">
            <SearchWidget
              initialValues={
                aiPrefill
                  ? {
                      pickup_date: aiPrefill.pickup_date,
                      dropoff_date: aiPrefill.dropoff_date,
                      category_slug: aiPrefill.category_slug,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100">Available Vehicles</h2>
        </div>
        <div className="mb-6">
          <CategoryFilter />
        </div>
        <VehicleGrid />
      </div>
    </div>
  )
}
