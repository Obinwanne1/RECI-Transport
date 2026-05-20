-- Migration: 004_internal_users.sql
-- Adds password_reset_required flag to user_profiles for admin-created accounts
-- that must change their temp password on first login.
-- DEFAULT false backfills all existing rows safely.

ALTER TABLE user_profiles
  ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT false;

-- ─── Fix RLS Gap ───────────────────────────────────────────────────────────────
-- The original "own_profile" policy is FOR ALL, which includes UPDATE.
-- This would allow a customer to self-clear the password_reset_required flag
-- or change their own role via the anon client. Split into granular policies.

DROP POLICY IF EXISTS "own_profile" ON user_profiles;

-- Users can read their own profile (unchanged behaviour)
CREATE POLICY "own_profile_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile ONLY if role and password_reset_required
-- remain unchanged (immutable via anon client — service role bypasses RLS).
CREATE POLICY "own_profile_update" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    AND password_reset_required = (SELECT password_reset_required FROM public.user_profiles WHERE id = auth.uid())
  );
