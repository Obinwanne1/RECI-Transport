-- ============================================================
-- RECI Transport — Migration 002
-- Adds corporate application status to user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS corporate_application_status TEXT
    NOT NULL DEFAULT 'none'
    CHECK (corporate_application_status IN ('none', 'pending', 'approved'));
