// ─── Enums ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type VehicleTier = 1 | 2 | 3 | 4 | 5

export type DamageSeverity = 'none' | 'minor' | 'major'

export type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash' | 'corporate_invoice'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export type SignalType = 'normal' | 'high' | 'peak'

export type UserRole = 'customer' | 'staff' | 'admin' | 'corporate_manager'

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export type InspectionType = 'pickup' | 'return'

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Location {
  id: string
  name: string
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
  created_at: string
}

export interface VehicleCategory {
  id: string
  name: string
  slug: string
  tier: VehicleTier
  description: string | null
  icon_url: string | null
  passenger_capacity: number
  luggage_capacity: number
  created_at: string
}

export interface Vehicle {
  id: string
  category_id: string
  location_id: string
  make: string
  model: string
  year: number
  registration_plate: string
  fuel_type: FuelType
  transmission: 'manual' | 'automatic'
  color: string
  mileage: number
  is_active: boolean
  image_urls: string[]
  features: string[]
  created_at: string
  updated_at: string
  // Joined
  category?: VehicleCategory
  location?: Location
  daily_rate?: number
}

export interface Extra {
  id: string
  name: string
  description: string | null
  price_per_day: number
  is_one_time_fee: boolean
  exclusive_group: string | null
  is_active: boolean
  sort_order: number
}

export interface PricingRule {
  id: string
  category_id: string
  location_id: string | null
  base_rate_per_day: number
  min_days: number
  weekly_discount_pct: number
  monthly_discount_pct: number
  effective_from: string
  effective_to: string | null
}

export interface PricingOverride {
  id: string
  category_id: string | null
  location_id: string | null
  name: string
  surcharge_pct: number
  flat_surcharge: number
  start_date: string
  end_date: string
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string
  booking_ref: string
  user_id: string | null
  vehicle_id: string
  status: BookingStatus
  pickup_datetime: string
  dropoff_datetime: string
  pickup_location_id: string
  dropoff_location_id: string
  driver_first_name: string
  driver_last_name: string
  driver_email: string
  driver_phone: string
  driver_licence_number: string | null
  base_price: number
  extras_price: number
  total_price: number
  corporate_account_id: string | null
  ai_policy_decision: AIPolicyDecision | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  vehicle?: Vehicle
  extras?: BookingExtra[]
  payments?: Payment[]
}

export interface BookingExtra {
  id: string
  booking_id: string
  extra_id: string
  quantity: number
  price_snapshot: number
  extra?: Extra
}

export interface AvailabilityBlock {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  reason: string | null
  created_by: string | null
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  paid_at: string | null
  created_at: string
}

// ─── Corporate ────────────────────────────────────────────────────────────────

export interface CorporateAccount {
  id: string
  company_name: string
  company_registration: string | null
  vat_number: string | null
  billing_address: string
  billing_email: string
  discount_pct: number
  credit_limit: number
  payment_terms_days: number
  travel_policy: string | null
  is_active: boolean
  created_at: string
}

export interface CorporatePricing {
  id: string
  corporate_account_id: string
  category_id: string
  rate_per_day: number
  effective_from: string
  effective_to: string | null
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: UserRole
  corporate_account_id: string | null
  licence_verified: boolean
  password_reset_required: boolean
  created_at: string
  updated_at: string
}

// ─── AI Features ─────────────────────────────────────────────────────────────

export interface VehicleInspection {
  id: string
  booking_id: string
  inspection_type: InspectionType
  photo_urls: string[]
  ai_damage_report: DamageReport | null
  inspector_notes: string | null
  created_at: string
}

export interface DamageReport {
  new_damage: boolean
  severity: DamageSeverity
  locations: string[]
  confidence: number
  description: string
}

export interface LicenceVerification {
  id: string
  user_id: string
  extracted_data: LicenceExtractedData | null
  confidence: number
  status: VerificationStatus
  verified_at: string | null
  created_at: string
}

export interface LicenceExtractedData {
  name: string
  licence_number: string
  expiry: string
  categories: string[]
  country: string
}

export interface AIPolicyDecision {
  approved: boolean
  reason: string
  flags: string[]
  checked_at: string
}

export interface AIConversation {
  id: string
  user_id: string | null
  session_id: string
  messages: ConversationMessage[]
  resolved_params: SearchParams | null
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchParams {
  pickup_location_id?: string
  pickup_date?: string
  dropoff_date?: string
  category_slug?: string
  passenger_capacity?: number
  fuel_type?: FuelType
  transmission?: 'manual' | 'automatic'
}

export interface ConversationalSearchResponse {
  params: SearchParams
  message: string
  confidence: number
}

// ─── Pricing Utils ────────────────────────────────────────────────────────────

export interface PricingInput {
  base_rate_per_day: number
  pickup_datetime: string
  dropoff_datetime: string
  extras: Array<{ price_per_day: number; is_one_time_fee: boolean; quantity: number }>
  override_surcharge_pct?: number
  corporate_discount_pct?: number
}

export interface PricingBreakdown {
  days: number
  base_subtotal: number
  extras_subtotal: number
  discount_amount: number
  surcharge_amount: number
  total: number
}
