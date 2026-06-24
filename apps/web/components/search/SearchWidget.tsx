'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useVehicleSearch } from '@/hooks/useVehicleSearch'

interface Location { id: string; name: string; city: string }

const FormSchema = z
  .object({
    pickup_location_id: z.string().min(1, 'Required'),
    pickup_date: z.string().min(1, 'Required'),
    dropoff_date: z.string().min(1, 'Required'),
    category_slug: z.string().optional(),
  })
  .refine((d) => !d.dropoff_date || d.dropoff_date > d.pickup_date, {
    message: 'Drop-off must be after pick-up',
    path: ['dropoff_date'],
  })

type FormValues = z.infer<typeof FormSchema>

interface SearchWidgetProps {
  initialValues?: { pickup_date?: string | null; dropoff_date?: string | null; category_slug?: string | null }
  onSearch?: () => void
}

const inputCls = "w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-shadow bg-white dark:bg-gray-800"
const labelCls = "block text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wide mb-1.5"

export default function SearchWidget({ initialValues, onSearch }: SearchWidgetProps) {
  const { search, setParams } = useVehicleSearch()
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pickup_location_id: 'a1b2c3d4-0000-0000-0000-000000000001',
      pickup_date: initialValues?.pickup_date ?? '',
      dropoff_date: initialValues?.dropoff_date ?? '',
      category_slug: initialValues?.category_slug ?? '',
    },
  })

  useEffect(() => {
    if (initialValues) {
      reset({
        pickup_location_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        pickup_date: initialValues.pickup_date ?? '',
        dropoff_date: initialValues.dropoff_date ?? '',
        category_slug: initialValues.category_slug ?? '',
      })
    }
  }, [initialValues, reset])

  const onSubmit = (values: FormValues) => {
    setParams({
      pickup_date: values.pickup_date,
      dropoff_date: values.dropoff_date,
      category_slug: values.category_slug || undefined,
      pickup_location_id: values.pickup_location_id,
    })
    search({
      pickup_date: values.pickup_date,
      dropoff_date: values.dropoff_date,
      category_slug: values.category_slug || undefined,
      pickup_location_id: values.pickup_location_id,
    })
    onSearch?.()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div>
          <label className={labelCls}>
            <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
            </svg>
            Pick-up Location
          </label>
          <select {...register('pickup_location_id')} className={inputCls}>
            {locations.length === 0 && (
              <option value="a1b2c3d4-0000-0000-0000-000000000001">Berlin HQ</option>
            )}
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.city}</option>
            ))}
          </select>
          {errors.pickup_location_id && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.pickup_location_id.message}</p>
          )}
        </div>

        {/* Pick-up */}
        <div>
          <label className={labelCls}>
            <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Pick-up Date
          </label>
          <input type="date" min={today} {...register('pickup_date')} className={inputCls} />
          {errors.pickup_date && <p className="text-[#DC2626] text-xs mt-1">{errors.pickup_date.message}</p>}
        </div>

        {/* Drop-off */}
        <div>
          <label className={labelCls}>
            <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Drop-off Date
          </label>
          <input type="date" min={today} {...register('dropoff_date')} className={inputCls} />
          {errors.dropoff_date && <p className="text-[#DC2626] text-xs mt-1">{errors.dropoff_date.message}</p>}
        </div>

        {/* Category + Search */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className={labelCls}>
              <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                <path d="M5 17H3v-4l2.5-5h11L19 13v4h-2M9 17h6M6 9h12"/>
              </svg>
              Vehicle Type
            </label>
            <select {...register('category_slug')} className={inputCls}>
              <option value="">Any type</option>
              <option value="economy">Economy</option>
              <option value="compact">Compact</option>
              <option value="suv">SUV</option>
              <option value="van">Van</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex-shrink-0 bg-[#407E3C] hover:bg-[#356834] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  )
}
