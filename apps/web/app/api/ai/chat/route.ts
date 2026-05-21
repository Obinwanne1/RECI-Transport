import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { logAICall } from '@/lib/ai-logger'
import { searchFaq } from '@/lib/faq-content'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
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

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

const MOCK_VEHICLES = [
  { id: 'mock-1', make: 'Volkswagen', model: 'Golf', year: 2023, fuel_type: 'petrol', transmission: 'manual', daily_rate: 49, category: { name: 'Economy', slug: 'economy', passenger_capacity: 5, luggage_capacity: 2 }, features: [], image_urls: [] },
  { id: 'mock-2', make: 'BMW', model: '3 Series', year: 2023, fuel_type: 'diesel', transmission: 'automatic', daily_rate: 89, category: { name: 'Compact', slug: 'compact', passenger_capacity: 5, luggage_capacity: 3 }, features: ['GPS', 'Heated seats'], image_urls: [] },
  { id: 'mock-3', make: 'Toyota', model: 'RAV4', year: 2022, fuel_type: 'hybrid', transmission: 'automatic', daily_rate: 119, category: { name: 'SUV', slug: 'suv', passenger_capacity: 7, luggage_capacity: 4 }, features: ['GPS', 'Roof rails'], image_urls: [] },
  { id: 'mock-4', make: 'Mercedes', model: 'Sprinter', year: 2022, fuel_type: 'diesel', transmission: 'manual', daily_rate: 149, category: { name: 'Van', slug: 'van', passenger_capacity: 3, luggage_capacity: 12 }, features: ['Cargo space'], image_urls: [] },
  { id: 'mock-5', make: 'Renault', model: 'Clio', year: 2023, fuel_type: 'electric', transmission: 'automatic', daily_rate: 59, category: { name: 'Economy', slug: 'economy', passenger_capacity: 5, luggage_capacity: 2 }, features: ['Fast charge'], image_urls: [] },
  { id: 'mock-6', make: 'Audi', model: 'Q5', year: 2023, fuel_type: 'petrol', transmission: 'automatic', daily_rate: 139, category: { name: 'SUV', slug: 'suv', passenger_capacity: 5, luggage_capacity: 4 }, features: ['GPS', 'Panoramic roof'], image_urls: [] },
]

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Economy', slug: 'economy', passenger_capacity: 5, luggage_capacity: 2, description: 'Compact city cars, great value' },
  { id: 'cat-2', name: 'Compact', slug: 'compact', passenger_capacity: 5, luggage_capacity: 3, description: 'Mid-size comfort for longer trips' },
  { id: 'cat-3', name: 'SUV', slug: 'suv', passenger_capacity: 7, luggage_capacity: 4, description: 'Spacious family vehicles, all-terrain capable' },
  { id: 'cat-4', name: 'Van', slug: 'van', passenger_capacity: 3, luggage_capacity: 12, description: 'High-capacity vans for moving and cargo' },
]

type ToolInput = {
  pickup_date?: string
  dropoff_date?: string
  category_slug?: string
  fuel_type?: string
  transmission?: string
}

type VehicleResult = {
  id: string
  make: string
  model: string
  year: number
  fuel_type: string
  transmission: string
  daily_rate: number | null
  category: {
    name: string
    slug: string
    passenger_capacity: number
    luggage_capacity: number
  }
  features: string[]
  image_urls: string[]
}

type SearchResult = {
  vehicles: VehicleResult[]
  search_params: {
    pickup_date?: string
    dropoff_date?: string
    category_slug?: string
    fuel_type?: string
    transmission?: string
  }
  count: number
}

