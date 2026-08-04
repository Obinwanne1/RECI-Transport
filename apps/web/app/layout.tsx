import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Poppins } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/CookieBanner'
import { PostHogProvider } from '@/components/PostHogProvider'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://localhost')
  ? 'https://web-lilac-nine-19.vercel.app'
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-lilac-nine-19.vercel.app')

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RECI Transport — AI-Powered Vehicle Rental in Berlin',
    template: '%s — RECI Transport',
  },
  description: 'Book cars, vans, and trucks in Berlin with AI-powered search. Instant confirmation, flexible extras, corporate accounts available.',
  keywords: ['car rental Berlin', 'vehicle hire Berlin', 'AI car rental', 'van rental Berlin', 'truck hire Berlin'],
  authors: [{ name: 'RECI Transport GmbH' }],
  openGraph: {
    type: 'website',
    locale: 'en_DE',
    url: BASE_URL,
    siteName: 'RECI Transport',
    title: 'RECI Transport — AI-Powered Vehicle Rental in Berlin',
    description: 'Book cars, vans, and trucks in Berlin with AI-powered search. Instant confirmation, flexible extras, corporate accounts available.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'RECI Transport — AI-Powered Vehicle Rental in Berlin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RECI Transport — AI-Powered Vehicle Rental in Berlin',
    description: 'Book vehicles in Berlin with AI-powered search.',
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('reci-theme') ||
              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            if (t === 'dark') document.documentElement.classList.add('dark');
          } catch(e) {}
        ` }} />
      </head>
      <body
        className="bg-[#F9FAFB] dark:bg-gray-950 transition-colors duration-150"
        style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
      >
        <ThemeProvider>
          <Suspense fallback={null}>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </Suspense>
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
