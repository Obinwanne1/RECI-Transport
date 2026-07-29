// Unit tests for DB-backed rate limit logic (mocks Supabase)

jest.mock('../lib/supabase/admin-server', () => ({
  createAdminClient: jest.fn(),
}))

import { createAdminClient } from '../lib/supabase/admin-server'
import { checkDbRateLimit } from '../lib/rate-limit'

function makeMockSupabase(existing: { count: number; reset_at: string } | null) {
  const update = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({}) }) })
  const upsert = jest.fn().mockResolvedValue({})

  const selectChain = {
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: existing, error: null }),
  }

  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(selectChain),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({}) }) }),
      upsert,
    }),
    _upsert: upsert,
    _update: update,
  }
}

describe('checkDbRateLimit', () => {
  beforeEach(() => jest.clearAllMocks())

  test('allows first request (no existing record)', async () => {
    const mock = makeMockSupabase(null)
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const allowed = await checkDbRateLimit('1.2.3.4', '/api/ai/search', 5, 60_000)
    expect(allowed).toBe(true)
  })

  test('allows request under limit', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const mock = makeMockSupabase({ count: 3, reset_at: future })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const allowed = await checkDbRateLimit('1.2.3.4', '/api/ai/search', 5, 60_000)
    expect(allowed).toBe(true)
  })

  test('blocks request at limit', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const mock = makeMockSupabase({ count: 5, reset_at: future })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const allowed = await checkDbRateLimit('1.2.3.4', '/api/ai/search', 5, 60_000)
    expect(allowed).toBe(false)
  })

  test('resets window when reset_at is in the past', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    const mock = makeMockSupabase({ count: 5, reset_at: past })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    // count=5 (at limit) but window expired — should allow
    const allowed = await checkDbRateLimit('1.2.3.4', '/api/ai/search', 5, 60_000)
    expect(allowed).toBe(true)
  })

  test('fails open on Supabase error (does not block legitimate requests)', async () => {
    ;(createAdminClient as jest.Mock).mockImplementation(() => {
      throw new Error('DB down')
    })

    const allowed = await checkDbRateLimit('1.2.3.4', '/api/ai/search', 5, 60_000)
    expect(allowed).toBe(true)
  })
})
