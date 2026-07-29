import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Privacy Policy — RECI Transport',
  description: 'How RECI Transport collects, uses, and protects your personal data under GDPR.',
}

export default function PrivacyPage() {
  const updated = '29 July 2026'

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-10">Last updated: {updated}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[#374151] dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">1. Controller</h2>
            <p>RECI Transport GmbH, Berlin, Germany (<strong>we / us / our</strong>) is the data controller for personal data processed through this website and mobile app. Contact: <a href="mailto:privacy@recitransport.de" className="text-[#407E3C] hover:underline">privacy@recitransport.de</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> name, email address, password (hashed), company name (corporate accounts)</li>
              <li><strong>Booking data:</strong> pickup/dropoff dates, vehicle selections, extras, pricing, booking reference</li>
              <li><strong>Driver data:</strong> driving licence number, licence image (for verification), date of birth</li>
              <li><strong>Payment data:</strong> processed by Stripe — we store only the last 4 card digits and expiry for receipts</li>
              <li><strong>Vehicle inspection data:</strong> photos uploaded during pickup/return inspections</li>
              <li><strong>Technical data:</strong> IP address (for rate limiting and fraud prevention), browser type, device type</li>
              <li><strong>Communications:</strong> emails we send you (booking confirmations, receipts, updates)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">3. How We Use Your Data</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                  <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                  <th className="text-left py-2 font-semibold">Legal Basis (GDPR Art. 6)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] dark:divide-gray-800">
                <tr><td className="py-2 pr-4">Processing bookings and payments</td><td className="py-2">Contract performance (6(1)(b))</td></tr>
                <tr><td className="py-2 pr-4">Driving licence verification</td><td className="py-2">Legal obligation (6(1)(c))</td></tr>
                <tr><td className="py-2 pr-4">Fraud prevention and rate limiting</td><td className="py-2">Legitimate interest (6(1)(f))</td></tr>
                <tr><td className="py-2 pr-4">Sending booking confirmations</td><td className="py-2">Contract performance (6(1)(b))</td></tr>
                <tr><td className="py-2 pr-4">Marketing emails (if opted in)</td><td className="py-2">Consent (6(1)(a))</td></tr>
                <tr><td className="py-2 pr-4">AI-powered vehicle search suggestions</td><td className="py-2">Legitimate interest (6(1)(f))</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">4. Data Processors</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase Inc.</strong> (USA) — database and authentication. SCCs in place.</li>
              <li><strong>Stripe Inc.</strong> (USA) — payment processing. SCCs and EU-US DPF.</li>
              <li><strong>Resend Inc.</strong> — transactional email delivery.</li>
              <li><strong>Anthropic PBC</strong> (USA) — AI-powered search and document analysis. Data processed per prompt only; not used to train models.</li>
              <li><strong>Vercel Inc.</strong> (USA) — web hosting. SCCs in place.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">5. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account data: until account deletion, or 3 years of inactivity</li>
              <li>Booking records: 10 years (German commercial law — HGB § 257)</li>
              <li>Payment records: 10 years (tax purposes)</li>
              <li>Inspection photos: 12 months after rental end</li>
              <li>IP addresses for rate limiting: 24 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">6. Your Rights</h2>
            <p className="mb-2">Under GDPR you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> — request a copy of your personal data</li>
              <li><strong>Rectification</strong> — correct inaccurate data</li>
              <li><strong>Erasure</strong> — delete your account and data (subject to legal retention obligations)</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interest</li>
              <li><strong>Withdraw consent</strong> — for any processing based on consent</li>
            </ul>
            <p className="mt-3">Exercise rights: <a href="mailto:privacy@recitransport.de" className="text-[#407E3C] hover:underline">privacy@recitransport.de</a> or via your <Link href="/account/profile" className="text-[#407E3C] hover:underline">Account Settings</Link>.</p>
            <p className="mt-2">You may also lodge a complaint with the Berlin data protection authority: <strong>Berliner Beauftragte für Datenschutz und Informationsfreiheit</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">7. Cookies</h2>
            <p>We use strictly necessary cookies only (session authentication). We do not use tracking or advertising cookies without your explicit consent. See our cookie banner for controls.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">8. Changes</h2>
            <p>Material changes will be notified by email 30 days in advance. Continued use after the effective date constitutes acceptance.</p>
          </section>

        </div>
      </main>
    </div>
  )
}
