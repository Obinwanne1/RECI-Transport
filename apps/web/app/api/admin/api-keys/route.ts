import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-server'
import { getUserFromRequest } from '@/lib/supabase/server'

async function assertAdmin(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin' && data?.role !== 'staff') return null
  return user
}

export async function GET(request: NextRequest) {
  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, owner_name, created_at, revoked_at, requests_today, last_reset_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  let body: { owner_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.owner_name?.trim()) {
    return NextResponse.json({ error: 'owner_name required' }, { status: 400 })
  }

  // Generate a secure random key — shown once, never stored in plain text
  const rawKey = `reci_${crypto.randomUUID().replace(/-/g, '')}`

  const encoder = new TextEncoder()
  const keyBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
  const keyHash = Array.from(new Uint8Array(keyBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ key_hash: keyHash, owner_name: body.owner_name.trim() })
    .select('id, owner_name, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })

  // Return raw key ONCE — not stored, cannot be retrieved again
  return NextResponse.json({ ...data, key: rawKey }, { status: 201 })
}
