import { create } from 'zustand'

export interface ExtraSelection {
  extra_id: string
  quantity: number
  price_snapshot: number
}

interface DriverFields {
  driverFirstName: string
  driverLastName: string
  driverEmail: string
  driverPhone: string
  driverLicenceNumber: string
}

interface BookingState {
  vehicleId: string | null
  pickupDate: string | null
  dropoffDate: string | null
  pickupLocationId: string | null
  extras: ExtraSelection[]
  driverFirstName: string
  driverLastName: string
  driverEmail: string
  driverPhone: string
  driverLicenceNumber: string
  bookingId: string | null
  bookingRef: string | null
  totalPrice: number | null

  setVehicle: (id: string) => void
  setDates: (pickup: string, dropoff: string, locationId: string) => void
  setExtras: (extras: ExtraSelection[]) => void
  setDriver: (fields: DriverFields) => void
  setBookingResult: (id: string, ref: string, total: number) => void
  reset: () => void
}

const initialState = {
  vehicleId: null,
  pickupDate: null,
  dropoffDate: null,
  pickupLocationId: null,
  extras: [],
  driverFirstName: '',
  driverLastName: '',
  driverEmail: '',
  driverPhone: '',
  driverLicenceNumber: '',
  bookingId: null,
  bookingRef: null,
  totalPrice: null,
}

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setVehicle: (id) => set({ vehicleId: id }),

  setDates: (pickup, dropoff, locationId) =>
    set({ pickupDate: pickup, dropoffDate: dropoff, pickupLocationId: locationId }),

  setExtras: (extras) => set({ extras }),

  setDriver: (fields) =>
    set({
      driverFirstName: fields.driverFirstName,
      driverLastName: fields.driverLastName,
      driverEmail: fields.driverEmail,
      driverPhone: fields.driverPhone,
      driverLicenceNumber: fields.driverLicenceNumber,
    }),

  setBookingResult: (id, ref, total) =>
    set({ bookingId: id, bookingRef: ref, totalPrice: total }),

  reset: () => set(initialState),
}))
