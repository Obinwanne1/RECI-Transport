# RECI Transport — Full Rebuild Specification

A production-complete implementation guide for the RECI Transport car rental portal. A Claude Code agent following this document should produce a fully working system with no ambiguity.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Monorepo Bootstrap](#3-monorepo-bootstrap)
4. [Package Configuration](#4-package-configuration)
5. [Supabase Setup](#5-supabase-setup)
6. [Database Migrations](#6-database-migrations)
7. [External Services](#7-external-services)
8. [Environment Variables](#8-environment-variables)
9. [Shared Packages](#9-shared-packages)
10. [Web App — apps/web](#10-web-app--appsweb)
11. [Admin App — apps/admin](#11-admin-app--appsadmin)
12. [Stripe Webhook Integration](#12-stripe-webhook-integration)
13. [AI Features](#13-ai-features)
14. [Loyalty System](#14-loyalty-system)
15. [Predictive Maintenance](#15-predictive-maintenance)
16. [Brand Tokens](#16-brand-tokens)
17. [Local Development](#17-local-development)
18. [Production Deployment](#18-production-deployment)
19. [Rebuild Checklist](#19-rebuild-checklist)

---

## 1. System Overview

RECI Transport is an AI-native car rental portal for Berlin. It consists of two Next.js 14 applications sharing a monorepo.

| App | Port | Path |
|---|---|---|
| Customer web app | 3000 | `/` |
| Admin portal | 3001 | `/admin` (basePath) |

**Service dependencies:**

| Concern | Service |
|---|---|
| Auth + Database | Supabase (Postgres + RLS + Auth) |
| Payments | Stripe |
| Email | Resend |
| AI | Anthropic Claude API |
| State management | Zustand |
| Forms | react-hook-form + zod |

**Admin is proxied through the web app.** The web app's `next.config.mjs` rewrites `/admin/:path*` to `http://localhost:3001/admin/:path*` in development and to the admin's Vercel URL in production.

---

## 2. Prerequisites

Verify these are installed before starting.

```bash
node --version   # must be >= 20
npm install -g pnpm@9.15.0
pnpm --version   # must be 9.15.0
```

---

## 3. Monorepo Bootstrap

```bash
mkdir reci-transport
cd reci-transport
git init
```

### 3.1 Root package.json

```json
{
  "name": "reci-transport",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0"
  }
}
```

### 3.2 pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3.3 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### 3.4 tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### 3.5 .prettierrc

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 3.6 .gitignore

```
node_modules
.next
dist
.env.local
.env*.local
*.tsbuildinfo
.turbo
```

### 3.7 Create directory structure

```bash
mkdir -p apps/web apps/admin apps/mobile
mkdir -p packages/config packages/types packages/utils packages/ui
mkdir -p supabase/migrations
```

---

## 4. Package Configuration

### 4.1 Scaffold apps/web

```bash
cd apps/web
pnpm dlx create-next-app@14.2.21 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**apps/web/package.json** — replace dependencies section with:

```json
{
  "name": "@reci/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@reci/types": "workspace:*",
    "@reci/utils": "workspace:*",
    "@reci/ui": "workspace:*",
    "@stripe/react-stripe-js": "^2.7.0",
    "@stripe/stripe-js": "^3.4.0",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "next": "14.2.21",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.51.0",
    "resend": "^3.2.0",
    "stripe": "^15.7.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@reci/config": "workspace:*",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

### 4.2 Scaffold apps/admin

```bash
cd apps/admin
pnpm dlx create-next-app@14.2.21 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**apps/admin/package.json:**

```json
{
  "name": "@reci/admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@reci/types": "workspace:*",
    "@reci/utils": "workspace:*",
    "@reci/ui": "workspace:*",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "@fullcalendar/core": "^6.1.0",
    "@fullcalendar/react": "^6.1.0",
    "@fullcalendar/resource-timeline": "^6.1.0",
    "@fullcalendar/interaction": "^6.1.0",
    "next": "14.2.21",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@reci/config": "workspace:*",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

### 4.3 apps/admin/next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'DENY' }],
      },
    ]
  },
}

export default nextConfig
```

### 4.4 apps/web/next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001'
    return [
      {
        source: '/admin/:path*',
        destination: `${adminUrl}/admin/:path*`,
      },
    ]
  },
}

export default nextConfig
```

Add `ADMIN_URL=https://your-admin.vercel.app` to web's env in production.

### 4.5 packages/config

**packages/config/package.json:**

```json
{
  "name": "@reci/config",
  "version": "0.1.0",
  "private": true,
  "exports": {
    "./tailwind": "./tailwind.config.js",
    "./eslint": "./eslint.config.js",
    "./tsconfig": "./tsconfig.json"
  }
}
```

**packages/config/tailwind.config.js:**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#407E3C',
          dark: '#1A2E18',
          accent: '#5a9e56',
        },
      },
    },
  },
  plugins: [],
}
```

### 4.6 packages/types

**packages/types/package.json:**

```json
{
  "name": "@reci/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**packages/types/src/index.ts** — define all shared types:

```typescript
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type VehicleTier = 'economy' | 'compact' | 'standard' | 'premium' | 'luxury' | 'van'

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export type TransmissionType = 'manual' | 'automatic'

export type DamageSeverity = 'minor' | 'moderate' | 'severe'

export type PaymentMethod = 'card' | 'bank_transfer' | 'corporate'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export type UserRole = 'customer' | 'staff' | 'admin'

export type InspectionType = 'pre_rental' | 'post_rental' | 'routine'

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export type SignalType = 'demand_spike' | 'low_availability' | 'price_drop' | 'event_nearby'

export interface Location {
  id: string
  name: string
  address: string
  city: string
  is_active: boolean
}

export interface VehicleCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
}

export interface Vehicle {
  id: string
  category_id: string
  make: string
  model: string
  year: number
  licence_plate: string
  colour: string
  fuel_type: FuelType
  transmission: TransmissionType
  seats: number
  doors: number
  tier: VehicleTier
  mileage: number
  is_active: boolean
  guaranteed_model: boolean
  last_service_mileage: number | null
  last_service_date: string | null
  images: string[]
  features: string[]
}

export interface Booking {
  id: string
  booking_ref: string
  user_id: string
  vehicle_id: string
  pickup_location_id: string
  return_location_id: string
  pickup_date: string
  return_date: string
  status: BookingStatus
  base_price: number
  extras_price: number
  discount_amount: number
  total_price: number
  points_redeemed: number
  driver_name: string
  driver_email: string
  driver_phone: string
  driver_licence: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Extra {
  id: string
  name: string
  description: string
  price_per_day: number
  is_active: boolean
}

export interface LoyaltyTier {
  id: string
  name: string
  min_points: number
  colour: string
}

export interface LoyaltyAccount {
  id: string
  user_id: string
  points_balance: number
  lifetime_points: number
  tier_id: string
  loyalty_tiers?: LoyaltyTier
}

export interface LoyaltyTransaction {
  id: string
  account_id: string
  booking_id: string | null
  points: number
  type: 'earned' | 'redeemed'
  description: string
  created_at: string
}

export interface MaintenanceAlert {
  id: string
  vehicle_id: string
  severity: 'warning' | 'alert' | 'critical'
  km_since_service: number
  ai_note: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}
```

### 4.7 packages/utils

**packages/utils/package.json:**

```json
{
  "name": "@reci/utils",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

**packages/utils/src/pricing.ts:**

```typescript
export const POINTS_TO_EUR = 100 // 100 points = €1
export const MAX_REDEEM_PCT = 0.2 // max 20% of booking total

export function computeMaxRedeemablePoints(
  totalEur: number,
  pointsBalance: number
): number {
  const maxFromTotal = Math.floor(totalEur * MAX_REDEEM_PCT * POINTS_TO_EUR)
  return Math.min(pointsBalance, maxFromTotal)
}

export function pointsToEur(points: number): number {
  return points / POINTS_TO_EUR
}

export function eurToPoints(eur: number): number {
  return Math.floor(eur * POINTS_TO_EUR)
}

export function computeBookingTotal(
  basePricePerDay: number,
  days: number,
  extrasPricePerDay: number,
  discountAmount: number,
  pointsRedeemed: number
): number {
  const subtotal = (basePricePerDay + extrasPricePerDay) * days
  const pointsDiscount = pointsToEur(pointsRedeemed)
  return Math.max(0, subtotal - discountAmount - pointsDiscount)
}
```

**packages/utils/src/index.ts:**

```typescript
export * from './pricing'
```

---

## 5. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note the project URL and keys from **Project Settings > API**.
3. In **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000` (update to production URL when deploying)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`
4. Run migrations 001–007 from the SQL Editor in order. See Section 6.
5. To create an admin user after signup, run this via the service role:

```sql
-- Set role in user_profiles
UPDATE user_profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

Then set `app_metadata` via Supabase Admin API or dashboard so the JWT includes the role claim:

```json
{ "role": "admin" }
```

---

## 6. Database Migrations

Run each migration in order in the Supabase SQL Editor. Never skip or reorder.

### Migration 001 — Initial Schema

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1;

-- Enums
CREATE TYPE booking_status AS ENUM (
  'pending','confirmed','active','completed','cancelled','no_show'
);
CREATE TYPE vehicle_tier AS ENUM (
  'economy','compact','standard','premium','luxury','van'
);
CREATE TYPE fuel_type AS ENUM ('petrol','diesel','electric','hybrid');
CREATE TYPE transmission_type AS ENUM ('manual','automatic');
CREATE TYPE damage_severity AS ENUM ('minor','moderate','severe');
CREATE TYPE payment_method AS ENUM ('card','bank_transfer','corporate');
CREATE TYPE payment_status AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE signal_type AS ENUM (
  'demand_spike','low_availability','price_drop','event_nearby'
);
CREATE TYPE user_role AS ENUM ('customer','staff','admin');
CREATE TYPE inspection_type AS ENUM ('pre_rental','post_rental','routine');
CREATE TYPE verification_status AS ENUM ('pending','verified','rejected','expired');

-- Tables
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Berlin',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES vehicle_categories(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  licence_plate TEXT NOT NULL UNIQUE,
  colour TEXT NOT NULL,
  fuel_type fuel_type NOT NULL,
  transmission transmission_type NOT NULL,
  seats INT NOT NULL DEFAULT 5,
  doors INT NOT NULL DEFAULT 4,
  tier vehicle_tier NOT NULL,
  mileage INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  images TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES vehicle_categories(id),
  vehicle_id UUID REFERENCES vehicles(id),
  tier vehicle_tier,
  base_price_per_day NUMERIC(10,2) NOT NULL,
  valid_from DATE,
  valid_to DATE,
  CONSTRAINT pricing_target CHECK (
    category_id IS NOT NULL OR vehicle_id IS NOT NULL OR tier IS NOT NULL
  )
);

CREATE TABLE pricing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  reason TEXT,
  UNIQUE(vehicle_id, date)
);

CREATE TABLE corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE corporate_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES vehicle_categories(id),
  vehicle_id UUID REFERENCES vehicles(id),
  discount_pct NUMERIC(5,2) NOT NULL
);

CREATE TABLE extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_day NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  corporate_account_id UUID REFERENCES corporate_accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE DEFAULT
    'RECI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('booking_ref_seq')::TEXT, 5, '0'),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  pickup_location_id UUID NOT NULL REFERENCES locations(id),
  return_location_id UUID NOT NULL REFERENCES locations(id),
  pickup_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  base_price NUMERIC(10,2) NOT NULL,
  extras_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  driver_name TEXT NOT NULL,
  driver_email TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_licence TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id),
  quantity INT NOT NULL DEFAULT 1,
  price_snapshot NUMERIC(10,2) NOT NULL
);

CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  method payment_method,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES auth.users(id),
  template TEXT NOT NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL,
  resend_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  inspection_type inspection_type NOT NULL,
  inspector_id UUID REFERENCES auth.users(id),
  notes TEXT,
  damage_detected BOOLEAN NOT NULL DEFAULT false,
  damage_severity damage_severity,
  damage_images TEXT[] DEFAULT '{}',
  ai_damage_report JSONB,
  admin_override BOOLEAN,
  admin_override_note TEXT,
  admin_override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  context JSONB,
  decision TEXT,
  model_used TEXT,
  confidence NUMERIC(4,3),
  input_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE licence_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES bookings(id),
  status verification_status NOT NULL DEFAULT 'pending',
  ocr_result JSONB,
  ai_confidence NUMERIC(4,3),
  admin_override BOOLEAN,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type signal_type NOT NULL,
  category_id UUID REFERENCES vehicle_categories(id),
  location_id UUID REFERENCES locations(id),
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  vehicles_remaining INT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers: updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_signals ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_locations" ON locations FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON vehicle_categories FOR SELECT USING (true);
CREATE POLICY "public_read_active_vehicles" ON vehicles FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_pricing" ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "public_read_extras" ON extras FOR SELECT USING (is_active = true);

-- User own-row policies
CREATE POLICY "own_profile_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "own_bookings_select" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_bookings_insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_payments_select" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Admin policies (checks JWT role claim)
CREATE POLICY "admin_all_vehicles" ON vehicles
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_users" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_inspections" ON vehicle_inspections
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_availability" ON availability_blocks
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_email_logs" ON email_logs
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_pricing_overrides" ON pricing_overrides
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE POLICY "admin_all_pricing_signals" ON pricing_signals
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

-- Indexes
CREATE INDEX idx_vehicles_category ON vehicles(category_id);
CREATE INDEX idx_vehicles_tier ON vehicles(tier);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_dates ON bookings(pickup_date, return_date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### Migration 002 — Corporate Application Status

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS corporate_application_status TEXT
    NOT NULL DEFAULT 'none'
    CHECK (corporate_application_status IN ('none','pending','approved'));
```

### Migration 003 — AI Layer

```sql
-- Extend ai_conversations (columns already partially created in 001 — add any missing)
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id),
  ADD COLUMN IF NOT EXISTS context JSONB,
  ADD COLUMN IF NOT EXISTS decision TEXT,
  ADD COLUMN IF NOT EXISTS model_used TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS input_hash TEXT;

-- API keys table (white-label AI product)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  requests_today INT NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend pricing_signals
ALTER TABLE pricing_signals
  ADD COLUMN IF NOT EXISTS vehicles_remaining INT;

-- Extend licence_verifications
ALTER TABLE licence_verifications
  ADD COLUMN IF NOT EXISTS admin_override BOOLEAN,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Extend vehicle_inspections
ALTER TABLE vehicle_inspections
  ADD COLUMN IF NOT EXISTS admin_override BOOLEAN,
  ADD COLUMN IF NOT EXISTS admin_override_note TEXT,
  ADD COLUMN IF NOT EXISTS admin_override_at TIMESTAMPTZ;
```

### Migration 004 — Internal Users

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT false;
```

### Migration 005 — Vehicle Guarantee

```sql
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS guaranteed_model BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vehicles_guaranteed
  ON vehicles(guaranteed_model) WHERE guaranteed_model = true;
```

### Migration 006 — Loyalty & Rewards

```sql
CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_points INT NOT NULL,
  colour TEXT NOT NULL
);

INSERT INTO loyalty_tiers (name, min_points, colour) VALUES
  ('Bronze',   0,    '#CD7F32'),
  ('Silver',   500,  '#C0C0C0'),
  ('Gold',     2000, '#FFD700'),
  ('Platinum', 5000, '#E5E4E2');

CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_points INT NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
  tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  points INT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0;

-- Trigger: auto-update tier based on lifetime_points
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  SELECT id INTO v_tier_id
  FROM loyalty_tiers
  WHERE min_points <= NEW.lifetime_points
  ORDER BY min_points DESC
  LIMIT 1;

  NEW.tier_id = v_tier_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_loyalty_tier
  BEFORE INSERT OR UPDATE ON loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION update_loyalty_tier();

-- RPC: award points
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_user_id UUID,
  p_points INT,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_account_id UUID;
  v_bronze_tier UUID;
BEGIN
  SELECT id INTO v_bronze_tier FROM loyalty_tiers WHERE name = 'Bronze';

  INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points, tier_id)
  VALUES (p_user_id, p_points, p_points, v_bronze_tier)
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = loyalty_accounts.points_balance + p_points,
    lifetime_points = loyalty_accounts.lifetime_points + p_points,
    updated_at = NOW()
  RETURNING id INTO v_account_id;

  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id FROM loyalty_accounts WHERE user_id = p_user_id;
  END IF;

  INSERT INTO loyalty_transactions (account_id, booking_id, points, description)
  VALUES (v_account_id, p_booking_id, p_points, 'Points earned for booking');
END;
$$;

-- RPC: deduct points
CREATE OR REPLACE FUNCTION deduct_loyalty_points(
  p_user_id UUID,
  p_points INT,
  p_booking_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_account_id UUID;
  v_balance INT;
BEGIN
  SELECT id, points_balance INTO v_account_id, v_balance
  FROM loyalty_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  UPDATE loyalty_accounts
  SET points_balance = points_balance - p_points, updated_at = NOW()
  WHERE id = v_account_id;

  INSERT INTO loyalty_transactions (account_id, booking_id, points, description)
  VALUES (v_account_id, p_booking_id, -p_points, 'Points redeemed for booking');
END;
$$;

-- RLS for loyalty tables
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_tiers" ON loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "own_loyalty_account" ON loyalty_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_loyalty_transactions" ON loyalty_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM loyalty_accounts WHERE id = account_id AND user_id = auth.uid())
  );
CREATE POLICY "admin_all_loyalty" ON loyalty_accounts
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));
```

### Migration 007 — Predictive Maintenance

```sql
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS last_service_mileage INT,
  ADD COLUMN IF NOT EXISTS last_service_date DATE;

CREATE TABLE maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('warning','alert','critical')),
  km_since_service INT NOT NULL,
  ai_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_maintenance" ON maintenance_alerts
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','staff'));

CREATE TRIGGER trg_maintenance_updated_at
  BEFORE UPDATE ON maintenance_alerts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 7. External Services

### 7.1 Stripe

1. Create account at [stripe.com](https://stripe.com).
2. Get keys from **Developers > API keys**.
3. In **Developers > Webhooks**, add endpoint: `https://yourdomain.com/api/webhooks/stripe`.
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`.
5. Copy the webhook signing secret.

### 7.2 Anthropic

1. Create account at [console.anthropic.com](https://console.anthropic.com).
2. Go to **API Keys** and generate a key.
3. Models to use:
   - `claude-haiku-4-5-20251001` — maintenance batch (low cost, batch processing)
   - `claude-sonnet-4-5` or `claude-haiku-4-5-20251001` — chat, damage detection, licence OCR

### 7.3 Resend

1. Create account at [resend.com](https://resend.com).
2. Add and verify your sending domain under **Domains**.
3. Generate an API key under **API Keys**.
4. Set the verified sender address as `RESEND_FROM_EMAIL`.

---

## 8. Environment Variables

### apps/web/.env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@yourdomain.com
ADMIN_URL=http://localhost:3001
```

### apps/admin/.env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 9. Shared Packages

### 9.1 Supabase client helpers

Create `packages/utils/src/supabase.ts`:

```typescript
// Browser client — use in client components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Each Next.js app also needs its own server-side and middleware clients. Create per-app:

**apps/web/lib/supabase/server.ts:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

**apps/web/middleware.ts:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({ request })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 10. Web App — apps/web

### 10.1 Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                          ← Home
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── book/
│   │   ├── [vehicleId]/page.tsx          ← Step 1
│   │   ├── extras/page.tsx               ← Step 2
│   │   ├── driver/page.tsx               ← Step 3
│   │   ├── payment/page.tsx              ← Step 4
│   │   └── confirmation/page.tsx         ← Step 5
│   ├── account/
│   │   ├── layout.tsx
│   │   ├── profile/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── corporate/page.tsx
│   │   └── rewards/page.tsx
│   └── api/
│       ├── bookings/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── loyalty/route.ts
│       ├── payments/route.ts
│       ├── vehicles/route.ts
│       ├── webhooks/stripe/route.ts
│       └── ai/
│           ├── chat/route.ts
│           ├── damage/route.ts
│           └── licence/route.ts
├── components/
│   ├── layout/Navbar.tsx
│   ├── search/
│   │   ├── AgentChat.tsx
│   │   ├── SearchWidget.tsx
│   │   └── CategoryFilter.tsx
│   ├── vehicles/
│   │   ├── VehicleGrid.tsx
│   │   └── VehicleCard.tsx
│   └── booking/
│       └── OrderSummary.tsx
├── hooks/
│   ├── useBookingStore.ts
│   └── useVehicleSearch.ts
└── lib/
    └── supabase/
        └── server.ts
```

### 10.2 Zustand Booking Store

**hooks/useBookingStore.ts:**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DriverData {
  fullName: string
  email: string
  phone: string
  licenceNumber: string
}

interface BookingStore {
  vehicleId: string | null
  pickupDate: string | null
  returnDate: string | null
  pickupLocationId: string | null
  returnLocationId: string | null
  selectedExtraIds: string[]
  pointsRedeemed: number
  driver: DriverData | null
  setVehicle: (id: string) => void
  setDates: (pickup: string, returnDate: string) => void
  setLocations: (pickupId: string, returnId: string) => void
  setExtras: (ids: string[]) => void
  setPointsRedeemed: (pts: number) => void
  setDriver: (data: DriverData) => void
  reset: () => void
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      vehicleId: null,
      pickupDate: null,
      returnDate: null,
      pickupLocationId: null,
      returnLocationId: null,
      selectedExtraIds: [],
      pointsRedeemed: 0,
      driver: null,
      setVehicle: (id) => set({ vehicleId: id }),
      setDates: (pickup, returnDate) => set({ pickupDate: pickup, returnDate }),
      setLocations: (pickupId, returnId) =>
        set({ pickupLocationId: pickupId, returnLocationId: returnId }),
      setExtras: (ids) => set({ selectedExtraIds: ids }),
      setPointsRedeemed: (pts) => set({ pointsRedeemed: pts }),
      setDriver: (data) => set({ driver: data }),
      reset: () =>
        set({
          vehicleId: null,
          pickupDate: null,
          returnDate: null,
          pickupLocationId: null,
          returnLocationId: null,
          selectedExtraIds: [],
          pointsRedeemed: 0,
          driver: null,
        }),
    }),
    { name: 'reci-booking' }
  )
)
```

### 10.3 Booking Flow Pages

**Step 1 — `/book/[vehicleId]/page.tsx`:**
- Fetch vehicle details from Supabase (client-side or server component).
- Render a date range picker and location selectors.
- On submit, call `useBookingStore.setVehicle`, `setDates`, `setLocations`, then `router.push('/book/extras')`.
- Show vehicle images, specs, and base price per day.

**Step 2 — `/book/extras/page.tsx`:**
- Fetch all active extras from `/api/vehicles` or directly from Supabase.
- Render extras as cards with checkbox toggles.
- On continue, call `useBookingStore.setExtras(selectedIds)`, then push to `/book/driver`.
- Show running total using `OrderSummary`.

**Step 3 — `/book/driver/page.tsx`:**
- Form fields: Full Name, Email, Phone, Licence Number.
- If user is logged in, pre-fill from `user_profiles`.
- Show loyalty redemption section: fetch account balance from `/api/loyalty`, compute `maxRedeemablePoints` using `computeMaxRedeemablePoints` from `@reci/utils`, render a slider or input.
- On submit, call `useBookingStore.setDriver(data)` and `setPointsRedeemed(pts)`, push to `/book/payment`.

**Step 4 — `/book/payment/page.tsx`:**
- On mount, POST to `/api/payments` to create a Stripe PaymentIntent. Store `clientSecret`.
- Render `<Elements>` with the clientSecret, then `<PaymentElement />`.
- On payment success (Stripe redirects or `confirmPayment` resolves), push to `/book/confirmation`.
- The booking record is created in the Stripe webhook handler, not here.

**Step 5 — `/book/confirmation/page.tsx`:**
- Read booking ref from URL search param or Zustand store.
- Show booking summary and call `useBookingStore.reset()`.
- Display points earned preview: `Math.floor(totalPaid)` points.

### 10.4 API Routes

**`/api/payments/route.ts` — POST:**

```typescript
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { amountCents, currency = 'eur', metadata } = await req.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

**`/api/bookings/route.ts` — POST:**

```typescript
// Validate body with Zod schema
// Enforce loyalty cap server-side: pointsRedeemed <= computeMaxRedeemablePoints(total, balance)
// Insert booking into Supabase using service role client
// Insert booking_extras rows
// Call deduct_loyalty_points RPC (non-blocking: void supabase.rpc(...))
// Send confirmation email via Resend
// Return { bookingRef }
```

Key Zod schema:

```typescript
import { z } from 'zod'

const CreateBookingSchema = z.object({
  vehicleId: z.string().uuid(),
  pickupLocationId: z.string().uuid(),
  returnLocationId: z.string().uuid(),
  pickupDate: z.string().datetime(),
  returnDate: z.string().datetime(),
  extraIds: z.array(z.string().uuid()),
  pointsRedeemed: z.number().int().min(0),
  driver: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    licenceNumber: z.string().min(4),
  }),
  stripePaymentIntentId: z.string(),
})
```

**`/api/vehicles/route.ts` — GET:**

```typescript
// Accept query params: categoryId, pickupDate, returnDate, locationId, tier, transmission
// Fetch vehicles from Supabase, exclude those with overlapping confirmed bookings
// Return vehicle list with category data joined
```

**`/api/loyalty/route.ts` — GET:**

```typescript
// Requires auth (read session from cookies)
// Fetch loyalty_accounts joined with loyalty_tiers for current user
// Fetch last 20 loyalty_transactions for the account
// Return { account, tiers, transactions }
```

**`/api/ai/chat/route.ts` — POST:**

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Body: { messages: [{role, content}], context: { availableVehicles, dates, location } }
// System prompt: "You are RECI Transport's AI assistant helping customers find the right rental car in Berlin..."
// Use claude-haiku-4-5-20251001 for cost efficiency
// Return streamed or single response
```

**`/api/ai/damage/route.ts` — POST:**

```typescript
// Body: { imageBase64: string, mediaType: string, bookingId?: string }
// Send to Claude vision with prompt asking for damage assessment
// Return { hasDamage, severity, description, confidence }
```

**`/api/ai/licence/route.ts` — POST:**

```typescript
// Body: { imageBase64: string, mediaType: string }
// Send to Claude vision asking to extract: fullName, licenceNumber, expiryDate, country
// Return { extracted: {...}, confidence }
// Also insert a licence_verifications row via service role
```

**`/api/webhooks/stripe/route.ts`:**

```typescript
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature failed', { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const { userId, bookingId, totalPaid } = pi.metadata

    const points = Math.floor(Number(totalPaid))

    // Call award_loyalty_points RPC via service role Supabase client
    await supabase.rpc('award_loyalty_points', {
      p_user_id: userId,
      p_points: points,
      p_booking_id: bookingId,
    })

    // Update booking status to confirmed
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    // Update payment record
    await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', pi.id)
  }

  return new Response('ok', { status: 200 })
}

export const dynamic = 'force-dynamic'
```

**Note:** Pass `userId`, `bookingId`, and `totalPaid` as Stripe PaymentIntent `metadata` when creating the PaymentIntent. Set `totalPaid` as the euro amount string (e.g. `"142.50"`).

### 10.5 Auth Routes

**`/auth/login/page.tsx`:**

```typescript
// Use @supabase/ssr createBrowserClient
// Render email/password form
// Call supabase.auth.signInWithPassword({ email, password })
// On success, router.push('/')
// Also render "Sign up" link that calls supabase.auth.signUp
```

**`/auth/callback/route.ts`:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

### 10.6 Account Pages

**`/account/rewards/page.tsx`:**
- Fetch from `/api/loyalty`.
- Show current tier badge (coloured card using tier `colour` hex).
- Show points balance prominently.
- Show progress bar to next tier: `(lifetime_points - current_tier.min_points) / (next_tier.min_points - current_tier.min_points) * 100`.
- Show transaction ledger (last 20 rows): positive = earned (green), negative = redeemed (amber).

**`/account/corporate/page.tsx`:**
- Show current `corporate_application_status` from `user_profiles`.
- If `'none'`: render application form with company name, registration number, contact details.
- On submit: PATCH `user_profiles` to set `corporate_application_status = 'pending'` and create a support email notification via Resend.
- If `'pending'`: show awaiting review message.
- If `'approved'`: show corporate account details.

---

## 11. Admin App — apps/admin

### 11.1 Key Implementation Rules

- All internal links must be relative paths (e.g. `href="/dashboard"`, not `href="/admin/dashboard"`). Next.js automatically prepends `basePath`.
- All `fetch()` calls to the admin's own API routes must use relative paths: `fetch('/api/admin/vehicles')`.
- Never hardcode `localhost:3001` inside the admin app itself.
- Auth: create the same `lib/supabase/server.ts` and middleware as in the web app.
- Admin routes must verify that the session user has `role = 'admin'` or `role = 'staff'` before returning data.

### 11.2 Directory Structure

```
apps/admin/
├── app/
│   ├── layout.tsx                        ← AdminNav sidebar wrapper
│   ├── page.tsx                          ← redirect to /dashboard
│   ├── auth/login/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                      ← KPI cards, recent bookings table
│   │   └── users/page.tsx                ← Admin-only: user role management
│   ├── bookings/page.tsx                 ← All bookings with search + filters
│   ├── fleet/
│   │   ├── page.tsx                      ← Vehicle grid with maintenance badges
│   │   ├── new/page.tsx                  ← Add vehicle form
│   │   └── [id]/page.tsx                 ← Edit vehicle (includes service fields)
│   ├── calendar/page.tsx                 ← FullCalendar resource timeline
│   ├── customers/page.tsx
│   ├── pricing/page.tsx
│   ├── availability/page.tsx
│   ├── maintenance/page.tsx              ← Predictive maintenance dashboard
│   └── api/
│       └── admin/
│           ├── vehicles/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── bookings/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── categories-locations/route.ts
│           └── maintenance/route.ts
└── components/
    └── AdminNav.tsx
```

### 11.3 AdminNav Component

```typescript
// components/AdminNav.tsx
// Sidebar with navigation links and sign out button
// Links: /dashboard, /bookings, /fleet, /calendar, /customers, /pricing, /maintenance
// Background: #1A2E18, active link: #407E3C, text: white
// Sign out: supabase.auth.signOut() then router.push('/auth/login')
```

### 11.4 Dashboard KPIs

**`/dashboard/page.tsx`** — server component, fetch via service role:
- Total bookings this month
- Revenue this month (sum of `total_price` where status in `confirmed, active, completed`)
- Active rentals (status = `active`)
- Fleet utilisation % (active vehicles / total active vehicles)

### 11.5 Fleet Management

**`/fleet/page.tsx`:**
- Grid of vehicle cards.
- Each card shows: image, make/model/year, licence plate, tier badge, mileage.
- Show maintenance badge (warning/alert/critical) based on `km_since_service` thresholds.
- Links to edit page.

**`/fleet/[id]/page.tsx`:**
- Full edit form for all vehicle fields including:
  - `last_service_mileage` (number input)
  - `last_service_date` (date input)
  - `guaranteed_model` (checkbox)
  - `is_active` (toggle)
- PATCH to `/api/admin/vehicles/[id]`.

**`/fleet/new/page.tsx`:**
- Same form as edit but blank, POST to `/api/admin/vehicles`.

### 11.6 Calendar Page

```typescript
// Use @fullcalendar/react with @fullcalendar/resource-timeline
// Resources: array of vehicles (id as resourceId, make+model as title)
// Events: bookings (title=booking_ref, resourceId=vehicle_id, start=pickup_date, end=return_date)
// Colour-code events by status: confirmed=#407E3C, active=#5a9e56, pending=#f59e0b
// Fetch data server-side, pass as props to a client component wrapping FullCalendar
```

### 11.7 Admin API Routes

All admin API routes must:

1. Call `createClient()` and `supabase.auth.getUser()`.
2. Check that `user_profiles.role IN ('admin', 'staff')` — return 403 otherwise.
3. Use the service role client for actual data operations.

**`/api/admin/vehicles/route.ts`:**

```typescript
// GET: return all vehicles (including inactive), joined with category
// POST: create vehicle, validate required fields
```

**`/api/admin/vehicles/[id]/route.ts`:**

```typescript
// GET: single vehicle
// PATCH: update fields — for soft delete, set is_active = false
// Never hard-delete vehicles (preserve booking history)
```

**`/api/admin/bookings/route.ts`:**

```typescript
// GET: all bookings with pagination, search by ref/customer, filter by status/date range
// JOIN with user_profiles, vehicles, locations
```

**`/api/admin/bookings/[id]/route.ts`:**

```typescript
// GET: single booking with full detail
// PATCH: update status (e.g. confirmed → active → completed)
```

---

## 12. Stripe Webhook Integration

The webhook at `apps/web/app/api/webhooks/stripe/route.ts` must handle:

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Update booking to `confirmed`, update payment to `succeeded`, call `award_loyalty_points` RPC |
| `payment_intent.payment_failed` | Update payment to `failed`, optionally notify customer |

**Critical implementation detail:** Next.js 14 App Router requires reading the raw request body as text before passing to `stripe.webhooks.constructEvent`. Use `await req.text()` — do not parse with `req.json()`.

```typescript
const body = await req.text()
// Do NOT: const body = await req.json()
```

Metadata to set on the PaymentIntent at creation time:

```typescript
metadata: {
  userId: session.user.id,
  bookingId: '<the created booking id>',
  totalPaid: totalEur.toFixed(2),
}
```

---

## 13. AI Features

### 13.1 Conversational Search

**System prompt for `/api/ai/chat/route.ts`:**

```
You are RECI Transport's AI assistant helping customers find the right rental car in Berlin.
You have access to the following available vehicles and pricing: {context.availableVehicles}
Dates requested: {context.dates}
Pickup location: {context.location}

Help the customer choose a vehicle. Ask clarifying questions if needed.
When you have enough information, respond with a JSON block: {"recommendedVehicleId": "<id>"}
Keep responses concise and friendly.
```

### 13.2 Damage Detection

**Prompt for `/api/ai/damage/route.ts`:**

```
Analyse this vehicle image for damage. Return a JSON object with:
{
  "hasDamage": boolean,
  "severity": "minor" | "moderate" | "severe" | null,
  "description": "brief description of damage found or null if none",
  "confidence": 0.0-1.0
}
Respond with only the JSON object, no other text.
```

### 13.3 Licence OCR

**Prompt for `/api/ai/licence/route.ts`:**

```
Extract the following from this driving licence image and return as JSON:
{
  "fullName": string,
  "licenceNumber": string,
  "expiryDate": "YYYY-MM-DD",
  "countryOfIssue": string,
  "confidence": 0.0-1.0
}
Respond with only the JSON object, no other text.
```

### 13.4 Predictive Maintenance

See Section 15 for full implementation.

---

## 14. Loyalty System

### 14.1 Constants

```typescript
// packages/utils/src/pricing.ts
export const POINTS_TO_EUR = 100   // 100 points = €1
export const MAX_REDEEM_PCT = 0.20  // max 20% of booking total

// Points earned = Math.floor(totalPaidEur)
// e.g. €142.50 booking → 142 points earned
```

### 14.2 Redemption Flow

1. Customer navigates to `/book/driver`.
2. Frontend fetches `GET /api/loyalty` to get `points_balance`.
3. Compute `maxRedeemablePoints = computeMaxRedeemablePoints(subtotal, balance)`.
4. Customer selects how many points to redeem (0 to max).
5. Store in Zustand: `setPointsRedeemed(pts)`.
6. Order summary updates: `discountFromPoints = pointsToEur(pts)`.
7. On booking creation (server-side), enforce cap again: if `pointsRedeemed > computeMaxRedeemablePoints(serverComputedTotal, balance)`, clamp to max.
8. Call `deduct_loyalty_points` RPC — this is non-blocking (`void supabase.rpc(...)`).
9. Stripe PaymentIntent amount = total after redemption discount.
10. On `payment_intent.succeeded`, call `award_loyalty_points` for points earned on the paid amount.

### 14.3 Tier Display

| Tier | Min Lifetime Points | Colour |
|---|---|---|
| Bronze | 0 | `#CD7F32` |
| Silver | 500 | `#C0C0C0` |
| Gold | 2000 | `#FFD700` |
| Platinum | 5000 | `#E5E4E2` |

The `trg_update_loyalty_tier` trigger keeps `tier_id` current automatically on every insert/update to `loyalty_accounts`.

---

## 15. Predictive Maintenance

### 15.1 Thresholds

| Severity | km Since Last Service |
|---|---|
| warning | ≥ 8,000 km |
| alert | ≥ 12,000 km |
| critical | ≥ 18,000 km |

### 15.2 Maintenance API Route

**`apps/admin/app/api/admin/maintenance/route.ts`:**

```typescript
import Anthropic from '@anthropic-ai/sdk'

const WARNING_KM = 8000
const ALERT_KM = 12000
const CRITICAL_KM = 18000

export async function GET() {
  // 1. Fetch all active vehicles from Supabase (service role)
  // 2. Compute km_since_service = vehicle.mileage - (vehicle.last_service_mileage ?? 0)
  // 3. Filter: keep only those where km_since_service >= WARNING_KM
  // 4. Assign severity: >= CRITICAL_KM → critical, >= ALERT_KM → alert, else → warning
  // 5. Sort: critical first, then alert, then warning

  // 6. Build one prompt listing all flagged vehicles:
  const vehicleList = flaggedVehicles
    .map((v, i) => `${i + 1}. ${v.make} ${v.model} (${v.licence_plate}): ${v.km_since_service} km since service, severity: ${v.severity}`)
    .join('\n')

  const prompt = `You are a vehicle fleet maintenance advisor.
For each vehicle below, provide a one-sentence maintenance recommendation.
Return a JSON array of strings, one per vehicle, in the same order.
Vehicles:
${vehicleList}`

  // 7. Call Claude haiku with this single prompt
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  // 8. Parse response as JSON array
  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let aiNotes: string[] = []
  try {
    aiNotes = JSON.parse(content.text)
  } catch {
    // fallback: one note per line
    aiNotes = content.text.split('\n').filter(Boolean)
  }

  // 9. Attach ai_note to each vehicle by index
  const result = flaggedVehicles.map((v, i) => ({
    ...v,
    ai_note: aiNotes[i] ?? null,
  }))

  return Response.json(result)
}

export async function PATCH(req: Request) {
  const { vehicle_id } = await req.json()
  // Verify admin session
  // Update vehicle: last_service_mileage = current mileage, last_service_date = today
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('vehicles')
    .update({
      last_service_mileage: currentMileage,
      last_service_date: today,
    })
    .eq('id', vehicle_id)

  return Response.json({ ok: true })
}
```

### 15.3 Maintenance Dashboard Page

**`/maintenance/page.tsx`:**
- Fetch from `/api/admin/maintenance` on load.
- Show table or card list sorted critical → alert → warning.
- Colour-code severity rows: critical = red, alert = orange, warning = yellow.
- Show AI recommendation note under each row.
- "Mark Serviced" button: PATCH `/api/admin/maintenance` with `{ vehicle_id }`, then refetch.

---

## 16. Brand Tokens

Apply these everywhere. Never use arbitrary colours.

| Token | Value | Usage |
|---|---|---|
| `brand.primary` | `#407E3C` | Buttons, active states, links |
| `brand.dark` | `#1A2E18` | Admin sidebar background |
| `brand.accent` | `#5a9e56` | Hover states, secondary buttons |
| Text dark | `#1A1A1A` | Body text |
| Text muted | `#6B7280` | Captions, secondary text |
| Border | `#E5E7EB` | Dividers, card borders |
| Background | `#F9FAFB` | Page backgrounds |
| White | `#FFFFFF` | Cards, modals |

In Tailwind, use the extended `brand` colours defined in `packages/config/tailwind.config.js`. For hex values not in Tailwind, use inline style or extend the config.

---

## 17. Local Development

```bash
# Install all workspace dependencies from root
pnpm install

# Run all apps simultaneously
pnpm dev

# Run individually
pnpm --filter web dev      # http://localhost:3000
pnpm --filter admin dev    # http://localhost:3001/admin

# Build all
pnpm build

# Typecheck all
pnpm typecheck
```

**Port verification (Windows):**

```powershell
# Check what is on port 3000
netstat -ano | findstr :3000

# Kill by PID
taskkill /F /PID <PID>
```

**After any `.env.local` change:** kill the Next.js process and restart. Environment variables are loaded at startup.

---

## 18. Production Deployment

### 18.1 Web App (Vercel)

1. Import repository to Vercel. Set **Root Directory** to `apps/web`.
2. Framework preset: Next.js.
3. Add all web `.env.local` variables in Vercel **Environment Variables**.
4. Set `ADMIN_URL` to the production admin app Vercel URL (e.g. `https://reci-admin.vercel.app`).
5. Deploy.
6. Add Stripe webhook endpoint pointing to `https://yourdomain.vercel.app/api/webhooks/stripe`.

### 18.2 Admin App (Vercel — separate project)

1. Import same repository. Set **Root Directory** to `apps/admin`.
2. Framework preset: Next.js.
3. Add admin `.env.local` variables.
4. Deploy.
5. Copy the admin deployment URL back to the web app's `ADMIN_URL` env var and redeploy web.

### 18.3 Supabase Auth for Production

Update in **Supabase > Authentication > URL Configuration**:
- Site URL: `https://yourdomain.vercel.app`
- Redirect URLs: add `https://yourdomain.vercel.app/auth/callback`

### 18.4 Self-Hosted Alternative

Each app is a standalone Next.js build:

```bash
# Build web
cd apps/web
pnpm build
NODE_ENV=production pnpm start  # runs on PORT env var or 3000

# Build admin
cd apps/admin
pnpm build
NODE_ENV=production pnpm start  # runs on PORT env var or 3001
```

Use a reverse proxy (nginx/Caddy) to serve both under a single domain with `/admin` proxied to port 3001.

---

## 19. Rebuild Checklist

Work through these in order. Do not proceed past a step until it is verified working.

### Phase 1 — Foundation

- [ ] Node >= 20 and pnpm 9.15.0 confirmed installed
- [ ] Root monorepo `package.json` created with workspaces and Turborepo
- [ ] `pnpm-workspace.yaml` configured
- [ ] `turbo.json` with `dev`, `build`, `lint`, `typecheck` tasks
- [ ] `tsconfig.base.json` and `.prettierrc` at root
- [ ] `.gitignore` covers `node_modules`, `.next`, `.env*.local`, `.turbo`
- [ ] `packages/config`, `packages/types`, `packages/utils`, `packages/ui` created with `package.json`
- [ ] `apps/web` scaffolded with `create-next-app@14.2.21`
- [ ] `apps/admin` scaffolded with `create-next-app@14.2.21`
- [ ] `apps/admin/next.config.mjs` sets `basePath: '/admin'`
- [ ] `apps/web/next.config.mjs` sets rewrite from `/admin/:path*` to admin URL
- [ ] `pnpm install` from root completes without errors

### Phase 2 — Database

- [ ] Supabase project created
- [ ] Migration 001 executed — all tables, enums, triggers, RLS policies created
- [ ] Migration 002 executed — `corporate_application_status` column added
- [ ] Migration 003 executed — AI layer columns and `api_keys` table added
- [ ] Migration 004 executed — `password_reset_required` column added
- [ ] Migration 005 executed — `guaranteed_model` column and index added
- [ ] Migration 006 executed — loyalty tables, RPCs, seed data inserted
- [ ] Migration 007 executed — maintenance columns and `maintenance_alerts` table added
- [ ] `handle_new_user` trigger verified by creating a test auth user and checking `user_profiles`
- [ ] Auth redirect URLs configured in Supabase dashboard
- [ ] At least one admin user created with `role = 'admin'` in `user_profiles` and `app_metadata`

### Phase 3 — External Services

- [ ] Stripe account created, secret and publishable keys obtained
- [ ] Stripe webhook endpoint registered, signing secret obtained
- [ ] Anthropic API key obtained
- [ ] Resend account created, domain verified, API key obtained
- [ ] All `.env.local` files populated for both apps

### Phase 4 — Web App Core

- [ ] Supabase server and browser clients working (`lib/supabase/server.ts`, middleware)
- [ ] Auth login page renders and sign in works
- [ ] Auth callback route exchanges code for session
- [ ] `useBookingStore` Zustand store persists across page navigation
- [ ] `GET /api/vehicles` returns vehicles filtered by availability
- [ ] Home page renders vehicle grid
- [ ] `/book/[vehicleId]` loads vehicle detail and date picker
- [ ] `/book/extras` loads extras and updates Zustand store
- [ ] `/book/driver` loads driver form with loyalty fetch
- [ ] `GET /api/loyalty` returns account, tiers, transactions for authenticated user
- [ ] Loyalty redemption computes correctly against `computeMaxRedeemablePoints`
- [ ] `/book/payment` creates PaymentIntent and renders Stripe Elements
- [ ] Test payment succeeds with Stripe test card `4242 4242 4242 4242`
- [ ] Stripe webhook receives `payment_intent.succeeded`, updates booking to `confirmed`
- [ ] `award_loyalty_points` RPC called successfully from webhook
- [ ] `/book/confirmation` displays booking reference
- [ ] `/account/rewards` shows correct tier, balance, and transaction history
- [ ] `/account/profile` loads and saves user profile
- [ ] `/account/bookings` shows booking history for logged-in user

### Phase 5 — Admin App Core

- [ ] Admin login page renders and works
- [ ] AdminNav sidebar renders with correct links
- [ ] `/dashboard` KPI cards show correct data
- [ ] `/fleet` vehicle grid loads all vehicles including inactive
- [ ] `/fleet/new` creates a vehicle
- [ ] `/fleet/[id]` edits a vehicle including service fields
- [ ] `/bookings` table lists all bookings with search
- [ ] `/bookings/[id]` status update works
- [ ] `/calendar` FullCalendar timeline renders bookings as events
- [ ] Admin proxy works: `http://localhost:3000/admin` routes to admin app

### Phase 6 — AI Features

- [ ] `/api/ai/chat` returns Claude responses for vehicle search queries
- [ ] AgentChat component sends and displays messages
- [ ] `/api/ai/damage` returns damage assessment from an uploaded image
- [ ] `/api/ai/licence` extracts text from a driving licence image
- [ ] `/admin/maintenance` GET returns flagged vehicles with AI notes
- [ ] `/admin/maintenance` PATCH marks vehicle as serviced
- [ ] Maintenance dashboard renders severity-coded list with AI notes

### Phase 7 — Production

- [ ] `pnpm build` succeeds for both apps with no TypeScript errors
- [ ] Web app deployed to Vercel, all env vars set
- [ ] Admin app deployed to Vercel as separate project, all env vars set
- [ ] Web app `ADMIN_URL` updated to production admin Vercel URL, redeployed
- [ ] Supabase auth redirect URLs updated for production domain
- [ ] Production Stripe webhook endpoint registered and verified
- [ ] Full booking flow tested end-to-end on production URL
- [ ] Admin portal accessible at `https://yourdomain.com/admin`

---

## 20. Planned Features (Coming Soon)

The following features have database schema, table structures, or scaffold code already in place but are not yet fully implemented. When rebuilding, these are the next build targets after the core system is stable.

### 20.1 Mobile App (React Native / Expo)

**Status:** Scaffold only — `apps/mobile/` exists with `app.json` and Supabase client but no screens built.

**Scope to build:**
- Expo SDK setup with `@supabase/supabase-js` and Expo SecureStore for token storage
- Auth screens (login, register)
- Vehicle browse + booking flow (mirrors web app)
- Booking history
- Push notifications (Expo Notifications) for booking confirmation and pickup reminders
- Loyalty balance widget

**Files to create:** `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(auth)/login.tsx`, all screen files, `apps/mobile/app.json` already seeded.

---

### 20.2 Dynamic / Demand-Based Pricing

**Status:** `pricing_signals` table exists with `demand_score`, `signal_type` (`normal`, `high`, `peak`), and `vehicles_remaining` columns. No computation logic or admin UI built.

**Scope to build:**
- Cron job (Supabase Edge Function or external cron) to compute demand scores daily per category
- Logic: score based on booking density in upcoming 7-day window vs available vehicle count
- Update `pricing_signals` rows with computed `demand_score` and `signal_type`
- Pricing engine in `packages/utils/src/pricing.ts` to read signals and apply surcharge multiplier
- Admin UI to view demand heatmap per category per date

**Key table:** `pricing_signals (category_id, date, demand_score, signal_type, vehicles_remaining)`

---

### 20.3 White-Label AI API (B2B Product)

**Status:** `api_keys` table exists with `key_hash`, `requests_today`, `last_reset_at`, `revoked_at`. No API surface built.

**Scope to build:**
- API key generation endpoint (admin only)
- Public API endpoints (versioned: `/api/v1/...`) authenticated by hashed key in `Authorization` header
- Rate limiting middleware: check `requests_today` < limit, increment, reset daily via cron
- Expose vehicle search, availability check, and pricing endpoints
- Admin UI: create/revoke keys, view usage stats
- Developer documentation

**Key table:** `api_keys (key_hash TEXT UNIQUE, owner_name, requests_today, last_reset_at, revoked_at)`

---

### 20.4 AI Damage Detection (Vehicle Inspections)

**Status:** `vehicle_inspections` table exists with `photo_urls[]`, `ai_damage_report JSONB`, `admin_override`. API route `/api/ai/damage` may be scaffolded.

**Scope to build:**
- Customer-facing photo upload at pickup and return (with Supabase Storage)
- Claude vision call: compare pickup vs return photos, identify new damage
- Structured damage report: `{ severity: 'none'|'minor'|'major', damage_areas: [], confidence: 0.0–1.0, description: string }`
- Admin review UI: view both photo sets, AI report, override button
- `admin_override` + `admin_override_note` fields already in schema for manual corrections

**AI model:** `claude-opus-4-6` or `claude-sonnet-4-6` (vision capable) — haiku does not support vision

---

### 20.5 AI Driving Licence OCR

**Status:** `licence_verifications` table exists with `extracted_data JSONB`, `confidence DECIMAL(4,3)`, `status` (`pending`, `verified`, `failed`, `expired`), `admin_override`. API route `/api/ai/licence` may be scaffolded.

**Scope to build:**
- Customer licence upload page under `/account/profile`
- Upload to Supabase Storage
- Claude vision call: extract name, DOB, licence number, expiry, issuing country
- Confidence threshold: auto-verify if confidence > 0.85, flag for admin review otherwise
- Admin queue: view flagged licences, approve/reject, set `admin_override`
- Update `user_profiles.licence_verified = true` on successful verification

---

### 20.6 Automated Email Workflows

**Status:** `email_logs` table exists. `resend` package installed. Single confirmation email may be implemented.

**Scope to build:**
- Booking confirmation email (HTML template, RECI-branded)
- Pickup reminder (24h before pickup datetime) — triggered via cron or Supabase scheduled function
- Return reminder (2h before dropoff)
- Loyalty tier-up notification email
- Admin alert for critical maintenance flags
- All templates in `/apps/web/emails/` using React Email or plain HTML

---

### 20.7 Corporate Invoice Payments

**Status:** `payment_method` enum includes `'corporate_invoice'` and `'bank_transfer'`. Corporate accounts table and pricing exist.

**Scope to build:**
- At checkout, corporate users (linked via `user_profiles.corporate_account_id`) see "Invoice" payment option
- Invoice booking bypasses Stripe — sets `payment_status: 'pending'`, `method: 'corporate_invoice'`
- Admin generates PDF invoice (using `@react-pdf/renderer` or similar)
- Invoice sent via Resend with payment instructions
- Admin marks invoice as paid → updates `payment_status: 'paid'`, `paid_at`
- Credit limit enforcement: reject booking if `corporate_accounts.credit_limit` would be exceeded

---

### 20.8 Refund Flow

**Status:** `payment_status` enum includes `'refunded'`. No refund UI or logic built.

**Scope to build:**
- Admin "Refund" button on booking detail page
- Calls Stripe refunds API: `stripe.refunds.create({ payment_intent: pi_... })`
- Updates `payments.status = 'refunded'`, stores `stripe_charge_id` if not already set
- Cancels booking: `bookings.status = 'cancelled'`
- Sends refund confirmation email to customer
- Loyalty points reversal: deduct awarded points if refund is full

---

### 20.9 Pricing Override Admin UI

**Status:** `pricing_overrides` table exists with `surcharge_pct`, `flat_surcharge`, `start_date`, `end_date`. No admin UI built.

**Scope to build:**
- Admin `/pricing` page section for seasonal surcharges
- Create/edit/delete override form: pick category, date range, surcharge type (% or flat)
- Pricing engine reads overrides at booking time and stacks onto base rate

---

### 20.10 Real-Time Availability Calendar (Customer-Facing)

**Status:** `availability_blocks` table exists. Admin can create blocks. Customer date picker does not yet read blocks.

**Scope to build:**
- Date picker in booking flow should call `/api/vehicles/availability?vehicle_id=...`
- API queries both `bookings` (confirmed/active status) and `availability_blocks` for the vehicle
- Returns blocked date ranges as JSON
- Datepicker highlights and disables unavailable dates
- Prevents double-booking at the API layer (`conflict` check before insert)
