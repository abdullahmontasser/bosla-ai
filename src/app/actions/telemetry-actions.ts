'use server'

import { headers } from 'next/headers'
import { TelemetryEventSchema } from '@/lib/validations/telemetry'
import { recordAnalyticsEvent } from '@/lib/db/analytics'
import { checkRateLimit, hashClientIdentifier } from '@/lib/telemetry/rate-limiter'

export interface RecordPublicEventInput {
  name: string
  locale?: string
  path?: string
  anonymousId?: string
  metadata?: Record<string, unknown>
}

export async function recordPublicEvent(
  name: string,
  payload?: Record<string, unknown>,
): Promise<{ success: boolean }> {
  try {
    const headerList = await headers()
    const forwarded = headerList.get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : headerList.get('x-real-ip') || '127.0.0.1'
    const hashedIp = hashClientIdentifier(ip)

    const rateLimit = checkRateLimit(hashedIp, 100, 3600000)
    if (!rateLimit.allowed) {
      return { success: false }
    }

    const locale = (payload?.locale as string) || 'en'
    const path = (payload?.path as string) || '/'
    const anonymousId = (payload?.anonymousId as string) || undefined

    const metadata: Record<string, unknown> = { ...payload }
    delete metadata.locale
    delete metadata.path
    delete metadata.anonymousId

    const validation = TelemetryEventSchema.safeParse({
      name,
      locale,
      path,
      anonymousId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    })

    if (!validation.success) {
      return { success: false }
    }

    await recordAnalyticsEvent(validation.data)
    return { success: true }
  } catch (error) {
    // Fail silently without disrupting user interaction (AC-7)
    console.error('[Telemetry Server Action Error]:', error)
    return { success: false }
  }
}
