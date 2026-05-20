import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'

async function handleApiKeyAuth(request: NextRequest): Promise<NextResponse> {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required. Send x-api-key header.' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  const keyBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey))
  const keyHash = Array.from(new Uint8Array(keyBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const supabase = createAdminClient()
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('id, revoked_at, requests_today, last_reset_at')
    .eq('key_hash', keyHash)
    .single()

  if (!keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  if (keyRow.revoked_at) return NextResponse.json({ error: 'API key revoked' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  if (keyRow.last_reset_at < today) {
    await supabase.from('api_keys').update({ requests_today: 0, last_reset_at: today }).eq('id', keyRow.id)
    keyRow.requests_today = 0
  }

  const DAILY_LIMIT = 100
  if (keyRow.requests_today >= DAILY_LIMIT) {
    const midnight = new Date()
    midnight.setUTCHours(24, 0, 0, 0)
    const retryAfter = Math.ceil((midnight.getTime() - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Daily rate limit exceeded (100 req/day)' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  void supabase.from('api_keys').update({ requests_today: keyRow.requests_today + 1 }).eq('id', keyRow.id)
  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  // White-label API: API key auth, no session needed
  if (request.nextUrl.pathname.startsWith('/api/v1/ai/')) {
    return handleApiKeyAuth(request)
  }

  if (!SUPABASE_CONFIGURED) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  // Refresh session — MUST call getUser() not getSession() per Supabase SSR docs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && path.startsWith('/account')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Force password reset for admin-created accounts accessing frontend
  if (user && path.startsWith('/account')) {
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('password_reset_required')
      .eq('id', user.id)
      .single()

    if (profile?.password_reset_required) {
      const resetUrl = request.nextUrl.clone()
      resetUrl.pathname = '/auth/reset-password'
      resetUrl.searchParams.set('required', 'true')
      return NextResponse.redirect(resetUrl)
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (path === '/auth/login' || path === '/auth/register')) {
    const accountUrl = request.nextUrl.clone()
    accountUrl.pathname = '/account/bookings'
    return NextResponse.redirect(accountUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/api/v1/ai/:path*', '/account/:path*', '/auth/login', '/auth/register'],
}
