-- ============================================================
-- RECI Transport — Predictive Maintenance
-- Migration: 007_maintenance.sql
-- ============================================================

-- Add service tracking columns to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS last_service_mileage INT,
  ADD COLUMN IF NOT EXISTS last_service_date     DATE;

-- Maintenance alerts table (AI-generated + manual)
CREATE TABLE maintenance_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  severity         TEXT NOT NULL CHECK (severity IN ('warning', 'alert', 'critical')),
  km_since_service INT  NOT NULL,
  ai_note          TEXT,              -- Claude-generated recommendation
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_alerts_vehicle ON maintenance_alerts(vehicle_id);
CREATE INDEX idx_maintenance_alerts_unresolved ON maintenance_alerts(vehicle_id) WHERE resolved_at IS NULL;

ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Staff and admin can read/write
CREATE POLICY "maintenance_alerts_staff_read" ON maintenance_alerts
  FOR SELECT USING (true);

CREATE POLICY "maintenance_alerts_staff_write" ON maintenance_alerts
  FOR ALL USING (true);
