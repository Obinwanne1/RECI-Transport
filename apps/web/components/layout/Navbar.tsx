'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    setDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base bg-[#407E3C] group-hover:bg-[#356834] transition-colors shadow-sm">
            R
          </div>
          <div className="leading-none">
            <span className="font-bold text-[#1A1A1A] text-base tracking-tight">RECI</span>
            <span className="font-normal text-[#6B7280] text-base tracking-tight"> Transport</span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#407E3C] text-white flex items-center justify-center text-xs font-bold">
                      {(user.email ?? '?')[0].toUpperCase()}
                    </div>
                    <svg className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-[#E5E7EB] shadow-xl py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-[#F3F4F6]">
                        <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/account/bookings', label: 'My Bookings' },
                        { href: '/account/profile', label: 'Profile' },
                        { href: '/account/corporate', label: 'Corporate Account' },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] hover:text-[#407E3C] transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-[#F3F4F6] mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-red-50 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors px-3 py-2">
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-semibold text-white bg-[#407E3C] hover:bg-[#356834] px-4 py-2 rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
