# Load Tests — RECI Transport

Uses [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (standalone binary, no npm install needed).

## Install k6

```bash
# Windows (via Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Scripts

| Script | What it tests | Recommended target |
|---|---|---|
| `vehicle-search.js` | `GET /api/vehicles` search + filter | Staging or Production |
| `booking-api.js` | `POST /api/bookings` creation flow | Staging only (creates real bookings) |

## Run vehicle search test

```bash
# Against staging/production
k6 run load-tests/vehicle-search.js --env BASE_URL=https://web-lilac-nine-19.vercel.app

# Against local dev
k6 run load-tests/vehicle-search.js --env BASE_URL=http://localhost:3002
```

## Run booking API test

**Run against staging only** — creates real booking rows in Supabase.

1. Get a valid JWT from browser DevTools (Application → Cookies → find `sb-*-auth-token`, copy `access_token`)
2. Get two vehicle IDs from Supabase dashboard

```bash
k6 run load-tests/booking-api.js \
  --env BASE_URL=https://web-lilac-nine-19.vercel.app \
  --env AUTH_TOKEN=<your-jwt> \
  --env VEHICLE_ID_1=<uuid-1> \
  --env VEHICLE_ID_2=<uuid-2>
```

## Thresholds

Both scripts fail the run if:
- `p(95)` response time > 2s (search) / 5s (booking)
- Error rate > 5%
- `p(99)` latency > 3s (search) / 8s (booking)

## Interpreting results

```
✓ status 200 ............... 100%
✓ has vehicles array ........ 100%

search_latency_ms p(95)=843ms   ← target: <2000ms
http_req_duration p(99)=1.2s    ← target: <3000ms
error_rate ................ 0%  ← target: <5%
```
