'use client'

import { useEffect, useState } from 'react'
import { useBookingStore } from '@/hooks/useBookingStore'
import { calcDays } from '@reci/utils'

const POINTS_TO_EUR = 100 // 100 points = €1
const MAX_REDEEM_PCT = 0.20 // max 20% of total

interface LoyaltyAccount {
  points_balance: number
  lifetime_points: number
  tier: { name: string; color_hex: string } | null
}

export default function OrderSummary() {
  const { vehicle, pickupDate, dropoffDate, selectedExtras, pricing, pointsRedeemed, setPointsRedeemed } = useBookingStore()

  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null)
  const [usePoints, setUsePoints] = useState(false)

  const days =
    pickupDate && dropoffDate
      ? (() => {
          try { return calcDays(pickupDate, dropoffDate) }
          catch { return 0 }
        })()
      : 0

  // Fetch loyalty balance (logged-in users only, soft-fail)
  useEffect(() => {
    fetch('/api/loyalty')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.points_balance !== undefined) setLoyalty(data) })
      .catch(() => {})
  }, [])

  const baseTotal = pricing?.total ?? 0

  // Calculate max redeemable points
  const maxRedeemPoints = loyalty
    ? Math.min(
        loyalty.points_balance,
        Math.floor((baseTotal * MAX_REDEEM_PCT) * POINTS_TO_EUR)
      )
    : 0
  const pointsDiscount = usePoints ? maxRedeemPoints / POINTS_TO_EUR : 0
  const finalTotal = Math.max(0, baseTotal - pointsDiscount)

  // Sync to store
  useEffect(() => {
    const pts = usePoints ? maxRedeemPoints : 0
    setPointsRedeemed(pts)
  }, [usePoints, maxRedeemPoints, setPointsRedeemed])

  if (!vehicle) return null

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

        {/* Points discount line */}
        {usePoints && pointsDiscount > 0 && (
          <div className="flex justify-between text-[#407E3C] font-medium">
            <span>Points discount ({maxRedeemPoints} pts)</span>
            <span>−€{pointsDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Loyalty points redemption */}
      {loyalty && loyalty.points_balance >= POINTS_TO_EUR && baseTotal > 0 && (
        <div className="mb-4 p-3 bg-[#F0FDF4] dark:bg-green-900/20 border border-[#BBF7D0] dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">★</span>
              <span className="text-sm font-semibold text-[#407E3C]">
                {loyalty.points_balance.toLocaleString()} pts available
              </span>
            </div>
            {loyalty.tier && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ color: loyalty.tier.color_hex, borderColor: loyalty.tier.color_hex, backgroundColor: loyalty.tier.color_hex + '18' }}
              >
                {loyalty.tier.name}
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={usePoints}
              onChange={(e) => setUsePoints(e.target.checked)}
              className="w-4 h-4 accent-[#407E3C] cursor-pointer"
            />
            <span className="text-xs text-[#407E3C]">
              Use {maxRedeemPoints} points → save €{(maxRedeemPoints / POINTS_TO_EUR).toFixed(2)}
            </span>
          </label>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
        <span className="font-semibold text-[#1A1A1A] dark:text-gray-100">Total</span>
        <div className="text-right">
          {usePoints && pointsDiscount > 0 && (
            <p className="text-xs text-[#6B7280] dark:text-gray-400 line-through">€{baseTotal.toFixed(2)}</p>
          )}
          <span className="text-2xl font-bold text-primary">
            €{(usePoints ? finalTotal : baseTotal).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Points earning preview */}
      {baseTotal > 0 && (
        <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-3 text-center">
          Earn ~{Math.floor(usePoints ? finalTotal : baseTotal)} points on this booking
        </p>
      )}
    </div>
  )
}
