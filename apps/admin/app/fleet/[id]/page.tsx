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

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deactivating, setDeactivating] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/vehicles/${params.id}`).then((r) => r.json()),
      fetch('/api/admin/categories-locations').then((r) => r.json()),
    ]).then(([vehicle, catLoc]) => {
      setCategories(catLoc.categories ?? [])
      setLocations(catLoc.locations ?? [])
      const cat = Array.isArray(vehicle.category) ? vehicle.category[0] : vehicle.category
      const loc = Array.isArray(vehicle.location) ? vehicle.location[0] : vehicle.location
      reset({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration_plate: vehicle.registration_plate,
        category_id: cat?.id ?? vehicle.category_id,
        location_id: loc?.id ?? vehicle.location_id,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        color: vehicle.color,
        seats: vehicle.seats ?? undefined,
        mileage: vehicle.mileage ?? undefined,
      })
      setLoading(false)
    })
  }, [params.id, reset])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch(`/api/admin/vehicles/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) { setServerError(result.error ?? 'Failed to update'); return }
    router.push('/fleet')
  }

  async function handleDeactivate() {
    setDeactivating(true)
    await fetch(`/api/admin/vehicles/${params.id}`, { method: 'DELETE' })
    router.push('/fleet')
  }

  if (loading) return <div className="p-6 text-[#6B7280]">Loading…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-4 inline-block">← Back</button>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Edit Vehicle</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-[#E5E7EB] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(['make', 'model', 'registration_plate', 'color'] as const).map((name) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1 capitalize">{name.replace('_', ' ')}</label>
              <input type="text" className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register(name)} />
              {errors[name] && <p className="mt-1 text-xs text-[#DC2626]">{errors[name]?.message as string}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Year</label>
            <input type="number" className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('year')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Fuel type</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('fuel_type')}>
              {['petrol','diesel','electric','hybrid'].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Transmission</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('transmission')}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Category</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('category_id')}>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Location</label>
            <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" {...register('location_id')}>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {serverError && <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">{serverError}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-md text-sm transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={handleDeactivate} disabled={deactivating} className="px-4 py-2.5 border border-[#DC2626] text-[#DC2626] text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-50">
            {deactivating ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </form>
    </div>
  )
}
