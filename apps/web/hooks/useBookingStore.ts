'use client'

import { create } from 'zustand'
import type { Vehicle } from '@/lib/schemas'
import type { PricingBreakdown } from '@reci/types'

export interface SelectedExtra {
  extra_id: string
  name: string
  price_per_day: number
  is_one_time_fee: boolean
  quantity: number
  price_snapshot: number
  exclusive_group: string | null
}

export interface DriverDetails {
  first_name: string
  last_name: string
  email: string
  phone: string
  licence_number?: string
}

interface BookingState {
  // Vehicle + dates
  vehicle: Vehicle | null
  vehicleId: string | null
  pickupDate: string | null
  dropoffDate: string | null
  pickupLocationId: string
  dropoffLocationId: string

  // Extras
  selectedExtras: SelectedExtra[]

  // Driver
  driverDetails: DriverDetails | null

  // Result (set after POST /api/bookings)
  bookingId: string | null
  bookingRef: string | null

  // Pricing
  pricing: PricingBreakdown | null

  // Step
  step: 1 | 2 | 3 | 4 | 5

  // Actions
  setVehicle: (vehicle: Vehicle) => void
  setDates: (pickup: string, dropoff: string) => void
  setDropoffLocationId: (id: string) => void
  setPricing: (pricing: PricingBreakdown) => void
  toggleExtra: (extra: SelectedExtra) => void
  clearExtraGroup: (group: string) => void
  setDriverDetails: (details: DriverDetails) => void
  setBookingResult: (id: string, ref: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

const BERLIN_HQ_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export const useBookingStore = create<BookingState>((set, get) => ({
  vehicle: null,
  vehicleId: null,
  pickupDate: null,
  dropoffDate: null,
  pickupLocationId: BERLIN_HQ_ID,
  dropoffLocationId: BERLIN_HQ_ID,
  selectedExtras: [],
  driverDetails: null,
  bookingId: null,
  bookingRef: null,
  pricing: null,
  step: 1,

  setVehicle: (vehicle) => set({ vehicle, vehicleId: vehicle.id }),

  setDates: (pickup, dropoff) => set({ pickupDate: pickup, dropoffDate: dropoff }),

  setDropoffLocationId: (id) => set({ dropoffLocationId: id }),

  setPricing: (pricing) => set({ pricing }),

  toggleExtra: (incoming) => {
    const { selectedExtras } = get()
    const exists = selectedExtras.find((e) => e.extra_id === incoming.extra_id)

    if (exists) {
      // Remove it
      set({ selectedExtras: selectedExtras.filter((e) => e.extra_id !== incoming.extra_id) })
    } else {
      // If exclusive_group, remove others in that group first
      const filtered = incoming.exclusive_group
        ? selectedExtras.filter((e) => e.exclusive_group !== incoming.exclusive_group)
        : selectedExtras
      set({ selectedExtras: [...filtered, incoming] })
    }
  },

  clearExtraGroup: (group) => {
    set((state) => ({
      selectedExtras: state.selectedExtras.filter((e) => e.exclusive_group !== group),
    }))
  },

  setDriverDetails: (details) => set({ driverDetails: details }),

  setBookingResult: (id, ref) => set({ bookingId: id, bookingRef: ref }),

  nextStep: () => {
    const { step } = get()
    if (step < 5) set({ step: (step + 1) as BookingState['step'] })
  },

  prevStep: () => {
    const { step } = get()
    if (step > 1) set({ step: (step - 1) as BookingState['step'] })
  },

  reset: () =>
    set({
      vehicle: null,
      vehicleId: null,
      pickupDate: null,
      dropoffDate: null,
      selectedExtras: [],
      driverDetails: null,
      bookingId: null,
      bookingRef: null,
      pricing: null,
      step: 1,
    }),
}))
