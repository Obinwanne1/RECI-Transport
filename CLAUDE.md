# RECI Transport — Claude Code Working Guide

## Project Identity

AI-native car rental portal for Berlin. Turborepo monorepo with two Next.js 14.2.21 apps.

| App | Port | URL |
|---|---|---|
| Customer web | **3002** | `http://localhost:3002` |
| Admin portal | 3001 | `http://localhost:3001/admin` (direct) |

Admin uses `basePath: '/admin'` — direct port 3001 root always returns 404 (expected).

> **PORT 3000 WARNING:** Port 3000 is occupied by an unrelated RMM System process (PID 11724). **Never kill it.** Web app intentionally runs on 3002. `NEXT_PUBLIC_APP_URL` in `apps/web/.env.local` is set to `http://localhost:3002` — do not change it back to 3000.

---

## Stack

- **Framework:** Next.js 14.2.21 (App Router), TypeScript, Tailwind CSS
- **Database/Auth:** Supabase (PostgreSQL + RLS + Auth)
- **Payments:** Stripe (Payment Intents + Webhooks)
- **Email:** Resend
- **AI:** Anthropic Claude API (singleton pattern — see below)
- **State:** Zustand (persisted)
- **Validation:** Zod
- **Package manager:** pnpm 9.15.0 (workspaces)
- **Task runner:** Turborepo 2.x

---

## Commands

```powershell
# Install all workspace deps from root
pnpm install

# Start both apps simultaneously (web on 3002, admin on 3001)
pnpm exec turbo run dev --parallel

# Type-check web app
cd apps/web ; pnpm exec tsc --noEmit

# Run unit tests
pnpm turbo test

# Run E2E tests (requires dev server running on 3002)
pnpm test:e2e

# Kill process on port (Windows) — NEVER kill PID 11724 (RMM System on 3000)
netstat -ano | findstr :3002   # get PID for web
taskkill /F /PID <PID>
```

After ANY `.env.local` change: kill + restart server. Running process does not pick up env changes.

---

## CI/CD

`.github/workflows/ci.yml` — 3 jobs run on every push/PR:

| Job | Runs when | What |
|---|---|---|
| `quality` | Always | lint + type-check + unit tests (stub env vars) |
| `build` | After quality passes | `turbo build` for both apps |
| `e2e` | PRs to main + main branch only | Playwright Chromium tests |

**GitHub Actions secrets required:**
- `SENTRY_AUTH_TOKEN` — for Sentry source map upload during build
- All Supabase/Stripe/Resend/Anthropic secrets — for E2E job only

---

## Load Tests

