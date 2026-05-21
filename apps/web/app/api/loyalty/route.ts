import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Fetch loyalty account with tier
  const { data: account } = await supabase
    .from('loyalty_accounts')
    .select(`
      points_balance,
      lifetime_points,
      created_at,
      tier:loyalty_tiers(id, name, slug, color_hex, perks, min_lifetime_points)
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch all tiers for progress calculation
  const { data: tiers } = await supabase
    .from('loyalty_tiers')
    .select('id, name, slug, min_lifetime_points, color_hex, perks')
    .order('min_lifetime_points', { ascending: true })

  // Recent transactions (last 20)
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('id, points, type, note, created_at, booking_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const lifetimePoints = account?.lifetime_points ?? 0
  const pointsBalance = account?.points_balance ?? 0

  // Determine next tier
  const sortedTiers = (tiers ?? []).sort((a, b) => a.min_lifetime_points - b.min_lifetime_points)
  const currentTier = (account?.tier as unknown as { id: string; name: string; slug: string; color_hex: string; perks: string[]; min_lifetime_points: number } | null) ?? null
  const nextTier = sortedTiers.find((t) => t.min_lifetime_points > lifetimePoints) ?? null
  const pointsToNextTier = nextTier ? nextTier.min_lifetime_points - lifetimePoints : 0

  return NextResponse.json({
    points_balance: pointsBalance,
    lifetime_points: lifetimePoints,
    tier: currentTier,
    next_tier: nextTier,
    points_to_next_tier: pointsToNextTier,
    tiers: sortedTiers,
    transactions: transactions ?? [],
  })
}
