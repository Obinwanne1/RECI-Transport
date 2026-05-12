'use client'

import { useEffect, useState } from 'react'

export default function PricingPage() {
  const [rules, setRules] = useState<any[]>([])
  const [overrides, setOverrides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState({ category_id: '', base_rate_per_day: '', effective_from: new Date().toISOString().split('T')[0] })
  const [newOverride, setNewOverride] = useState({ name: '', start_date: '', end_date: '', surcharge_pct: '' })
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    load()
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
    load()
  }

  if (loading) return <div className="p-6 text-[#6B7280]">Loading…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Pricing</h1>

      {error && <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      {/* Base rates */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">Base Rates</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Category', '€/day', 'Effective from', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r: any) => {
                const cat = Array.isArray(r.category) ? r.category[0] : r.category
                return (
                  <tr key={r.id} className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-2.5">{cat?.name ?? r.category_id}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#407E3C]">€{Number(r.base_rate_per_day).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-[#6B7280] text-xs">{r.effective_from?.split('T')[0]}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => deleteRule(r.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Add rule form */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Add Rate</p>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={newRule.category_id}
              onChange={(e) => setNewRule({ ...newRule, category_id: e.target.value })}
              className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
            >
              <option value="">Category…</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="number"
              placeholder="€/day"
              value={newRule.base_rate_per_day}
              onChange={(e) => setNewRule({ ...newRule, base_rate_per_day: e.target.value })}
              className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
            />
            <input
              type="date"
              value={newRule.effective_from}
              onChange={(e) => setNewRule({ ...newRule, effective_from: e.target.value })}
              className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
            />
          </div>
          <button
            onClick={addRule}
            disabled={saving || !newRule.category_id || !newRule.base_rate_per_day}
            className="mt-3 bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            Add rate
          </button>
        </div>
      </section>

      {/* Seasonal overrides */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">Seasonal Overrides</h2>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Name', 'Start', 'End', 'Surcharge %', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overrides.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-[#6B7280] text-xs">No overrides.</td></tr>
              ) : overrides.map((o: any) => (
                <tr key={o.id} className="border-b border-[#F3F4F6]">
                  <td className="px-4 py-2.5 font-medium">{o.name}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] text-xs">{o.start_date}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] text-xs">{o.end_date}</td>
                  <td className="px-4 py-2.5 text-[#407E3C] font-semibold">+{o.surcharge_pct}%</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteOverride(o.id)} className="text-xs text-[#DC2626] hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Add Override</p>
          <div className="grid grid-cols-4 gap-3">
            <input placeholder="Name" value={newOverride.name} onChange={(e) => setNewOverride({ ...newOverride, name: e.target.value })} className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" />
            <input type="date" value={newOverride.start_date} onChange={(e) => setNewOverride({ ...newOverride, start_date: e.target.value })} className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" />
            <input type="date" value={newOverride.end_date} onChange={(e) => setNewOverride({ ...newOverride, end_date: e.target.value })} className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" />
            <input type="number" placeholder="Surcharge %" value={newOverride.surcharge_pct} onChange={(e) => setNewOverride({ ...newOverride, surcharge_pct: e.target.value })} className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]" />
          </div>
          <button
            onClick={addOverride}
            disabled={saving || !newOverride.name || !newOverride.start_date || !newOverride.end_date}
            className="mt-3 bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            Add override
          </button>
        </div>
      </section>
    </div>
  )
}
