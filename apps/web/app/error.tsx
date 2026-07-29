'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Something went wrong</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">An unexpected error occurred. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Try again
          </button>
          <Link href="/" className="border border-[#E5E7EB] dark:border-gray-700 text-[#1A1A1A] dark:text-gray-100 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
