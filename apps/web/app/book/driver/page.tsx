'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CheckoutStepper from '@/components/booking/CheckoutStepper'
import DriverForm from '@/components/booking/DriverForm'
import OrderSummary from '@/components/booking/OrderSummary'
import { useBookingStore } from '@/hooks/useBookingStore'
import type { DriverDetails } from '@/lib/schemas'

export default function BookDriverPage() {
  const router = useRouter()
  const {
    vehicle,
    pickupDate,
    dropoffDate,
    selectedExtras,
    pickupLocationId,
    dropoffLocationId,
    pointsRedeemed,
    setDriverDetails,
    setBookingResult,
    driverDetails,
  } = useBookingStore()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicle || !pickupDate || !dropoffDate) router.replace('/')
  }, [vehicle, pickupDate, dropoffDate, router])

  const handleSubmit = async (details: DriverDetails) => {
    if (!vehicle || !pickupDate || !dropoffDate) return
    setSubmitting(true)
    setError(null)
    setDriverDetails(details)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          pickup_datetime: new Date(pickupDate).toISOString(),
          dropoff_datetime: new Date(dropoffDate).toISOString(),
          pickup_location_id: pickupLocationId,
          dropoff_location_id: dropoffLocationId,
          driver_first_name: details.first_name,
          driver_last_name: details.last_name,
          driver_email: details.email,
          driver_phone: details.phone,
          driver_licence_number: details.licence_number,
          extras: selectedExtras.map((e) => ({
            extra_id: e.extra_id,
            quantity: e.quantity,
            price_snapshot: e.price_snapshot,
          })),
          points_redeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Booking failed')
        setSubmitting(false)
        return
      }

      setBookingResult(data.booking_id, data.booking_ref)
      router.push('/book/payment')
    } catch {
      setError('Network error — please try again')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />
      <CheckoutStepper current={3} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-6">Driver details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-card text-sm text-[#DC2626]">
                  {error}
                </div>
              )}
              <DriverForm
                defaultValues={driverDetails ?? undefined}
                onSubmit={handleSubmit}
                loading={submitting}
              />
            </div>

            <button
              onClick={() => router.back()}
              className="mt-4 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}
