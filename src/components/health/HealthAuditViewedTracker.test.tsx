// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HealthAuditViewedTracker } from './HealthAuditViewedTracker'
import { trackEvent } from '@/lib/telemetry/client'

vi.mock('@/lib/telemetry/client', () => ({
  trackEvent: vi.fn(),
}))

describe('HealthAuditViewedTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fires health_audit_viewed once on mount, even after rerenders', async () => {
    const { rerender } = render(<HealthAuditViewedTracker locale="en" />)
    await rerender(<HealthAuditViewedTracker locale="en" />)

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith('health_audit_viewed', { locale: 'en' })
  })
})
