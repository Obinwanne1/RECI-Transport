import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin-server'

const client = new Anthropic()

const AgentResultSchema = z.object({
  approved: z.boolean(),
  reason: z.string(),
  flags: z.array(z.string()),
})

export type AgentResult = z.infer<typeof AgentResultSchema>

/**
 * Calls Claude to evaluate a booking against a corporate travel policy.
 * Updates bookings.ai_policy_decision with the result.
 * Non-blocking — on failure, logs error and returns null.
 */
export async function runCorporateAgent(bookingId: string): Promise<AgentResult | null> {
  const supabase = createAdminClient()

  // Fetch booking + corporate account
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_ref, total_price, pickup_datetime, dropoff_datetime,
      vehicle:vehicles(make, model, year, category:vehicle_categories(name, tier)),
      corporate:corporate_accounts(company_name, travel_policy, discount_pct, credit_limit),
      driver:user_profiles!bookings_user_id_fkey(role)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    console.error('[corporate-agent] failed to fetch booking:', error)
    return null
  }

  const corporateArr = booking.corporate as unknown as Array<{
    company_name: string
    travel_policy: string | null
    discount_pct: number
    credit_limit: number
  }>
  const corporate = Array.isArray(corporateArr) ? corporateArr[0] : corporateArr

  if (!corporate?.travel_policy) {
    // No policy defined — auto-approve
    const result: AgentResult = {
      approved: true,
      reason: 'No travel policy defined — auto-approved.',
      flags: [],
    }
    await supabase
      .from('bookings')
      .update({ ai_policy_decision: result })
      .eq('id', bookingId)
    return result
  }

  const vehicleArr = booking.vehicle as unknown as Array<{
    make: string; model: string; year: number
    category: Array<{ name: string; tier: string }> | { name: string; tier: string } | null
  }>
  const vehicle = Array.isArray(vehicleArr) ? vehicleArr[0] : vehicleArr
  const catRaw = vehicle?.category
  const category = Array.isArray(catRaw) ? catRaw[0] : catRaw

  const bookingContext = `
Company: ${corporate.company_name}
Employee role: ${(booking.driver as unknown as Array<{ role: string }>)?.[0]?.role ?? 'unknown'}
Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} (${category?.name ?? 'unknown'}, tier ${category?.tier ?? '?'})
Rental period: ${booking.pickup_datetime} → ${booking.dropoff_datetime}
Total cost: €${Number(booking.total_price).toFixed(2)}
Corporate credit limit: €${corporate.credit_limit}
`.trim()

  const systemPrompt = `You are a corporate travel policy enforcement agent.
Your job: evaluate a rental booking against the company's travel policy and return a JSON decision.

Return ONLY valid JSON with this exact shape:
{
  "approved": boolean,
  "reason": "one-sentence summary",
  "flags": ["specific violation or concern", ...]
}

approved=true if all policy rules are met.
approved=false if any rule is clearly violated.
flags should list specific issues (empty array if none).
Do not include markdown, code fences, or any text outside the JSON.`

  const userMessage = `Travel Policy:
${corporate.travel_policy}

Booking to evaluate:
${bookingContext}`

  try {
    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: AbortSignal.timeout(30_000) }
    )

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const parsed = AgentResultSchema.safeParse(JSON.parse(text))
    if (!parsed.success) {
      console.error('[corporate-agent] invalid response shape:', text)
      return null
    }

    await supabase
      .from('bookings')
      .update({ ai_policy_decision: parsed.data })
      .eq('id', bookingId)

    return parsed.data
  } catch (err) {
    console.error('[corporate-agent] Claude call failed:', err)
    return null
  }
}
