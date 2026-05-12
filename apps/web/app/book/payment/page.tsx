'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '@/components/layout/Navbar'
import CheckoutStepper from '@/components/booking/CheckoutStepper'
import OrderSummary from '@/components/booking/OrderSummary'
import { useBookingStore } from '@/hooks/useBookingStore'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Inner form (must be inside <Elements>) ───────────────────────────────────

interface PaymentFormProps {
  bookingId: string
  bookingRef: string
  amount: number
}

function PaymentForm({ bookingId, bookingRef, amount }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setStripeError(null)

    const origin = window.location.origin
    const returnUrl = `${origin}/book/confirmation?booking_id=${bookingId}`

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })

    // Only runs if redirect didn't happen (i.e. error)
    if (error) {
      setStripeError(error.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Card Details</h2>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { email: 'never' } },
          }}
        />

        {stripeError && (
          <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">
            {stripeError}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#6B7280]">Booking ref</span>
            <span className="text-sm font-mono font-semibold text-[#1A1A1A]">{bookingRef}</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-base font-semibold text-[#1A1A1A]">Total due</span>
            <span className="text-2xl font-bold text-primary">€{amount.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={!stripe || submitting}
            className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing…' : `Pay €${amount.toFixed(2)}`}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
        <svg className="w-4 h-4 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe. Your card details are never stored on our servers.
      </div>
    </form>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function BookPaymentPage() {
  const router = useRouter()
  const { bookingId, bookingRef, pricing } = useBookingStore()

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(pricing?.total ?? 0)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const createIntent = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    setIntentError(null)

    try {
      const res = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed to initialise payment' }))
        setIntentError(error ?? 'Failed to initialise payment')
        return
      }

      const { client_secret, amount: serverAmount } = await res.json()
      setClientSecret(client_secret)
      setAmount(serverAmount)
    } catch {
      setIntentError('Network error. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) {
      router.replace('/')
      return
    }
    createIntent()
  }, [bookingId, router, createIntent])

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <CheckoutStepper current={4} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading && (
              <div className="card text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">Preparing secure payment…</p>
              </div>
            )}

            {intentError && !loading && (
              <div className="card text-center py-10">
                <p className="text-[#DC2626] font-medium mb-3">{intentError}</p>
                <button
                  onClick={createIntent}
                  className="btn-primary px-6 py-2 text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {clientSecret && !loading && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#407E3C',
                      colorBackground: '#ffffff',
                      colorText: '#1A1A1A',
                      colorDanger: '#DC2626',
                      borderRadius: '6px',
                      fontFamily: 'Poppins, system-ui, sans-serif',
                    },
                  },
                }}
              >
                <PaymentForm
                  bookingId={bookingId!}
                  bookingRef={bookingRef ?? ''}
                  amount={amount}
                />
              </Elements>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-6 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
        >
          ← Back to driver details
        </button>
      </div>
    </div>
  )
}
