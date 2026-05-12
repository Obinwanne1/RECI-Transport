'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const Schema = z.object({
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().int().min(2000).max(2030),
  registration_plate: z.string().min(1, 'Required'),
  category_id: z.string().uuid('Required'),
  location_id: z.string().uuid('Required'),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic']),
  color: z.string().min(1, 'Required'),
  seats: z.coerce.number().int().min(1).max(20).optional(),
  mileage: z.coerce.number().int().min(0).optional(),
})
type FormData = z.infer<typeof Schema>

export default function NewVehiclePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/vehicles').then(() => {})
    // Load categories + locations from existing vehicles data or create separate endpoints
    // Using direct admin routes here
    Promise.all([
      fetch('/api/admin/pricing-rules').then((r) => r.json()),
    ])
  }, [])

  // Load categories from Supabase via existing endpoint
  useEffect(() => {
    fetch('/api/admin/categories-locations')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setCategories(d.categories ?? [])
          setLocations(d.locations ?? [])
        }
      })
      .catch(() => {})
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { fuel_type: 'petrol', transmission: 'automatic' },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/admin/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      setServerError(result.error ?? 'Failed to create vehicle')
      return
    }
    router.push('/fleet')
  }

  const field = (label: string, name: keyof FormData, type = 'text', extra?: object) => (
    <div>
      <label className="block text-sm font-medium text-[#1A1A1A] mb-1">{label}</label>
      <input
        type={type}
        className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
        {...register(name, extra)}
      />
      {errors[name] && <p className="mt-1 text-xs text-[#DC2626]">{errors[name]?.message as string}</p>}
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-4 inline-block">← Back</button>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Add Vehicle</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-[#E5E7EB] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('Make', 'make')}
          {field('Model', 'model')}
          {field('Year', 'year', 'number')}
          {field('Registration plate', 'registration_plate')}
          {field('Color', 'color')}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Fuel type</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('fuel_type')}>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Transmission</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('transmission')}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Category ID</label>
            {categories.length > 0 ? (
              <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('category_id')}>
                <option value="">Select…</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Paste category UUID"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
                {...register('category_id')}
              />
            )}
            {errors.category_id && <p className="mt-1 text-xs text-[#DC2626]">{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Location ID</label>
            {locations.length > 0 ? (
              <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('location_id')}>
                <option value="">Select…</option>
                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Paste location UUID"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
                {...register('location_id')}
              />
            )}
            {errors.location_id && <p className="mt-1 text-xs text-[#DC2626]">{errors.location_id.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Seats', 'seats', 'number')}
          {field('Mileage (km)', 'mileage', 'number')}
        </div>

        {serverError && <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create vehicle'}
        </button>
      </form>
    </div>
  )
}
