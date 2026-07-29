import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Terms of Service — RECI Transport',
  description: 'Terms and conditions for using the RECI Transport vehicle rental platform.',
}

export default function TermsPage() {
  const updated = '29 July 2026'

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100 mb-2">Terms of Service</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-10">Last updated: {updated}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[#374151] dark:text-gray-300">

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">1. Parties</h2>
            <p>These terms form a contract between <strong>RECI Transport GmbH</strong> (&quot;RECI&quot;, &quot;we&quot;) and the person or entity (&quot;you&quot;, &quot;customer&quot;) accessing this platform to book vehicles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 21 years old (25 for certain vehicle categories)</li>
              <li>You must hold a valid driving licence for the vehicle category booked</li>
              <li>Licence must have been held for at least 2 years</li>
              <li>You must have a valid payment method</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">3. Bookings and Payment</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A booking is confirmed once payment is successfully processed and you receive a booking reference</li>
              <li>Prices are quoted in EUR inclusive of VAT</li>
              <li>Payment is processed by Stripe. Card details are never stored on RECI systems</li>
              <li>Pricing shown at time of booking is the price charged. Dynamic demand pricing may change between sessions</li>
              <li>Corporate accounts are invoiced per agreed corporate agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">4. Cancellations and Refunds</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>72+ hours before pickup:</strong> Full refund</li>
              <li><strong>24–72 hours before pickup:</strong> 50% refund</li>
              <li><strong>Under 24 hours / no-show:</strong> No refund</li>
              <li>Refunds are processed within 5–10 business days to the original payment method</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">5. Vehicle Use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vehicles must be returned at the agreed time and location in the same condition</li>
              <li>Smoking in vehicles is prohibited and will incur a €150 cleaning fee</li>
              <li>Vehicles may not be driven outside the permitted geographic zone without prior written consent</li>
              <li>You are responsible for all traffic fines, tolls, and parking charges incurred during the rental period</li>
              <li>Subletting or commercial use of the vehicle is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">6. Damage and Liability</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A digital inspection is performed at pickup and return</li>
              <li>Pre-existing damage recorded at pickup will not be charged</li>
              <li>New damage found at return is assessed and charged per the damage schedule</li>
              <li>You are liable for the excess amount stated in your booking confirmation unless CDW is purchased</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">7. AI-Powered Features</h2>
            <p>Search suggestions and vehicle recommendations use AI. Results are provided for convenience only and do not constitute guaranteed availability. Availability is confirmed at checkout. AI-generated content may contain errors — always verify booking details before payment.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">8. Loyalty Points</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Points are awarded at €1 spent = 1 point</li>
              <li>Points expire 12 months after earning if no account activity</li>
              <li>Points have no cash value and are non-transferable</li>
              <li>RECI reserves the right to modify the loyalty programme with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by German law, RECI&apos;s total liability to you is capped at the amount paid for the booking giving rise to the claim. RECI is not liable for indirect, consequential, or incidental damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">10. Governing Law</h2>
            <p>These terms are governed by German law. Disputes shall be subject to the exclusive jurisdiction of the courts of Berlin, Germany.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">11. Contact</h2>
            <p>RECI Transport GmbH · Berlin, Germany · <a href="mailto:legal@recitransport.de" className="text-[#407E3C] hover:underline">legal@recitransport.de</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
