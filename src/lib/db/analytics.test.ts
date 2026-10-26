import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordAnalyticsEvent, pruneOldAnalyticsEvents, getAnalyticsEventCount } from './analytics'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsEvent: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Analytics Repository (covers: AC-7, AC-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records an analytics event successfully (covers: AC-9)', async () => {
    const mockCreated = {
      id: 'cuid_event_1',
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: 'anon_123',
      metadata: { referrer: 'direct' },
      createdAt: new Date(),
    }

    vi.mocked(prisma.analyticsEvent.create).mockResolvedValueOnce(mockCreated)

    const result = await recordAnalyticsEvent({
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: 'anon_123',
      metadata: { referrer: 'direct' },
    })

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        name: 'page_view',
        locale: 'en',
        path: '/en',
        anonymousId: 'anon_123',
        metadata: { referrer: 'direct' },
      },
    })
    expect(result.id).toBe('cuid_event_1')
  })

  it('prunes events older than 30 days (covers: AC-9)', async () => {
    vi.mocked(prisma.analyticsEvent.deleteMany).mockResolvedValueOnce({ count: 42 })

    const result = await pruneOldAnalyticsEvents(30)

    expect(prisma.analyticsEvent.deleteMany).toHaveBeenCalled()
    const callArgs = vi.mocked(prisma.analyticsEvent.deleteMany).mock.calls[0][0]
    expect((callArgs?.where?.createdAt as { lt?: Date })?.lt).toBeInstanceOf(Date)
    expect(result.count).toBe(42)
  })

  it('counts events optionally filtered by name', async () => {
    vi.mocked(prisma.analyticsEvent.count).mockResolvedValueOnce(15)

    const result = await getAnalyticsEventCount('studio_cta_clicked')

    expect(prisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: { name: 'studio_cta_clicked' },
    })
    expect(result).toBe(15)
  })
})
