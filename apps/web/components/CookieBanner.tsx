'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'reci-cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true)
    } catch {
      // Private browsing — show banner
      setVisible(true)
    }
  }, [])

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, 'accepted') } catch { /* noop */ }
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem(COOKIE_KEY, 'declined') } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-[#374151] dark:text-gray-300">
          We use strictly necessary cookies to keep you logged in and process your bookings. We do not use advertising or tracking cookies.{' '}
          <Link href="/privacy" className="text-[#407E3C] hover:underline font-medium">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-[#6B7280] dark:text-gray-400 hover:text-[#374151] dark:hover:text-gray-200 border border-[#E5E7EB] dark:border-gray-600 rounded-lg transition-colors"
          >
            Decline optional
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-semibold bg-[#407E3C] hover:bg-[#356834] text-white rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
