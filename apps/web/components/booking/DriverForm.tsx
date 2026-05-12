'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DriverDetailsSchema, type DriverDetails } from '@/lib/schemas'

interface DriverFormProps {
  defaultValues?: Partial<DriverDetails>
  onSubmit: (data: DriverDetails) => void
  loading?: boolean
}

export default function DriverForm({ defaultValues, onSubmit, loading }: DriverFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverDetails>({
    resolver: zodResolver(DriverDetailsSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">First Name</label>
          <input {...register('first_name')} className="input-field" placeholder="Anna" />
          {errors.first_name && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Last Name</label>
          <input {...register('last_name')} className="input-field" placeholder="Müller" />
          {errors.last_name && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          className="input-field"
          placeholder="anna@example.com"
        />
        {errors.email && (
          <p className="text-[#DC2626] text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone</label>
        <input
          {...register('phone')}
          type="tel"
          className="input-field"
          placeholder="+49 30 1234567"
        />
        {errors.phone && (
          <p className="text-[#DC2626] text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
          Driving Licence Number{' '}
          <span className="text-[#6B7280] font-normal">(optional)</span>
        </label>
        <input
          {...register('licence_number')}
          className="input-field"
          placeholder="B123456789"
        />
        <p className="text-xs text-[#6B7280] mt-1">
          Required at vehicle pick-up. AI verification available in Phase 8.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating booking…
          </>
        ) : (
          'Continue to Payment'
        )}
      </button>
    </form>
  )
}