async function toolSearchVehicles(input: ToolInput): Promise<SearchResult> {
  const { pickup_date, dropoff_date, category_slug, fuel_type, transmission } = input

  if (!SUPABASE_CONFIGURED) {
    let filtered = MOCK_VEHICLES as VehicleResult[]
    if (category_slug) filtered = filtered.filter((v) => v.category.slug === category_slug)
    if (fuel_type) filtered = filtered.filter((v) => v.fuel_type === fuel_type)
    if (transmission) filtered = filtered.filter((v) => v.transmission === transmission)
    return {
      vehicles: filtered,
      search_params: { pickup_date, dropoff_date, category_slug, fuel_type, transmission },
      count: filtered.length,
    }
  }

  const supabase = await createClient()

  let query = supabase
    .from('vehicles')
    .select(`
      id, make, model, year, fuel_type, transmission, image_urls, features, category_id,
      category:vehicle_categories(name, slug, passenger_capacity, luggage_capacity, pricing:pricing_rules(base_rate_per_day))
    `)
    .eq('is_active', true)

  if (category_slug) {
    const { data: catRow } = await supabase
      .from('vehicle_categories')
      .select('id')
      .eq('slug', category_slug)
      .single()
    if (catRow) query = query.eq('category_id', catRow.id)
  }

  if (fuel_type) query = query.eq('fuel_type', fuel_type)
  if (transmission) query = query.eq('transmission', transmission)

  const { data: vehicles, error } = await query
  if (error || !vehicles) return { vehicles: [], search_params: input, count: 0 }

  let available = vehicles

  if (pickup_date && dropoff_date) {
    const pickupTs = new Date(pickup_date).toISOString()
    const dropoffTs = new Date(dropoff_date).toISOString()

    const [{ data: booked }, { data: blocked }] = await Promise.all([
      supabase
        .from('bookings')
        .select('vehicle_id')
        .not('status', 'in', '("cancelled")')
        .lt('pickup_datetime', dropoffTs)
        .gt('dropoff_datetime', pickupTs),
      supabase
        .from('availability_blocks')
        .select('vehicle_id')
        .lt('start_date', dropoffTs)
        .gt('end_date', pickupTs),
    ])

    const unavailable = new Set([
      ...(booked ?? []).map((r) => r.vehicle_id),
      ...(blocked ?? []).map((r) => r.vehicle_id),
    ])
    available = available.filter((v) => !unavailable.has(v.id))
  }

  const result: VehicleResult[] = available.map((v) => {
    const cat = v.category as unknown as {
      name: string; slug: string; passenger_capacity: number; luggage_capacity: number
      pricing?: Array<{ base_rate_per_day: number }>
    } | null
    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      fuel_type: v.fuel_type,
      transmission: v.transmission,
      daily_rate: cat?.pricing?.[0]?.base_rate_per_day ?? null,
      category: {
        name: cat?.name ?? '',
        slug: cat?.slug ?? '',
        passenger_capacity: cat?.passenger_capacity ?? 0,
        luggage_capacity: cat?.luggage_capacity ?? 0,
      },
      features: v.features ?? [],
      image_urls: v.image_urls ?? [],
    }
  })

  return {
    vehicles: result,
    search_params: { pickup_date, dropoff_date, category_slug, fuel_type, transmission },
    count: result.length,
  }
}

async function toolGetCategories() {
  if (!SUPABASE_CONFIGURED) return MOCK_CATEGORIES

  const supabase = await createClient()
  const { data } = await supabase
    .from('vehicle_categories')
    .select('id, name, slug, passenger_capacity, luggage_capacity, description')
  return data ?? MOCK_CATEGORIES
}

function toolSearchFaq(input: { query: string }) {
  const results = searchFaq(input.query, 4)
  if (results.length === 0) {
    return { found: false, message: 'No matching FAQ entries. Answer from general knowledge or advise contacting support.' }
  }
  return {
    found: true,
    results: results.map((r) => ({
      category: r.category,
      question: r.question,
      answer: r.answer,
    })),
  }
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_vehicles',
    description:
      'Search available rental vehicles from the live fleet database. ALWAYS call this when the user asks about availability, specific vehicles, prices, or wants to find a car. Returns real-time results. Call with whatever filters you can infer — missing filters return all results.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pickup_date: { type: 'string', description: 'Pickup date YYYY-MM-DD. Omit if user did not specify.' },
        dropoff_date: { type: 'string', description: 'Dropoff date YYYY-MM-DD. Omit if user did not specify.' },
        category_slug: {
          type: 'string',
          enum: ['economy', 'compact', 'suv', 'van'],
          description: 'Infer from context: "van/moving" → van, "family/space" → suv, "city/small/cheap" → economy. Omit if unclear.',
        },
        fuel_type: {
          type: 'string',
          enum: ['petrol', 'diesel', 'electric', 'hybrid'],
          description: 'Only set if user explicitly asked for a fuel type.',
        },
        transmission: {
          type: 'string',
          enum: ['manual', 'automatic'],
          description: 'Only set if user explicitly asked.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_categories',
    description:
      'Get all vehicle categories available at RECI Transport with descriptions and capacities. Call when user asks what types of vehicles are offered, or when you need category info to answer a question.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_faq',
    description:
      'Search RECI Transport policy and FAQ knowledge base. Call this for ANY question about: cancellation, payment, deposit, insurance, CDW, driver age, licence requirements, fuel policy, mileage limits, opening hours, pickup/return rules, corporate accounts, damage, late returns. Do NOT guess policy details — always retrieve them.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The user question or key topic to search for (e.g. "cancellation policy", "deposit", "minimum age").',
        },
      },
      required: ['query'],
    },
  },
]

