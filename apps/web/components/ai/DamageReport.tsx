'use client'

import ConfidenceBar from './ConfidenceBar'
import type { DamageReport } from '@/lib/schemas'

interface DamageReportProps {
  report: DamageReport & { dispute_raised?: boolean; needs_human_review?: boolean }
}

const SEVERITY_STYLES = {
  none: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  minor: 'bg-orange-50 text-orange-700 border-orange-200',
  major: 'bg-red-50 text-[#DC2626] border-red-200',
}

const SEVERITY_LABELS = {
  none: 'No damage',
  minor: 'Minor damage',
  major: 'Major damage',
}

export default function DamageReportView({ report }: DamageReportProps) {
  return (
    <div className="space-y-4">
      {/* Severity badge */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${
            SEVERITY_STYLES[report.severity]
          }`}
        >
          {report.severity === 'none' ? '✓ ' : report.severity === 'major' ? '⚠ ' : '• '}
          {SEVERITY_LABELS[report.severity]}
        </span>
      </div>

      {/* Confidence */}
      <div>
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
          AI Confidence
        </p>
        <ConfidenceBar confidence={report.confidence} />
      </div>

      {/* Locations */}
      {report.new_damage && report.locations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
            Affected Areas
          </p>
          <ul className="space-y-1">
            {report.locations.map((loc, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                {loc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasoning */}
      <div>
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
          Assessment
        </p>
        <p className="text-sm text-[#6B7280]">{report.reasoning}</p>
      </div>

      {/* Dispute raised */}
      {report.dispute_raised && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <span className="text-base shrink-0">⚠</span>
          <p className="text-sm text-[#DC2626] font-medium">
            Dispute raised — our team will review within 24 hours and contact you.
          </p>
        </div>
      )}

      {/* Human review (no auto-dispute) */}
      {report.needs_human_review && !report.dispute_raised && report.new_damage && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <span className="text-base shrink-0">🔍</span>
          <p className="text-sm text-orange-700">
            Flagged for staff review — confidence below threshold. No charge raised automatically.
          </p>
        </div>
      )}
    </div>
  )
}
