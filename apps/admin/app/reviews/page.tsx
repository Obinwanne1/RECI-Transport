'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

interface LicenceReview {
  id: string
  user_id: string
  confidence: number
  status: string
  created_at: string
  extracted_data: {
    name?: string
    licence_number?: string
    expiry_date?: string
    categories?: string[]
    issuing_country?: string
    name_match?: boolean
  }
  profile: { first_name: string; last_name: string; email: string } | null
}

interface DamageReview {
  id: string
  booking_id: string
  inspection_type: string
  photo_urls: string[]
  created_at: string
  ai_damage_report: {
    new_damage: boolean
    severity: string
    locations: string[]
    confidence: number
    reasoning: string
    needs_human_review: boolean
  }
  booking: {
    booking_ref: string
    driver_first_name: string
    driver_last_name: string
    driver_email: string
    notes: string | null
    vehicle: { make: string; model: string; year: number; registration_plate: string } | null
  } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? 'bg-green-100 text-green-700' : value >= 0.6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    none: 'bg-green-100 text-green-700',
    minor: 'bg-yellow-100 text-yellow-700',
    major: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[severity] ?? 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  )
}

// ── Licence Review Card ────────────────────────────────────────────────────

function LicenceCard({ item, onAction }: { item: LicenceReview; onAction: () => void }) {
  const [name, setName] = useState(item.extracted_data.name ?? '')
  const [licenceNumber, setLicenceNumber] = useState(item.extracted_data.licence_number ?? '')
  const [expiry, setExpiry] = useState(item.extracted_data.expiry_date ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/admin/api/admin/reviews/licences/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          note: note || undefined,
          ...(action === 'approve' ? { name, licence_number: licenceNumber, expiry_date: expiry } : {}),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Action failed. Please try again.')
        return
      }
      setDone(true)
      onAction()
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  const inputCls = 'w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]'

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1A1A1A] text-sm">
            {item.profile ? `${item.profile.first_name} ${item.profile.last_name}` : 'Unknown customer'}
          </p>
          <p className="text-xs text-[#6B7280]">{item.profile?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfidencePill value={item.confidence} />
          <span className="text-xs text-[#9CA3AF]">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* AI extracted fields — editable */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor={`name-${item.id}`} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Name</label>
          <input id={`name-${item.id}`} className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label htmlFor={`licence-${item.id}`} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Licence No.</label>
          <input id={`licence-${item.id}`} className={inputCls} value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} placeholder="Licence number" />
        </div>
        <div>
          <label htmlFor={`expiry-${item.id}`} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Expiry</label>
          <input id={`expiry-${item.id}`} type="date" className={inputCls} value={expiry} onChange={e => setExpiry(e.target.value)} />
        </div>
      </div>

      {item.extracted_data.categories && item.extracted_data.categories.length > 0 && (
        <p className="text-xs text-[#6B7280]">
          Categories: <span className="font-medium text-[#1A1A1A]">{item.extracted_data.categories.join(', ')}</span>
          {item.extracted_data.issuing_country && <> · Country: <span className="font-medium text-[#1A1A1A]">{item.extracted_data.issuing_country}</span></>}
        </p>
      )}

      {item.extracted_data.name_match === false && (
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          ⚠ Name mismatch — AI extracted name does not match booking driver name.
        </p>
      )}

      {/* Staff note */}
      <div>
        <label htmlFor={`note-${item.id}`} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Staff Note (optional)</label>
        <input id={`note-${item.id}`} className={inputCls} value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for rejection or correction note" />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => act('approve')}
          disabled={loading}
          className="flex-1 bg-[#407E3C] hover:bg-[#356834] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Saving…' : '✓ Verify & Approve'}
        </button>
        <button
          onClick={() => act('reject')}
          disabled={loading}
          className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

// ── Damage Review Card ─────────────────────────────────────────────────────