const SYSTEM_PROMPT = `You are an intelligent rental assistant for RECI Transport, a car rental company based in Berlin.

You have real-time access to fleet inventory AND policy/FAQ knowledge via tools. Use them — never guess.

Rules:
- ALWAYS call search_vehicles before answering availability or pricing questions
- ALWAYS call search_faq before answering policy, insurance, cancellation, licence, fuel, age, or hours questions
- Call get_categories when asked about vehicle types
- After vehicle results, summarise top 3: **Make Model** — €X/day · Fuel · X seats
- If 0 vehicles: say so honestly, suggest removing a filter or trying different dates
- Match the user's language: German query → German reply
- Be concise. No preamble. No restating the question.
- Relative dates: resolve against today (${new Date().toISOString().split('T')[0]})
- After showing results, offer to help narrow down or proceed to booking

Today: ${new Date().toISOString().split('T')[0]}
Location: Berlin HQ (all vehicles)`

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ChatResponse = {
  reply: string
  vehicles?: VehicleResult[]
  search_params?: {
    pickup_date?: string
    dropoff_date?: string
    category_slug?: string
    fuel_type?: string
    transmission?: string
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI chat unavailable' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 })
  }

  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content?.trim()) {
    return NextResponse.json({ error: 'Last message must be non-empty user message' }, { status: 400 })
  }
  if (lastMsg.content.length > 1000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const client = new Anthropic()

  // Build Anthropic messages array (map our simple format to SDK format)
  let anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let finalReply = ''
  let foundVehicles: VehicleResult[] = []
  let foundSearchParams: SearchResult['search_params'] | undefined

  // Agentic tool loop — max 5 iterations to prevent infinite loops
  for (let iteration = 0; iteration < 5; iteration++) {
    let response: Anthropic.Message
    try {
      response = await client.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: anthropicMessages,
        },
        { signal: AbortSignal.timeout(30_000) }
      )
    } catch (err) {
      console.error('[ai/chat] Claude API error:', err)
      return NextResponse.json({ error: 'AI chat failed' }, { status: 502 })
    }

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text')
      finalReply = textBlock?.type === 'text' ? textBlock.text : ''
      break
    }

    if (response.stop_reason === 'tool_use') {
      // Append assistant message (with tool_use blocks) to history
      anthropicMessages.push({ role: 'assistant', content: response.content })

      // Execute all tool calls, collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        let toolOutput: string

        try {
          if (block.name === 'search_vehicles') {
            const searchResult = await toolSearchVehicles(block.input as ToolInput)
            foundVehicles = searchResult.vehicles
            foundSearchParams = searchResult.search_params
            // Give Claude a concise summary — avoid sending full image_urls
            const summary = searchResult.vehicles.map((v) => ({
              id: v.id,
              name: `${v.make} ${v.model} ${v.year}`,
              category: v.category.slug,
              fuel_type: v.fuel_type,
              transmission: v.transmission,
              daily_rate: v.daily_rate,
              seats: v.category.passenger_capacity,
              features: v.features.slice(0, 3),
            }))
            toolOutput = JSON.stringify({ count: searchResult.count, vehicles: summary })
          } else if (block.name === 'get_categories') {
            const cats = await toolGetCategories()
            toolOutput = JSON.stringify(cats)
          } else if (block.name === 'search_faq') {
            const faqResult = toolSearchFaq(block.input as { query: string })
            toolOutput = JSON.stringify(faqResult)
          } else {
            toolOutput = JSON.stringify({ error: 'Unknown tool' })
          }
        } catch (err) {
          console.error(`[ai/chat] tool ${block.name} failed:`, err)
          toolOutput = JSON.stringify({ error: 'Tool execution failed' })
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: toolOutput,
        })
      }

      // Append tool results as user turn
      anthropicMessages.push({ role: 'user', content: toolResults })
      continue
    }

    // Unexpected stop reason
    console.error('[ai/chat] Unexpected stop_reason:', response.stop_reason)
    break
  }

  if (!finalReply) {
    return NextResponse.json({ error: 'AI did not produce a response' }, { status: 502 })
  }

  void logAICall({
    context: 'chat_agent',
    decision: {
      tool_called: foundVehicles.length > 0 ? 'search_vehicles' : 'none',
      results_count: foundVehicles.length,
      search_params: foundSearchParams ?? null,
    },
  })

  const resp: ChatResponse = {
    reply: finalReply,
    ...(foundVehicles.length > 0 && { vehicles: foundVehicles, search_params: foundSearchParams }),
  }

  return NextResponse.json(resp)
}
