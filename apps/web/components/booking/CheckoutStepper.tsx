import React from 'react'

const STEPS = [
  { n: 1, label: 'Confirm' },
  { n: 2, label: 'Extras' },
  { n: 3, label: 'Driver' },
  { n: 4, label: 'Payment' },
  { n: 5, label: 'Done' },
]

interface CheckoutStepperProps {
  current: number
}

export default function CheckoutStepper({ current }: CheckoutStepperProps) {
  return (
    <nav className="bg-white border-b border-[#E5E7EB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-0">
          {STEPS.map(({ n, label }, i) => {
            const done = n < current
            const active = n === current

            return (
              <React.Fragment key={n}>
                <li className="flex items-center gap-2">
                  <span
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                      ${done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-[#E5E7EB] text-[#6B7280]'}
                    `}
                  >
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      n
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      active ? 'text-primary' : done ? 'text-[#1A1A1A]' : 'text-[#6B7280]'
                    }`}
                  >
                    {label}
                  </span>
                </li>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${n < current ? 'bg-primary' : 'bg-[#E5E7EB]'}`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
