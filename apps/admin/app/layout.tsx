import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'RECI Admin',
  description: 'RECI Transport fleet and operations dashboard.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Try to get user — may not exist on /auth/login
  let userEmail = ''
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email ?? ''
  } catch {
    // Not authenticated — middleware will redirect; layout renders auth page
  }

  const isAuthPage = !userEmail

  return (
    <html lang="en">
      <body className="bg-[#F9FAFB] font-sans">
        {isAuthPage ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <AdminNav userEmail={userEmail} />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  )
}
