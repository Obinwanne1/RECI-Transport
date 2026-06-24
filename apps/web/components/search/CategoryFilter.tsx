'use client'

import { useVehicleSearch } from '@/hooks/useVehicleSearch'

const GridIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const CarIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 17H3v-4l2.5-5h11L19 13v4h-2M9 17h6M6 9h12"/>
  </svg>
)

const SuvIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 17H3V11l1.5-3.5h15L21 11v6h-2M9 17h6M3 11h18M7.5 7.5h9"/>
  </svg>
)

const VanIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 17H3V8a1 1 0 0 1 1-1h12l3 4v6h-2M9 17h6M4 7v6M10 7v6"/>
  </svg>
)

const CATEGORIES = [
  { label: 'All',     slug: '',        Icon: GridIcon },
  { label: 'Economy', slug: 'economy', Icon: CarIcon },
  { label: 'Compact', slug: 'compact', Icon: CarIcon },
  { label: 'SUV',     slug: 'suv',     Icon: SuvIcon },
  { label: 'Van',     slug: 'van',     Icon: VanIcon },
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
      {CATEGORIES.map(({ label, slug, Icon }) => (
        <button
          key={slug}
          onClick={() => handleClick(slug)}
          className={`
            flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border
            ${active === slug
              ? 'bg-[#407E3C] text-white border-[#407E3C] shadow-sm'
              : 'bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-300 border-[#E5E7EB] dark:border-gray-600 hover:border-[#407E3C] hover:text-[#407E3C] dark:hover:text-[#407E3C] dark:hover:border-[#407E3C]'
            }
          `}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  )
}
