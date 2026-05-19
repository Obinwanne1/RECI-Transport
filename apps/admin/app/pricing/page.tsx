'use client'

import { useEffect, useState } from 'react'

function PricingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-1">
      <div className="h-10 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg w-full" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1.5">{children}</label>
}

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'

function getOverrideStatus(start: string, end: string): { label: string; cls: string } {
  const now = new Date()
  const s = new Date(start)
  const e = new Date(end)
  if (now < s) return { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  if (now > e) return { label: 'Expired',  cls: 'bg-[#F3F4F6] text-[#9CA3AF] dark:bg-gray-800 dark:text-gray-500' }
  return { label: 'Active', cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PricingPage() {
  const [rules, setRules] = useState<any[]>([])
  const [overrides, setOverrides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState({ category_id: '', base_rate_per_day: '', effective_from: new Date().toISOString().split('T')[0] })
  const [newOverride, setNewOverride] = useState({ name: '', start_date: '', end_date: '', surcharge_pct: '' })
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [rulesRes, overridesRes, catRes] = await Promise.all([
      fetch('/api/admin/pricing-rules').then((r) => r.json()),
      fetch('/api/admin/pricing-overrides').then((r) => r.json()),
      fetch('/api/admin/categories-locations').then((r) => r.json()),
    ])
    setRules(Array.isArray(rulesRes) ? rulesRes : [])
    setOverrides(Array.isArray(overridesRes) ? overridesRes : [])
    setCategories(catRes.categories ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addRule() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/pricing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRule, base_rate_per_day: parseFloat(newRule.base_rate_per_day) }),
    })
    const d = await res.json()
    if (!res.ok) setError(d.error ?? 'Failed')
    else { setNewRule({ category_id: '', base_rate_per_day: '', effective_from: new Date().toISOString().split('T')[0] }); load() }
    setSaving(false)
  }

  async function deleteRule(id: string) {
    await fetch(`/api/admin/pricing-rules/${id}`, { method: 'DELETE' })
    setConfirmId(null); load()
  }

  async function addOverride() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/pricing-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newOverride, surcharge_pct: parseFloat(newOverride.surcharge_pct) }),
    })
    const d = await res.json()
    if (!res.ok) setError(d.error ?? 'Failed')
    else { setNewOverride({ name: '', start_date: '', end_date: '', surcharge_pct: '' }); load() }
    setSaving(false)
  }

  async function deleteOverride(id: string) {
    await fetch(`/api/admin/pricing-overrides/${id}`, { method: 'DELETE' })
    setConfirmId(null); load()
  }

  const latestPerCategory: Record<string, string> = {}
  rules.forEach((r: any) => {
    if (!latestPerCategory[r.category_id] || r.effective_from > latestPerCategory[r.category_id]) {
      latestPerCategory[r.category_id] = r.effective_from
    }
  })

  function DeleteActions({ id, onConfirm }: { id: string; onConfirm: () => void }) {
    if (confirmId === id) {
      return (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[#6B7280] dark:text-gray-400">Delete?</span>
          <button onClick={onConfirm} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Yes</button>
          <button onClick={() => setConfirmId(null)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 transition-colors">No</button>
        </div>
      )
    }
    return (
      <button onClick={() => setConfirmId(id)} className="text-xs text-[#DC2626] dark:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
        Delete
      </button>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Pricing</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">Base rates per category and seasonal surcharges</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Base Rates */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-gray-100">Base Rates</h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">Per-category daily rate. Latest effective date wins.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4"><PricingSkeleton /></div>
          ) : rules.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#6B7280] dark:text-gray-400">No base rates configured.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
                  {['Category', '€/day', 'Effective', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((r: any) => {
                  const cat = Array.isArray(r.category) ? r.category[0] : r.category
                  const isCurrent = latestPerCategory[r.category_id] === r.effective_from
                  return (
                    <tr key={r.id} className="border-b border-[#F3F4F6] dark:border-gray-800 last:border-0">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A] dark:text-gray-100">{cat?.name ?? r.category_id}</td>
                      <td className="px-4 py-3 font-bold text-[#407E3C]">€{Number(r.base_rate_per_day).toFixed(2)}</td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs font-mono">{r.effective_from?.split('T')[0]}</td>
                      <td className="px-4 py-3">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Current
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-gray-800">Superseded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteActions id={r.id} onConfirm={() => deleteRule(r.id)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-4">Add Base Rate</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <select value={newRule.category_id} onChange={(e) => setNewRule({ ...newRule, category_id: e.target.value })} className={inputCls}>
                <option value="">Select category…</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Rate (€/day)</Label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={newRule.base_rate_per_day}
                onChange={(e) => setNewRule({ ...newRule, base_rate_per_day: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>Effective from</Label>
              <input type="date" value={newRule.effective_from}
                onChange={(e) => setNewRule({ ...newRule, effective_from: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={addRule}
              disabled={saving || !newRule.category_id || !newRule.base_rate_per_day}
              className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              {saving ? 'Saving…' : 'Add rate'}
            </button>
            {newRule.base_rate_per_day && newRule.category_id && (
              <p className="text-xs text-[#6B7280] dark:text-gray-400">Preview: €{Number(newRule.base_rate_per_day || 0).toFixed(2)}/day</p>
            )}
          </div>
        </div>
      </section>

      {/* Seasonal Overrides */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-gray-100">Seasonal Overrides</h2>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">Surcharge % applied on top of base rate during date ranges.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-4"><PricingSkeleton /></div>
          ) : overrides.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#6B7280] dark:text-gray-400">No seasonal overrides.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
                  {['Name', 'Period', 'Surcharge', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overrides.map((o: any) => {
                  const { label, cls } = getOverrideStatus(o.start_date, o.end_date)
                  return (
                    <tr key={o.id} className="border-b border-[#F3F4F6] dark:border-gray-800 last:border-0">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A] dark:text-gray-100">{o.name}</td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs whitespace-nowrap">{fmtDate(o.start_date)} – {fmtDate(o.end_date)}</td>
                      <td className="px-4 py-3 font-bold text-[#F97316]">+{o.surcharge_pct}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteActions id={o.id} onConfirm={() => deleteOverride(o.id)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-4">Add Override</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Override name</Label>
              <input placeholder="e.g. Summer Peak" value={newOverride.name}
                onChange={(e) => setNewOverride({ ...newOverride, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>Surcharge %</Label>
              <input type="number" min="0" step="0.1" placeholder="e.g. 25" value={newOverride.surcharge_pct}
                onChange={(e) => setNewOverride({ ...newOverride, surcharge_pct: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>Start date</Label>
              <input type="date" value={newOverride.start_date}
                onChange={(e) => setNewOverride({ ...newOverride, start_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>End date</Label>
              <input type="date" value={newOverride.end_date} min={newOverride.start_date}
                onChange={(e) => setNewOverride({ ...newOverride, end_date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={addOverride}
              disabled={saving || !newOverride.name || !newOverride.start_date || !newOverride.end_date || !newOverride.surcharge_pct}
              className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              {saving ? 'Saving…' : 'Add override'}
            </button>
            {newOverride.surcharge_pct && (
              <p className="text-xs text-[#6B7280] dark:text-gray-400">+{newOverride.surcharge_pct}% surcharge applied</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
