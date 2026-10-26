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
 * Reset store (useful for tests)
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear()
}
