'use client'

import { useEffect, useState } from 'react'
import type { PricingSignal } from '@/lib/schemas'

interface DemandBannerProps {
  categoryId?: string
  dateRange?: { start: string; end: string }
}

export default function DemandBanner({ categoryId, dateRange }: DemandBannerProps) {
  const [signal, setSignal] = useState<PricingSignal | null>(null)

  useEffect(() => {
    if (!categoryId || !dateRange) return

    const qs = new URLSearchParams({
      category_id: categoryId,
      start_date: dateRange.start,
      end_date: dateRange.end,
    })

    fetch(`/api/pricing-signals?${qs}`)
      .then((r) => r.json())
      .then((data: PricingSignal) => {
        if (data.signal !== 'normal') setSignal(data)
        else setSignal(null)
      })
      .catch(() => setSignal(null))
  }, [categoryId, dateRange?.start, dateRange?.end])

  if (!signal?.message) return null

  const isPeak = signal.signal === 'peak'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium mb-4 ${
        isPeak
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
      }`}
    >
      <span className="text-lg">{isPeak ? '🔥' : '⚡'}</span>
      <span>{signal.message}</span>
      {signal.surcharge_pct > 0 && (
        <span className="ml-auto font-semibold">+{signal.surcharge_pct}%</span>
      )}
    </div>
  )
}
