'use client'

import { useTheme } from '@/components/ThemeProvider'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-300 hover:border-primary transition-colors shadow-sm"
    >
      {theme === 'dark' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71m12.02 0-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <ThemeToggle />
      <div className="mb-8 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: '#407E3C' }}
        >
          R
        </div>
        <span className="font-semibold text-[#1A1A1A] dark:text-gray-100 text-xl">RECI Transport</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
