'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-[#DC2626] font-medium mb-2">Failed to load account data</p>
      <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">Please try again or contact support.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          Retry
        </button>
        <Link href="/" className="border border-[#E5E7EB] dark:border-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-gray-100">
          Go home
        </Link>
      </div>
    </div>
  )
}
