export const supportedLocales = ['en', 'ar'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale)
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
