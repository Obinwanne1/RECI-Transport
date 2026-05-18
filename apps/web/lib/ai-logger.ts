import { createAdminClient } from '@/lib/supabase/admin-server'

export interface AILogEntry {
  bookingId?: string
  context: string
  decision: Record<string, unknown>
  confidence?: number
  modelUsed?: string
  inputHash?: string
}

/**
 * Non-blocking audit logger for all AI feature calls.
 * Fire-and-forget — never blocks the main response.
 * Call as: void logAICall({ ... })
 */
export function logAICall(entry: AILogEntry): void {
  const supabase = createAdminClient()

  supabase
    .from('ai_conversations')
    .insert({
      booking_id: entry.bookingId ?? null,
      context: entry.context,
      decision: entry.decision,
      model_used: entry.modelUsed ?? 'claude-sonnet-4-6',
      confidence: entry.confidence ?? null,
      input_hash: entry.inputHash ?? null,
      // Required by existing schema
      session_id: crypto.randomUUID(),
      messages: [],
    })
    .then(({ error }) => {
      if (error) console.error('[ai-logger] failed to log:', error.message)
    })
}

/**
 * SHA-256 hash of a string — used for input_hash to detect duplicate calls.
 * Server-safe: uses Node's crypto.subtle available in Next.js edge/server.
 */
export async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
