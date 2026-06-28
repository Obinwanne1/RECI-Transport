# RECI Transport — Claude Code Working Guide

## Project Identity

AI-native car rental portal for Berlin. Turborepo monorepo with two Next.js 14.2.21 apps.

| App | Port | URL |
|---|---|---|
| Customer web | 3000 | `http://localhost:3000` |
| Admin portal | 3001 | `http://localhost:3000/admin` (proxy) or `http://localhost:3001/admin` (direct) |

Admin uses `basePath: '/admin'` — direct port 3001 root always returns 404 (expected).

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

# Start both apps simultaneously
pnpm exec turbo run dev --parallel

# Type-check web app
cd apps/web ; pnpm exec tsc --noEmit

# Kill process on port (Windows)
netstat -ano | findstr :3000   # get PID
taskkill /F /PID <PID>
```

After ANY `.env.local` change: kill + restart server. Running process does not pick up env changes.

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
│   ├── anthropic.ts          ← Anthropic singleton
│   └── supabase/server.ts
├── app/
│   ├── loading.tsx           ← Root loading skeleton
│   ├── error.tsx             ← Root error boundary ('use client')
│   ├── vehicles/[id]/        ← Vehicle detail page (server component)
│   ├── book/[vehicleId]/     ← Booking step 1
│   └── api/ai/               ← All AI routes (use singleton)
└── components/
    ├── vehicles/VehicleCard.tsx   ← memo, unoptimized image, click → /vehicles/[id]
    └── booking/OrderSummary.tsx   ← memo, useMemo for price calcs

apps/admin/
├── app/
│   ├── dashboard/users/page.tsx  ← Internal users (admin/staff only, admin role required)
│   ├── customers/page.tsx        ← All customer-facing users
│   └── api/admin/                ← All admin API routes (require admin/staff session)
└── components/AdminNav.tsx
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
| Licence OCR | `POST /api/ai/licence` | claude-sonnet-4-6 (vision) |
| Damage detection | `POST /api/ai/damage` | claude-sonnet-4-6 (vision) |
| Corporate policy agent | `lib/corporate-agent.ts` | claude-sonnet-4-6 |
| Maintenance notes | `GET /admin/api/admin/maintenance` | claude-haiku-4-5-20251001 |

All AI calls are server-side only. All fail gracefully — never block the page on AI failure.

---

## Performance Patterns (Already Live)

- **Anthropic singleton** — module-level init, not per-request
- **API caching** — `export const revalidate = 86400` on `/api/locations`, `3600` on `/api/extras`
- **AbortController** — ConversationalSearch cancels in-flight request on re-submit
- **Exponential backoff** — confirmation page polls 1s→2s→4s→8s→16s→32s
- **React.memo** — VehicleCard, OrderSummary
- **useMemo** — price calculations in OrderSummary

---

## Common Issues and Fixes

| Symptom | Cause | Fix |
|---|---|---|
| "Something went wrong" error boundary | `next/image` hostname not in `remotePatterns` | Add hostname to `next.config.mjs` `images.remotePatterns` |
| `TypeError: fetch failed` on all Supabase calls | Supabase project paused | Resume in Supabase Dashboard; wait ~2min for warm-up |
| Admin returns 401 | `app_metadata.role` not set in Supabase Auth | Set both `user_profiles.role` AND `app_metadata` in Supabase; user must re-login |
| Port already in use | Stale process | `netstat -ano | findstr :<PORT>` → `taskkill /F /PID <PID>` |
| "Users" tab missing in admin sidebar | `userRole` not `'admin'` | Check `user_profiles.role` and `app_metadata.role` both set to `admin` |
| Env changes not picked up | Server loaded old env | Kill and restart dev server |
| Wikimedia images 429 / blocked on Vercel | Next.js optimizer proxy + Wikimedia Referer block | Replace with Unsplash CDN URLs; add `images.unsplash.com` to `remotePatterns`; use `unoptimized` prop |
| Admin portal 404 / redirect loop (`/auth/login`) | `new URL('/auth/login', request.url)` loses `basePath` | Use `request.nextUrl.clone()` + `.pathname =` in all middleware redirects |
| Vercel API 500 with "ByteString char 65279" | PowerShell piped env vars prepend UTF-16 BOM (`U+FEFF`) | Re-add env vars via Bash: `echo -n "value" \| vercel env add VAR production` — never use PowerShell pipe for this |

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
