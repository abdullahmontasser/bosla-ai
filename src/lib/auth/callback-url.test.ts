import { describe, expect, it } from 'vitest'
import { sanitizeCallbackUrl } from './callback-url'

const fallback = '/en/tailor'

describe('sanitizeCallbackUrl', () => {
  it('keeps a relative workspace path', () => {
    expect(sanitizeCallbackUrl('/ar/tracker?status=APPLIED', fallback)).toBe(
      '/ar/tracker?status=APPLIED',
    )
  })

  it('keeps a hash fragment', () => {
    expect(sanitizeCallbackUrl('/en/resume#upload', fallback)).toBe('/en/resume#upload')
  })

  it('falls back when the value is missing', () => {
    expect(sanitizeCallbackUrl(undefined, fallback)).toBe(fallback)
    expect(sanitizeCallbackUrl('', fallback)).toBe(fallback)
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeCallbackUrl('https://evil.example/phish', fallback)).toBe(fallback)
  })

  it('rejects protocol relative URLs', () => {
    expect(sanitizeCallbackUrl('//evil.example/phish', fallback)).toBe(fallback)
    expect(sanitizeCallbackUrl('/\\evil.example/phish', fallback)).toBe(fallback)
  })

  it('rejects values that are not paths', () => {
    expect(sanitizeCallbackUrl('javascript:alert(1)', fallback)).toBe(fallback)
    expect(sanitizeCallbackUrl('tailor', fallback)).toBe(fallback)
  })

  it('avoids redirect loops through the auth pages', () => {
    expect(sanitizeCallbackUrl('/en/login', fallback)).toBe(fallback)
    expect(sanitizeCallbackUrl('/ar/signup?callbackUrl=/ar/tracker', fallback)).toBe(fallback)
  })

  it('normalizes the fallback too', () => {
    expect(sanitizeCallbackUrl(undefined, '//evil.example')).toBe('/')
  })
})
