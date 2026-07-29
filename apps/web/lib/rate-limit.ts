import { createAdminClient } from './supabase/admin-server'

export async function checkDbRateLimit(
  ip: string,
  endpoint: string,
  maxPerWindow: number,
  windowMs: number
): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    const resetAt = new Date(now.getTime() + windowMs).toISOString()

    const { data: existing } = await supabase
      .from('api_rate_limits')
      .select('count, reset_at')
      .eq('ip', ip)
      .eq('endpoint', endpoint)
      .single()

    if (!existing || new Date(existing.reset_at) < now) {
      await supabase
        .from('api_rate_limits')
        .upsert({ ip, endpoint, count: 1, reset_at: resetAt }, { onConflict: 'ip,endpoint' })
      return true
    }

    if (existing.count >= maxPerWindow) return false

    await supabase
      .from('api_rate_limits')
      .update({ count: existing.count + 1 })
      .eq('ip', ip)
      .eq('endpoint', endpoint)

    return true
  } catch {
    return true // fail open — don't block requests if rate limit check errors
  }
}
