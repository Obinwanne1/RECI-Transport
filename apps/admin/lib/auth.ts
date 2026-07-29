import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type AdminRole = 'admin' | 'staff'

export interface AuthorizedSession {
  authorized: true
  userId: string
  role: AdminRole
}

export interface UnauthorizedSession {
  authorized: false
  response: NextResponse
}

export type SessionResult = AuthorizedSession | UnauthorizedSession

export async function assertAdminSession(): Promise<SessionResult> {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    return { authorized: true, userId: user.id, role: profile.role as AdminRole }
  } catch {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export async function assertAdminOnly(): Promise<SessionResult> {
  const result = await assertAdminSession()
  if (!result.authorized) return result
  if (result.role !== 'admin') {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 }) }
  }
  return result
}
