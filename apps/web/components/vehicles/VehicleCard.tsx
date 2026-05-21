'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Vehicle } from '@/lib/schemas'

const FUEL_BADGES: Record<string, { label: string; cls: string }> = {
  petrol:   { label: 'Petrol',   cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  diesel:   { label: 'Diesel',   cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  electric: { label: 'Electric', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  hybrid:   { label: 'Hybrid',   cls: 'bg-teal-50 text-teal-600 border-teal-100' },
}

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { id, make, model, year, fuel_type, transmission, image_urls, daily_rate, category } = vehicle
  const image = image_urls?.[0] ?? null
  const fuel = FUEL_BADGES[fuel_type] ?? { label: fuel_type, cls: 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600' }
  const [imgError, setImgError] = useState(false)

  return (
    <div className="group bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-[16/9] bg-[#F3F4F6] dark:bg-gray-800 relative overflow-hidden">
        {image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${make} ${model}`} onError={() => setImgError(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#D1D5DB]">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 10l1.5-4.5h11L19 10M5 10H3l-.5 3H3v4h2v-1h14v1h2v-4h-.5L18 10H5z" />
            </svg>
            <span className="text-xs font-medium text-[#9CA3AF]">{make} {model}</span>
          </div>
        )}
        {/* Category ribbon */}
        {category && (
          <span className="absolute top-3 left-3 bg-[#407E3C] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            {category.name}
          </span>
        )}
        {/* Exact model guarantee badge */}
        {vehicle.guaranteed_model && (
          <span className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-[#407E3C] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-[#407E3C]/30">
            ✓ Exact Model
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-[#1A1A1A] dark:text-gray-100 text-lg leading-tight">{make} {model}</h3>
          <p className="text-sm text-[#9CA3AF] dark:text-gray-500 font-medium">{year}</p>
        </div>

        {/* Specs badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${fuel.cls}`}>
            {fuel.label}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600 capitalize">
            {transmission}
          </span>
          {category && (
            <>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600">
                {category.passenger_capacity} seats
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600">
                {category.luggage_capacity} bags
              </span>
            </>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#F3F4F6] dark:border-gray-700">
          <div>
            {daily_rate != null ? (
              <div className="leading-none">
                <span className="text-2xl font-bold text-[#407E3C]">€{daily_rate}</span>
                <span className="text-sm text-[#9CA3AF] ml-1">/day</span>
              </div>
            ) : (
              <span className="text-sm text-[#9CA3AF]">Price on request</span>
            )}
          </div>
          <Link
            href={`/book/${id}`}
            className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  )
}
