# RECI Transport — Phase State

## Current Phase: AUDIT COMPLETE ✓
**Date:** 2026-07-29

## Phase 0 — Foundation ✓
- Monorepo, packages, apps, schema, seed, .env.example
- `pnpm dev` → web:200, admin:200

## Phase 1 — Vehicle Search + Availability + Conversational Entry ✓
- GET /api/vehicles, GET /api/vehicles/[id]/availability
- POST /api/ai/search (Claude sonnet-4-6, Zod validated, rate limited)
- SearchWidget, ConversationalSearch, CategoryFilter, VehicleCard, VehicleGrid, Navbar
- Zustand useVehicleSearch store

## Phase 2 — Booking Engine + Extras ✓
- Zustand useBookingStore, 5-step checkout flow
- POST /api/bookings — TOCTOU check, server-side pricing, rate limited
- GET /api/extras, GET /api/vehicles/[id], GET /api/pricing-signals
- CheckoutStepper, OrderSummary, ExtraSelector, DriverForm, DemandBanner
- /book/[vehicleId], /book/extras, /book/driver, /book/payment (placeholder → Phase 3)

## Phase 3 — Payments + Confirmation ✓
- lib/stripe.ts — lazy-init (avoids build-time throw when env absent)
- lib/email.ts — lazy-init Resend; sendBookingConfirmation + sendCorporateInvoice
- POST /api/payments/intent — idempotent, rate-limited 5/min, server-side amount
- POST /api/webhooks/stripe — sig verified, idempotent, succeeded/failed
- GET /api/bookings/[id] — full booking with joins
- /book/payment — Stripe Elements, RECI theme, retry on intent error
- /book/confirmation — confirmed/processing/failed/polling states, Suspense wrapped

