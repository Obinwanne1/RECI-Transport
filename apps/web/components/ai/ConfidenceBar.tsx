'use client'

interface ConfidenceBarProps {
  confidence: number
  showLabel?: boolean
}

export default function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
  const pct = Math.round(confidence * 100)

  // Green → orange → red based on damage confidence
  let barColor = '#16A34A'
  if (confidence >= 0.7) barColor = '#DC2626'
  else if (confidence >= 0.5) barColor = '#EA580C'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#E5E7EB] dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[#6B7280] dark:text-gray-400 w-10 text-right">{pct}%</span>
      )}
    </div>
  )
}
