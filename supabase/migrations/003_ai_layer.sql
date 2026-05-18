-- ─── Phase 8 AI Layer ────────────────────────────────────────────────────────

-- Extend ai_conversations to support all AI feature contexts
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS context     TEXT,
  ADD COLUMN IF NOT EXISTS decision    JSONB,
  ADD COLUMN IF NOT EXISTS model_used  TEXT,
  ADD COLUMN IF NOT EXISTS confidence  DECIMAL(4,3),
  ADD COLUMN IF NOT EXISTS input_hash  TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_booking
  ON ai_conversations(booking_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_context
  ON ai_conversations(context);

-- API keys for white-label AI product
CREATE TABLE IF NOT EXISTS api_keys (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash       TEXT        NOT NULL UNIQUE,
  owner_name     TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at     TIMESTAMPTZ,
  requests_today INT         NOT NULL DEFAULT 0,
  last_reset_at  DATE        NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_api_keys" ON api_keys
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'staff')
  );

-- pricing_signals: pre-computed demand scores (populated by cron)
-- Table created in initial schema — add vehicles_remaining column if missing
ALTER TABLE pricing_signals
  ADD COLUMN IF NOT EXISTS vehicles_remaining INT;

-- licence_verifications: add admin_override column
ALTER TABLE licence_verifications
  ADD COLUMN IF NOT EXISTS admin_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_note     TEXT;

-- vehicle_inspections: add admin_override column
ALTER TABLE vehicle_inspections
  ADD COLUMN IF NOT EXISTS admin_override      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_override_note TEXT,
  ADD COLUMN IF NOT EXISTS admin_override_at   TIMESTAMPTZ;
