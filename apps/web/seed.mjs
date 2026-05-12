import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ewrknfmpdifdgxlmqbzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8'
)

const { error: locErr } = await supabase.from('locations').upsert([{
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  name: 'RECI Transport Berlin HQ',
  address: 'Unter den Linden 1',
  city: 'Berlin', country: 'DE',
  latitude: 52.5170365, longitude: 13.3888599
}])
if (locErr) { console.error('locations:', locErr.message); process.exit(1) }
console.log('locations ok')

const { error: catErr } = await supabase.from('vehicle_categories').upsert([
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Economy', slug: 'economy', tier: '1', description: 'Compact and fuel-efficient. Perfect for city driving.', passenger_capacity: 4, luggage_capacity: 1 },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Compact', slug: 'compact', tier: '2', description: 'A little more space without sacrificing economy.', passenger_capacity: 5, luggage_capacity: 2 },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'SUV', slug: 'suv', tier: '3', description: 'Space, comfort, and all-road capability.', passenger_capacity: 5, luggage_capacity: 4 },
  { id: 'c0000000-0000-0000-0000-000000000004', name: 'Van', slug: 'van', tier: '4', description: 'Ideal for moves, deliveries, and group transport.', passenger_capacity: 3, luggage_capacity: 10 },
])
if (catErr) { console.error('categories:', catErr.message); process.exit(1) }
console.log('categories ok')

const { error: priceErr } = await supabase.from('pricing_rules').upsert([
  { category_id: 'c0000000-0000-0000-0000-000000000001', base_rate_per_day: 45.00, weekly_discount_pct: 10.00, monthly_discount_pct: 20.00 },
  { category_id: 'c0000000-0000-0000-0000-000000000002', base_rate_per_day: 65.00, weekly_discount_pct: 10.00, monthly_discount_pct: 20.00 },
  { category_id: 'c0000000-0000-0000-0000-000000000003', base_rate_per_day: 95.00, weekly_discount_pct: 8.00, monthly_discount_pct: 18.00 },
  { category_id: 'c0000000-0000-0000-0000-000000000004', base_rate_per_day: 120.00, weekly_discount_pct: 8.00, monthly_discount_pct: 15.00 },
])
if (priceErr) { console.error('pricing_rules:', priceErr.message); process.exit(1) }
console.log('pricing_rules ok')

const { error: vErr } = await supabase.from('vehicles').upsert([
  { id: 'e0000000-0000-0000-0000-000000000001', category_id: 'c0000000-0000-0000-0000-000000000001', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Volkswagen', model: 'Polo', year: 2023, registration_plate: 'B-RT 1001', fuel_type: 'petrol', transmission: 'manual', color: 'Silver', mileage: 12450, features: ['Bluetooth','USB-C','Rear camera'] },
  { id: 'e0000000-0000-0000-0000-000000000002', category_id: 'c0000000-0000-0000-0000-000000000001', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Toyota', model: 'Yaris', year: 2024, registration_plate: 'B-RT 1002', fuel_type: 'hybrid', transmission: 'automatic', color: 'White', mileage: 4800, features: ['Bluetooth','Lane assist','Apple CarPlay','Android Auto'] },
  { id: 'e0000000-0000-0000-0000-000000000003', category_id: 'c0000000-0000-0000-0000-000000000002', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Volkswagen', model: 'Golf', year: 2023, registration_plate: 'B-RT 2001', fuel_type: 'petrol', transmission: 'automatic', color: 'Black', mileage: 18200, features: ['Bluetooth','Cruise control','Parking sensors','Apple CarPlay'] },
  { id: 'e0000000-0000-0000-0000-000000000004', category_id: 'c0000000-0000-0000-0000-000000000002', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Seat', model: 'Leon', year: 2024, registration_plate: 'B-RT 2002', fuel_type: 'diesel', transmission: 'manual', color: 'Grey', mileage: 9100, features: ['Bluetooth','USB-C','Rear camera','Climate control'] },
  { id: 'e0000000-0000-0000-0000-000000000005', category_id: 'c0000000-0000-0000-0000-000000000003', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Volkswagen', model: 'Tiguan', year: 2023, registration_plate: 'B-RT 3001', fuel_type: 'diesel', transmission: 'automatic', color: 'Blue', mileage: 22300, features: ['Bluetooth','Navigation','Panoramic roof','Heated seats','4WD'] },
  { id: 'e0000000-0000-0000-0000-000000000006', category_id: 'c0000000-0000-0000-0000-000000000003', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Toyota', model: 'RAV4', year: 2024, registration_plate: 'B-RT 3002', fuel_type: 'hybrid', transmission: 'automatic', color: 'White', mileage: 8700, features: ['Bluetooth','Apple CarPlay','Android Auto','Adaptive cruise','Heated seats'] },
  { id: 'e0000000-0000-0000-0000-000000000007', category_id: 'c0000000-0000-0000-0000-000000000004', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Mercedes-Benz', model: 'Sprinter', year: 2022, registration_plate: 'B-RT 4001', fuel_type: 'diesel', transmission: 'manual', color: 'White', mileage: 45600, features: ['Bluetooth','Rear camera','Loading ramp','Bulkhead'] },
  { id: 'e0000000-0000-0000-0000-000000000008', category_id: 'c0000000-0000-0000-0000-000000000004', location_id: 'a1b2c3d4-0000-0000-0000-000000000001', make: 'Ford', model: 'Transit', year: 2023, registration_plate: 'B-RT 4002', fuel_type: 'diesel', transmission: 'automatic', color: 'Silver', mileage: 31200, features: ['Bluetooth','Rear camera','Cruise control','Tow bar'] },
])
if (vErr) { console.error('vehicles:', vErr.message); process.exit(1) }
console.log('vehicles ok')

const { error: exErr } = await supabase.from('extras').upsert([
  { name: 'Basic Insurance', description: 'Third-party liability.', price_per_day: 0.00, is_one_time_fee: false, exclusive_group: 'insurance', sort_order: 1 },
  { name: 'Full Insurance', description: 'Zero-excess comprehensive cover.', price_per_day: 18.00, is_one_time_fee: false, exclusive_group: 'insurance', sort_order: 2 },
  { name: 'GPS Navigation', description: 'Portable Garmin satnav.', price_per_day: 8.00, is_one_time_fee: false, exclusive_group: null, sort_order: 3 },
  { name: 'Baby Seat', description: 'Rear-facing infant seat.', price_per_day: 10.00, is_one_time_fee: false, exclusive_group: null, sort_order: 4 },
  { name: 'Child Seat', description: 'Forward-facing child seat.', price_per_day: 10.00, is_one_time_fee: false, exclusive_group: null, sort_order: 5 },
  { name: 'Additional Driver', description: 'Register a second driver.', price_per_day: 15.00, is_one_time_fee: false, exclusive_group: null, sort_order: 6 },
  { name: 'Fuel Option', description: 'Return empty - we refuel at market rate.', price_per_day: 45.00, is_one_time_fee: true, exclusive_group: null, sort_order: 7 },
  { name: 'Chauffeur', description: 'Professional driver for the full duration.', price_per_day: 120.00, is_one_time_fee: false, exclusive_group: null, sort_order: 8 },
])
if (exErr) { console.error('extras:', exErr.message); process.exit(1) }
console.log('extras ok')
console.log('Seed complete.')
