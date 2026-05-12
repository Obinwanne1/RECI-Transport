'use client'

import { useVehicleSearch } from '@/hooks/useVehicleSearch'

const CATEGORIES = [
  { label: 'All', slug: '', icon: '🚘' },
  { label: 'Economy', slug: 'economy', icon: '🚗' },
  { label: 'Compact', slug: 'compact', icon: '🚙' },
  { label: 'SUV', slug: 'suv', icon: '🛻' },
  { label: 'Van', slug: 'van', icon: '🚐' },
]

export default function CategoryFilter() {
  const { params, setParams, search } = useVehicleSearch()
  const active = params.category_slug ?? ''

  const handleClick = (slug: string) => {
    const next = slug || undefined
    setParams({ category_slug: next })
    search({ category_slug: next })
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(({ label, slug, icon }) => (
        <button
          key={slug}
          onClick={() => handleClick(slug)}
          className={`
            flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border
            ${active === slug
              ? 'bg-[#407E3C] text-white border-[#407E3C] shadow-sm'
              : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#407E3C] hover:text-[#407E3C]'
            }
          `}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
