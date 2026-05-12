'use client'

import { create } from 'zustand'
import type { Vehicle, SearchParams } from '@/lib/schemas'

interface VehicleSearchState {
  params: SearchParams
  results: Vehicle[]
  loading: boolean
  error: string | null
  hasSearched: boolean
  setParams: (params: Partial<SearchParams>) => void
  search: (overrideParams?: Partial<SearchParams>) => Promise<void>
  reset: () => void
}

const DEFAULT_PARAMS: SearchParams = {}

export const useVehicleSearch = create<VehicleSearchState>((set, get) => ({
  params: DEFAULT_PARAMS,
  results: [],
  loading: false,
  error: null,
  hasSearched: false,

  setParams: (incoming) => {
    set((state) => ({ params: { ...state.params, ...incoming } }))
  },

  search: async (overrideParams) => {
    const params = { ...get().params, ...overrideParams }
    set({ loading: true, error: null })

    const qs = new URLSearchParams()
    if (params.pickup_date) qs.set('pickup_date', params.pickup_date)
    if (params.dropoff_date) qs.set('dropoff_date', params.dropoff_date)
    if (params.pickup_location_id) qs.set('location_id', params.pickup_location_id)
    if (params.category_slug) qs.set('category_slug', params.category_slug)

    try {
      const res = await fetch(`/api/vehicles?${qs.toString()}`)
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const data: Vehicle[] = await res.json()
      set({ results: data, loading: false, hasSearched: true })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Search failed',
        loading: false,
        hasSearched: true,
      })
    }
  },

  reset: () => set({ params: DEFAULT_PARAMS, results: [], error: null, hasSearched: false }),
}))
