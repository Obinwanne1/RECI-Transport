# Plan: Single URL + Full Dark Mode (Web Frontend)

**Date:** 2026-05-19  
**Status:** AWAITING APPROVAL

---

## Goals

1. Admin (`apps/admin`) and web (`apps/web`) accessible from a single port via one `pnpm dev` command
2. Admin at `localhost:3000/admin`, customer site at `localhost:3000/`
3. Full dark/light mode toggle on ALL web frontend pages and components

---

## Part 1 — Single URL Setup

### Approach: `basePath` + Next.js rewrite proxy

**Why this approach:**
- No nginx required, no extra tooling
- Pure Next.js config — works in dev and production identically
- Admin keeps its own Next.js server (port 3001 internally), web proxies it at `/admin`

### Steps

#### 1.1 — Set `basePath` in admin app
File: `apps/admin/next.config.mjs`
- Add `basePath: '/admin'`
- Add `assetPrefix: '/admin'`
- All internal `<Link>`, `<Image>`, API routes auto-adjust — no page changes needed
- `<Link href="/bookings">` becomes `/admin/bookings` in the browser automatically

#### 1.2 — Add rewrite in web app
File: `apps/web/next.config.mjs`
- Add async `rewrites()` that proxies `/admin/:path*` → `http://localhost:3001/admin/:path*`
- Web acts as the single entry point; admin requests tunnel through it

#### 1.3 — Add root dev script
File: root `package.json`
- Add `"dev": "pnpm --filter web dev & pnpm --filter admin dev"`  
  (Windows-safe: two background processes, single terminal command)

#### ⚠️ Supabase Auth Callback Warning
If admin users log in via Google OAuth or magic links, the Supabase dashboard redirect URL must be updated from:
- `http://localhost:3001/auth/callback`
to:
- `http://localhost:3000/admin/auth/callback`

**Action required by you:** Update allowed redirect URLs in Supabase project → Authentication → URL Configuration.  
I will NOT change Supabase config — only code.

---

## Part 2 — Full Dark Mode on Web Frontend

### Approach: Mirror admin's ThemeProvider pattern

#### 2.1 — Create ThemeProvider for web
File: `apps/web/components/ThemeProvider.tsx` (new file)
- Copy admin's ThemeProvider (localStorage key: `reci-theme`, applies `.dark` to `documentElement`)

#### 2.2 — Update root layout
File: `apps/web/app/layout.tsx`
- Add anti-FOUC inline script (same as admin: reads `reci-theme` from localStorage before hydration)
- Wrap children with `<ThemeProvider>`
- Add `suppressHydrationWarning` to `<html>`
- Add `dark:bg-gray-950` to `<body>`

#### 2.3 — Add toggle to Navbar
File: `apps/web/components/layout/Navbar.tsx`
- Add sun/moon toggle button (same style as admin's TopBar toggle)
- Reads/sets theme via ThemeProvider context

#### 2.4 — Update globals.css
File: `apps/web/app/globals.css`
- Add `.dark` CSS variables block (bg, surface, text, border — matching admin palette)
- Update `.card`, `.btn-primary`, `.input`, `.label` components with dark variants
- Add `color-scheme: dark` to `.dark` block
- Add webkit-autofill overrides for dark mode

#### 2.5 — Dark mode all pages (17 pages)

| File | Changes |
|------|---------|
| `app/page.tsx` | Hero bg, search widget bg, section headings |
| `app/auth/layout.tsx` | Card bg, logo text |
| `app/auth/login/page.tsx` | Form bg, inputs, labels, links |
| `app/auth/register/page.tsx` | Form bg, inputs, labels, links |
| `app/account/layout.tsx` | Sidebar bg, nav links hover |
| `app/account/bookings/page.tsx` | Booking cards, status badges, text |
| `app/account/bookings/[id]/inspect-pickup/page.tsx` | Panel bg, photo areas, buttons |
| `app/account/bookings/[id]/inspect-return/page.tsx` | Panel bg, comparison areas |
| `app/account/profile/page.tsx` | Form fields, labels |
| `app/account/corporate/page.tsx` | Form fields, labels, info cards |
| `app/book/[vehicleId]/page.tsx` | Vehicle card, date picker, price box |
| `app/book/extras/page.tsx` | Insurance cards, addon rows |
| `app/book/driver/page.tsx` | Driver form fields |
| `app/book/payment/page.tsx` | Payment card, Stripe element wrapper |
| `app/book/confirmation/page.tsx` | Confirmation card, TripCopilot panel |
| `app/admin/api-keys/page.tsx` | Table, key rows, copy button |

#### 2.6 — Dark mode all components (17 components)

| File | Changes |
|------|---------|
| `components/search/ConversationalSearch.tsx` | Input bg, placeholder, border |
| `components/search/SearchWidget.tsx` | Form bg, selects, date inputs |
| `components/search/CategoryFilter.tsx` | Pills bg/border, active state |
| `components/search/DemandBanner.tsx` | Banner bg, text color |
| `components/vehicles/VehicleGrid.tsx` | Grid bg, skeleton colors |
| `components/vehicles/VehicleCard.tsx` | Card bg, badge colors, text |
| `components/booking/CheckoutStepper.tsx` | Step bg, active/done colors |
| `components/booking/OrderSummary.tsx` | Sidebar bg, line items, total |
| `components/booking/ExtraSelector.tsx` | Radio/checkbox cards, borders |
| `components/booking/DriverForm.tsx` | Inputs, labels |
| `components/booking/LicenceUpload.tsx` | Upload area, preview bg |
| `components/booking/TripCopilot.tsx` | Panel bg, route items |
| `components/ai/PhotoInspectionPanel.tsx` | Camera panel bg |
| `components/ai/DamageReport.tsx` | Report card, severity badge |
| `components/ai/ConfidenceBar.tsx` | Bar track bg |
| `components/admin/DemandCard.tsx` | Card bg, signal colors |

---

## Execution Order

1. Part 1 (single URL) — fast, low risk
2. Part 2.1–2.4 (ThemeProvider + layout + CSS) — foundation
3. Part 2.5 (pages) — page by page
4. Part 2.6 (components) — component by component
5. Test both light and dark on every page
6. Single commit per phase

---

## Files Changed Summary

| App | Files |
|-----|-------|
| `apps/admin` | 1 (next.config) |
| `apps/web` | 1 (next.config) + 1 (root package.json) + 1 (ThemeProvider new) + 1 (layout) + 1 (Navbar) + 1 (globals.css) + 17 pages + 17 components = **39 files** |

**Total: 40 files**

---

## Risk Notes

- Stripe Elements (`apps/web/app/book/payment/page.tsx`) uses injected iframes — dark mode will NOT apply inside Stripe's iframe. The outer wrapper can be themed but the card input stays light. This is a Stripe limitation.
- `inspect-pickup` and `inspect-return` use camera APIs — photo capture areas will be themed but the actual camera preview is browser-native.

---

## Implementation Progress

_(Updated as tasks complete)_

- [ ] 1.1 admin basePath
- [ ] 1.2 web rewrite
- [ ] 1.3 root dev script
- [ ] 2.1 ThemeProvider
- [ ] 2.2 root layout
- [ ] 2.3 Navbar toggle
- [ ] 2.4 globals.css dark vars
- [ ] 2.5 pages dark mode (17)
- [ ] 2.6 components dark mode (17)
