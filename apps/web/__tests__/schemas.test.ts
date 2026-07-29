import { CreateBookingSchema, SearchParamsSchema, DriverDetailsSchema } from '../lib/schemas'

describe('CreateBookingSchema', () => {
  const valid = {
    vehicle_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    pickup_datetime: '2026-08-01T10:00:00Z',
    dropoff_datetime: '2026-08-05T10:00:00Z',
    pickup_location_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891',
    dropoff_location_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567892',
    driver_first_name: 'Max',
    driver_last_name: 'Mustermann',
    driver_email: 'max@example.com',
    driver_phone: '+49301234567',
    extras: [],
  }

  test('accepts valid booking', () => {
    expect(CreateBookingSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects invalid vehicle_id (not UUID)', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, vehicle_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  test('rejects invalid email', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, driver_email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  test('rejects short phone', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, driver_phone: '123' })
    expect(result.success).toBe(false)
  })

  test('rejects empty driver first name', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, driver_first_name: '' })
    expect(result.success).toBe(false)
  })

  test('defaults points_redeemed to 0 when omitted', () => {
    const result = CreateBookingSchema.safeParse(valid)
    expect(result.success && result.data.points_redeemed).toBe(0)
  })

  test('rejects negative points_redeemed', () => {
    const result = CreateBookingSchema.safeParse({ ...valid, points_redeemed: -1 })
    expect(result.success).toBe(false)
  })

  test('rejects extra with non-positive quantity', () => {
    const result = CreateBookingSchema.safeParse({
      ...valid,
      extras: [{ extra_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', quantity: 0, price_snapshot: 10 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('DriverDetailsSchema', () => {
  test('accepts valid driver', () => {
    const result = DriverDetailsSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@example.com',
      phone: '+49301234567',
    })
    expect(result.success).toBe(true)
  })

  test('rejects missing email', () => {
    const result = DriverDetailsSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
      phone: '+49301234567',
    })
    expect(result.success).toBe(false)
  })
})

describe('SearchParamsSchema', () => {
  test('accepts empty params', () => {
    expect(SearchParamsSchema.safeParse({}).success).toBe(true)
  })

  test('rejects invalid fuel_type', () => {
    const result = SearchParamsSchema.safeParse({ fuel_type: 'hydrogen' })
    expect(result.success).toBe(false)
  })

  test('rejects negative passenger_capacity', () => {
    const result = SearchParamsSchema.safeParse({ passenger_capacity: -1 })
    expect(result.success).toBe(false)
  })
})
