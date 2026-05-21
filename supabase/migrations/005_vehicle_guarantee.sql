-- Phase B5: Exact Model Guarantee
-- Allows admins to mark individual vehicles as "guaranteed exact model"

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS guaranteed_model BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN vehicles.guaranteed_model IS
  'When true, customer is guaranteed this exact vehicle (not "or similar"). Admin-controlled.';

CREATE INDEX IF NOT EXISTS idx_vehicles_guaranteed ON vehicles(guaranteed_model) WHERE guaranteed_model = true;
