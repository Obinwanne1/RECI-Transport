import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-server'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 3
const ipCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

const CreateCorporateSchema = z.object({
  company_name: z.string().min(2, 'Company name required'),
  company_registration: z.string().optional(),
  vat_number: z.string().optional(),
  billing_address: z.string().min(5, 'Billing address required'),
  billing_email: z.string().email('Valid billing email required'),
  travel_policy: z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('corporate_account_id, corporate_application_status')
    .eq('id', user.id)
    .single()

  if (!profile?.corporate_account_id) {
    return NextResponse.json({
      account: null,
      application_status: profile?.corporate_application_status ?? 'none',
    })
  }

  const { data: account, error } = await supabase
    .from('corporate_accounts')
    .select('id, company_name, company_registration, vat_number, billing_address, billing_email, discount_pct, credit_limit, payment_terms_days, travel_policy, is_active')
    .eq('id', profile.corporate_account_id)
    .single()

  if (error || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  return NextResponse.json({ account, application_status: 'approved' })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only one corporate account per user
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('corporate_account_id, corporate_application_status')
    .eq('id', user.id)
    .single()

  if (profile?.corporate_account_id) {
    return NextResponse.json({ error: 'Already linked to a corporate account' }, { status: 409 })
  }
  if (profile?.corporate_application_status === 'pending') {
    return NextResponse.json({ error: 'Application already pending' }, { status: 409 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateCorporateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()

  // Create corporate account (discount_pct=0 until admin sets it)
  const { data: account, error: accountErr } = await admin
    .from('corporate_accounts')
    .insert({
      company_name: parsed.data.company_name,
      company_registration: parsed.data.company_registration ?? null,
      vat_number: parsed.data.vat_number ?? null,
      billing_address: parsed.data.billing_address,
      billing_email: parsed.data.billing_email,
      travel_policy: parsed.data.travel_policy ?? null,
      discount_pct: 0,
    })
    .select('id')
    .single()

  if (accountErr || !account) {
    console.error('[corporate] insert error:', accountErr)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  // Link user to account + set role to corporate_manager
  await admin
    .from('user_profiles')
    .update({
      corporate_account_id: account.id,
      role: 'corporate_manager',
      corporate_application_status: 'approved',
    })
    .eq('id', user.id)

  return NextResponse.json({ account_id: account.id }, { status: 201 })
}
