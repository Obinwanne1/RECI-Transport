'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tier {
  id: string
  name: string
  slug: string
  min_lifetime_points: number
  color_hex: string
  perks: string[]
}

interface Transaction {
  id: string
  points: number
  type: 'earned' | 'redeemed' | 'adjusted'
  note: string | null
  created_at: string
  booking_id: string | null
}

interface LoyaltyData {
  points_balance: number
  lifetime_points: number
  tier: Tier | null
  next_tier: Tier | null
  points_to_next_tier: number
  tiers: Tier[]
  transactions: Transaction[]
}

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RewardsPage() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/loyalty')
      .then((r) => {
        if (r.status === 401) throw new Error('Please sign in to view your rewards.')
        if (!r.ok) throw new Error('Failed to load rewards')
        return r.json()
      })
      .then((d: LoyaltyData) => { setData(d); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-[#DC2626] font-medium mb-4">{error}</p>
        <Link href="/auth/login" className="btn-primary px-6 py-2 text-sm inline-block">Sign in</Link>
      </div>
    )
  }

  if (!data) return null

  const { points_balance, lifetime_points, tier, next_tier, points_to_next_tier, tiers, transactions } = data
  const progressPct = next_tier
    ? Math.min(100, Math.round(((lifetime_points - (tier?.min_lifetime_points ?? 0)) / (next_tier.min_lifetime_points - (tier?.min_lifetime_points ?? 0))) * 100))
    : 100

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-gray-100">RECI Rewards</h1>

      {/* Balance card */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tier?.color_hex ?? '#CD7F32'} 0%, ${tier?.color_hex ?? '#CD7F32'}cc 100%)` }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 bg-white translate-y-8 -translate-x-8" />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Available Points</p>
              <p className="text-5xl font-bold mt-1">{points_balance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">{lifetime_points.toLocaleString()} lifetime points</p>
            </div>
            <div className="text-right">
              <span className="text-3xl">{TIER_ICONS[tier?.slug ?? 'bronze']}</span>
              <p className="text-sm font-bold mt-1">{tier?.name ?? 'Bronze'}</p>
            </div>
          </div>

          <p className="text-xs opacity-70">100 points = €1 discount · Earn 1 point per €1 spent</p>
        </div>
      </div>

      {/* Tier progress */}
      <div className="card">
        <h2 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">Tier Progress</h2>

        {next_tier ? (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-[#1A1A1A] dark:text-gray-200">{tier?.name ?? 'Bronze'}</span>
              <span className="text-[#6B7280] dark:text-gray-400">{points_to_next_tier.toLocaleString()} pts to {next_tier.name}</span>
              <span className="font-medium" style={{ color: next_tier.color_hex }}>{next_tier.name}</span>
            </div>
            <div className="w-full bg-[#F3F4F6] dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: next_tier.color_hex }}
              />
            </div>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-2">{progressPct}% of the way to {next_tier.name}</p>
          </>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] dark:bg-green-900/20 border border-[#BBF7D0] dark:border-green-800 rounded-lg">
            <span className="text-2xl">💎</span>
            <div>
              <p className="font-semibold text-[#407E3C]">Platinum member</p>
              <p className="text-xs text-[#6B7280] dark:text-gray-400">You've reached our highest tier. Thank you!</p>
            </div>
          </div>
        )}
      </div>

      {/* Tiers overview */}
      <div className="card">
        <h2 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">All Tiers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiers.map((t) => {
            const isCurrent = t.id === tier?.id
            return (
              <div
                key={t.id}
                className={`rounded-xl p-3 border-2 transition-all ${isCurrent ? 'shadow-sm' : 'opacity-60'}`}
                style={{
                  borderColor: isCurrent ? t.color_hex : 'transparent',
                  backgroundColor: t.color_hex + '12',
                }}
              >
                <div className="text-2xl mb-1">{TIER_ICONS[t.slug]}</div>
                <p className="font-semibold text-sm text-[#1A1A1A] dark:text-gray-100">{t.name}</p>
                <p className="text-xs text-[#6B7280] dark:text-gray-400">{t.min_lifetime_points.toLocaleString()}+ pts</p>
                {isCurrent && (
                  <span className="inline-block mt-1 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color_hex }}>
                    Current
                  </span>
                )}
                <ul className="mt-2 space-y-0.5">
                  {t.perks.slice(0, 2).map((perk, i) => (
                    <li key={i} className="text-xs text-[#6B7280] dark:text-gray-400 flex gap-1">
                      <span style={{ color: t.color_hex }}>·</span> {perk}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-semibold text-[#1A1A1A] dark:text-gray-100 mb-4">Points History</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6B7280] dark:text-gray-400 text-sm">No transactions yet.</p>
            <Link href="/" className="btn-primary mt-4 px-6 py-2 text-sm inline-block">Book a car to earn points</Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6] dark:divide-gray-800">
            {transactions.map((tx) => (
              <li key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    tx.type === 'earned' ? 'bg-[#F0FDF4] text-[#407E3C]' : 'bg-red-50 text-[#DC2626]'
                  }`}>
                    {tx.type === 'earned' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-gray-200">
                      {tx.note ?? (tx.type === 'earned' ? 'Points earned' : 'Points redeemed')}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.points > 0 ? 'text-[#407E3C]' : 'text-[#DC2626]'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
