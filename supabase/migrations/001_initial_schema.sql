-- ============================================================
-- RECI Transport — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE vehicle_tier AS ENUM ('1', '2', '3', '4', '5');

CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');

CREATE TYPE transmission_type AS ENUM ('manual', 'automatic');

CREATE TYPE damage_severity AS ENUM ('none', 'minor', 'major');

CREATE TYPE payment_method AS ENUM (
  'stripe', 'bank_transfer', 'cash', 'corporate_invoice'
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

CREATE TYPE signal_type AS ENUM ('normal', 'high', 'peak');

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin', 'corporate_manager');

CREATE TYPE inspection_type AS ENUM ('pickup', 'return');

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');

-- ─── Booking Ref Sequence ────────────────────────────────────────────────────
CREATE SEQUENCE booking_ref_seq START 1;

-- ─── Locations ───────────────────────────────────────────────────────────────
CREATE TABLE locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'DE',
  latitude      DECIMAL(9, 6),
  longitude     DECIMAL(9, 6),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vehicle Categories ───────────────────────────────────────────────────────
CREATE TABLE vehicle_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  tier                vehicle_tier NOT NULL,
  description         TEXT,
  icon_url            TEXT,
  passenger_capacity  INT NOT NULL DEFAULT 5,
  luggage_capacity    INT NOT NULL DEFAULT 2,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vehicles ─────────────────────────────────────────────────────────────────
CREATE TABLE vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE RESTRICT,
  location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  make                TEXT NOT NULL,
  model               TEXT NOT NULL,
  year                INT NOT NULL,
  registration_plate  TEXT NOT NULL UNIQUE,
  fuel_type           fuel_type NOT NULL,
  transmission        transmission_type NOT NULL DEFAULT 'automatic',
  color               TEXT NOT NULL,
  mileage             INT NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  image_urls          TEXT[] NOT NULL DEFAULT '{}',
  features            TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_category_location ON vehicles(category_id, location_id);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);

-- ─── Pricing Rules ────────────────────────────────────────────────────────────
CREATE TABLE pricing_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id           UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  location_id           UUID REFERENCES locations(id) ON DELETE CASCADE,
  base_rate_per_day     DECIMAL(10, 2) NOT NULL,
  min_days              INT NOT NULL DEFAULT 1,
  weekly_discount_pct   DECIMAL(5, 2) NOT NULL DEFAULT 0,
  monthly_discount_pct  DECIMAL(5, 2) NOT NULL DEFAULT 0,
  effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to          DATE,
  UNIQUE (category_id, location_id, effective_from)
);

-- ─── Pricing Overrides (seasonal / demand surcharges) ────────────────────────
CREATE TABLE pricing_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  surcharge_pct   DECIMAL(5, 2) NOT NULL DEFAULT 0,
  flat_surcharge  DECIMAL(10, 2) NOT NULL DEFAULT 0,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  CHECK (end_date > start_date)
);

-- ─── Corporate Accounts ───────────────────────────────────────────────────────
CREATE TABLE corporate_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          TEXT NOT NULL,
  company_registration  TEXT,
  vat_number            TEXT,
  billing_address       TEXT NOT NULL,
  billing_email         TEXT NOT NULL,
  discount_pct          DECIMAL(5, 2) NOT NULL DEFAULT 0,
  credit_limit          DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_terms_days    INT NOT NULL DEFAULT 30,
  travel_policy         TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Corporate Pricing ────────────────────────────────────────────────────────
CREATE TABLE corporate_pricing (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id  UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  category_id           UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  rate_per_day          DECIMAL(10, 2) NOT NULL,
  effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to          DATE,
  UNIQUE (corporate_account_id, category_id, effective_from)
);

-- ─── Extras ───────────────────────────────────────────────────────────────────
CREATE TABLE extras (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  price_per_day    DECIMAL(10, 2) NOT NULL,
  is_one_time_fee  BOOLEAN NOT NULL DEFAULT false,
  exclusive_group  TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0
);

-- ─── User Profiles ────────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  first_name            TEXT,
  last_name             TEXT,
  phone                 TEXT,
  role                  user_role NOT NULL DEFAULT 'customer',
  corporate_account_id  UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  licence_verified      BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref             TEXT NOT NULL UNIQUE DEFAULT (
    'RECI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('booking_ref_seq')::TEXT, 5, '0')
  ),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id              UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  status                  booking_status NOT NULL DEFAULT 'pending',
  pickup_datetime         TIMESTAMPTZ NOT NULL,
  dropoff_datetime        TIMESTAMPTZ NOT NULL,
  pickup_location_id      UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  dropoff_location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  driver_first_name       TEXT NOT NULL,
  driver_last_name        TEXT NOT NULL,
  driver_email            TEXT NOT NULL,
  driver_phone            TEXT NOT NULL,
  driver_licence_number   TEXT,
  base_price              DECIMAL(10, 2) NOT NULL,
  extras_price            DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price             DECIMAL(10, 2) NOT NULL,
  corporate_account_id    UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  ai_policy_decision      JSONB,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (dropoff_datetime > pickup_datetime)
);

CREATE INDEX idx_bookings_vehicle_dates ON bookings(vehicle_id, pickup_datetime, dropoff_datetime);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_corporate ON bookings(corporate_account_id);