Uses [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (standalone binary).

```bash
# Vehicle search — safe to run against production
k6 run load-tests/vehicle-search.js --env BASE_URL=https://web-lilac-nine-19.vercel.app

# Booking API — staging only (creates real DB rows)
k6 run load-tests/booking-api.js --env BASE_URL=<staging-url> --env AUTH_TOKEN=<jwt> --env VEHICLE_ID_1=<uuid>
```

See `load-tests/README.md` for full instructions.

---

## Contact Emails

Legal contact emails use domain `recitransport.de` (matches Resend FROM domain):
- Privacy: `privacy@recitransport.de`
- Legal: `legal@recitransport.de`
- Bookings (transactional FROM): `bookings@recitransport.de`

---

## Key Architectural Rules

### Anthropic Singleton
Never `new Anthropic()` inside a request handler. Use the singleton:

```typescript
import anthropic from '@/lib/anthropic'
// anthropic.messages.create(...)
```

All AI routes (`/api/ai/*`) and `lib/corporate-agent.ts` import from `@/lib/anthropic`.

### next/image for External URLs
- All allowed hostnames must be in `next.config.mjs` `images.remotePatterns`
- Currently allowed: `**.supabase.co`, `images.unsplash.com`
- Wikimedia was removed — Vercel domains are blocked by Wikimedia's Referer policy (returns redirect/403). All vehicle images now use Unsplash CDN URLs.
- Use `unoptimized` prop on all external images — Next.js optimizer proxy triggers Unsplash/Wikimedia rate limits
- Missing hostname = hard render error that triggers the root error boundary

### Admin Auth (Two-Layer Check)
Admin portal requires BOTH:
1. `user_profiles.role = 'admin' | 'staff'` (database)
2. `app_metadata.role = 'admin' | 'staff'` in Supabase Auth (JWT claim)

One alone is insufficient. User must sign out and back in after metadata change.

Every admin API route also calls `assertAdminSession()` or `assertAdminOnly()` from `apps/admin/lib/auth.ts` — inline auth check as defense-in-depth, not relying on middleware alone.

### Admin Shell (Mobile Responsive)
`apps/admin/components/AdminShell.tsx` — client component managing sidebar state. Wraps all authenticated admin pages. Pattern:
- Mobile: sidebar is `fixed` drawer, hidden off-screen (`-translate-x-full`), revealed on hamburger tap
- Desktop (`lg:`): sidebar is `static`, always visible
- Overlay (`bg-black/50`) closes drawer on tap outside
- `TopBar` receives `onMenuOpen` prop; renders hamburger `☰` button on `< lg` breakpoints only
- `AdminNav` receives `onClose` prop; renders ✕ button inside sidebar on `< lg`

Do not add `AdminNav` or `TopBar` directly to layouts — always go through `AdminShell`.

### Admin Middleware Redirects (basePath Critical Rule)
`apps/admin` uses `basePath: '/admin'`. Never construct redirect URLs with `new URL('/auth/login', request.url)` — this loses the basePath and creates a 404 loop.

**Always use `request.nextUrl.clone()`:**
```typescript
// WRONG — strips basePath, causes redirect loop
const loginUrl = new URL('/auth/login', request.url)

// CORRECT — basePath-aware
const loginUrl = request.nextUrl.clone()
loginUrl.pathname = '/auth/login'
return NextResponse.redirect(loginUrl)
```
This applies to ALL redirects in `apps/admin/middleware.ts`.

### Admin Navigation
- Internal links in admin app use relative paths (e.g. `/dashboard`, not `/admin/dashboard`). Next.js prepends basePath.
- API fetches inside admin use relative paths: `fetch('/api/admin/users')` — not `localhost:3001`.
- "Users" section in sidebar only visible when `userRole === 'admin'`.

### Supabase Free Tier Behaviour
- Projects pause after inactivity. DNS fails entirely while paused (TypeError: fetch failed).
- After resume, expect ~2 min warm-up with 521 Cloudflare errors. Transient — wait.
- Resume via Supabase Dashboard > your project.

---

## File Structure (Key Files)

```
apps/web/
├── lib/
│   ├── anthropic.ts              ← Anthropic singleton
│   ├── ai-vision-adapter.ts      ← Vision provider adapter (Anthropic | OpenAI-compatible)
│   ├── rate-limit.ts             ← DB-backed rate limiting (checkDbRateLimit)
│   └── supabase/server.ts
├── app/
│   ├── loading.tsx               ← Root loading skeleton
│   ├── error.tsx                 ← Root error boundary ('use client')
│   ├── page.tsx                  ← Home: AI/Filter toggle, AgentChat, AdvancedFilterGrid
│   ├── vehicles/[id]/            ← Vehicle detail page (server component)
│   ├── book/[vehicleId]/         ← Booking step 1
│   └── api/ai/
│       ├── damage/route.ts       ← Vision damage check → pending_review, no auto-dispute
│       └── licence/route.ts      ← Vision licence OCR → status=pending, no auto-verify
└── components/search/
    ├── AgentChat.tsx             ← Conversational AI search
    └── AdvancedFilterGrid.tsx    ← Structured filter form (fuel, transmission, passengers)

apps/admin/
├── lib/
│   └── auth.ts                   ← assertAdminSession() + assertAdminOnly() helpers
├── app/
│   ├── layout.tsx                ← Uses AdminShell; viewport meta tag included
│   ├── reviews/page.tsx          ← HITL review UI (2 tabs: Licence OCR | Damage Reports)
│   ├── integrations/page.tsx     ← IoT roadmap page
│   ├── dashboard/users/page.tsx  ← Internal users (admin role required)
│   ├── customers/page.tsx        ← All customer-facing users
│   └── api/admin/
│       ├── reviews/
│       │   ├── licences/route.ts         ← GET pending licences
│       │   ├── licences/[id]/route.ts    ← PATCH approve/reject
│       │   ├── damage/route.ts           ← GET pending damage inspections
│       │   └── damage/[id]/route.ts      ← PATCH confirm/dismiss/partial
│       └── ...                   ← All other admin API routes (all call assertAdminSession)
└── components/
    ├── AdminShell.tsx            ← Client component: mobile drawer + desktop static sidebar
    ├── AdminNav.tsx              ← Sidebar nav; 30s module-level review count cache; onClose prop
    ├── TopBar.tsx                ← Top bar; hamburger button (lg:hidden); onMenuOpen prop
    └── ToastProvider.tsx         ← Toast context + useToast() hook; auto-dismiss 4s

supabase/migrations/
└── 008_rate_limits.sql           ← api_rate_limits table (ip, endpoint, count, reset_at)
```

---

## Vehicle Flow

```
Home (VehicleGrid) → click card → /vehicles/[id] (detail) → Book Now → /book/[vehicleId] (step 1)
                                                                       ↑
                                                           "Book Now" on card also goes here
```

---

## Booking Flow (5 Steps)

1. `/book/[vehicleId]` — vehicle + dates + return location
2. `/book/extras` — add-ons
3. `/book/driver` — driver details + loyalty redemption
4. `/book/payment` — Stripe PaymentElement
5. `/book/confirmation` — booking ref, points earned

Booking record created at step 3. Stripe webhook (`payment_intent.succeeded`) confirms it and awards loyalty points.

---

## Roles

| Role | Access |
|---|---|
| `customer` | Customer web only |
| `staff` | Full admin portal (except Users tab) |
| `admin` | Full admin portal including Users tab and user creation |
| `corporate_manager` | Customer web + corporate features |

---

## AI Features

| Feature | Route | Model |
|---|---|---|
| Conversational search | `POST /api/ai/search` | claude-sonnet-4-6 |
| Extras recommendations | `POST /api/ai/extras-recommend` | claude-haiku-4-5-20251001 |
| Trip co-pilot | `POST /api/ai/trip` | claude-sonnet-4-6 |
| Licence OCR | `POST /api/ai/licence` | via AI Vision Adapter |
| Damage detection | `POST /api/ai/damage` | via AI Vision Adapter |
| Corporate policy agent | `lib/corporate-agent.ts` | claude-sonnet-4-6 |
| Maintenance notes | `GET /admin/api/admin/maintenance` | claude-haiku-4-5-20251001 |

All AI calls are server-side only. All fail gracefully — never block the page on AI failure.

### AI Vision Adapter
Vision calls (damage + licence) go through `apps/web/lib/ai-vision-adapter.ts`. Provider is switched via `AI_VISION_PROVIDER` env var:
- `anthropic` (default) — uses Anthropic singleton
- `openai-compatible` — calls any OpenAI-compatible endpoint (LLaVA/Ollama/LM Studio)

Additional env vars: `AI_VISION_BASE_URL`, `AI_VISION_MODEL`, `AI_VISION_API_KEY`

### HITL — Human-in-the-Loop Reviews
AI damage and licence routes no longer auto-commit results. All results land in a pending state:
- Damage: `ai_damage_report->>'pending_review' = 'true'`, `auto_dispute_raised = false`
- Licence: `status = 'pending'`, `user_profiles.licence_verified` NOT updated

Admin review routes (in `apps/admin/app/api/admin/reviews/`):
- `GET/PATCH /api/admin/reviews/licences` — list + approve/reject
- `GET/PATCH /api/admin/reviews/damage` — list + confirm/dismiss/partial
- Review UI: `apps/admin/app/reviews/page.tsx`
- Nav badge: `AdminNav.tsx` fetches pending count from both endpoints on mount

---

## Performance Patterns (Already Live)

- **Anthropic singleton** — module-level init, not per-request
- **API caching** — `revalidate = 86400` on `/api/locations`, `3600` on `/api/extras` and `/api/vehicles/[id]`, `300` on `/api/pricing-signals`, `60` on `/api/vehicles` and `/api/admin/kpis`
- **Fleet pagination** — `/api/admin/vehicles` accepts `page`/`perPage`; default 20 per page
- **AdminNav review count cache** — module-level `_reviewCount` + `_reviewFetchedAt`; max one fetch per 30s across all re-mounts
- **AbortController** — ConversationalSearch cancels in-flight request on re-submit
- **Exponential backoff** — confirmation page polls 1s→2s→4s→8s→16s→32s
- **React.memo** — VehicleCard, OrderSummary
- **useMemo** — price calculations in OrderSummary
- **DB-backed rate limiting** — `api_rate_limits` table; serverless-safe (no in-memory Map)

---

## Common Issues and Fixes

| Symptom | Cause | Fix |
|---|---|---|
| "Something went wrong" error boundary | `next/image` hostname not in `remotePatterns` | Add hostname to `next.config.mjs` `images.remotePatterns` |
| `TypeError: fetch failed` on all Supabase calls | Supabase project paused | Resume in Supabase Dashboard; wait ~2min for warm-up |
| Admin returns 401 | `app_metadata.role` not set in Supabase Auth | Set both `user_profiles.role` AND `app_metadata` in Supabase; user must re-login |
| Port already in use | Stale process | `netstat -ano | findstr :<PORT>` → `taskkill /F /PID <PID>` — **never kill PID 11724** |
| "Users" tab missing in admin sidebar | `userRole` not `'admin'` | Check `user_profiles.role` and `app_metadata.role` both set to `admin` |
| Env changes not picked up | Server loaded old env | Kill and restart dev server |
| Wikimedia images 429 / blocked on Vercel | Next.js optimizer proxy + Wikimedia Referer block | Replace with Unsplash CDN URLs; add `images.unsplash.com` to `remotePatterns`; use `unoptimized` prop |
| Admin portal 404 / redirect loop (`/auth/login`) | `new URL('/auth/login', request.url)` loses `basePath` | Use `request.nextUrl.clone()` + `.pathname =` in all middleware redirects |
| Vercel API 500 with "ByteString char 65279" | PowerShell piped env vars prepend UTF-16 BOM (`U+FEFF`) | Re-add env vars via Bash: `echo -n "value" \| vercel env add VAR production` — never use PowerShell pipe for this |
| Web app hits wrong port / "Resource not found" on `/api/vehicles` | `NEXT_PUBLIC_APP_URL` points to port 3000 (RMM System) | Verify `apps/web/.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3002` |
| Admin sidebar covers content on mobile | Old layout without AdminShell | All admin pages must use `AdminShell` — never add `AdminNav` directly to layouts |
| Rate limiting bypassed on Vercel | In-memory Map resets per serverless instance | Use `checkDbRateLimit()` from `apps/web/lib/rate-limit.ts` — DB-backed, works across instances |

---

## Deployment

Two separate Vercel projects (web and admin). See `SKILL.md` section 18 for full deployment checklist.

- Web: set `ADMIN_URL` to production admin Vercel URL
- Stripe webhook must point to production domain, not localhost
- `RESEND_FROM_EMAIL` must use a Resend-verified domain
- Supabase Auth redirect URLs must include production domain

### Live Production URLs

| App | URL |
|---|---|
| Customer portal | `https://web-lilac-nine-19.vercel.app` |
| Admin portal | `https://admin-umber-seven.vercel.app/admin` |
| Demo admin login | `demo@reci-transport.com` / `RecIDemo2026!` |
| Supabase project | `https://ewrknfmpdifdgxlmqbzi.supabase.co` |

### Vercel Env Var Warning — PowerShell BOM Bug
**NEVER** set Vercel env vars by piping strings in PowerShell:
```powershell
# BROKEN — prepends UTF-16 BOM (U+FEFF char 65279) to the value
"sk-ant-..." | vercel env add ANTHROPIC_API_KEY production
```
**Always use Bash `echo -n`:**
```bash
echo -n "sk-ant-..." | vercel env add ANTHROPIC_API_KEY production
```
The BOM causes `TypeError: Cannot convert argument to a ByteString because the character at index 0 has a value of 65279` in every Supabase/Anthropic HTTP call on Vercel.

Full rebuild spec: `SKILL.md`
Full system documentation: `docs/RECI_TRANSPORT_DOCS.pdf`
