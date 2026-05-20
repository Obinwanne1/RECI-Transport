import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all auth pages through (login, forgot-password, reset-password)
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  if (!SUPABASE_CONFIGURED) return NextResponse.next()

  const response = NextResponse.next({ request })

  // SSR client to check session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Role check via service role client
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role, password_reset_required')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const loginUrl = new URL('/auth/login?error=unauthorized', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Force password reset for admin-created accounts on first login
  if (profile.password_reset_required && !pathname.startsWith('/auth/reset-password')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Password reset required' }, { status: 403 })
    }
    const resetUrl = new URL('/auth/reset-password', request.url)
    resetUrl.searchParams.set('required', 'true')
    return NextResponse.redirect(resetUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
