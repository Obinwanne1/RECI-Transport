import type { PricingInput, PricingBreakdown } from '@reci/types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Calculate rental days — always round up (partial day = full day).
 * Min 1 day.
 */
export function calcDays(pickupDatetime: string, dropoffDatetime: string): number {
  const pickup = new Date(pickupDatetime).getTime()
  const dropoff = new Date(dropoffDatetime).getTime()
  if (dropoff <= pickup) throw new Error('dropoff must be after pickup')
  return Math.max(1, Math.ceil((dropoff - pickup) / MS_PER_DAY))
}

/**
 * Single source of truth for all pricing.
 * Used by API routes AND UI — prevents display/charge drift.
 */
export function calculatePrice(input: PricingInput): PricingBreakdown {
  const {
    base_rate_per_day,
    pickup_datetime,
    dropoff_datetime,
    extras,
    override_surcharge_pct = 0,
    corporate_discount_pct = 0,
  } = input

  const days = calcDays(pickup_datetime, dropoff_datetime)

  // Base subtotal
  const base_subtotal = round2(base_rate_per_day * days)

  // Extras subtotal
  const extras_subtotal = round2(
    extras.reduce((sum, e) => {
      const line = e.is_one_time_fee
        ? e.price_per_day * e.quantity
        : e.price_per_day * days * e.quantity
      return sum + line
    }, 0)
  )

  const subtotal = base_subtotal + extras_subtotal

  // Corporate discount applied to base only (not extras)
  const discount_amount = round2(base_subtotal * (corporate_discount_pct / 100))

  // Seasonal/demand surcharge applied after discount, to base only
  const surcharge_amount = round2(
    (base_subtotal - discount_amount) * (override_surcharge_pct / 100)
  )

  const total = round2(subtotal - discount_amount + surcharge_amount)

  return {
    days,
    base_subtotal,
    extras_subtotal,
    discount_amount,
    surcharge_amount,
    total,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
