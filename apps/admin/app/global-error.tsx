'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#F9FAFB', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: 64, height: 64, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Admin Error</h1>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>An unexpected error occurred. Our team has been notified.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{ background: '#407E3C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Try again
              </button>
              <a
                href="/dashboard"
                style={{ border: '1px solid #E5E7EB', color: '#1A1A1A', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
