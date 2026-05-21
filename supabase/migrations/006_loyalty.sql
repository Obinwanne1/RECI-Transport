-- ============================================================
-- RECI Transport — Loyalty & Rewards Program
-- Migration: 006_loyalty.sql
-- ============================================================

-- ─── Loyalty Tiers (static reference data) ───────────────────────────────────
CREATE TABLE loyalty_tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,            -- 'Bronze', 'Silver', 'Gold', 'Platinum'
  slug                TEXT NOT NULL UNIQUE,     -- 'bronze', 'silver', 'gold', 'platinum'
  min_lifetime_points INT  NOT NULL DEFAULT 0,  -- threshold to reach this tier
  color_hex           TEXT NOT NULL DEFAULT '#CD7F32',
  perks               TEXT[] NOT NULL DEFAULT '{}',
  sort_order          INT  NOT NULL DEFAULT 0
);

-- ─── Loyalty Accounts (one per user) ─────────────────────────────────────────
CREATE TABLE loyalty_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance    INT  NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_points   INT  NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
  tier_id           UUID REFERENCES loyalty_tiers(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Loyalty Transactions (full ledger) ──────────────────────────────────────
CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  points          INT  NOT NULL,               -- positive = earned, negative = redeemed
  type            TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjusted')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Add points_redeemed column to bookings ───────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_loyalty_accounts_user ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_booking ON loyalty_transactions(booking_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Tiers: public read
CREATE POLICY "loyalty_tiers_public_read" ON loyalty_tiers
  FOR SELECT USING (true);

-- Accounts: user reads own row
CREATE POLICY "loyalty_accounts_own_read" ON loyalty_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: user reads own rows
CREATE POLICY "loyalty_transactions_own_read" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Seed tier data ───────────────────────────────────────────────────────────
INSERT INTO loyalty_tiers (name, slug, min_lifetime_points, color_hex, perks, sort_order) VALUES
  ('Bronze',   'bronze',   0,    '#CD7F32', ARRAY['1 point per €1 spent', 'Member discounts'], 1),
  ('Silver',   'silver',   500,  '#C0C0C0', ARRAY['1 point per €1 spent', '5% booking discount', 'Priority support'], 2),
  ('Gold',     'gold',     2000, '#FFD700', ARRAY['1 point per €1 spent', '10% booking discount', 'Free upgrade (when available)', 'Priority support'], 3),
  ('Platinum', 'platinum', 5000, '#E5E4E2', ARRAY['1 point per €1 spent', '15% booking discount', 'Guaranteed free upgrade', 'Dedicated account manager', 'Airport pickup'], 4);

-- Update loyalty_accounts.tier_id via trigger after insert/update
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier_id UUID;
BEGIN
  SELECT id INTO new_tier_id
  FROM loyalty_tiers
  WHERE min_lifetime_points <= NEW.lifetime_points
  ORDER BY min_lifetime_points DESC
  LIMIT 1;

  NEW.tier_id := new_tier_id;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_loyalty_tier
  BEFORE INSERT OR UPDATE ON loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION update_loyalty_tier();

-- ─── RPC: award points after confirmed payment ────────────────────────────────
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_user_id   UUID,
  p_points    INT,
  p_booking_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Upsert loyalty account
  INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE
    SET points_balance  = loyalty_accounts.points_balance  + p_points,
        lifetime_points = loyalty_accounts.lifetime_points + p_points;

  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, booking_id, points, type, note)
  VALUES (p_user_id, p_booking_id, p_points, 'earned', 'Earned on booking');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: deduct points at booking creation ───────────────────────────────────
CREATE OR REPLACE FUNCTION deduct_loyalty_points(
  p_user_id    UUID,
  p_points     INT,
  p_booking_id UUID
) RETURNS VOID AS $$
DECLARE
  current_balance INT;
BEGIN
  SELECT points_balance INTO current_balance
  FROM loyalty_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  UPDATE loyalty_accounts
  SET points_balance = points_balance - p_points
  WHERE user_id = p_user_id;

  INSERT INTO loyalty_transactions (user_id, booking_id, points, type, note)
  VALUES (p_user_id, p_booking_id, -p_points, 'redeemed', 'Redeemed at checkout');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
