'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserSupabaseClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[#F9FAFB] dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#407E3C] rounded-xl mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100">Reset password</h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
            {sent ? "Check your email" : "We'll send a reset link to your email"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Email sent to</p>
                <p className="text-sm text-[#6B7280] dark:text-gray-400 font-mono mt-0.5">{email}</p>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-gray-500 leading-relaxed">
                Click the link in the email to set a new password. If it doesn&apos;t arrive within a few minutes, check your spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] dark:text-gray-200 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#407E3C] hover:bg-[#356834] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-sm text-[#6B7280] dark:text-gray-400">
          <Link href="/auth/login" className="text-[#407E3C] hover:text-[#356834] font-medium transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
