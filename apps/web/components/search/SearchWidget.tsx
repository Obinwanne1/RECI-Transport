'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useVehicleSearch } from '@/hooks/useVehicleSearch'

const BERLIN_HQ_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

const FormSchema = z
  .object({
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

const inputCls = "w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-shadow bg-white"
const labelCls = "block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5"

export default function SearchWidget({ initialValues, onSearch }: SearchWidgetProps) {
  const { search, setParams } = useVehicleSearch()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pickup_date: initialValues?.pickup_date ?? '',
      dropoff_date: initialValues?.dropoff_date ?? '',
      category_slug: initialValues?.category_slug ?? '',
    },
  })

  useEffect(() => {
    if (initialValues) {
      reset({
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div>
          <label className={labelCls}>
            <span className="mr-1">📍</span>Pick-up Location
          </label>
          <input
            type="text"
            value="Berlin HQ"
            readOnly
            className={`${inputCls} bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed`}
          />
        </div>

        {/* Pick-up */}
        <div>
          <label className={labelCls}>
            <span className="mr-1">📅</span>Pick-up Date
          </label>
          <input type="date" min={today} {...register('pickup_date')} className={inputCls} />
          {errors.pickup_date && <p className="text-[#DC2626] text-xs mt-1">{errors.pickup_date.message}</p>}
        </div>

        {/* Drop-off */}
        <div>
          <label className={labelCls}>
            <span className="mr-1">📅</span>Drop-off Date
          </label>
          <input type="date" min={today} {...register('dropoff_date')} className={inputCls} />
          {errors.dropoff_date && <p className="text-[#DC2626] text-xs mt-1">{errors.dropoff_date.message}</p>}
        </div>

        {/* Category + Search */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className={labelCls}>
              <span className="mr-1">🚗</span>Vehicle Type
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
