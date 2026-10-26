import { NextRequest, NextResponse } from 'next/server'
import { TelemetryEventSchema } from '@/lib/validations/telemetry'
import { recordAnalyticsEvent } from '@/lib/db/analytics'
import { checkRateLimit, hashClientIdentifier } from '@/lib/telemetry/rate-limiter'

const MAX_BODY_BYTES = 2048 // 2 KB maximum payload size (AC-8)

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce payload size limit
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf-8') > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Payload Too Large: Telemetry payload must not exceed 2KB' },
        { status: 400 },
      )
    }

    // 2. Extract and hash client IP for privacy-preserving rate limiting (AC-7, AC-8)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'
    const hashedIp = hashClientIdentifier(ip)

    // 3. Enforce hourly rolling in-memory rate limit (100 events/hour) (AC-8)
    const rateLimit = checkRateLimit(hashedIp, 100, 3600000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    // 4. Parse and validate JSON payload (supporting sendBeacon text/plain or application/json)
    let jsonPayload: unknown
    try {
      jsonPayload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Bad Request: Malformed JSON body' }, { status: 400 })
    }

    const validation = TelemetryEventSchema.safeParse(jsonPayload)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    // 5. Persist anonymous telemetry event (AC-7, AC-9)
    await recordAnalyticsEvent(validation.data)

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      },
    )
  } catch (error) {
    console.error('[Telemetry Route Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
