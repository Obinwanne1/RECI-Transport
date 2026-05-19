'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/ui/PasswordInput'

const RegisterSchema = z
  .object({
    first_name: z.string().min(1, 'First name required'),
    last_name: z.string().min(1, 'Last name required'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterForm = z.infer<typeof RegisterSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) })

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { first_name: data.first_name, last_name: data.last_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="w-14 h-14 bg-[#F0FDF4] dark:bg-green-900/30 border-2 border-[#407E3C] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#407E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Check your email</h2>
        <p className="text-sm text-[#6B7280] dark:text-gray-400">
          We sent a confirmation link. Click it to activate your account then sign in.
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
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-1">Create account</h1>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">Join RECI Transport</p>

      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-[#E5E7EB] dark:border-gray-600 rounded-md py-2.5 text-sm font-medium text-[#1A1A1A] dark:text-gray-100 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB] dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-gray-900 px-2 text-[#6B7280] dark:text-gray-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">First name</label>
            <input className="input w-full" {...register('first_name')} />
            {errors.first_name && <p className="mt-1 text-xs text-[#DC2626]">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">Last name</label>
            <input className="input w-full" {...register('last_name')} />
            {errors.last_name && <p className="mt-1 text-xs text-[#DC2626]">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">Email</label>
          <input type="email" autoComplete="email" className="input w-full" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1">Password</label>
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280] dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
