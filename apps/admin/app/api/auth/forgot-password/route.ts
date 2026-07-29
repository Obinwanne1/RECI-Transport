import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

// In-memory rate limit: 3 attempts per IP per 15 minutes
// NOTE: resets on cold start — acceptable on free tier where volume is low
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 3

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: true }) // silent — don't reveal rate limiting
  }

  const body = await request.json().catch(() => ({}))
  const { email, redirectTo } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Validate redirectTo — only allow same origin to prevent open redirect in reset email
  const origin = request.nextUrl.origin
  const safeRedirectTo =
    redirectTo &&
    typeof redirectTo === 'string' &&
    (redirectTo.startsWith(`${origin}/`) || redirectTo.startsWith('http://localhost:'))
      ? redirectTo
      : `${origin}/auth/reset-password`

  const admin = createAdminClient()

  // Check role before sending reset email — only admin/staff allowed
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (profile && ['admin', 'staff'].includes(profile.role)) {
    // Use anon-key client to trigger Supabase's email sending pipeline
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: safeRedirectTo })
  }

  // Always 200 — never reveal whether email exists or is blocked
  return NextResponse.json({ ok: true })
}
