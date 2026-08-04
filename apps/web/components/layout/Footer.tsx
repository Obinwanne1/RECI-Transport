import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#407E3C] flex items-center justify-center text-white font-bold text-sm">R</div>
              <span className="font-bold text-[#1A1A1A] dark:text-gray-100 text-sm">RECI Transport</span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Berlin&apos;s AI-native vehicle rental. Cars, vans, and trucks with instant confirmation.
            </p>
            <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-3">
              RECI Transport GmbH<br />
              Mitte, Berlin, Germany
            </p>
          </div>

          {/* Pickup Locations */}
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-gray-100 uppercase tracking-widest mb-3">Pickup Locations</h4>
            <ul className="space-y-2 text-xs text-[#6B7280] dark:text-gray-400">
              <li>📍 Berlin Mitte — Mon–Sun 07:00–22:00</li>
              <li>📍 Berlin Schönefeld Airport — Daily 06:00–23:00</li>
              <li>📍 Berlin Friedrichshain — Mon–Sat 08:00–20:00</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-gray-100 uppercase tracking-widest mb-3">Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:support@recitransport.de" className="text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
                  support@recitransport.de
                </a>
              </li>
              <li className="text-[#6B7280] dark:text-gray-400">+49 30 1234 5678</li>
              <li className="text-[#6B7280] dark:text-gray-400">Mon–Sun · 08:00–20:00 CET</li>
            </ul>
          </div>

          {/* Quick FAQ */}
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-gray-100 uppercase tracking-widest mb-3">Quick FAQ</h4>
            <ul className="space-y-2 text-xs text-[#6B7280] dark:text-gray-400">
              <li>✅ Insurance included in all rates</li>
              <li>✅ Free cancellation up to 48h before</li>
              <li>✅ Corporate accounts available</li>
              <li>✅ Min. age 21 · Valid EU licence required</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#F3F4F6] dark:border-gray-700">
          <span className="text-xs text-[#9CA3AF] dark:text-gray-500">
            © {year} RECI Transport GmbH, Berlin
          </span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            <Link href="/privacy" className="text-xs text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Terms of Service
            </Link>
            <Link href="/terms" className="text-xs text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Legal
            </Link>
            <a href="mailto:support@recitransport.de" className="text-xs text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] dark:hover:text-[#5a9e56] transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
