'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import CheckoutStepper from '@/components/booking/CheckoutStepper'
import { useBookingStore } from '@/hooks/useBookingStore'
import type { BookingConfirmation } from '@/lib/schemas'

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('en-DE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })
}

function BookConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reset = useBookingStore((s) => s.reset)

  const bookingId = searchParams.get('booking_id')
  const redirectStatus = searchParams.get('redirect_status')

  const [booking, setBooking] = useState<BookingConfirmation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!bookingId) {
      router.replace('/')
      return
    }

    async function fetchBooking() {
      const res = await fetch(`/api/bookings/${bookingId}`)
      if (!res.ok) {
        setError('Could not load booking details.')
        setLoading(false)
        return
      }

      const data: BookingConfirmation = await res.json()
      setBooking(data)
      setLoading(false)

      // If webhook hasn't fired yet, poll up to 6 times (30s total)
      if (data.status === 'pending' && redirectStatus === 'succeeded') {
        setPollCount((c) => c + 1)
      }
    }

    fetchBooking()
  }, [bookingId, redirectStatus, router, pollCount])

  // Polling: retry if still pending after Stripe redirect
  useEffect(() => {
    if (pollCount > 0 && pollCount <= 6 && booking?.status === 'pending') {
      const t = setTimeout(() => setPollCount((c) => c + 1), 5000)
      return () => clearTimeout(t)
    }
  }, [pollCount, booking?.status])

  // Clear store once confirmed
  useEffect(() => {
    if (booking?.status === 'confirmed') {
      reset()
    }
  }, [booking?.status, reset])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <CheckoutStepper current={5} />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[#6B7280] text-sm">Loading your booking…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <CheckoutStepper current={5} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-[#DC2626] font-medium mb-4">{error}</p>
          <Link href="/" className="btn-primary px-6 py-2 text-sm inline-block">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  // Payment failed
  if (redirectStatus === 'failed' || (booking && booking.status === 'pending' && pollCount > 6)) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <CheckoutStepper current={4} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Payment Failed</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            Your card was not charged. Your booking is still reserved — please try again.
          </p>
          <button
            onClick={() => router.push(`/book/payment`)}
            className="btn-primary px-6 py-2 text-sm"
          >
            Try payment again
          </button>
        </div>
      </div>
    )
  }

  // Payment processing (webhook not yet fired)
  if (booking && booking.status === 'pending' && redirectStatus === 'succeeded') {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <CheckoutStepper current={5} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Confirming your booking…</h1>
          <p className="text-[#6B7280] text-sm">Payment received. We're confirming your reservation.</p>
        </div>
      </div>
    )
  }

  // Confirmed
  if (booking && booking.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <CheckoutStepper current={5} />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#F0FDF4] border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Booking Confirmed!</h1>
            <p className="text-[#6B7280] text-sm">A confirmation email has been sent to {booking.driver_email}</p>
          </div>

          {/* Booking ref */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 text-center mb-6">
            <p className="text-xs font-semibold text-[#407E3C] uppercase tracking-wider mb-1">Booking Reference</p>
            <p className="text-3xl font-bold font-mono text-[#1A1A1A]">{booking.booking_ref}</p>
          </div>

          {/* Details card */}
          <div className="card space-y-5 mb-6">
            {/* Vehicle */}
            <div className="pb-4 border-b border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-base font-semibold text-[#1A1A1A]">
                {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
              </p>
              {booking.vehicle.category && (
                <p className="text-sm text-[#6B7280]">{booking.vehicle.category.name}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E5E7EB]">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Pick-up</p>
                <p className="text-sm text-[#1A1A1A]">{formatDatetime(booking.pickup_datetime)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Drop-off</p>
                <p className="text-sm text-[#1A1A1A]">{formatDatetime(booking.dropoff_datetime)}</p>
              </div>
            </div>

            {/* Driver */}
            <div className="pb-4 border-b border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Driver</p>
              <p className="text-sm text-[#1A1A1A]">{booking.driver_first_name} {booking.driver_last_name}</p>
            </div>

            {/* Extras */}
            {booking.extras.length > 0 && (
              <div className="pb-4 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Extras</p>
                <ul className="space-y-1">
                  {booking.extras.map((e, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">{e.name}{e.quantity > 1 ? ` ×${e.quantity}` : ''}</span>
                      <span className="text-[#1A1A1A]">€{e.price_snapshot.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1A1A1A]">Total Charged</span>
              <span className="text-xl font-bold text-primary">€{Number(booking.total_price).toFixed(2)}</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="card bg-[#F9FAFB] border-l-4 border-l-[#407E3C] mb-8">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-3">What happens next</p>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li className="flex gap-2">
                <span className="text-[#407E3C] mt-0.5">•</span>
                Your vehicle will be ready at <strong className="text-[#1A1A1A]">RECI HQ, Berlin</strong> at the pick-up time.
              </li>
              <li className="flex gap-2">
                <span className="text-[#407E3C] mt-0.5">•</span>
                Bring your <strong className="text-[#1A1A1A]">driving licence</strong> and this confirmation email.
              </li>
              <li className="flex gap-2">
                <span className="text-[#407E3C] mt-0.5">•</span>
                Questions? Call us at <strong className="text-[#1A1A1A]">+49 30 0000 0000</strong>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="btn-primary px-8 py-3 inline-block text-sm font-semibold">
              Return Home
            </Link>
            <Link
              href="/account/bookings"
              className="px-8 py-3 inline-block text-sm font-semibold border border-[#407E3C] text-[#407E3C] rounded-md hover:bg-[#F0FDF4] transition-colors"
            >
              View in My Bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (unknown status)
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-[#6B7280] mb-4">Booking status unknown. Please contact support.</p>
        <Link href="/" className="btn-primary px-6 py-2 text-sm inline-block">Return home</Link>
      </div>
    </div>
  )
}

export default function BookConfirmationPage() {
  return (
    <Suspense>
      <BookConfirmationContent />
    </Suspense>
  )
}
