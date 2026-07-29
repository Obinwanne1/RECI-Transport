/**
 * k6 load test — Vehicle Search API
 * Run: k6 run load-tests/vehicle-search.js --env BASE_URL=https://web-lilac-nine-19.vercel.app
 *
 * Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const searchLatency = new Trend('search_latency_ms', true)
const errorRate = new Rate('error_rate')

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up to 10 VUs
    { duration: '1m',  target: 10 },  // hold 10 VUs for 1 minute
    { duration: '30s', target: 30 },  // spike to 30 VUs
    { duration: '30s', target: 30 },  // hold spike
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    error_rate: ['rate<0.05'],          // error rate under 5%
    search_latency_ms: ['p(99)<3000'],  // 99th percentile under 3s
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002'

const SEARCH_SCENARIOS = [
  { category_slug: null,      pickup_date: null,         dropoff_date: null },
  { category_slug: 'sedan',   pickup_date: '2026-09-01', dropoff_date: '2026-09-03' },
  { category_slug: 'van',     pickup_date: '2026-09-10', dropoff_date: '2026-09-12' },
  { category_slug: 'suv',     pickup_date: null,         dropoff_date: null },
  { category_slug: 'compact', pickup_date: '2026-08-15', dropoff_date: '2026-08-16' },
]

export default function () {
  const scenario = SEARCH_SCENARIOS[Math.floor(Math.random() * SEARCH_SCENARIOS.length)]

  const params = new URLSearchParams()
  if (scenario.category_slug) params.set('category_slug', scenario.category_slug)
  if (scenario.pickup_date)   params.set('pickup_date', scenario.pickup_date)
  if (scenario.dropoff_date)  params.set('dropoff_date', scenario.dropoff_date)

  const url = `${BASE_URL}/api/vehicles?${params.toString()}`
  const start = Date.now()
  const res = http.get(url, {
    headers: { Accept: 'application/json' },
    timeout: '10s',
  })
  searchLatency.add(Date.now() - start)

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'has vehicles array': (r) => {
      try {
        const body = JSON.parse(r.body)
        return Array.isArray(body.vehicles)
      } catch {
        return false
      }
    },
  })

  errorRate.add(!ok)
  sleep(Math.random() * 2 + 1) // 1-3s think time
}
