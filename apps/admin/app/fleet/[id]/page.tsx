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

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'
const labelCls = 'block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5'

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  })

  useEffect(() => {
    Promise.all([
      fetch(`/admin/api/admin/vehicles/${params.id}`).then((r) => r.json()),
      fetch('/admin/api/admin/categories-locations').then((r) => r.json()),
    ]).then(([vehicle, catLoc]) => {
      setCategories(catLoc.categories ?? [])
      setLocations(catLoc.locations ?? [])
      const cat = Array.isArray(vehicle.category) ? vehicle.category[0] : vehicle.category
      const loc = Array.isArray(vehicle.location) ? vehicle.location[0] : vehicle.location
      reset({
        make: vehicle.make, model: vehicle.model, year: vehicle.year,
        registration_plate: vehicle.registration_plate,
        category_id: cat?.id ?? vehicle.category_id,
        location_id: loc?.id ?? vehicle.location_id,
        fuel_type: vehicle.fuel_type, transmission: vehicle.transmission,
        color: vehicle.color,
        seats: vehicle.seats ?? undefined,
        mileage: vehicle.mileage ?? undefined,
      })
      setLoading(false)
    })
  }, [params.id, reset])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch(`/admin/api/admin/vehicles/${params.id}`, {
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
    await fetch(`/admin/api/admin/vehicles/${params.id}`, { method: 'DELETE' })
    router.push('/fleet')
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-16 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
        <div className="h-7 w-40 bg-[#F3F4F6] dark:bg-gray-800 rounded" />
        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 mb-5 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight mb-6">Edit Vehicle</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          {(['make', 'model', 'registration_plate', 'color'] as const).map((name) => (
            <div key={name}>
              <label className={labelCls}>{name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
              <input type="text" className={inputCls} {...register(name)} />
              {errors[name] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[name]?.message as string}</p>}
            </div>
          ))}
          <div>
            <label className={labelCls}>Year</label>
            <input type="number" className={inputCls} {...register('year')} />
          </div>
        </div>

        <div className="border-t border-[#F3F4F6] dark:border-gray-800 pt-5 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fuel type</label>
            <select className={inputCls} {...register('fuel_type')}>
              {['petrol','diesel','electric','hybrid'].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Transmission</label>
            <select className={inputCls} {...register('transmission')}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} {...register('category_id')}>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <select className={inputCls} {...register('location_id')}>
              {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          {confirmDeactivate ? (
            <div className="flex gap-2">
              <button type="button" onClick={handleDeactivate} disabled={deactivating} className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {deactivating ? 'Deactivating…' : 'Confirm'}
              </button>
              <button type="button" onClick={() => setConfirmDeactivate(false)} className="px-4 py-2.5 border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400 text-sm font-semibold rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDeactivate(true)} className="px-4 py-2.5 border border-[#E5E7EB] dark:border-gray-700 text-[#DC2626] dark:text-red-400 text-sm font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              Deactivate
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
