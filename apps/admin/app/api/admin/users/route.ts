import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

async function assertCallerIsAdmin(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = createAdminClient()

  let query = supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, role, password_reset_required, created_at', { count: 'exact' })
    .in('role', ['admin', 'staff'])
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    const safe = search.replace(/[,()]/g, '')
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data, total: count ?? 0, page, per_page: perPage })
}

const CreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['staff', 'admin']),
})

export async function POST(request: NextRequest) {
  if (!(await assertCallerIsAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Generate temp password — shown once, never stored in plain text
  const tempPassword = `Reci-${crypto.randomUUID().slice(0, 8).toUpperCase()}!`

  const supabase = createAdminClient()

  // Step 1: create auth user (email_confirm=true skips verification email)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Step 2: update profile — handle_new_user() trigger created it with role='customer'
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      role: parsed.data.role,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      password_reset_required: true,
    })
    .eq('id', authData.user.id)

  if (profileError) {
    // Compensating action: remove auth user to avoid orphan with wrong role
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json(
    { id: authData.user.id, email: parsed.data.email, temp_password: tempPassword },
    { status: 201 }
  )
}
