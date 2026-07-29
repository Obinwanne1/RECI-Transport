import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#407E3C] flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="text-sm text-[#6B7280] dark:text-gray-400">
              © {year} RECI Transport GmbH, Berlin
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            <Link href="/privacy" className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@recitransport.de" className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Support
            </a>
            <Link href="/terms" className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Legal
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
