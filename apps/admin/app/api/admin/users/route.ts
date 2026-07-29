import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdminOnly } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await assertAdminOnly()
  if (!session.authorized) return session.response

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
    const safe = search.replace(/[^a-zA-Z0-9 @.\-]/g, '').slice(0, 100)
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
  const session = await assertAdminOnly()
  if (!session.authorized) return session.response

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

  // Check if auth user already exists for this email
  const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingAuthUser = existingUsers.find((u) => u.email === parsed.data.email)

  let userId: string

  if (existingAuthUser) {
    // User already exists — update their password and set reset flag
    userId = existingAuthUser.id
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
      },
    })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }
  } else {
    // New user — create auth entry (email_confirm=true skips verification email)
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
    userId = authData.user.id
  }

  // Update profile — role + names + force reset flag
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      role: parsed.data.role,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      password_reset_required: true,
    })
    .eq('id', userId)

  if (profileError) {
    // Compensating action for new users only — existing users keep their original state
    if (!existingAuthUser) {
      await supabase.auth.admin.deleteUser(userId)
    }
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json(
    { id: userId, email: parsed.data.email, temp_password: tempPassword },
    { status: 201 }
  )
}
