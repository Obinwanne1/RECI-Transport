'use client'

import { useEffect, useState } from 'react'

function AvailabilitySkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-1">
      <div className="h-10 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#F3F4F6] dark:bg-gray-800 rounded-lg w-full" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-1.5">{children}</label>
}

const inputCls = 'w-full border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-[#1A1A1A] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#407E3C] focus:border-transparent transition-colors'

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function blockDays(start: string, end: string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function blockStatus(start: string, end: string): { label: string; cls: string } {
  const now = new Date()
  if (now < new Date(start)) return { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  if (now > new Date(end))   return { label: 'Past',     cls: 'bg-[#F3F4F6] text-[#9CA3AF] dark:bg-gray-800 dark:text-gray-500' }
  return { label: 'Active', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

export default function AvailabilityPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ vehicle_id: '', start_date: '', end_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

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
    setConfirmId(null); load()
  }

  const previewDays = form.start_date && form.end_date && form.end_date >= form.start_date
    ? blockDays(form.start_date, form.end_date)
    : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100 tracking-tight">Availability Blocks</h1>
        <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-1">Prevent vehicles from being booked during specific date ranges.</p>
      </div>

      {/* Add block form */}
      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-4">Block Vehicle</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Vehicle</Label>
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={inputCls}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} · {v.registration_plate}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Start date</Label>
            <input type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <Label>End date</Label>
            <input type="date" value={form.end_date} min={form.start_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <Label>Reason (optional)</Label>
            <input type="text" placeholder="e.g. Maintenance, MOT, Private use" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputCls} />
          </div>
        </div>
        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={addBlock}
            disabled={saving || !form.vehicle_id || !form.start_date || !form.end_date}
            className="bg-[#407E3C] hover:bg-[#356834] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
          >
            {saving ? 'Saving…' : 'Block dates'}
          </button>
          {previewDays && (
            <p className="text-xs text-[#6B7280] dark:text-gray-400">{previewDays} day{previewDays !== 1 ? 's' : ''} blocked</p>
          )}
        </div>
      </div>

      {/* Blocks table */}
      <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#F3F4F6] dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-gray-100">Current Blocks</h2>
          {!loading && (
            <span className="text-xs text-[#6B7280] dark:text-gray-400">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="p-5"><AvailabilitySkeleton /></div>
        ) : blocks.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#6B7280] dark:text-gray-400">No availability blocks.</p>
            <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-1">All vehicles are bookable by default.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-gray-700 bg-[#F9FAFB] dark:bg-gray-800/50">
                {['Vehicle', 'Period', 'Days', 'Reason', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((b: any) => {
                const v = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
                const { label, cls } = blockStatus(b.start_date, b.end_date)
                const isConfirming = confirmId === b.id
                return (
                  <tr key={b.id} className="border-b border-[#F3F4F6] dark:border-gray-800 last:border-0">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A] dark:text-gray-100 whitespace-nowrap">
                      {v ? `${v.year} ${v.make} ${v.model}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs">
                      {blockDays(b.start_date, b.end_date)}d
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] dark:text-gray-400 text-xs max-w-[140px] truncate">
                      {b.reason ?? <span className="text-[#D1D5DB] dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isConfirming ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-[#6B7280] dark:text-gray-400">Remove?</span>
                          <button onClick={() => deleteBlock(b.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Yes</button>
                          <button onClick={() => setConfirmId(null)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F3F4F6] dark:bg-gray-800 text-[#374151] dark:text-gray-300 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(b.id)} className="text-xs text-[#DC2626] dark:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
