const INTERNAL_ORIGIN = 'http://internal.local'

/**
 * Keep post authentication redirects inside this app.
 *
 * Only same origin, path based targets are accepted. Anything that looks like
 * an external host, a protocol relative URL, or an auth page itself falls back
 * to a safe workspace destination so we never bounce the user in a loop.
 */
export function sanitizeCallbackUrl(raw: unknown, fallback: string): string {
  const safeFallback = normalizeInternalPath(fallback) ?? '/'

  if (typeof raw !== 'string') return safeFallback

  const value = raw.trim()
  if (!value) return safeFallback

  const normalized = normalizeInternalPath(value)
  if (!normalized) return safeFallback
  if (isAuthPage(normalized)) return safeFallback

  return normalized
}

function normalizeInternalPath(value: string): string | null {
  if (!value.startsWith('/')) return null
  // `//host` and `/\host` are interpreted as protocol relative by browsers.
  if (value.startsWith('//') || value.startsWith('/\\')) return null

  try {
    const url = new URL(value, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function isAuthPage(path: string): boolean {
  const pathname = path.split(/[?#]/)[0] ?? ''
  return /^\/(?:[a-z]{2}\/)?(?:login|signup)\/?$/.test(pathname)
}
