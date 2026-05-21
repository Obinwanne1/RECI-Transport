import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('user_profiles')
        .select('corporate_account_id')
        .eq('id', user.id)
        .single()
    : { data: null }

  const navItems = [
    { href: '/account/bookings', label: 'My Bookings' },
    { href: '/account/profile', label: 'Profile' },
    { href: '/account/rewards', label: 'Rewards' },
    { href: '/account/corporate', label: 'Corporate Account' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-lg overflow-hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-sm font-medium text-[#1A1A1A] dark:text-gray-200 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  {item.label}
                  {item.href === '/account/corporate' && profile?.corporate_account_id && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#F0FDF4] dark:bg-green-900/30 text-[#407E3C]">
                      Active
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  )
}
