import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import {
  getPreferredLocale,
  isUnsupportedLocaleSegment,
  matchSupportedLocale,
  middleware,
  parseAcceptLanguage,
} from './middleware'
import { LOCALE_COOKIE_NAME } from './lib/i18n/config'

describe('Middleware i18n & locale negotiation', () => {
  describe('parseAcceptLanguage & matchSupportedLocale', () => {
    it('parses accept-language headers and sorts by quality weights (RFC 9110)', () => {
      const header = 'en;q=0.3, ar;q=0.9, fr;q=0.7'
      const parsed = parseAcceptLanguage(header)
      expect(parsed).toEqual(['ar', 'fr', 'en'])
    })

    it('filters out rejected languages with q=0', () => {
      const header = 'en;q=0, ar;q=0.8'
      const parsed = parseAcceptLanguage(header)
      expect(parsed).toEqual(['ar'])
    })

    it('matches exact language tags and subtag prefixes (BCP 47)', () => {
      expect(matchSupportedLocale(['ar'])).toBe('ar')
      expect(matchSupportedLocale(['ar-EG'])).toBe('ar')
      expect(matchSupportedLocale(['en'])).toBe('en')
      expect(matchSupportedLocale(['en-US'])).toBe('en')
    })

    it('does not match unrelated language tags starting with ar like arn or arp', () => {
      // "arn" is Mapudungun, "arp" is Arapaho - should not be treated as Arabic
      expect(matchSupportedLocale(['arn', 'en'])).toBe('en')
      expect(matchSupportedLocale(['arp'])).toBeNull()
    })

    it('returns null when no supported language is present', () => {
      expect(matchSupportedLocale(['fr', 'de', 'ja'])).toBeNull()
    })
  })

  describe('isUnsupportedLocaleSegment', () => {
    it('identifies known unsupported language codes and regional subtags', () => {
      expect(isUnsupportedLocaleSegment('fr')).toBe(true)
      expect(isUnsupportedLocaleSegment('de')).toBe(true)
      expect(isUnsupportedLocaleSegment('es-ES')).toBe(true)
      expect(isUnsupportedLocaleSegment('zh-CN')).toBe(true)
    })

    it('does not classify valid application routes as unsupported locales', () => {
      expect(isUnsupportedLocaleSegment('cv')).toBe(false)
      expect(isUnsupportedLocaleSegment('me')).toBe(false)
      expect(isUnsupportedLocaleSegment('ai')).toBe(false)
      expect(isUnsupportedLocaleSegment('pr')).toBe(false)
      expect(isUnsupportedLocaleSegment('qa')).toBe(false)
      expect(isUnsupportedLocaleSegment('hr')).toBe(false)
      expect(isUnsupportedLocaleSegment('dashboard')).toBe(false)
      expect(isUnsupportedLocaleSegment('design-system')).toBe(false)
      expect(isUnsupportedLocaleSegment('')).toBe(false)
    })
  })

  describe('getPreferredLocale', () => {
    it('prefers the NEXT_LOCALE cookie over headers', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          cookie: `${LOCALE_COOKIE_NAME}=ar`,
          'accept-language': 'en-US,en;q=0.9',
        },
      })
      expect(getPreferredLocale(req)).toBe('ar')
    })

    it('falls back to accept-language header when cookie is missing or invalid', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          'accept-language': 'ar,en;q=0.8',
        },
      })
      expect(getPreferredLocale(req)).toBe('ar')
    })

    it('falls back to defaultLocale (en) when no matching locale exists', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          'accept-language': 'ja,ko;q=0.8',
        },
      })
      expect(getPreferredLocale(req)).toBe('en')
    })
  })

  describe('middleware route redirection and pass-through', () => {
    it('passes through supported locale paths without redirecting', () => {
      const reqEn = new NextRequest('http://localhost:3000/en/design-system')
      const resEn = middleware(reqEn)
      expect(resEn.status).toBe(200)
      expect(resEn.headers.get('location')).toBeNull()

      const reqAr = new NextRequest('http://localhost:3000/ar')
      const resAr = middleware(reqAr)
      expect(resAr.status).toBe(200)
    })

    it('passes through known unsupported locale paths to trigger notFound() in layout', () => {
      const reqFr = new NextRequest('http://localhost:3000/fr/design-system')
      const resFr = middleware(reqFr)
      expect(resFr.status).toBe(200)
      expect(resFr.headers.get('location')).toBeNull()
    })

    it('redirects root path / to /en without trailing slash', () => {
      const req = new NextRequest('http://localhost:3000/')
      const res = middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/en')
    })

    it('redirects unlocalized app routes like /cv and /me to localized paths', () => {
      const reqCv = new NextRequest('http://localhost:3000/cv')
      const resCv = middleware(reqCv)
      expect(resCv.status).toBe(307)
      expect(resCv.headers.get('location')).toBe('http://localhost:3000/en/cv')

      const reqMe = new NextRequest('http://localhost:3000/me')
      const resMe = middleware(reqMe)
      expect(resMe.status).toBe(307)
      expect(resMe.headers.get('location')).toBe('http://localhost:3000/en/me')
    })

    it('preserves query parameters on redirect', () => {
      const req = new NextRequest('http://localhost:3000/cv?view=grid&sort=asc')
      const res = middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/en/cv?view=grid&sort=asc')
    })

    it('respects cookie preference on redirect', () => {
      const req = new NextRequest('http://localhost:3000/design-system', {
        headers: {
          cookie: `${LOCALE_COOKIE_NAME}=ar`,
        },
      })
      const res = middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/ar/design-system')
    })
  })
})
