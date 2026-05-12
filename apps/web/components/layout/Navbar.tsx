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

  // Close dropdown on outside click
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
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: '#407E3C' }}
          >
            R
          </div>
          <span className="font-semibold text-[#1A1A1A] text-lg">RECI Transport</span>
        </Link>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {(user.email ?? '?')[0].toUpperCase()}
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg border border-[#E5E7EB] shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account/bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/account/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/account/corporate"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
                      >
                        Corporate Account
                      </Link>
                      <div className="border-t border-[#E5E7EB] mt-1 pt-1">
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
                  <Link
                    href="/auth/login"
                    className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-sm">
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
