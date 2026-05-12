'use client'

import { useVehicleSearch } from '@/hooks/useVehicleSearch'

const CATEGORIES = [
  { label: 'All', slug: '' },
  { label: 'Economy', slug: 'economy' },
  { label: 'Compact', slug: 'compact' },
  { label: 'SUV', slug: 'suv' },
  { label: 'Van', slug: 'van' },
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
      {CATEGORIES.map(({ label, slug }) => (
        <button
          key={slug}
          onClick={() => handleClick(slug)}
          className={`
            whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border
            ${
              active === slug
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-[#1A1A1A] border-[#E5E7EB] hover:border-primary hover:text-primary'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
