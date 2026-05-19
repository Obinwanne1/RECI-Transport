'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/ui/PasswordInput'

const Schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof Schema>

function ResetPasswordContent() {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(Schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="card text-center">
        <div className="w-14 h-14 bg-[#F0FDF4] dark:bg-green-900/30 border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Password updated</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400">
          Your password has been changed. Sign in with your new credentials.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-6 btn-primary px-6 py-2 text-sm"
        >
          Go to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-1">Set new password</h1>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">New password</label>
          <PasswordInput autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">Confirm password</label>
          <PasswordInput autoComplete="new-password" {...register('confirm_password')} />
          {errors.confirm_password && <p className="mt-1 text-xs text-[#DC2626]">{errors.confirm_password.message}</p>}
        </div>

        {serverError && (
          <p className="text-sm text-[#DC2626] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-gray-400">
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
