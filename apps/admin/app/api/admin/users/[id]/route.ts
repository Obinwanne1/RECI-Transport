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

const PatchUserSchema = z.object({
  role: z.enum(['staff', 'admin']).optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await assertCallerIsAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify target is an internal user
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', params.id)
    .single()

  if (!existing || !['admin', 'staff'].includes(existing.role)) {
    return NextResponse.json({ error: 'User not found or not an internal user' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(parsed.data)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await assertCallerIsAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Verify target is an internal user before deleting
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', params.id)
    .single()

  if (!existing || !['admin', 'staff'].includes(existing.role)) {
    return NextResponse.json({ error: 'User not found or not an internal user' }, { status: 404 })
  }

  // Hard-delete from auth — cascades to user_profiles via ON DELETE CASCADE
  const { error } = await supabase.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
