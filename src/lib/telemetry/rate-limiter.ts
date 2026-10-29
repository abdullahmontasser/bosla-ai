import { createHash } from 'node:crypto'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rolling rate limits
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired entries every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Hash an IP address or identifier with salt so plain IP is never stored or logged
 */
export function hashClientIdentifier(ip: string, salt = 'careercraft_telemetry_salt'): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Checks in-memory rolling rate limit (default 100 requests per hour)
 */
export function checkRateLimit(
  hashedId: string,
  limit = 100,
  windowMs = 60 * 60 * 1000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  cleanupExpired(now)

  const record = rateLimitStore.get(hashedId)

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(hashedId, newRecord)
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Check if an identifier is currently rate limited without incrementing
 */
export function isRateLimited(hashedId: string, limit: number): boolean {
  const now = Date.now()
  cleanupExpired(now)
  const record = rateLimitStore.get(hashedId)
  if (!record) return false
  if (now > record.resetTime) {
    rateLimitStore.delete(hashedId)
    return false
  }
  return record.count >= limit
}

/**
 * Record a failed attempt towards a rate limit (e.g. invalid credentials)
 */
export function recordFailedAttempt(
  hashedId: string,
  limit = 5,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  cleanupExpired(now)

  const record = rateLimitStore.get(hashedId)

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(hashedId, newRecord)
    return {
      allowed: limit > 1,
      remaining: Math.max(0, limit - 1),
      resetTime: newRecord.resetTime,
    }
  }

  record.count += 1
  return {
    allowed: record.count < limit,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  }
}

/**
 * Clear a rate limit entry (e.g. after successful authentication)
 */
export function clearRateLimit(hashedId: string): void {
  rateLimitStore.delete(hashedId)
}

/**
 * Reset store (useful for tests)
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear()
}
