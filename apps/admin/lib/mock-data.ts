export const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

const now = new Date()
const d = (offsetDays: number) => new Date(now.getTime() + offsetDays * 86400000).toISOString()

export const MOCK_BOOKINGS = [
  {
    id: 'mock-1',
    booking_ref: 'REC-0001',
    status: 'confirmed',
    total_price: 357,
    pickup_datetime: d(1),
    dropoff_datetime: d(5),
    created_at: d(-2),
    driver_first_name: 'Hans',
    driver_last_name: 'Müller',
    driver_email: 'hans.mueller@example.de',
    notes: null,
    ai_policy_decision: null,
    vehicle: { make: 'BMW', model: '3 Series', year: 2023, registration_plate: 'B-RT 1234', category: { name: 'Compact' } },
    extras: [],
    payment: { amount: 357, status: 'paid', stripe_payment_intent_id: 'pi_mock_001', paid_at: d(-1) },
  },
  {
    id: 'mock-2',
    booking_ref: 'REC-0002',
    status: 'pending',
    total_price: 245,
    pickup_datetime: d(3),
    dropoff_datetime: d(8),
    created_at: d(-1),
    driver_first_name: 'Anna',
    driver_last_name: 'Schmidt',
    driver_email: 'anna.schmidt@example.de',
    notes: null,
    ai_policy_decision: null,
    vehicle: { make: 'Volkswagen', model: 'Golf', year: 2023, registration_plate: 'B-RT 5678', category: { name: 'Economy' } },
    extras: [],
    payment: null,
  },
  {
    id: 'mock-3',
    booking_ref: 'REC-0003',
    status: 'active',
    total_price: 596,
    pickup_datetime: d(-1),
    dropoff_datetime: d(2),
    created_at: d(-3),
    driver_first_name: 'Klaus',
    driver_last_name: 'Weber',
    driver_email: 'klaus.weber@example.de',
    notes: 'Customer requested GPS add-on',
    ai_policy_decision: null,
    vehicle: { make: 'Mercedes', model: 'Sprinter', year: 2022, registration_plate: 'B-RT 9012', category: { name: 'Van' } },
    extras: [{ quantity: 1, price_snapshot: 25, extra: { name: 'GPS Navigator', price: 25 } }],
    payment: { amount: 596, status: 'paid', stripe_payment_intent_id: 'pi_mock_003', paid_at: d(-3) },
  },
]
