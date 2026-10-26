import { recordPublicEvent } from '@/app/actions/telemetry-actions'

function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return 'server_render'
  try {
    const key = 'careercraft_anon_id'
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = 'anon_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
      sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'anon_fallback'
  }
}

export interface TrackEventOptions {
  locale?: string
  path?: string
  metadata?: Record<string, unknown>
}

/**
 * Sends an anonymous engagement event using navigator.sendBeacon, falling back to fetch and Server Action
 */
export async function trackEvent(name: string, options?: TrackEventOptions): Promise<void> {
  if (typeof window === 'undefined') return

  const locale = options?.locale || (document.documentElement.lang as string) || 'en'
  const path = options?.path || window.location.pathname || '/'
  const anonymousId = getOrCreateAnonymousId()

  const payload = {
    name,
    locale,
    path,
    anonymousId,
    metadata: options?.metadata || {},
  }

  const serialized = JSON.stringify(payload)

  // 1. Try navigator.sendBeacon
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([serialized], { type: 'application/json' })
      const queued = navigator.sendBeacon('/api/telemetry', blob)
      if (queued) return
    } catch {
      // Fall through to fetch
    }
  }

  // 2. Try fetch with keepalive
  try {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      keepalive: true,
    })
    if (res.ok) return
  } catch {
    // Fall through to Server Action
  }

  // 3. Fallback to Server Action
  try {
    await recordPublicEvent(name, {
      locale,
      path,
      anonymousId,
      ...options?.metadata,
    })
  } catch {
    // Graceful silent swallow
  }
}
