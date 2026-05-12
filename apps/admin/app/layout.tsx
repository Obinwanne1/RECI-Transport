import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'
import './globals.css'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

export const metadata: Metadata = {
  title: 'RECI Admin',
  description: 'RECI Transport fleet and operations dashboard.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let userEmail = ''
  if (SUPABASE_CONFIGURED) {
    try {
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      userEmail = user?.email ?? ''
    } catch {
      // Not authenticated — middleware will redirect
    }
  }

  const isAuthPage = SUPABASE_CONFIGURED && !userEmail

  return (
    <html lang="en">
      <body className="bg-[#F9FAFB] font-sans">
        {isAuthPage ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <AdminNav userEmail={userEmail || 'dev@localhost'} />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  )
}
