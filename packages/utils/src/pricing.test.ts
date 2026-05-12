import { describe, it, expect } from 'vitest'
import { calcDays, calculatePrice } from './pricing'

describe('calcDays', () => {
  it('calculates whole days', () => {
    expect(calcDays('2026-06-01T10:00:00Z', '2026-06-04T10:00:00Z')).toBe(3)
  })

  it('rounds partial day up', () => {
    expect(calcDays('2026-06-01T10:00:00Z', '2026-06-04T11:00:00Z')).toBe(4)
  })

  it('minimum 1 day for same-day return', () => {
    expect(calcDays('2026-06-01T10:00:00Z', '2026-06-01T14:00:00Z')).toBe(1)
  })

  it('throws if dropoff before pickup', () => {
    expect(() => calcDays('2026-06-04T10:00:00Z', '2026-06-01T10:00:00Z')).toThrow()
  })
})

describe('calculatePrice', () => {
  const base = {
    base_rate_per_day: 100,
    pickup_datetime: '2026-06-01T10:00:00Z',
    dropoff_datetime: '2026-06-04T10:00:00Z', // 3 days
    extras: [],
  }

  it('base only — no extras, no discount', () => {
    const result = calculatePrice(base)
    expect(result.days).toBe(3)
    expect(result.base_subtotal).toBe(300)
    expect(result.extras_subtotal).toBe(0)
    expect(result.discount_amount).toBe(0)
    expect(result.surcharge_amount).toBe(0)
    expect(result.total).toBe(300)
  })

  it('adds per-day extras', () => {
    const result = calculatePrice({
      ...base,
      extras: [{ price_per_day: 10, is_one_time_fee: false, quantity: 1 }],
    })
    expect(result.extras_subtotal).toBe(30)
    expect(result.total).toBe(330)
  })

  it('adds one-time fee extras (not multiplied by days)', () => {
    const result = calculatePrice({
      ...base,
      extras: [{ price_per_day: 50, is_one_time_fee: true, quantity: 1 }],
    })
    expect(result.extras_subtotal).toBe(50)
    expect(result.total).toBe(350)
  })

  it('applies corporate discount to base only', () => {
    const result = calculatePrice({
      ...base,
      extras: [{ price_per_day: 10, is_one_time_fee: false, quantity: 1 }],
      corporate_discount_pct: 10,
    })
    // base: 300, extras: 30, discount: 30 (10% of base 300)
    expect(result.discount_amount).toBe(30)
    expect(result.total).toBe(300) // 300 + 30 - 30 = 300
  })

  it('applies surcharge after discount, on base only', () => {
    const result = calculatePrice({
      ...base,
      override_surcharge_pct: 20,
    })
    // base: 300, surcharge: 60 (20% of 300)
    expect(result.surcharge_amount).toBe(60)
    expect(result.total).toBe(360)
  })

  it('discount then surcharge ordering is correct', () => {
    const result = calculatePrice({
      ...base,
      corporate_discount_pct: 10, // -30 → discounted base = 270
      override_surcharge_pct: 10,  // +27 (10% of 270)
    })
    expect(result.discount_amount).toBe(30)
    expect(result.surcharge_amount).toBe(27)
    expect(result.total).toBe(297)
  })

  it('rounds to 2 decimal places', () => {
    const result = calculatePrice({
      base_rate_per_day: 33.33,
      pickup_datetime: '2026-06-01T10:00:00Z',
      dropoff_datetime: '2026-06-04T10:00:00Z',
      extras: [],
    })
    expect(result.base_subtotal).toBe(99.99)
  })
})
