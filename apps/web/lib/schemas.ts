import { z } from 'zod'

export const VehicleCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  tier: z.union([z.literal('1'), z.literal('2'), z.literal('3'), z.literal('4'), z.literal('5')]),
  description: z.string().nullable(),
  passenger_capacity: z.number(),
  luggage_capacity: z.number(),
})

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  location_id: z.string().uuid(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  registration_plate: z.string(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic']),
  color: z.string(),
  mileage: z.number(),
  is_active: z.boolean(),
  image_urls: z.array(z.string()),
  features: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
  // Joined
  category: VehicleCategorySchema.optional(),
  daily_rate: z.number().optional(),
})

export const SearchParamsSchema = z.object({
  pickup_location_id: z.string().uuid().optional(),
  pickup_date: z.string().optional(), // ISO date string
  dropoff_date: z.string().optional(),
  category_slug: z.string().optional(),
  passenger_capacity: z.number().int().positive().optional(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
})

export const ConversationalSearchResponseSchema = z.object({
  params: SearchParamsSchema,
  message: z.string(),
  confidence: z.number().min(0).max(1),
})

export const AvailabilityBlockSchema = z.object({
  start: z.string(),
  end: z.string(),
})

export const ExtraSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price_per_day: z.number(),
  is_one_time_fee: z.boolean(),
  exclusive_group: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
})

export const DriverDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(6, 'Phone number required'),
  licence_number: z.string().optional(),
})

export const CreateBookingSchema = z.object({
  vehicle_id: z.string().uuid(),
  pickup_datetime: z.string(),
  dropoff_datetime: z.string(),
  pickup_location_id: z.string().uuid(),
  dropoff_location_id: z.string().uuid(),
  driver_first_name: z.string().min(1),
  driver_last_name: z.string().min(1),
  driver_email: z.string().email(),
  driver_phone: z.string().min(6),
  driver_licence_number: z.string().optional(),
  extras: z.array(
    z.object({
      extra_id: z.string().uuid(),
      quantity: z.number().int().positive(),
      price_snapshot: z.number(),
    })
  ),
})

export const PricingSignalSchema = z.object({
  signal: z.enum(['normal', 'high', 'peak']),
  surcharge_pct: z.number(),
  message: z.string().nullable(),
  vehicles_remaining: z.number().optional(),
})

export type Vehicle = z.infer<typeof VehicleSchema>
export type VehicleCategory = z.infer<typeof VehicleCategorySchema>
export type SearchParams = z.infer<typeof SearchParamsSchema>
export type ConversationalSearchResponse = z.infer<typeof ConversationalSearchResponseSchema>
export type AvailabilityBlock = z.infer<typeof AvailabilityBlockSchema>
export type Extra = z.infer<typeof ExtraSchema>
export type DriverDetails = z.infer<typeof DriverDetailsSchema>
export type CreateBooking = z.infer<typeof CreateBookingSchema>
export type PricingSignal = z.infer<typeof PricingSignalSchema>

// ─── Phase 3: Payment + Confirmation ─────────────────────────────────────────

export const CreatePaymentIntentSchema = z.object({
  booking_id: z.string().uuid(),
})

export const PaymentIntentResponseSchema = z.object({
  client_secret: z.string(),
  amount: z.number(),
  currency: z.string(),
})

export const BookingConfirmationSchema = z.object({
  id: z.string().uuid(),
  booking_ref: z.string(),
  status: z.string(),
  driver_first_name: z.string(),
  driver_last_name: z.string(),
  driver_email: z.string(),
  pickup_datetime: z.string(),
  dropoff_datetime: z.string(),
  total_price: z.number(),
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
    category: z.object({ name: z.string() }).optional(),
  }),
  extras: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      price_snapshot: z.number(),
    })
  ),
})

export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>
export type BookingConfirmation = z.infer<typeof BookingConfirmationSchema>

// ─── Phase 8: AI Layer ────────────────────────────────────────────────────────

// Führerschein OCR
export const LicenceOCRResponseSchema = z.object({
  name: z.string().nullable(),
  licence_number: z.string().nullable(),
  expiry_date: z.string().nullable(),
  categories: z.array(z.string()),
  issuing_country: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  name_match: z.boolean(),
})

// Trip Co-pilot
export const TripCopilotRequestSchema = z.object({
  booking_id: z.string().uuid(),
  pickup_location: z.string(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  pickup_date: z.string(),
  dropoff_date: z.string(),
  vehicle_name: z.string(),
})

export const TripCopilotResponseSchema = z.object({
  route_summary: z.string(),
  estimated_fuel_cost_eur: z.number().nullable(),
  top_stops: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
  parking_tips: z.string(),
  fuel_note: z.string().nullable(),
  co2_kg_estimate: z.number().nullable().optional(),
  eco_rating: z.enum(['green', 'moderate', 'high']).nullable().optional(),
  eco_tip: z.string().nullable().optional(),
})

// AI Damage Detection
export const DamageDetectionRequestSchema = z.object({
  booking_id: z.string().uuid(),
  inspection_type: z.enum(['pickup', 'return']),
  photo_urls: z.array(z.string().url()).min(1).max(8),
  baseline_photo_urls: z.array(z.string().url()).optional(),
})

export const DamageReportSchema = z.object({
  new_damage: z.boolean(),
  severity: z.enum(['none', 'minor', 'major']),
  locations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  needs_human_review: z.boolean().optional(),
})

export type LicenceOCRResponse = z.infer<typeof LicenceOCRResponseSchema>
export type TripCopilotRequest = z.infer<typeof TripCopilotRequestSchema>
export type TripCopilotResponse = z.infer<typeof TripCopilotResponseSchema>
export type DamageDetectionRequest = z.infer<typeof DamageDetectionRequestSchema>
export type DamageReport = z.infer<typeof DamageReportSchema>