-- ─── Booking Extras ───────────────────────────────────────────────────────────
CREATE TABLE booking_extras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id        UUID NOT NULL REFERENCES extras(id) ON DELETE RESTRICT,
  quantity        INT NOT NULL DEFAULT 1,
  price_snapshot  DECIMAL(10, 2) NOT NULL,
  UNIQUE (booking_id, extra_id)
);

-- ─── Availability Blocks ──────────────────────────────────────────────────────
CREATE TABLE availability_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ NOT NULL,
  reason        TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_availability_blocks_vehicle ON availability_blocks(vehicle_id, start_date, end_date);

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount                      DECIMAL(10, 2) NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'EUR',
  method                      payment_method NOT NULL,
  status                      payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id    TEXT UNIQUE,
  stripe_charge_id            TEXT,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);

-- ─── Email Logs ───────────────────────────────────────────────────────────────
CREATE TABLE email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  template    TEXT NOT NULL,
  resend_id   TEXT,
  status      TEXT NOT NULL DEFAULT 'sent',
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vehicle Inspections (AI damage detection) ────────────────────────────────
CREATE TABLE vehicle_inspections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  inspection_type   inspection_type NOT NULL,
  photo_urls        TEXT[] NOT NULL DEFAULT '{}',
  ai_damage_report  JSONB,
  inspector_notes   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, inspection_type)
);

-- ─── AI Conversations (conversational search) ────────────────────────────────
CREATE TABLE ai_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id        TEXT NOT NULL,
  messages          JSONB NOT NULL DEFAULT '[]',
  resolved_params   JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);

-- ─── Licence Verifications (AI OCR) ──────────────────────────────────────────
CREATE TABLE licence_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extracted_data  JSONB,
  confidence      DECIMAL(4, 3),
  status          verification_status NOT NULL DEFAULT 'pending',
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licence_verifications_user ON licence_verifications(user_id);

-- ─── Pricing Signals (dynamic demand, Phase 8c) ───────────────────────────────
CREATE TABLE pricing_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  demand_score  DECIMAL(4, 3) NOT NULL DEFAULT 0,
  signal_type   signal_type NOT NULL DEFAULT 'normal',
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, date)
);

-- ─── Updated_at trigger (vehicles + bookings + user_profiles) ────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- Locations: public read
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_locations" ON locations FOR SELECT USING (true);
CREATE POLICY "admin_all_locations" ON locations FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Vehicle Categories: public read
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON vehicle_categories FOR SELECT USING (true);
CREATE POLICY "admin_all_categories" ON vehicle_categories FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Vehicles: public read active only
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_vehicles" ON vehicles FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all_vehicles" ON vehicles FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Pricing Rules: public read
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pricing" ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "admin_all_pricing" ON pricing_rules FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Pricing Overrides: public read
ALTER TABLE pricing_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_overrides" ON pricing_overrides FOR SELECT USING (true);
CREATE POLICY "admin_all_overrides" ON pricing_overrides FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Extras: public read active
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_extras" ON extras FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all_extras" ON extras FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- User Profiles: own row only
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON user_profiles FOR ALL
  USING (auth.uid() = id);
CREATE POLICY "admin_all_profiles" ON user_profiles FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Bookings: own bookings only
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bookings" ON bookings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "create_booking" ON bookings FOR INSERT
  WITH CHECK (true); -- anyone can create (guest checkout supported)
CREATE POLICY "own_booking_update" ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "admin_all_bookings" ON bookings FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Booking Extras: via booking ownership
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_extras_via_booking" ON booking_extras FOR SELECT
  USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_booking_extras" ON booking_extras FOR INSERT
  WITH CHECK (true);
CREATE POLICY "admin_all_booking_extras" ON booking_extras FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Payments: own only
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_payments" ON payments FOR SELECT
  USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY "admin_all_payments" ON payments FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Availability Blocks: public read (for datepicker)
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_blocks" ON availability_blocks FOR SELECT USING (true);
CREATE POLICY "admin_all_blocks" ON availability_blocks FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Corporate Accounts: corporate manager + admin
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_corporate_account" ON corporate_accounts FOR SELECT
  USING (
    id IN (
      SELECT corporate_account_id FROM user_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "admin_all_corporate" ON corporate_accounts FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Vehicle Inspections: own booking
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_inspections" ON vehicle_inspections FOR SELECT
  USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_inspections" ON vehicle_inspections FOR INSERT
  WITH CHECK (true);
CREATE POLICY "admin_all_inspections" ON vehicle_inspections FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- AI Conversations: own session
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ai_conversations" ON ai_conversations FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Licence Verifications: own user
ALTER TABLE licence_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_licence" ON licence_verifications FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "admin_all_licences" ON licence_verifications FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Pricing Signals: public read
ALTER TABLE pricing_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_signals" ON pricing_signals FOR SELECT USING (true);
CREATE POLICY "admin_all_signals" ON pricing_signals FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Email Logs: admin only
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_email_logs" ON email_logs FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- Corporate Pricing: corporate manager read
ALTER TABLE corporate_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_corporate_pricing" ON corporate_pricing FOR SELECT
  USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM user_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "admin_all_corporate_pricing" ON corporate_pricing FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
