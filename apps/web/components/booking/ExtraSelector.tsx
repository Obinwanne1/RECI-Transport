'use client'

import { useBookingStore } from '@/hooks/useBookingStore'
import type { Extra } from '@/lib/schemas'

interface ExtraSelectorProps {
  extras: Extra[]
  days: number
}

export default function ExtraSelector({ extras, days }: ExtraSelectorProps) {
  const { selectedExtras, toggleExtra } = useBookingStore()

  const insurance = extras.filter((e) => e.exclusive_group === 'insurance')
  const addons = extras.filter((e) => e.exclusive_group !== 'insurance')

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

  return (
    <div className="space-y-6">
      {/* Insurance — radio (exclusive) */}
      {insurance.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Insurance</h3>
          <div className="space-y-3">
            {insurance.map((extra) => {
              const selected = isSelected(extra.id)
              return (
                <label
                  key={extra.id}
                  className={`flex items-start gap-4 p-4 rounded-card border cursor-pointer transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-[#E5E7EB] hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="insurance"
                    checked={selected}
                    onChange={() => handleToggle(extra)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#1A1A1A]">{extra.name}</span>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        {extra.price_per_day === 0
                          ? 'Included'
                          : `€${linePrice(extra).toFixed(2)}${extra.is_one_time_fee ? '' : '/day'}`}
                      </span>
                    </div>
                    {extra.description && (
                      <p className="text-sm text-[#6B7280] mt-0.5">{extra.description}</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Add-ons — checkboxes */}
      {addons.length > 0 && (
        <div>
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Add-ons</h3>
          <div className="space-y-3">
            {addons.map((extra) => {
              const selected = isSelected(extra.id)
              return (
                <label
                  key={extra.id}
                  className={`flex items-start gap-4 p-4 rounded-card border cursor-pointer transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-[#E5E7EB] hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleToggle(extra)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#1A1A1A]">{extra.name}</span>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        €{linePrice(extra).toFixed(2)}
                        {extra.is_one_time_fee ? ' one-time' : '/day'}
                      </span>
                    </div>
                    {extra.description && (
                      <p className="text-sm text-[#6B7280] mt-0.5">{extra.description}</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
