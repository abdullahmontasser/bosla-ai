import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  hashClientIdentifier,
  isRateLimited,
  recordFailedAttempt,
  clearRateLimit,
  _resetRateLimitStore,
} from './rate-limiter'

describe('Telemetry Rate Limiter (covers: AC-8)', () => {
  beforeEach(() => {
    _resetRateLimitStore()
  })

  it('hashes client IP address into one-way sha256 hash without plain IP disclosure', () => {
    const rawIp = '192.168.1.100'
    const hash1 = hashClientIdentifier(rawIp)
    const hash2 = hashClientIdentifier(rawIp)
    expect(hash1).toBe(hash2)
    expect(hash1).not.toContain(rawIp)
    expect(hash1.length).toBe(32)
  })

  it('allows requests within limit of 100 requests per hour', () => {
    const clientId = 'client_test_1'
    for (let i = 0; i < 50; i++) {
      const result = checkRateLimit(clientId, 100, 3600000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(100 - (i + 1))
    }
  })

  it('blocks requests exceeding 100 requests per hour', () => {
    const clientId = 'client_test_heavy'
    for (let i = 0; i < 100; i++) {
      checkRateLimit(clientId, 100, 3600000)
    }

    const blockedResult = checkRateLimit(clientId, 100, 3600000)
    expect(blockedResult.allowed).toBe(false)
    expect(blockedResult.remaining).toBe(0)
  })

  it('tracks distinct clients separately', () => {
    const clientA = 'client_a'
    const clientB = 'client_b'

    for (let i = 0; i < 100; i++) {
      checkRateLimit(clientA, 100, 3600000)
    }

    expect(checkRateLimit(clientA, 100, 3600000).allowed).toBe(false)
    expect(checkRateLimit(clientB, 100, 3600000).allowed).toBe(true)
  })

  describe('Auth failure tracking and lockout (covers: Hardening Item 1)', () => {
    it('accurately locks out after 5 failed attempts and clears on success', () => {
      const authKey = 'auth_user_test'
      expect(isRateLimited(authKey, 5)).toBe(false)

      // First 4 failed attempts allow further tries
      for (let i = 1; i <= 4; i++) {
        const res = recordFailedAttempt(authKey, 5, 15 * 60 * 1000)
        expect(res.allowed).toBe(true)
        expect(res.remaining).toBe(5 - i)
        expect(isRateLimited(authKey, 5)).toBe(false)
      }

      // 5th failed attempt triggers lockout
      const fifth = recordFailedAttempt(authKey, 5, 15 * 60 * 1000)
      expect(fifth.allowed).toBe(false)
      expect(fifth.remaining).toBe(0)
      expect(isRateLimited(authKey, 5)).toBe(true)

      // Clearing rate limit resets lockout status
      clearRateLimit(authKey)
      expect(isRateLimited(authKey, 5)).toBe(false)
    })
  })
})
