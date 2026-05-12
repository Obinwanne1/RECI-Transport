'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CheckoutStepper from '@/components/booking/CheckoutStepper'
import DemandBanner from '@/components/search/DemandBanner'
import { useBookingStore } from '@/hooks/useBookingStore'
import { calculatePrice } from '@reci/utils'
import type { Vehicle } from '@/lib/schemas'

export default function BookStep1Page({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = use(params)
  const router = useRouter()
  const { setVehicle, setDates, setPricing, pickupDate, dropoffDate, vehicle: storedVehicle } = useBookingStore()

  const [vehicle, setVehicleLocal] = useState<Vehicle | null>(storedVehicle)
  const [loading, setLoading] = useState(!storedVehicle)
  const [error, setError] = useState<string | null>(null)
  const [pickup, setPickup] = useState(pickupDate ?? '')
  const [dropoff, setDropoff] = useState(dropoffDate ?? '')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (storedVehicle?.id === vehicleId) return
    fetch(`/api/vehicles/${vehicleId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Vehicle not found')
        return r.json()
      })
      .then((v: Vehicle) => {
        setVehicleLocal(v)
        setVehicle(v)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [vehicleId, storedVehicle, setVehicle])

  const days = (() => {
    if (!pickup || !dropoff || dropoff <= pickup) return 0
    try { return Math.max(1, Math.ceil((new Date(dropoff).getTime() - new Date(pickup).getTime()) / 86400000)) }
    catch { return 0 }
  })()

  const preview = vehicle?.daily_rate && days > 0
    ? calculatePrice({
        base_rate_per_day: vehicle.daily_rate,
        pickup_datetime: pickup,
        dropoff_datetime: dropoff,
        extras: [],
      })
    : null

  const handleContinue = () => {
    if (!vehicle || !pickup || !dropoff || dropoff <= pickup) return
    setVehicle(vehicle)
    setDates(pickup, dropoff)
    if (preview) setPricing(preview)
    router.push('/book/extras')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (error || !vehicle) return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-[#DC2626] font-medium">{error ?? 'Vehicle not found'}</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-4">Back to search</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <CheckoutStepper current={1} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Confirm your vehicle</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="aspect-[16/9] bg-[#F3F4F6] rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {vehicle.image_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vehicle.image_urls[0]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#6B7280] text-sm">No image</span>
                )}
              </div>
              <div className="flex items-start justify-between">
                <div>
                  {vehicle.category && <p className="text-xs font-medium text-primary uppercase tracking-wide">{vehicle.category.name}</p>}
                  <h2 className="text-xl font-bold text-[#1A1A1A]">{vehicle.make} {vehicle.model} <span className="text-[#6B7280] font-normal text-base">({vehicle.year})</span></h2>
                </div>
                {vehicle.daily_rate && (
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">€{vehicle.daily_rate}</span>
                    <span className="text-sm text-[#6B7280]">/day</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">{vehicle.fuel_type}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">{vehicle.transmission}</span>
                {vehicle.category && <>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{vehicle.category.passenger_capacity} seats</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{vehicle.category.luggage_capacity} bags</span>
                </>}
              </div>
              {vehicle.features?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {vehicle.features.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Date picker */}
            <div className="card">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Select your dates</h3>

              {vehicle.category?.id && pickup && dropoff && (
                <DemandBanner
                  categoryId={vehicle.category.id}
                  dateRange={{ start: pickup, end: dropoff }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Pick-up Date</label>
                  <input type="date" min={today} value={pickup} onChange={(e) => setPickup(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Drop-off Date</label>
                  <input type="date" min={pickup || today} value={dropoff} onChange={(e) => setDropoff(e.target.value)} className="input-field" />
                </div>
              </div>
              {pickup && dropoff && dropoff <= pickup && (
                <p className="text-[#DC2626] text-xs mt-2">Drop-off must be after pick-up</p>
              )}
            </div>
          </div>

          {/* Price preview */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Price Preview</h3>
              {preview ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">€{vehicle.daily_rate} × {days} day{days !== 1 ? 's' : ''}</span>
                    <span>€{preview.base_subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-[#E5E7EB]">
                    <span>Subtotal</span>
                    <span className="text-primary">€{preview.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-2">Extras added in next step</p>
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">Select dates to see price</p>
              )}

              <button
                onClick={handleContinue}
                disabled={!pickup || !dropoff || dropoff <= pickup}
                className="btn-primary w-full mt-6"
              >
                Continue to Extras
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
