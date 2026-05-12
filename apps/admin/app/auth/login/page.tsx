'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

const LoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type LoginForm = z.infer<typeof LoginSchema>

function LoginContent() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const unauthorized = searchParams?.get('error') === 'unauthorized'

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setServerError(null)
    const supabase = createBrowserSupabaseClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#407E3C] rounded-lg mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">RECI Admin</h1>
          <p className="text-sm text-[#6B7280] mt-1">Staff access only</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          {unauthorized && (
            <p className="mb-4 text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">
              Access denied. Admin or staff role required.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
