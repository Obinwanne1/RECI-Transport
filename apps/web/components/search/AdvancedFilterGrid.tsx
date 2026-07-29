'use client'

import { useEffect, useState } from 'react'
import { useVehicleSearch } from '@/hooks/useVehicleSearch'
import type { SearchParams } from '@/lib/schemas'

interface Location { id: string; name: string; city: string }

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-shadow bg-white dark:bg-gray-800'
const labelCls = 'block text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wide mb-1.5'

export default function AdvancedFilterGrid() {
  const { search } = useVehicleSearch()
  const [locations, setLocations] = useState<Location[]>([])

  const [pickupLocationId, setPickupLocationId] = useState('a1b2c3d4-0000-0000-0000-000000000001')
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [transmission, setTransmission] = useState('')
  const [passengerCapacity, setPassengerCapacity] = useState('')

  const [dateError, setDateError] = useState('')

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const today = new Date().toISOString().split('T')[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setDateError('')

    if (pickupDate && dropoffDate && dropoffDate <= pickupDate) {
      setDateError('Drop-off must be after pick-up')
      return
    }

    search({
      pickup_location_id: pickupLocationId || undefined,
      pickup_date: pickupDate || undefined,
      dropoff_date: dropoffDate || undefined,
      category_slug: categorySlug || undefined,
      fuel_type: (fuelType || undefined) as SearchParams['fuel_type'],
      transmission: (transmission || undefined) as SearchParams['transmission'],
      passenger_capacity: passengerCapacity ? parseInt(passengerCapacity, 10) : undefined,
    })
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Location */}
        <div>
          <label className={labelCls}>Pick-up Location</label>
          <select value={pickupLocationId} onChange={e => setPickupLocationId(e.target.value)} className={inputCls}>
            {locations.length === 0 && <option value="a1b2c3d4-0000-0000-0000-000000000001">Berlin HQ</option>}
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.city}</option>)}
          </select>
        </div>

        {/* Pick-up date */}
        <div>
          <label className={labelCls}>Pick-up Date</label>
          <input type="date" min={today} value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={inputCls} />
        </div>

        {/* Drop-off date */}
        <div>
          <label className={labelCls}>Drop-off Date</label>
          <input type="date" min={today} value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} className={inputCls} />
          {dateError && <p className="text-[#DC2626] text-xs mt-1">{dateError}</p>}
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Vehicle Type</label>
          <select value={categorySlug} onChange={e => setCategorySlug(e.target.value)} className={inputCls}>
            <option value="">Any type</option>
            <option value="economy">Economy</option>
            <option value="compact">Compact</option>
            <option value="suv">SUV</option>
            <option value="van">Van</option>
          </select>
        </div>

        {/* Fuel type */}
        <div>
          <label className={labelCls}>Fuel Type</label>
          <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputCls}>
            <option value="">Any fuel</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label className={labelCls}>Transmission</label>
          <select value={transmission} onChange={e => setTransmission(e.target.value)} className={inputCls}>
            <option value="">Any gearbox</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Passenger capacity + submit row */}
      <div className="flex gap-4 items-end">
        <div className="w-48">
          <label className={labelCls}>Min. Passengers</label>
          <select value={passengerCapacity} onChange={e => setPassengerCapacity(e.target.value)} className={inputCls}>
            <option value="">Any</option>
            <option value="2">2+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
            <option value="7">7+</option>
          </select>
        </div>
        <button
          type="submit"
          className="flex-shrink-0 bg-[#407E3C] hover:bg-[#356834] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}
