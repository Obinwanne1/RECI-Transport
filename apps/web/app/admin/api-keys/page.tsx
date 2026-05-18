'use client'

import { useEffect, useState } from 'react'

interface ApiKey {
  id: string
  owner_name: string
  created_at: string
  revoked_at: string | null
  requests_today: number
  last_reset_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchKeys() {
    const res = await fetch('/api/admin/api-keys')
    if (res.ok) setKeys(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchKeys() }, [])

  async function handleGenerate() {
    if (!newKeyName.trim()) return
    setGenerating(true)
    setError(null)
    setGeneratedKey(null)

    const res = await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_name: newKeyName.trim() }),
    })

    if (res.ok) {
      const data = await res.json()
      setGeneratedKey(data.key)
      setNewKeyName('')
      fetchKeys()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to generate key')
    }
    setGenerating(false)
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/admin/api-keys/${id}`, { method: 'PATCH' })
    fetchKeys()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">White-label API Keys</h1>
      <p className="text-sm text-[#6B7280] mb-8">
        Issue API keys for external partners to access RECI&apos;s AI endpoints. Limit: 100 req/day per key.
      </p>

      {/* Generate new key */}
      <div className="card mb-8">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Generate New Key</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Partner / owner name (e.g. BerlinRentals GmbH)"
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !newKeyName.trim()}
            className="btn-primary px-5 disabled:opacity-50"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : 'Generate'}
          </button>
        </div>
        {error && <p className="text-sm text-[#DC2626] mt-2">{error}</p>}
      </div>

      {/* Generated key — shown once */}
      {generatedKey && (
        <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-card">
          <p className="text-sm font-semibold text-[#407E3C] mb-2">
            ✓ Key generated — copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white border border-[#E5E7EB] rounded px-3 py-2 text-sm font-mono text-[#1A1A1A] break-all">
              {generatedKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(generatedKey)}
              className="shrink-0 px-3 py-2 text-sm border border-[#407E3C] text-[#407E3C] rounded-md hover:bg-[#F0FDF4] transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Send as: <code className="bg-white border border-[#E5E7EB] rounded px-1 py-0.5">x-api-key: {generatedKey.slice(0, 20)}…</code>
          </p>
        </div>
      )}

      {/* Keys table */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Active Keys</h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-6">No keys generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Owner</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Created</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Req Today</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {keys.map((k) => (
                  <tr key={k.id} className={k.revoked_at ? 'opacity-50' : ''}>
                    <td className="py-3 px-3 font-medium text-[#1A1A1A]">{k.owner_name}</td>
                    <td className="py-3 px-3 text-[#6B7280]">
                      {new Date(k.created_at).toLocaleDateString('en-DE')}
                    </td>
                    <td className="py-3 px-3 text-[#6B7280]">
                      {k.revoked_at ? '—' : `${k.requests_today} / 100`}
                    </td>
                    <td className="py-3 px-3">
                      {k.revoked_at ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[#DC2626] border border-red-200">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#407E3C] border border-[#BBF7D0]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!k.revoked_at && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="text-xs text-[#DC2626] hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
