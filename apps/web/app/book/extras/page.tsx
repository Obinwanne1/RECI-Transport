'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CheckoutStepper from '@/components/booking/CheckoutStepper'
import ExtraSelector from '@/components/booking/ExtraSelector'
import OrderSummary from '@/components/booking/OrderSummary'
import { useBookingStore } from '@/hooks/useBookingStore'
import { calculatePrice } from '@reci/utils'
import type { Extra } from '@/lib/schemas'

export default function BookExtrasPage() {
  const router = useRouter()
  const { vehicle, pickupDate, dropoffDate, selectedExtras, setPricing } = useBookingStore()
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)

  // Guard: must have vehicle + dates
  useEffect(() => {
    if (!vehicle || !pickupDate || !dropoffDate) {
      router.replace('/')
      return
    }
    fetch('/api/extras')
      .then((r) => r.json())
      .then((data: Extra[]) => { setExtras(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [vehicle, pickupDate, dropoffDate, router])

  // Recalculate pricing whenever extras change
  useEffect(() => {
    if (!vehicle?.daily_rate || !pickupDate || !dropoffDate) return
    const pricing = calculatePrice({
      base_rate_per_day: vehicle.daily_rate,
      pickup_datetime: pickupDate,
      dropoff_datetime: dropoffDate,
      extras: selectedExtras.map((e) => ({
        price_per_day: e.price_per_day,
        is_one_time_fee: e.is_one_time_fee,
        quantity: e.quantity,
      })),
    })
    setPricing(pricing)
  }, [selectedExtras, vehicle, pickupDate, dropoffDate, setPricing])

  const days = (() => {
    if (!pickupDate || !dropoffDate) return 0
    try { return Math.max(1, Math.ceil((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / 86400000)) }
    catch { return 0 }
  })()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <CheckoutStepper current={2} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Choose your extras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="card flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="card">
                <ExtraSelector extras={extras} days={days} />
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <button onClick={() => router.back()} className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
                ← Back
              </button>
              <button onClick={() => router.push('/book/driver')} className="btn-primary">
                Continue to Driver Details
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}
