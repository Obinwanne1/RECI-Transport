'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const Schema = z.object({
  email: z.string().email('Valid email required'),
})
type FormData = z.infer<typeof Schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
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

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="card text-center">
        <div className="w-14 h-14 bg-[#F0FDF4] dark:bg-green-900/30 border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Check your email</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400">
          If that address is registered, we sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block btn-primary px-6 py-2 text-sm"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-1">Forgot password?</h1>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="input w-full"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>}
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
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-gray-400">
        Remember it?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
