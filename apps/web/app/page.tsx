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

  // Load all vehicles on mount
  useEffect(() => {
    search()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAiResult = (params: SearchParams) => {
    setAiPrefill(params)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">
            Find your perfect vehicle
          </h1>
          <p className="text-[#6B7280] mb-6">
            Berlin&apos;s AI-native rental service. Search by typing what you need.
          </p>

          <ConversationalSearch onResult={handleAiResult} />
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

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Available Vehicles</h2>
        </div>
        <div className="mb-6">
          <CategoryFilter />
        </div>
        <VehicleGrid />
      </div>
    </div>
  )
}
