'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useVehicleSearch } from '@/hooks/useVehicleSearch'

// Berlin HQ location ID from seed
const BERLIN_HQ_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

const FormSchema = z
  .object({
    pickup_date: z.string().min(1, 'Pick-up date required'),
    dropoff_date: z.string().min(1, 'Drop-off date required'),
    category_slug: z.string().optional(),
  })
  .refine((d) => !d.dropoff_date || d.dropoff_date > d.pickup_date, {
    message: 'Drop-off must be after pick-up',
    path: ['dropoff_date'],
  })

type FormValues = z.infer<typeof FormSchema>

interface SearchWidgetProps {
  initialValues?: {
    pickup_date?: string
    dropoff_date?: string
    category_slug?: string
  }
  onSearch?: () => void
}

export default function SearchWidget({ initialValues, onSearch }: SearchWidgetProps) {
  const { search, setParams } = useVehicleSearch()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues ?? {},
  })

  // Re-populate when AI pre-fills
  useEffect(() => {
    if (initialValues) reset(initialValues)
  }, [initialValues, reset])

  const onSubmit = (values: FormValues) => {
    setParams({
      pickup_date: values.pickup_date,
      dropoff_date: values.dropoff_date,
      category_slug: values.category_slug || undefined,
      pickup_location_id: BERLIN_HQ_ID,
    })
    search({
      pickup_date: values.pickup_date,
      dropoff_date: values.dropoff_date,
      category_slug: values.category_slug || undefined,
      pickup_location_id: BERLIN_HQ_ID,
    })
    onSearch?.()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-card border border-[#E5E7EB] shadow-card p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Location (locked to Berlin HQ for now) */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Pick-up Location</label>
          <input
            type="text"
            value="Berlin HQ"
            readOnly
            className="input-field bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
          />
        </div>

        {/* Pick-up date */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Pick-up Date</label>
          <input
            type="date"
            min={today}
            {...register('pickup_date')}
            className="input-field"
          />
          {errors.pickup_date && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.pickup_date.message}</p>
          )}
        </div>

        {/* Drop-off date */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Drop-off Date</label>
          <input
            type="date"
            min={today}
            {...register('dropoff_date')}
            className="input-field"
          />
          {errors.dropoff_date && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.dropoff_date.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Vehicle Type</label>
          <select {...register('category_slug')} className="input-field">
            <option value="">Any type</option>
            <option value="economy">Economy</option>
            <option value="compact">Compact</option>
            <option value="suv">SUV</option>
            <option value="van">Van</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button type="submit" className="btn-primary w-full sm:w-auto px-8">
          Search Vehicles
        </button>
      </div>
    </form>
  )
}
