import { describe, it, expect } from 'vitest'
import { TelemetryEventSchema } from './telemetry'

describe('TelemetryEventSchema (covers: AC-7, AC-8)', () => {
  it('validates standard valid telemetry event', () => {
    const valid = {
      name: 'page_view',
      locale: 'en',
      path: '/en',
      anonymousId: 'anon_12345',
      metadata: { referrer: 'google.com', screenWidth: 1440 },
    }
    const result = TelemetryEventSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('validates Arabic locale event', () => {
    const valid = {
      name: 'benchmark_preset_selected',
      locale: 'ar',
      path: '/ar',
      anonymousId: 'anon_ar_789',
      metadata: { presetId: 'frontend_developer' },
    }
    const result = TelemetryEventSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects invalid event name format', () => {
    const invalid = {
      name: 'INVALID NAME WITH SPACES',
      locale: 'en',
      path: '/en',
    }
    const result = TelemetryEventSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects event name longer than 64 characters', () => {
    const invalid = {
      name: 'a'.repeat(65),
      locale: 'en',
      path: '/en',
    }
    const result = TelemetryEventSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects locale longer than 8 characters', () => {
    const invalid = {
      name: 'page_view',
      locale: 'en-US-long-invalid',
      path: '/en',
    }
    const result = TelemetryEventSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects path longer than 255 characters', () => {
    const invalid = {
      name: 'page_view',
      locale: 'en',
      path: '/' + 'a'.repeat(256),
    }
    const result = TelemetryEventSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
