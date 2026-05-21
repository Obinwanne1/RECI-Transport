'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

const PasswordSchema = z.object({
  new_password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type PasswordForm = z.infer<typeof PasswordSchema>

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'
const labelCls = 'block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5'

export default function SettingsPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
  })

  async function onSubmit(data: PasswordForm) {
    setServerError(null)
    setSuccess(false)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: data.new_password })
    if (error) { setServerError(error.message); return }
    setSuccess(true)
    reset()
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">Manage your account preferences.</p>

      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">Change Password</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelCls}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={inputCls + ' pr-10'}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                {...register('new_password')}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                {showNew ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.new_password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.new_password.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={inputCls + ' pr-10'}
                placeholder="Repeat new password"
                autoComplete="new-password"
                {...register('confirm_password')}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                {showConfirm ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{serverError}</p>
          )}

          {success && (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              Password updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
