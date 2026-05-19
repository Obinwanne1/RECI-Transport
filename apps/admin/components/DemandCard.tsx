'use client'

interface DemandRow {
  category_name: string
  demand_score: number
  signal_type: 'normal' | 'high' | 'peak'
  vehicles_remaining: number | null
  computed_at: string | null
}

interface DemandCardProps {
  rows: DemandRow[]
}

const SIGNAL_COLOR = {
  normal: { label: 'text-[#407E3C]', bg: 'bg-[#407E3C]', track: 'bg-[#407E3C]/20' },
  high:   { label: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', track: 'bg-orange-100 dark:bg-orange-900/30' },
  peak:   { label: 'text-red-600 dark:text-red-400',  bg: 'bg-red-500', track: 'bg-red-100 dark:bg-red-900/30' },
}

export default function DemandCard({ rows }: DemandCardProps) {
  const lastUpdate = rows[0]?.computed_at

  return (
    <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Fleet Demand Today</h2>
        <div className="flex gap-3 text-xs text-[#6B7280] dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#407E3C]" />Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Peak</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[#6B7280] dark:text-gray-400 text-center py-4">
          No demand data yet — pricing cron hasn&apos;t run.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const colors = SIGNAL_COLOR[row.signal_type]
            const pct = Math.round(row.demand_score * 100)
            return (
              <div key={row.category_name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#1A1A1A] dark:text-gray-200">{row.category_name}</span>
                  <div className="flex items-center gap-2">
                    {row.vehicles_remaining != null && row.signal_type !== 'normal' && (
                      <span className="text-xs text-[#6B7280] dark:text-gray-500">{row.vehicles_remaining} left</span>
                    )}
                    <span className={`text-xs font-semibold ${colors.label}`}>{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#E5E7EB] dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lastUpdate && (
        <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-4">
          Last computed: {new Date(lastUpdate).toLocaleString('en-DE', { timeZone: 'Europe/Berlin' })}
        </p>
      )}
    </div>
  )
}
