'use client'

import { useTheme } from './ThemeProvider'

function SunIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  )
}

export default function TopBar() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-20 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-[#E5E7EB] dark:border-gray-700/60 flex items-center justify-end px-5">
      <button
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-gray-800 transition-colors group"
      >
        {/* Toggle pill */}
        <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          isDark ? 'bg-[#407E3C]' : 'bg-gray-200'
        }`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isDark ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`} />
        </span>

        {/* Icon + label */}
        <span className={`flex items-center gap-1 text-xs font-medium transition-colors ${
          isDark ? 'text-yellow-400' : 'text-[#6B7280] dark:text-gray-400'
        }`}>
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </span>
      </button>
    </header>
  )
}
