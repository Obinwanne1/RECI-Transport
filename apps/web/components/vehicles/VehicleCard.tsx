import Link from 'next/link'
import type { Vehicle } from '@/lib/schemas'

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
}

const FUEL_COLORS: Record<string, string> = {
  petrol: 'bg-orange-100 text-orange-700',
  diesel: 'bg-blue-100 text-blue-700',
  electric: 'bg-green-100 text-green-700',
  hybrid: 'bg-teal-100 text-teal-700',
}

interface VehicleCardProps {
  vehicle: Vehicle
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { id, make, model, year, fuel_type, transmission, image_urls, daily_rate, category } =
    vehicle

  const image = image_urls?.[0] ?? null

  return (
    <div className="card flex flex-col h-full">
      {/* Image */}
      <div className="aspect-[16/9] rounded-md overflow-hidden bg-[#F3F4F6] mb-4 flex items-center justify-center">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${make} ${model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#6B7280]">
            <svg
              className="w-12 h-12 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 17h8M5 10l1.5-4.5h11L19 10M5 10H3l-.5 3H3v4h2v-1h14v1h2v-4h-.5L18 10H5z"
              />
            </svg>
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Category badge */}
      {category && (
        <span className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
          {category.name}
        </span>
      )}

      {/* Title */}
      <h3 className="font-semibold text-[#1A1A1A] text-lg leading-tight">
        {make} {model}
      </h3>
      <p className="text-sm text-[#6B7280] mb-3">{year}</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${FUEL_COLORS[fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
          {FUEL_LABELS[fuel_type] ?? fuel_type}
        </span>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600 capitalize">
          {transmission}
        </span>
        {category && (
          <>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
              {category.passenger_capacity} seats
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
              {category.luggage_capacity} bags
            </span>
          </>
        )}
      </div>

      {/* Price + CTA */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
        <div>
          {daily_rate != null ? (
            <>
              <span className="text-2xl font-bold text-[#1A1A1A]">€{daily_rate}</span>
              <span className="text-sm text-[#6B7280]">/day</span>
            </>
          ) : (
            <span className="text-sm text-[#6B7280]">Price on request</span>
          )}
        </div>
        <Link
          href={`/book/${id}`}
          className="btn-primary text-sm"
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
