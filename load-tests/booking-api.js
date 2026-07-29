/**
 * k6 load test — Booking Creation API
 * Run: k6 run load-tests/booking-api.js --env BASE_URL=https://web-lilac-nine-19.vercel.app --env AUTH_TOKEN=<jwt>
 *
 * AUTH_TOKEN: copy from browser DevTools → Application → Cookies → sb-*-auth-token (access_token field)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const bookingLatency = new Trend('booking_latency_ms', true)
const errorRate = new Rate('error_rate')

export const options = {
  stages: [
    { duration: '30s', target: 5  },  // gentle ramp — booking API has rate limit (5/min)
    { duration: '2m',  target: 5  },  // hold
    { duration: '30s', target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // booking creates Stripe PaymentIntent — allow 5s
    error_rate: ['rate<0.05'],
    booking_latency_ms: ['p(99)<8000'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

// These vehicle IDs must exist in your Supabase vehicles table
const VEHICLE_IDS = [
  __ENV.VEHICLE_ID_1 || 'replace-with-real-uuid-1',
  __ENV.VEHICLE_ID_2 || 'replace-with-real-uuid-2',
]

function randomFutureDates() {
  const daysAhead = Math.floor(Math.random() * 30) + 7  // 7-37 days ahead
  const pickup = new Date(Date.now() + daysAhead * 86400000)
  const dropoff = new Date(pickup.getTime() + (Math.floor(Math.random() * 3) + 1) * 86400000)
  return {
    pickup: pickup.toISOString().replace('T', ' ').slice(0, 16),
    dropoff: dropoff.toISOString().replace('T', ' ').slice(0, 16),
  }
}

export default function () {
  const vehicleId = VEHICLE_IDS[Math.floor(Math.random() * VEHICLE_IDS.length)]
  const dates = randomFutureDates()

  const payload = JSON.stringify({
    vehicle_id: vehicleId,
    pickup_datetime: dates.pickup,
    dropoff_datetime: dates.dropoff,
    pickup_location: 'RECI HQ Berlin',
    dropoff_location: 'RECI HQ Berlin',
    driver_first_name: 'Load',
    driver_last_name: 'Test',
    driver_email: `loadtest+${Date.now()}@example.com`,
    driver_phone: '+49300000000',
    driver_licence_number: 'LT-TEST-001',
    extras: [],
    points_redeemed: 0,
  })

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
    headers['Cookie'] = `sb-access-token=${AUTH_TOKEN}`
  }

  const start = Date.now()
  const res = http.post(`${BASE_URL}/api/bookings`, payload, { headers, timeout: '15s' })
  bookingLatency.add(Date.now() - start)

  const ok = check(res, {
    'status 201': (r) => r.status === 201,
    'has booking_id': (r) => {
      try {
        const body = JSON.parse(r.body)
        return typeof body.booking_id === 'string'
      } catch {
        return false
      }
    },
  })

  errorRate.add(!ok)
  sleep(Math.random() * 5 + 5) // 5-10s think time between bookings
}
