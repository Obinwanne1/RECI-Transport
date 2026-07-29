import anthropic from '@/lib/anthropic'

type ImageSource =
  | { type: 'url'; url: string }
  | { type: 'base64'; media_type: string; data: string }

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource }

export interface VisionCallParams {
  systemPrompt: string
  maxTokens: number
  messages: Array<{ role: 'user'; content: ContentBlock[] }>
}

export async function callVisionAI(params: VisionCallParams): Promise<string> {
  const provider = process.env.AI_VISION_PROVIDER ?? 'anthropic'

  if (provider === 'openai-compatible') {
    return callOpenAICompatible(params)
  }

  // Default: Anthropic
  const message = await anthropic.messages.create(
    {
      model: process.env.AI_VISION_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: params.messages as Parameters<typeof anthropic.messages.create>[0]['messages'],
    },
    { signal: AbortSignal.timeout(30_000) }
  )

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
  return block.text
}

async function callOpenAICompatible(params: VisionCallParams): Promise<string> {
  const baseUrl = process.env.AI_VISION_BASE_URL
  const model = process.env.AI_VISION_MODEL ?? 'llava'

  if (!baseUrl) {
    throw new Error('AI_VISION_BASE_URL is required when AI_VISION_PROVIDER=openai-compatible')
  }

  const openaiMessages = params.messages.map((msg) => ({
    role: msg.role,
    content: msg.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text }
      }
      // Convert Anthropic image block to OpenAI image_url format
      const src = block.source
      const url =
        src.type === 'url'
          ? src.url
          : `data:${src.media_type};base64,${src.data}`
      return { type: 'image_url', image_url: { url } }
    }),
  }))

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AI_VISION_API_KEY
        ? { Authorization: `Bearer ${process.env.AI_VISION_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...openaiMessages,
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI-compatible provider error ${response.status}: ${err}`)
  }

  const json = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }

  const text = json.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from OpenAI-compatible provider')
  return text
}
