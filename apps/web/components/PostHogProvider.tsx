'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Lazy-loads PostHog only when NEXT_PUBLIC_POSTHOG_KEY is set.
// No-op in development or when key is absent — no tracking without consent.
let posthog: { capture: (e: string, p?: Record<string, unknown>) => void } | null = null

async function getPostHog() {
  if (posthog) return posthog
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  const ph = await import('posthog-js')
  ph.default.init(key, {
    api_host: 'https://eu.posthog.com',
    capture_pageview: false, // manual to avoid double-counting
    persistence: 'localStorage',
    autocapture: false,
  })
  posthog = ph.default
  return posthog
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track if user has accepted cookies
    const consent = (() => { try { return localStorage.getItem('reci-cookie-consent') } catch { return null } })()
    if (consent !== 'accepted') return

    getPostHog().then((ph) => {
      ph?.capture('$pageview', { $current_url: window.location.href })
    })
  }, [pathname, searchParams])

  return <>{children}</>
}
