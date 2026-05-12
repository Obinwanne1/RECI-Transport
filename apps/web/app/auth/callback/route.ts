import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/bookings'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] code exchange failed:', error.message)
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
