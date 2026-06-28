/**
 * Demo seed: 20 vehicles (5 categories) with images.
 * Run: node seed_demo.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ewrknfmpdifdgxlmqbzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmtuZm1wZGlmZGd4bG1xYnppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MDYyOCwiZXhwIjoyMDk0MTY2NjI4fQ.W9yt2J63AjLGPM3n7xgzfHoZIzTxUKbAXCl1MulnTq8'
)

const LOC = 'a1b2c3d4-0000-0000-0000-000000000001'
const CAT = {
  economy:  'c0000000-0000-0000-0000-000000000001',
  compact:  'c0000000-0000-0000-0000-000000000002',
  suv:      'c0000000-0000-0000-0000-000000000003',
  van:      'c0000000-0000-0000-0000-000000000004',
  premium:  'c0000000-0000-0000-0000-000000000005',
}

// ── 1. Ensure base data exists ──────────────────────────────────────────────
const { error: locErr } = await supabase.from('locations').upsert([{
  id: LOC,
  name: 'RECI Transport Berlin HQ',
  address: 'Unter den Linden 1',
  city: 'Berlin', country: 'DE',
  latitude: 52.5170365, longitude: 13.3888599,
}])
if (locErr) { console.error('locations:', locErr.message); process.exit(1) }
console.log('✓ location')

const { error: catErr } = await supabase.from('vehicle_categories').upsert([
  { id: CAT.economy, name: 'Economy',  slug: 'economy',  tier: '1', description: 'Compact and fuel-efficient. Perfect for city driving.',     passenger_capacity: 4, luggage_capacity: 1 },
  { id: CAT.compact, name: 'Compact',  slug: 'compact',  tier: '2', description: 'A little more space without sacrificing economy.',          passenger_capacity: 5, luggage_capacity: 2 },
  { id: CAT.suv,     name: 'SUV',      slug: 'suv',      tier: '3', description: 'Space, comfort, and all-road capability.',                  passenger_capacity: 5, luggage_capacity: 4 },
  { id: CAT.van,     name: 'Van',      slug: 'van',      tier: '4', description: 'Ideal for moves, deliveries, and group transport.',         passenger_capacity: 3, luggage_capacity: 10 },
  { id: CAT.premium, name: 'Premium',  slug: 'premium',  tier: '5', description: 'Executive luxury for business travel and special events.',  passenger_capacity: 5, luggage_capacity: 3 },
])
if (catErr) { console.error('categories:', catErr.message); process.exit(1) }
console.log('✓ categories')

const { error: priceErr } = await supabase.from('pricing_rules').upsert([
  { category_id: CAT.economy, base_rate_per_day: 45.00,  weekly_discount_pct: 10, monthly_discount_pct: 20 },
  { category_id: CAT.compact, base_rate_per_day: 65.00,  weekly_discount_pct: 10, monthly_discount_pct: 20 },
  { category_id: CAT.suv,     base_rate_per_day: 95.00,  weekly_discount_pct:  8, monthly_discount_pct: 18 },
  { category_id: CAT.van,     base_rate_per_day: 120.00, weekly_discount_pct:  8, monthly_discount_pct: 15 },
  { category_id: CAT.premium, base_rate_per_day: 180.00, weekly_discount_pct:  5, monthly_discount_pct: 12 },
], { onConflict: 'category_id,location_id,effective_from', ignoreDuplicates: true })
if (priceErr) { console.error('pricing_rules:', priceErr.message); process.exit(1) }
console.log('✓ pricing')

// ── 2. 20 demo vehicles ─────────────────────────────────────────────────────
const vehicles = [
  // ECONOMY ─────────────────────────────────────────────────────────────────
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    category_id: CAT.economy, location_id: LOC,
    make: 'Volkswagen', model: 'Polo', year: 2023,
    registration_plate: 'B-RT 1001',
    fuel_type: 'petrol', transmission: 'manual', color: 'Silver', mileage: 12450,
    features: ['Bluetooth', 'USB-C', 'Rear camera'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/VW_Polo_VI_Facelift_IMG_3527.jpg/1280px-VW_Polo_VI_Facelift_IMG_3527.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    category_id: CAT.economy, location_id: LOC,
    make: 'Toyota', model: 'Yaris', year: 2024,
    registration_plate: 'B-RT 1002',
    fuel_type: 'hybrid', transmission: 'automatic', color: 'White', mileage: 4800,
    features: ['Bluetooth', 'Lane assist', 'Apple CarPlay', 'Android Auto'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/2020_Toyota_Yaris_Excel_Hybrid_1.5_Front.jpg/1280px-2020_Toyota_Yaris_Excel_Hybrid_1.5_Front.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000021',
    category_id: CAT.economy, location_id: LOC,
    make: 'Renault', model: 'Clio', year: 2024,
    registration_plate: 'B-RT 1003',
    fuel_type: 'petrol', transmission: 'manual', color: 'Red', mileage: 6200,
    features: ['Bluetooth', 'USB-C', 'Climate control', 'Rear camera'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Renault_Clio_V_facelift_front_20230618.jpg/1280px-Renault_Clio_V_facelift_front_20230618.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000022',
    category_id: CAT.economy, location_id: LOC,
    make: 'Opel', model: 'Corsa-e', year: 2024,
    registration_plate: 'B-RT 1004',
    fuel_type: 'electric', transmission: 'automatic', color: 'Blue', mileage: 2100,
    features: ['Bluetooth', 'Apple CarPlay', 'Android Auto', 'Heated seats', 'One-pedal driving'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Opel_Corsa_Electric_IMG_3108.jpg/1280px-Opel_Corsa_Electric_IMG_3108.jpg'],
  },

  // COMPACT ─────────────────────────────────────────────────────────────────
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    category_id: CAT.compact, location_id: LOC,
    make: 'Volkswagen', model: 'Golf', year: 2023,
    registration_plate: 'B-RT 2001',
    fuel_type: 'petrol', transmission: 'automatic', color: 'Black', mileage: 18200,
    features: ['Bluetooth', 'Cruise control', 'Parking sensors', 'Apple CarPlay'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/VW_Golf_8_2.0_TDI_Style_--_2020_--_4328.jpg/1280px-VW_Golf_8_2.0_TDI_Style_--_2020_--_4328.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    category_id: CAT.compact, location_id: LOC,
    make: 'SEAT', model: 'Leon', year: 2024,
    registration_plate: 'B-RT 2002',
    fuel_type: 'diesel', transmission: 'manual', color: 'Grey', mileage: 9100,
    features: ['Bluetooth', 'USB-C', 'Rear camera', 'Climate control'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/SEAT_Le%C3%B3n_IV_--_2021_--_1489.jpg/1280px-SEAT_Le%C3%B3n_IV_--_2021_--_1489.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000023',
    category_id: CAT.compact, location_id: LOC,
    make: 'BMW', model: '118i', year: 2024,
    registration_plate: 'B-RT 2003',
    fuel_type: 'petrol', transmission: 'automatic', color: 'Alpine White', mileage: 5400,
    features: ['Bluetooth', 'Apple CarPlay', 'Android Auto', 'Adaptive cruise', 'Parking assist'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/2019_BMW_118i_M_Sport_automatic_2.0_%28facelift%2C_front%29%2C_Zhejiang_University_Yuquan_Campus%2C_Hangzhou.jpg/1280px-2019_BMW_118i_M_Sport_automatic_2.0_%28facelift%2C_front%29%2C_Zhejiang_University_Yuquan_Campus%2C_Hangzhou.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000024',
    category_id: CAT.compact, location_id: LOC,
    make: 'Audi', model: 'A3 Sportback', year: 2023,
    registration_plate: 'B-RT 2004',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Navarra Blue', mileage: 11600,
    features: ['Bluetooth', 'Virtual Cockpit', 'Apple CarPlay', 'Lane assist', 'Heated seats'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Audi_A3_Sportback_40_TFSI_e_8Y_%28cropped%29.jpg/1280px-Audi_A3_Sportback_40_TFSI_e_8Y_%28cropped%29.jpg'],
  },

  // SUV ─────────────────────────────────────────────────────────────────────
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    category_id: CAT.suv, location_id: LOC,
    make: 'Volkswagen', model: 'Tiguan', year: 2023,
    registration_plate: 'B-RT 3001',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Deep Black', mileage: 22300,
    features: ['Bluetooth', 'Navigation', 'Panoramic roof', 'Heated seats', '4WD'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/2021_Volkswagen_Tiguan_R-Line_2.0_TDI_4MOTION_front_8.3.21.jpg/1280px-2021_Volkswagen_Tiguan_R-Line_2.0_TDI_4MOTION_front_8.3.21.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    category_id: CAT.suv, location_id: LOC,
    make: 'Toyota', model: 'RAV4', year: 2024,
    registration_plate: 'B-RT 3002',
    fuel_type: 'hybrid', transmission: 'automatic', color: 'Pearl White', mileage: 8700,
    features: ['Bluetooth', 'Apple CarPlay', 'Android Auto', 'Adaptive cruise', 'Heated seats'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2019_Toyota_RAV4_%28AXAP54R%29_GXL_2WD_wagon_%282019-11-29%29_01.jpg/1280px-2019_Toyota_RAV4_%28AXAP54R%29_GXL_2WD_wagon_%282019-11-29%29_01.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000025',
    category_id: CAT.suv, location_id: LOC,
    make: 'BMW', model: 'X3', year: 2024,
    registration_plate: 'B-RT 3003',
    fuel_type: 'petrol', transmission: 'automatic', color: 'Black Sapphire', mileage: 7800,
    features: ['Bluetooth', 'Navigation', 'Panoramic sunroof', 'Harman Kardon audio', 'Heated seats', 'AWD'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/BMW_X3_G01_IMG_4098.jpg/1280px-BMW_X3_G01_IMG_4098.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000026',
    category_id: CAT.suv, location_id: LOC,
    make: 'Mercedes-Benz', model: 'GLC 220d', year: 2024,
    registration_plate: 'B-RT 3004',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Polar White', mileage: 9500,
    features: ['Bluetooth', 'MBUX infotainment', 'Apple CarPlay', 'Burmester audio', 'Heated seats', '4MATIC'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Mercedes_GLC_300_W253_IMG_2913.jpg/1280px-Mercedes_GLC_300_W253_IMG_2913.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000027',
    category_id: CAT.suv, location_id: LOC,
    make: 'Audi', model: 'Q5', year: 2023,
    registration_plate: 'B-RT 3005',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Glacier White', mileage: 14200,
    features: ['Bluetooth', 'Virtual Cockpit', 'Matrix LED lights', 'Bang & Olufsen audio', 'Quattro AWD'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Audi_Q5_II_IMG_3614.jpg/1280px-Audi_Q5_II_IMG_3614.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000028',
    category_id: CAT.suv, location_id: LOC,
    make: 'Volvo', model: 'XC60', year: 2024,
    registration_plate: 'B-RT 3006',
    fuel_type: 'hybrid', transmission: 'automatic', color: 'Crystal White', mileage: 6300,
    features: ['Bluetooth', 'Google built-in', 'Pilot Assist', 'Bowers & Wilkins audio', 'Air suspension'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Volvo_XC60_T8_Recharge_Inscription_Expression_%28facelift%2C_dark%29%2C_front_8.8.22.jpg/1280px-Volvo_XC60_T8_Recharge_Inscription_Expression_%28facelift%2C_dark%29%2C_front_8.8.22.jpg'],
  },

  // VAN ─────────────────────────────────────────────────────────────────────
  {
    id: 'e0000000-0000-0000-0000-000000000007',
    category_id: CAT.van, location_id: LOC,
    make: 'Mercedes-Benz', model: 'Sprinter', year: 2022,
    registration_plate: 'B-RT 4001',
    fuel_type: 'diesel', transmission: 'manual', color: 'White', mileage: 45600,
    features: ['Bluetooth', 'Rear camera', 'Loading ramp', 'Bulkhead'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/2018_Mercedes-Benz_Sprinter_%28W907%29_313_CDI_MWB_high-roof_panel_van_%282018-10-26%29_01.jpg/1280px-2018_Mercedes-Benz_Sprinter_%28W907%29_313_CDI_MWB_high-roof_panel_van_%282018-10-26%29_01.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000008',
    category_id: CAT.van, location_id: LOC,
    make: 'Ford', model: 'Transit', year: 2023,
    registration_plate: 'B-RT 4002',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Silver', mileage: 31200,
    features: ['Bluetooth', 'Rear camera', 'Cruise control', 'Tow bar'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/2022_Ford_Transit_cargo_van%2C_front_8.3.22.jpg/1280px-2022_Ford_Transit_cargo_van%2C_front_8.3.22.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000029',
    category_id: CAT.van, location_id: LOC,
    make: 'Volkswagen', model: 'Transporter T6.1', year: 2024,
    registration_plate: 'B-RT 4003',
    fuel_type: 'diesel', transmission: 'manual', color: 'Reflex Silver', mileage: 13800,
    features: ['Bluetooth', 'App-Connect', 'Rear camera', 'Sliding door both sides', 'Long wheelbase'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/VW_T6.1_Transporter_IMG_3285.jpg/1280px-VW_T6.1_Transporter_IMG_3285.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000030',
    category_id: CAT.van, location_id: LOC,
    make: 'Renault', model: 'Trafic', year: 2023,
    registration_plate: 'B-RT 4004',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Arctic White', mileage: 19700,
    features: ['Bluetooth', 'Rear camera', 'Lane departure warning', 'Emergency brake assist'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/2021_Renault_Trafic_%28X82_Phase_III%29_30_L2H1_2.0_dCi_van_%282021-11-05%29_01.jpg/1280px-2021_Renault_Trafic_%28X82_Phase_III%29_30_L2H1_2.0_dCi_van_%282021-11-05%29_01.jpg'],
  },

  // PREMIUM ─────────────────────────────────────────────────────────────────
  {
    id: 'e0000000-0000-0000-0000-000000000031',
    category_id: CAT.premium, location_id: LOC,
    make: 'Mercedes-Benz', model: 'E 300', year: 2024,
    registration_plate: 'B-RT 5001',
    fuel_type: 'petrol', transmission: 'automatic', color: 'Obsidian Black', mileage: 4200,
    features: ['Bluetooth', 'MBUX', 'Burmester 3D audio', 'Massaging seats', 'Ambient lighting', 'Head-up display', 'Night vision'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mercedes-Benz_W214_IMG_3009.jpg/1280px-Mercedes-Benz_W214_IMG_3009.jpg'],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000032',
    category_id: CAT.premium, location_id: LOC,
    make: 'BMW', model: '520d', year: 2024,
    registration_plate: 'B-RT 5002',
    fuel_type: 'diesel', transmission: 'automatic', color: 'Mineral White', mileage: 5900,
    features: ['Bluetooth', 'iDrive 8.5', 'Bowers & Wilkins audio', 'Heated & ventilated seats', 'Gesture control', 'Active suspension'],
    image_urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW_G60_520d_xDrive_front_20230919.jpg/1280px-BMW_G60_520d_xDrive_front_20230919.jpg'],
  },
]

const { error: vErr } = await supabase.from('vehicles').upsert(vehicles)
if (vErr) { console.error('vehicles:', vErr.message); process.exit(1) }
console.log(`✓ ${vehicles.length} vehicles`)

// ── 3. Extras ───────────────────────────────────────────────────────────────
const { error: exErr } = await supabase.from('extras').upsert([
  { name: 'Basic Insurance',     description: 'Third-party liability. Required minimum.',           price_per_day:   0.00, is_one_time_fee: false, exclusive_group: 'insurance', sort_order: 1 },
  { name: 'Full Insurance',      description: 'Zero-excess comprehensive cover.',                   price_per_day:  18.00, is_one_time_fee: false, exclusive_group: 'insurance', sort_order: 2 },
  { name: 'GPS Navigation',      description: 'Portable Garmin satnav, updated maps.',             price_per_day:   8.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 3 },
  { name: 'Baby Seat',           description: 'Rear-facing infant seat.',                          price_per_day:  10.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 4 },
  { name: 'Child Seat',          description: 'Forward-facing child seat.',                        price_per_day:  10.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 5 },
  { name: 'Additional Driver',   description: 'Register a second driver on the booking.',          price_per_day:  15.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 6 },
  { name: 'Fuel Option',         description: 'Return empty — we refuel at market rate.',          price_per_day:  45.00, is_one_time_fee: true,  exclusive_group: null,        sort_order: 7 },
  { name: 'Chauffeur',           description: 'Professional driver for the full duration.',        price_per_day: 120.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 8 },
  { name: 'Wi-Fi Hotspot',       description: 'In-car 4G/LTE hotspot. Unlimited data.',           price_per_day:   5.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 9 },
  { name: 'Ski Rack',            description: 'Roof-mounted ski and snowboard carrier.',           price_per_day:  12.00, is_one_time_fee: false, exclusive_group: null,        sort_order: 10 },
])
if (exErr) { console.error('extras:', exErr.message); process.exit(1) }
console.log('✓ extras')

console.log('\n✅ Demo seed complete — 20 vehicles across 5 categories ready.')
