import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RECI Transport — Vehicle Rental',
  description: 'Book cars, vans, and trucks with AI-powered service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
