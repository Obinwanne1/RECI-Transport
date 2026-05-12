-- ============================================================
-- RECI Transport — Seed Data
-- ============================================================

-- ─── Location ─────────────────────────────────────────────────────────────────
INSERT INTO locations (id, name, address, city, country, latitude, longitude)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'RECI Transport Berlin HQ',
  'Unter den Linden 1',
  'Berlin',
  'DE',
  52.5170365,
  13.3888599
);

-- ─── Vehicle Categories ───────────────────────────────────────────────────────
INSERT INTO vehicle_categories (id, name, slug, tier, description, passenger_capacity, luggage_capacity)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Economy',  'economy',  '1', 'Compact and fuel-efficient. Perfect for city driving.', 4, 1),
  ('c0000000-0000-0000-0000-000000000002', 'Compact',  'compact',  '2', 'A little more space without sacrificing economy.', 5, 2),
  ('c0000000-0000-0000-0000-000000000003', 'SUV',      'suv',      '3', 'Space, comfort, and all-road capability.', 5, 4),
  ('c0000000-0000-0000-0000-000000000004', 'Van',      'van',      '4', 'Ideal for moves, deliveries, and group transport.', 3, 10);

-- ─── Pricing Rules ────────────────────────────────────────────────────────────
INSERT INTO pricing_rules (category_id, base_rate_per_day, weekly_discount_pct, monthly_discount_pct)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 45.00, 10.00, 20.00),
  ('c0000000-0000-0000-0000-000000000002', 65.00, 10.00, 20.00),
  ('c0000000-0000-0000-0000-000000000003', 95.00, 8.00,  18.00),
  ('c0000000-0000-0000-0000-000000000004', 120.00, 8.00, 15.00);

-- ─── Vehicles ─────────────────────────────────────────────────────────────────
INSERT INTO vehicles (id, category_id, location_id, make, model, year, registration_plate, fuel_type, transmission, color, mileage, features)
VALUES
  -- Economy x2
  ('v0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Volkswagen', 'Polo', 2023, 'B-RT 1001', 'petrol', 'manual', 'Silver', 12450,
   ARRAY['Bluetooth', 'USB-C', 'Rear camera']),

  ('v0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Toyota', 'Yaris', 2024, 'B-RT 1002', 'hybrid', 'automatic', 'White', 4800,
   ARRAY['Bluetooth', 'Lane assist', 'Apple CarPlay', 'Android Auto']),

  -- Compact x2
  ('v0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Volkswagen', 'Golf', 2023, 'B-RT 2001', 'petrol', 'automatic', 'Black', 18200,
   ARRAY['Bluetooth', 'Cruise control', 'Parking sensors', 'Apple CarPlay']),

  ('v0000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Seat', 'Leon', 2024, 'B-RT 2002', 'diesel', 'manual', 'Grey', 9100,
   ARRAY['Bluetooth', 'USB-C', 'Rear camera', 'Climate control']),

  -- SUV x2
  ('v0000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Volkswagen', 'Tiguan', 2023, 'B-RT 3001', 'diesel', 'automatic', 'Blue', 22300,
   ARRAY['Bluetooth', 'Navigation', 'Panoramic roof', 'Heated seats', '4WD']),

  ('v0000000-0000-0000-0000-000000000006',
   'c0000000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Toyota', 'RAV4', 2024, 'B-RT 3002', 'hybrid', 'automatic', 'White', 8700,
   ARRAY['Bluetooth', 'Apple CarPlay', 'Android Auto', 'Adaptive cruise', 'Heated seats']),

  -- Van x2
  ('v0000000-0000-0000-0000-000000000007',
   'c0000000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Mercedes-Benz', 'Sprinter', 2022, 'B-RT 4001', 'diesel', 'manual', 'White', 45600,
   ARRAY['Bluetooth', 'Rear camera', 'Loading ramp', 'Bulkhead']),

  ('v0000000-0000-0000-0000-000000000008',
   'c0000000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Ford', 'Transit', 2023, 'B-RT 4002', 'diesel', 'automatic', 'Silver', 31200,
   ARRAY['Bluetooth', 'Rear camera', 'Cruise control', 'Tow bar']);

-- ─── Extras ───────────────────────────────────────────────────────────────────
INSERT INTO extras (name, description, price_per_day, is_one_time_fee, exclusive_group, sort_order)
VALUES
  -- Insurance (mutually exclusive)
  ('Basic Insurance',  'Third-party liability. Required minimum.',    0.00,  false, 'insurance', 1),
  ('Full Insurance',   'Zero-excess comprehensive cover.',           18.00,  false, 'insurance', 2),

  -- Add-ons
  ('GPS Navigation',   'Portable Garmin satnav, updated maps.',       8.00,  false, NULL, 3),
  ('Baby Seat',        'Rear-facing infant seat (0–13 kg).',         10.00,  false, NULL, 4),
  ('Child Seat',       'Forward-facing child seat (9–36 kg).',       10.00,  false, NULL, 5),
  ('Additional Driver','Register a second driver on the booking.',   15.00,  false, NULL, 6),
  ('Fuel Option',      'Return empty — we refuel at market rate.',   45.00,  true,  NULL, 7),
  ('Chauffeur',        'Professional driver for the full duration.', 120.00, false, NULL, 8);
