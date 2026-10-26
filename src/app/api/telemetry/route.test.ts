import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { recordAnalyticsEvent } from '@/lib/db/analytics'
import { _resetRateLimitStore } from '@/lib/telemetry/rate-limiter'

vi.mock('@/lib/db/analytics', () => ({
  recordAnalyticsEvent: vi.fn(),
}))

describe('POST /api/telemetry route handler (covers: AC-7, AC-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetRateLimitStore()
  })

  function createRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
  }

  it('records valid telemetry event successfully (AC-7)', async () => {
    vi.mocked(recordAnalyticsEvent).mockResolvedValueOnce({
      id: 'event_123',
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: 'anon_1',
      metadata: null,
      createdAt: new Date(),
    })

    const req = createRequest({
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: 'anon_1',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'page_view',
        locale: 'en',
        path: '/en',
      }),
    )
  })

  it('rejects oversized payload exceeding 2KB with 400 (AC-8)', async () => {
    const hugeMetadata = { data: 'x'.repeat(2500) }
    const req = createRequest({
      name: 'page_view',
      locale: 'en',
      path: '/en',
      metadata: hugeMetadata,
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Payload Too Large')
  })

  it('returns 429 Too Many Requests when rate limit is exceeded (AC-8)', async () => {
    vi.mocked(recordAnalyticsEvent).mockResolvedValue({
      id: 'evt',
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: null,
      metadata: null,
      createdAt: new Date(),
    })

    const headers = { 'x-forwarded-for': '203.0.113.195' }

    // Send 100 requests
    for (let i = 0; i < 100; i++) {
      const req = createRequest({ name: 'page_view', locale: 'en', path: '/en' }, headers)
      const r = await POST(req)
      expect(r.status).toBe(200)
    }

    // 101st request should be rate limited
    const limitReq = createRequest({ name: 'page_view', locale: 'en', path: '/en' }, headers)
    const limitRes = await POST(limitReq)
    expect(limitRes.status).toBe(429)
    const json = await limitRes.json()
    expect(json.error).toBe('Too Many Requests')
    expect(limitRes.headers.get('Retry-After')).toBe('3600')
  })

  it('returns 400 Bad Request on invalid schema payload (AC-8)', async () => {
    const req = createRequest({
      name: 'INVALID NAME WITH SPACES',
      locale: 'en',
      path: '/en',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
