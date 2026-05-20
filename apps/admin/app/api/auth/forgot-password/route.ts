import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, redirectTo } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

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
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  }

  // Always 200 — never reveal whether email exists or is blocked
  return NextResponse.json({ ok: true })
}
