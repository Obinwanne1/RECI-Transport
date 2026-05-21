'use client'

import { useBookingStore } from '@/hooks/useBookingStore'
import type { Extra } from '@/lib/schemas'
import type { ExtraRecommendation } from '@/app/api/ai/extras-recommend/route'

interface ExtraSelectorProps {
  extras: Extra[]
  days: number
  recommendations?: ExtraRecommendation[]
}

export default function ExtraSelector({ extras, days, recommendations = [] }: ExtraSelectorProps) {
  const { selectedExtras, toggleExtra } = useBookingStore()

  const recMap = new Map(recommendations.map((r) => [r.extra_id, r]))

  // Sort: high-priority recommended first, then medium, then rest
  const sortExtras = (list: Extra[]) =>
    [...list].sort((a, b) => {
      const pa = recMap.get(a.id)?.priority === 'high' ? 0 : recMap.get(a.id)?.priority === 'medium' ? 1 : 2
      const pb = recMap.get(b.id)?.priority === 'high' ? 0 : recMap.get(b.id)?.priority === 'medium' ? 1 : 2
      return pa - pb
    })

  const insurance = sortExtras(extras.filter((e) => e.exclusive_group === 'insurance'))
  const addons = sortExtras(extras.filter((e) => e.exclusive_group !== 'insurance'))

  const isSelected = (id: string) => selectedExtras.some((e) => e.extra_id === id)

  const handleToggle = (extra: Extra) => {
    toggleExtra({
      extra_id: extra.id,
      name: extra.name,
      price_per_day: extra.price_per_day,
      is_one_time_fee: extra.is_one_time_fee,
      quantity: 1,
      price_snapshot: extra.price_per_day,
      exclusive_group: extra.exclusive_group,
    })
  }

  const linePrice = (extra: Extra) =>
    extra.is_one_time_fee ? extra.price_per_day : extra.price_per_day * days

  const RecommendBadge = ({ id }: { id: string }) => {
    const rec = recMap.get(id)
    if (!rec) return null
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            rec.priority === 'high'
              ? 'bg-[#F0FDF4] text-[#407E3C] border border-[#BBF7D0]'
              : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]'
          }`}
        >
          ✦ {rec.priority === 'high' ? 'AI Recommended' : 'Suggested'}
        </span>
        <span className="text-xs text-[#9CA3AF]">{rec.reason}</span>
      </div>
    )
  }

  const renderExtra = (extra: Extra, type: 'radio' | 'checkbox') => {
    const selected = isSelected(extra.id)
    return (
      <label
        key={extra.id}
        className={`flex items-start gap-4 p-4 rounded-card border cursor-pointer transition-colors ${
          selected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : recMap.get(extra.id)?.priority === 'high'
            ? 'border-[#407E3C]/30 bg-[#F0FDF4]/50 dark:bg-green-900/10 hover:border-primary/50'
            : 'border-[#E5E7EB] dark:border-gray-600 hover:border-primary/50'
        }`}
      >
        <input
          type={type}
          name={type === 'radio' ? 'insurance' : undefined}
          checked={selected}
          onChange={() => handleToggle(extra)}
          className="mt-0.5 accent-primary"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-[#1A1A1A] dark:text-gray-100">{extra.name}</span>
            <span className="text-sm font-semibold text-primary whitespace-nowrap">
              {type === 'radio' && extra.price_per_day === 0
                ? 'Included'
                : `€${linePrice(extra).toFixed(2)}${extra.is_one_time_fee ? (type === 'radio' ? '' : ' one-time') : '/day'}`}
            </span>
          </div>
          {extra.description && (
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-0.5">{extra.description}</p>
          )}
          <RecommendBadge id={extra.id} />
        </div>
      </label>
    )
  }

  return (
    <div className="space-y-6">
      {recommendations.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#407E3C] font-medium">
          <span>✦</span>
          <span>AI recommendations shown based on your trip profile</span>
        </div>
      )}

      {insurance.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">Insurance</h3>
          <div className="space-y-3">
            {insurance.map((extra) => renderExtra(extra, 'radio'))}
          </div>
        </div>
      )}

      {addons.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-3">Add-ons</h3>
          <div className="space-y-3">
            {addons.map((extra) => renderExtra(extra, 'checkbox'))}
          </div>
        </div>
      )}
    </div>
  )
}
