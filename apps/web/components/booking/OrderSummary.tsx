import { useBookingStore } from '@/hooks/useBookingStore'
import { calcDays } from '@reci/utils'

export default function OrderSummary() {
  const { vehicle, pickupDate, dropoffDate, selectedExtras, pricing } = useBookingStore()

  if (!vehicle) return null

  const days =
    pickupDate && dropoffDate
      ? (() => {
          try {
            return calcDays(pickupDate, dropoffDate)
          } catch {
            return 0
          }
        })()
      : 0

  return (
    <div className="card sticky top-24">
      <h3 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">Order Summary</h3>

      {/* Vehicle */}
      <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700 mb-4">
        <p className="font-medium dark:text-gray-100">
          {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-[#6B7280] dark:text-gray-400">{vehicle.year}</p>
        {pickupDate && dropoffDate && (
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">
            {new Date(pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' → '}
            {new Date(dropoffDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' · '}
            {days} day{days !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Line items */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-[#6B7280] dark:text-gray-400">
            Base rate{days > 0 ? ` (${days}d)` : ''}
          </span>
          <span className="dark:text-gray-200">€{(pricing?.base_subtotal ?? (vehicle.daily_rate ?? 0) * days).toFixed(2)}</span>
        </div>

        {selectedExtras.map((e) => (
          <div key={e.extra_id} className="flex justify-between">
            <span className="text-[#6B7280] dark:text-gray-400">{e.name}</span>
            <span>
              €
              {(
                e.is_one_time_fee
                  ? e.price_snapshot * e.quantity
                  : e.price_snapshot * days * e.quantity
              ).toFixed(2)}
            </span>
          </div>
        ))}

        {pricing && pricing.discount_amount > 0 && (
          <div className="flex justify-between text-[#16A34A]">
            <span>Discount</span>
            <span>−€{pricing.discount_amount.toFixed(2)}</span>
          </div>
        )}

        {pricing && pricing.surcharge_amount > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Demand surcharge</span>
            <span>+€{pricing.surcharge_amount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
        <span className="font-semibold text-[#1A1A1A] dark:text-gray-100">Total</span>
        <span className="text-2xl font-bold text-primary">
          €{(pricing?.total ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
