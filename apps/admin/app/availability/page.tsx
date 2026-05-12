'use client'

import { useEffect, useState } from 'react'

export default function AvailabilityPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ vehicle_id: '', start_date: '', end_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [blocksRes, vehiclesRes] = await Promise.all([
      fetch('/api/admin/availability-blocks').then((r) => r.json()),
      fetch('/api/admin/vehicles').then((r) => r.json()),
    ])
    setBlocks(Array.isArray(blocksRes) ? blocksRes : [])
    setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes.filter((v: any) => v.is_active) : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addBlock() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/availability-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (!res.ok) setError(d.error ?? 'Failed')
    else { setForm({ vehicle_id: '', start_date: '', end_date: '', reason: '' }); load() }
    setSaving(false)
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/admin/availability-blocks/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-6 text-[#6B7280]">Loading…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Availability Blocks</h1>

      {/* Add block form */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Block Vehicle</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
          >
            <option value="">Vehicle…</option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} · {v.registration_plate}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#407E3C]"
          />
        </div>
        {error && <p className="mt-2 text-xs text-[#DC2626]">{error}</p>}
        <button
          onClick={addBlock}
          disabled={saving || !form.vehicle_id || !form.start_date || !form.end_date}
          className="mt-3 bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Block dates'}
        </button>
      </div>

      {/* Blocks table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['Vehicle', 'Start', 'End', 'Reason', ''].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6B7280]">No blocks.</td></tr>
            ) : blocks.map((b: any) => {
              const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
              return (
                <tr key={b.id} className="border-b border-[#F3F4F6]">
                  <td className="px-4 py-2.5 font-medium">{v ? `${v.year} ${v.make} ${v.model}` : '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{b.start_date}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{b.end_date}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{b.reason ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => deleteBlock(b.id)} className="text-xs text-[#DC2626] hover:underline">Remove</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
