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

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'
const labelCls = 'block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5'

export default function NewVehiclePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/admin/api/admin/categories-locations')
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
    const res = await fetch('/admin/api/admin/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) { setServerError(result.error ?? 'Failed to create vehicle'); return }
    router.push('/fleet')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-gray-100 mb-5 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight mb-6">Add Vehicle</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-4">Basic Info</p>
          <div className="grid grid-cols-2 gap-4">
            {(['make', 'model', 'color'] as const).map((name) => (
              <div key={name}>
                <label className={labelCls}>{name.charAt(0).toUpperCase() + name.slice(1)}</label>
                <input type="text" className={inputCls} {...register(name)} />
                {errors[name] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[name]?.message as string}</p>}
              </div>
            ))}
            <div>
              <label className={labelCls}>Year</label>
              <input type="number" className={inputCls} {...register('year')} />
              {errors.year && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.year.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Registration Plate</label>
              <input type="text" className={inputCls} {...register('registration_plate')} />
              {errors.registration_plate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.registration_plate.message}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-[#F3F4F6] dark:border-gray-800 pt-5">
          <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-4">Specs</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fuel type</label>
              <select className={inputCls} {...register('fuel_type')}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
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
              <label className={labelCls}>Seats</label>
              <input type="number" className={inputCls} {...register('seats')} />
            </div>
            <div>
              <label className={labelCls}>Mileage (km)</label>
              <input type="number" className={inputCls} {...register('mileage')} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#F3F4F6] dark:border-gray-800 pt-5">
          <p className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-widest mb-4">Assignment</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              {categories.length > 0 ? (
                <select className={inputCls} {...register('category_id')}>
                  <option value="">Select…</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Paste category UUID" className={inputCls} {...register('category_id')} />
              )}
              {errors.category_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Location</label>
              {locations.length > 0 ? (
                <select className={inputCls} {...register('location_id')}>
                  <option value="">Select…</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Paste location UUID" className={inputCls} {...register('location_id')} />
              )}
              {errors.location_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.location_id.message}</p>}
            </div>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Creating…' : 'Create vehicle'}
        </button>
      </form>
    </div>
  )
}
