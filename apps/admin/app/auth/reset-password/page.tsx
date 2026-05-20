'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import PasswordInput from '@/components/ui/PasswordInput'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const required = searchParams.get('required') === 'true'

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    if (required) {
      // Already logged in with temp password — no PASSWORD_RECOVERY event needed
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
      })
      return
    }

    // Standard email-reset link flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [required])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError(null)

    const supabase = createBrowserSupabaseClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Clear the forced-reset flag server-side
    if (required) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch(`/admin/api/admin/users/${user.id}/clear-reset`, { method: 'POST' })
      }
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[#F9FAFB] dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#407E3C] rounded-xl mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100">
            {required ? 'Set your permanent password' : 'Set new password'}
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
            {required
              ? 'Your temporary password must be changed before continuing.'
              : 'Choose a strong password for your account'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 shadow-sm">
          {success ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Password updated</p>
              <p className="text-xs text-[#6B7280] dark:text-gray-400">Redirecting to dashboard…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-8 h-8 border-2 border-[#407E3C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#6B7280] dark:text-gray-400">Verifying reset link…</p>
              {!required && (
                <p className="text-xs text-[#9CA3AF] dark:text-gray-500">
                  If this takes too long, the link may have expired.{' '}
                  <a href="/auth/forgot-password" className="text-[#407E3C] hover:underline">Request a new one</a>.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                  New password
                </label>
                <PasswordInput
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                  Confirm password
                </label>
                <PasswordInput
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
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