function DamageCard({ item, onAction }: { item: DamageReview; onAction: () => void }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'confirm_dispute' | 'dismiss' | 'partial') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/admin/api/admin/reviews/damage/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note || undefined }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Action failed. Please try again.')
        return
      }
      setDone(true)
      onAction()
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  const report = item.ai_damage_report
  const booking = item.booking
  const vehicle = booking?.vehicle

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1A1A1A] text-sm">
            {booking?.booking_ref ?? 'Unknown'} · {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration_plate})` : ''}
          </p>
          <p className="text-xs text-[#6B7280]">
            {booking ? `${booking.driver_first_name} ${booking.driver_last_name} — ${booking.driver_email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <ConfidencePill value={report.confidence} />
          <span className="text-xs text-[#9CA3AF] capitalize">{item.inspection_type}</span>
        </div>
      </div>

      {/* Photos */}
      {item.photo_urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {item.photo_urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-[#E5E7EB] hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* AI report */}
      <div className="bg-[#F9FAFB] rounded-lg p-3 space-y-2">
        {report.locations.length > 0 && (
          <p className="text-xs text-[#1A1A1A]">
            <span className="font-semibold">Locations: </span>{report.locations.join(', ')}
          </p>
        )}
        <p className="text-xs text-[#6B7280]">
          <span className="font-semibold text-[#1A1A1A]">AI assessment: </span>{report.reasoning}
        </p>
        {report.needs_human_review && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
            ⚠ Flagged for review — confidence below threshold
          </p>
        )}
      </div>

      {/* Staff note */}
      <div>
        <label htmlFor={`damage-note-${item.id}`} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Staff Note (optional)</label>
        <input
          id={`damage-note-${item.id}`}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add context for the booking record"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => act('confirm_dispute')}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Saving…' : 'Confirm Dispute'}
        </button>
        <button
          onClick={() => act('partial')}
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Partial
        </button>
        <button
          onClick={() => act('dismiss')}
          disabled={loading}
          className="px-4 py-2 bg-[#407E3C] hover:bg-[#356834] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          No Damage
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [tab, setTab] = useState<'licences' | 'damage'>('licences')
  const [licences, setLicences] = useState<LicenceReview[]>([])
  const [damage, setDamage] = useState<DamageReview[]>([])
  const [licenceTotal, setLicenceTotal] = useState(0)
  const [damageTotal, setDamageTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  function fetchAll() {
    setLoading(true)
    Promise.all([
      fetch('/admin/api/admin/reviews/licences').then(r => r.json()),
      fetch('/admin/api/admin/reviews/damage').then(r => r.json()),
    ]).then(([lData, dData]) => {
      setLicences(lData.licences ?? [])
      setLicenceTotal(lData.total ?? 0)
      setDamage(dData.inspections ?? [])
      setDamageTotal(dData.total ?? 0)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      tab === t
        ? 'bg-[#407E3C] text-white'
        : 'text-[#6B7280] hover:bg-[#F3F4F6]'
    }`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">AI Reviews</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Verify AI decisions before they take effect</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button className={tabCls('licences')} onClick={() => setTab('licences')}>
          Licence OCR
          {licenceTotal > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {licenceTotal}
            </span>
          )}
        </button>
        <button className={tabCls('damage')} onClick={() => setTab('damage')}>
          Damage Reports
          {damageTotal > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {damageTotal}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[#F3F4F6] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'licences' ? (
        licences.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <p className="text-lg font-medium">No pending licence reviews</p>
            <p className="text-sm mt-1">All submissions have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {licences.map(item => (
              <LicenceCard key={item.id} item={item} onAction={fetchAll} />
            ))}
          </div>
        )
      ) : (
        damage.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <p className="text-lg font-medium">No pending damage reviews</p>
            <p className="text-sm mt-1">All inspections have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {damage.map(item => (
              <DamageCard key={item.id} item={item} onAction={fetchAll} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
