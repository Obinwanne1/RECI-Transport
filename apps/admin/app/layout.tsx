import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminNav from '@/components/AdminNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import TopBar from '@/components/TopBar'
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
  let userRole = ''
  if (SUPABASE_CONFIGURED) {
    try {
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      userEmail = user?.email ?? ''
      if (user) {
        const admin = createAdminClient()
        const { data: profile } = await admin
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        userRole = profile?.role ?? ''
      }
    } catch {
      // Not authenticated — middleware will redirect
    }
  }

  const isAuthPage = SUPABASE_CONFIGURED && !userEmail

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Anti-FOUC: set dark class before React hydrates */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('reci-theme') ||
              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            if (t === 'dark') document.documentElement.classList.add('dark');
          } catch(e) {}
        ` }} />
      </head>
      <body className="bg-[#F9FAFB] dark:bg-gray-950 font-sans transition-colors duration-150">
        <ThemeProvider>
          {isAuthPage ? (
            <>
              <TopBar />
              {children}
            </>
          ) : (
            <div className="flex min-h-screen">
              <AdminNav userEmail={userEmail || 'dev@localhost'} userRole={userRole} />
              <main className="flex-1 overflow-auto min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
                <TopBar />
                {children}
              </main>
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
