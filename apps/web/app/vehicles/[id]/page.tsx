import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import type { Vehicle } from '@/lib/schemas'

const FUEL_BADGES: Record<string, { label: string; cls: string }> = {
  petrol:   { label: 'Petrol',   cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  diesel:   { label: 'Diesel',   cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  electric: { label: 'Electric', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  hybrid:   { label: 'Hybrid',   cls: 'bg-teal-50 text-teal-600 border-teal-100' },
}

async function getVehicle(id: string): Promise<Vehicle | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/vehicles/${id}`, { next: { revalidate: 300 } })
  if (!res.ok) return null
  return res.json()
}

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicle(params.id)
  if (!vehicle) notFound()

  const { make, model, year, fuel_type, transmission, image_urls, daily_rate, category, features, color, mileage, guaranteed_model } = vehicle
  const fuel = FUEL_BADGES[fuel_type] ?? { label: fuel_type, cls: 'bg-gray-50 text-gray-500 border-gray-100' }
  const primaryImage = image_urls?.[0] ?? null

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-gray-400 hover:text-[#407E3C] mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: image + gallery */}
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-[#F3F4F6] dark:bg-gray-800 relative">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={`${make} ${model}`}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#D1D5DB]">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 10l1.5-4.5h11L19 10M5 10H3l-.5 3H3v4h2v-1h14v1h2v-4h-.5L18 10H5z" />
                  </svg>
                  <span className="text-sm font-medium text-[#9CA3AF]">{make} {model}</span>
                </div>
              )}
              {guaranteed_model && (
                <span className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-[#407E3C] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#407E3C]/30">
                  ✓ Exact Model
                </span>
              )}
            </div>

            {/* Thumbnail strip */}
            {image_urls && image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {image_urls.slice(1).map((url, i) => (
                  <div key={i} className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden relative bg-[#F3F4F6] dark:bg-gray-800">
                    <Image src={url} alt={`${make} ${model} view ${i + 2}`} fill unoptimized className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: details + CTA */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              {category && (
                <span className="inline-block bg-[#407E3C] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2">
                  {category.name}
                </span>
              )}
              <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-gray-100">{make} {model}</h1>
              <p className="text-[#6B7280] dark:text-gray-400 font-medium mt-0.5">{year} · {color}</p>
            </div>

            {/* Specs */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${fuel.cls}`}>{fuel.label}</span>
              <span className="text-xs px-3 py-1.5 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600 capitalize">
                {transmission}
              </span>
              {category && (
                <>
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600">
                    {category.passenger_capacity} seats
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600">
                    {category.luggage_capacity} bags
                  </span>
                </>
              )}
              <span className="text-xs px-3 py-1.5 rounded-full font-medium border bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-600">
                {mileage.toLocaleString()} km
              </span>
            </div>

            {/* Features */}
            {features?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-200 mb-2">Features</h3>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => (
                    <span key={f} className="text-xs px-2.5 py-1 bg-[#407E3C]/10 text-[#407E3C] rounded-full font-medium">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Price + Book */}
            <div className="card !p-5 space-y-4">
              {daily_rate != null ? (
                <div>
                  <span className="text-3xl font-bold text-[#407E3C]">€{daily_rate}</span>
                  <span className="text-sm text-[#9CA3AF] ml-1">/day</span>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">Extras and insurance selected at checkout</p>
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">Price on request</p>
              )}
              <Link
                href={`/book/${vehicle.id}`}
                className="btn-primary w-full justify-center text-base py-3"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
