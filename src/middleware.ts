import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, isSupportedLocale, LOCALE_COOKIE_NAME, Locale } from '@/lib/i18n/config'

// Known ISO-639-1 language codes that are not supported in CareerCraft AI.
// When encountered as the first path segment (e.g. /fr, /de/overview), they pass
// through to the localized layout which triggers notFound() per AC-1.
// Application routes (like /cv, /me, /ai) are NOT in this set and redirect properly.
export const KNOWN_UNSUPPORTED_LOCALES = new Set([
  'fr',
  'de',
  'es',
  'it',
  'pt',
  'ru',
  'zh',
  'ja',
  'ko',
  'nl',
  'tr',
  'pl',
  'sv',
  'da',
  'fi',
  'no',
  'he',
  'id',
  'ms',
  'hi',
  'th',
  'vi',
  'uk',
  'el',
  'cs',
  'ro',
  'hu',
  'fa',
  'ur',
  'bn',
  'ta',
  'te',
  'mr',
  'sw',
  'af',
])

export function isUnsupportedLocaleSegment(segment: string): boolean {
  if (!segment) return false
  const base = segment.split('-')[0]?.toLowerCase()
  return Boolean(base && KNOWN_UNSUPPORTED_LOCALES.has(base))
}

export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [langTag, ...params] = part.trim().split(';')
      let q = 1.0
      for (const param of params) {
        const [key, value] = param.trim().split('=')
        if (key === 'q' && value) {
          const parsed = parseFloat(value)
          if (!isNaN(parsed)) q = parsed
        }
      }
      return { lang: (langTag || '').trim().toLowerCase(), q }
    })
    .filter((item) => item.q > 0 && item.lang.length > 0)
    .sort((a, b) => b.q - a.q)
    .map((item) => item.lang)
}

export function matchSupportedLocale(languages: string[]): Locale | null {
  for (const tag of languages) {
    if (tag === 'ar' || tag.startsWith('ar-')) return 'ar'
    if (tag === 'en' || tag.startsWith('en-')) return 'en'
  }
  return null
}

export function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale
  }

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferredLanguages = parseAcceptLanguage(acceptLanguage)
    const matched = matchSupportedLocale(preferredLanguages)
    if (matched) return matched
  }

  return defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const segments = pathname.split('/')
  const firstSegment = segments[1] || ''

  // 1. If path begins with a supported locale (/en, /ar), let it proceed
  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next()
  }

  // 2. If path begins with a known unsupported locale (/fr, /de, /fr-CA),
  // let it pass through to the localized layout which triggers notFound()
  if (isUnsupportedLocaleSegment(firstSegment)) {
    return NextResponse.next()
  }

  // 3. Otherwise, it is an unlocalized route (e.g. /, /cv, /me, /design-system).
  // Redirect cleanly with HTTP 307 to /${targetLocale}${cleanPath}.
  const targetLocale = getPreferredLocale(request)
  const cleanPath = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`
  const redirectUrl = new URL(`/${targetLocale}${cleanPath}`, request.url)
  redirectUrl.search = request.nextUrl.search

  return NextResponse.redirect(redirectUrl, 307)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
