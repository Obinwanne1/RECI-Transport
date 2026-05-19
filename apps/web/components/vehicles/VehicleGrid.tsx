'use client'

import { useVehicleSearch } from '@/hooks/useVehicleSearch'
import VehicleCard from './VehicleCard'

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-[16/9] bg-[#E5E7EB] dark:bg-gray-700 rounded-md mb-4" />
      <div className="h-3 bg-[#E5E7EB] dark:bg-gray-700 rounded w-1/4 mb-2" />
      <div className="h-5 bg-[#E5E7EB] dark:bg-gray-700 rounded w-3/4 mb-1" />
      <div className="h-3 bg-[#E5E7EB] dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-[#E5E7EB] dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-16 bg-[#E5E7EB] dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
        <div className="h-7 w-20 bg-[#E5E7EB] dark:bg-gray-700 rounded" />
        <div className="h-9 w-24 bg-[#E5E7EB] dark:bg-gray-700 rounded-button" />
      </div>
    </div>
  )
}

export default function VehicleGrid() {
  const { results, loading, error, hasSearched } = useVehicleSearch()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-[#DC2626]">
        <p className="font-medium">Search failed</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🚗</div>
        <p className="font-medium text-[#1A1A1A] dark:text-gray-100">No vehicles available for your dates</p>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">Try different dates or remove the type filter</p>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}