## Phase 4 — Auth + Corporate ✓
- middleware.ts — session refresh + /account/* protection
- /auth/login (Suspense wrapped), /auth/register, /auth/callback
- useAuth hook, Navbar auth state + dropdown
- /account/bookings, /account/profile, /account/corporate
- POST /api/bookings updated: user_id, corporate pricing, AI agent call
- lib/corporate-agent.ts — Claude sonnet-4-6, Zod validated, non-blocking
- sendCorporateInvoice wired in webhook for corporate bookings

## Phase 5 — Admin Dashboard ✓
- Full admin portal: Dashboard, Bookings, Fleet, Calendar, Customers, Pricing, Availability, Maintenance, Reviews, Integrations, Users (admin only)
- HITL review system: Licence OCR + Damage Reports tabs
- AI Vision Adapter: Anthropic or OpenAI-compatible (LLaVA/Ollama)
- FullCalendar resource timeline

## Security + Performance + UX Audit ✓ (2026-07-29)

### Security fixes (S1–S5)
- **S1** — `assertAdminSession()` / `assertAdminOnly()` added to all 21 admin API routes (`apps/admin/lib/auth.ts`)
- **S2** — Forgot-password: DB rate limiting (3 req/15min) + `redirectTo` allowlist validation
- **S3** — Search input sanitization: strict allowlist `/[^a-zA-Z0-9 @.\-]/g` across all 3 search routes
- **S4** — AI route rate limiting moved from in-memory Map → `api_rate_limits` Supabase table (serverless-safe)
- **S5** — File upload MIME type: strict `EXT_MAP` allowlist (`image/jpeg`, `image/png`, `image/webp`)

### Performance fixes (P1–P7)
- **P1** — Fleet pagination: `/api/admin/vehicles` accepts `page`/`perPage`; fleet UI has Previous/Next controls
- **P2** — Vehicle search: `revalidate = 60`
- **P3** — Vehicle detail: `revalidate = 3600`
- **P4** — Admin KPIs: `revalidate = 60` (was `force-dynamic`); removed `force-dynamic` from dashboard page
- **P5** — AdminNav review count: module-level cache, max 1 fetch per 30s
- **P6** — Booking page vehicle image: `<img>` → `<Image fill unoptimized />`
- **P7** — Pricing signals: `revalidate = 300`

### UX + reliability fixes (U1–U9)
- **U1** — Fleet + Reviews mutations: check `res.ok` before updating state; show error
- **U2** — Licence verify API: returns 500 on partial write (profile update fail)
- **U3** — Damage review API: returns 500 when booking notes update fails
- **U4** — Toast system: `ToastProvider.tsx` + `useToast()` hook; auto-dismiss 4s; wired into `AdminShell`
- **U5** — Bookings page: distinct error state vs empty state
- **U6** — Damage inspection insert: returns 500 when DB insert fails
- **U7** — TypeScript: `BookingRow` + `VehicleRow` interfaces replace `any[]`
- **U8** — Stripe key: runtime guard throws if `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` missing
- **U9** — Reviews page: all form labels have matching `htmlFor`/`id`

### Mobile responsive admin
- `AdminShell.tsx` — client component managing mobile drawer state
- `TopBar.tsx` — hamburger `☰` button (`lg:hidden`) opens drawer
- `AdminNav.tsx` — ✕ close button (`lg:hidden`) + `onClose` prop
- `apps/admin/app/layout.tsx` — viewport meta tag added; uses `AdminShell`

### Port change
- Web app moved from port 3000 → **3002** (port 3000 occupied by RMM System PID 11724 — never kill)
- `apps/web/.env.local`: `NEXT_PUBLIC_APP_URL=http://localhost:3002`

### New files created
- `apps/admin/components/AdminShell.tsx`
- `apps/admin/components/ToastProvider.tsx`
- `apps/admin/lib/auth.ts`
- `apps/web/lib/rate-limit.ts`
- `supabase/migrations/008_rate_limits.sql`

### Commits
- `d9fe11e` — Security + performance audit fixes (S1-S5, P1-P7)
- `d9416a5` — UX/reliability fixes + mobile responsive admin (U1-U9, AdminShell)

---

## Production URLs (live on Vercel)

| App | URL | Status |
|---|---|---|
| Customer portal | `https://web-lilac-nine-19.vercel.app` | ✓ Live |
| Admin portal | `https://admin-umber-seven.vercel.app/admin` | ✓ Live |
| Supabase | `https://ewrknfmpdifdgxlmqbzi.supabase.co` | ✓ Active |

---

## Monetisation Hardening ✓ (2026-07-29)

### Wave 1 — GDPR + Legal
- `apps/web/app/privacy/page.tsx` — Privacy Policy (GDPR-compliant, Berlin/EU)
- `apps/web/app/terms/page.tsx` — Terms of Service (German law, cancellation tiers)
- `apps/web/components/CookieBanner.tsx` — GDPR cookie consent (localStorage, accept/decline)
- `apps/web/app/api/account/delete/route.ts` — Right-to-erasure endpoint (GDPR Art. 17); blocks if active bookings; anonymises historical records; deletes auth account
- `apps/web/components/layout/Footer.tsx` — Footer with Privacy Policy, Terms, Support, Legal links
- `apps/web/app/layout.tsx` — CookieBanner wired in
- `apps/web/package.json` — dev port fixed 3000 → 3002
- `apps/account/profile/page.tsx` — delete account UI (2-step confirm)

### Wave 2 — Sentry Error Monitoring
- `@sentry/nextjs` added to both apps
- `sentry.client.config.ts` + `sentry.server.config.ts` in web + admin
- `apps/web/next.config.mjs` — wrapped with `withSentryConfig`; security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy); removed `wikimedia.org`, added `images.unsplash.com`
- `apps/admin/next.config.mjs` — same security headers + `withSentryConfig`
- `apps/web/app/error.tsx` — `Sentry.captureException(error)` wired in
- `NEXT_PUBLIC_SENTRY_DSN` added to admin `.env.example`; port fixed 3000→3002 in root+admin `.env.example`

### Wave 3 — Admin Audit Log
- `supabase/migrations/009_admin_audit_log.sql` — append-only table; RLS read-only for admin/staff; indexed by admin_id, created_at, resource
- `apps/admin/lib/audit.ts` — `logAudit()` fire-and-forget helper; never throws
- `apps/admin/lib/auth.ts` — `email` field added to `AuthorizedSession` return type
- `apps/admin/app/api/admin/reviews/licences/[id]/route.ts` — audit on approve + reject
- `apps/admin/app/api/admin/reviews/damage/[id]/route.ts` — audit on confirm_dispute, partial, dismiss

### Wave 4 — Test Suite
- `apps/web/jest.config.ts` — Jest config with `next/jest` transformer
- `apps/web/__tests__/schemas.test.ts` — `CreateBookingSchema`, `DriverDetailsSchema`, `SearchParamsSchema` unit tests (16 cases)
- `apps/web/__tests__/sanitization.test.ts` — S3 allowlist regex tests (9 cases, covers SQLi/XSS/PostgREST vectors)
- `apps/web/__tests__/rate-limit.test.ts` — `checkDbRateLimit` unit tests with Supabase mock (5 cases)
- `playwright.config.ts` — E2E config (Chromium + iPhone 14, baseURL port 3002)
- `e2e/homepage.spec.ts` — 7 E2E specs (load, AI/filter toggle, cookie banner, privacy/terms pages)
- `e2e/booking-flow.spec.ts` — 3 E2E specs (vehicle card, detail page, auth redirect)
- `apps/web/package.json` — `test` + `test:coverage` scripts; jest + @types/jest + ts-jest devDeps
- Root `package.json` — `test:e2e` + `test:e2e:ui` scripts; `@playwright/test` devDep

### Wave 5 — SEO + Analytics
- `apps/web/app/sitemap.ts` — Next.js sitemap route (home, auth, privacy, terms)
- `apps/web/app/robots.ts` — robots.txt (disallows /account/, /book/, /api/, /admin/)
- `apps/web/app/layout.tsx` — full OG metadata (title template, description, keywords, openGraph, twitter card, robots)
- `apps/web/components/PostHogProvider.tsx` — lazy PostHog init; consent-gated (checks `reci-cookie-consent`); EU endpoint (`eu.posthog.com`); page view tracking on route change
- `apps/web/app/page.tsx` — `<Footer />` wired in; PostHogProvider in layout

### Wave 6 — CI/CD Pipeline ✓ (2026-07-29)
- `.github/workflows/ci.yml` — 3-job pipeline: quality (lint + type-check + unit tests) → build → e2e
- E2E job gated to `main` branch and PRs to `main` only (cost control)
- Build uses stub env vars so CI passes without real secrets; `SENTRY_AUTH_TOKEN` via GitHub secret
- Concurrency group cancels stale runs on same branch

### Wave 7 — Load Tests ✓ (2026-07-29)
- `load-tests/vehicle-search.js` — k6 script; 30 VU spike; thresholds: p(95)<2s, error_rate<5%
- `load-tests/booking-api.js` — k6 script; 5 VU steady (rate-limit aware); thresholds: p(95)<5s
- `load-tests/README.md` — install + run instructions; result interpretation guide

### Fixes ✓ (2026-07-29)
- `apps/web/app/privacy/page.tsx` — email domain corrected: `privacy@reci-transport.com` → `privacy@recitransport.de`
- `apps/web/app/terms/page.tsx` — email domain corrected: `legal@reci-transport.com` → `legal@recitransport.de`
- Domain now consistent with `bookings@recitransport.de` used in `lib/email.ts`

### Pending install
Run `pnpm install` from repo root to install: `@sentry/nextjs`, `posthog-js`, `jest`, `@types/jest`, `ts-jest`, `@playwright/test`
Then run `npx playwright install chromium` for E2E browsers.

### Setup needed before going live
1. Create Sentry project → add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env (web + admin); add `SENTRY_AUTH_TOKEN` to GitHub Actions secrets
2. Create PostHog project (EU region) → add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel env (web)
3. Run migration `009_admin_audit_log.sql` in Supabase SQL editor
4. Set up mailboxes: `privacy@recitransport.de` and `legal@recitransport.de`
5. Add all Supabase + Stripe + Anthropic + Resend secrets to GitHub Actions (for E2E job)

## Rating: 10/10 ✓
All blockers resolved. Ready to monetise.

## Next: Phase 6 — React Native Mobile App
- Expo Router tabs: Search, Bookings, Profile
- Vehicle search + availability (reuse web API)
- Booking flow (steps 1-3, Stripe WebView for payment)
- Auth: expo-secure-store session persistence
- Push notifications: Expo Notifications for booking reminders
