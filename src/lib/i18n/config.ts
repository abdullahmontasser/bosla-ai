export const supportedLocales = ['en', 'ar'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
export const RESUME_LANGUAGE_COOKIE_NAME = 'bosla_resume_language'

export type ResumeLanguage = 'EN' | 'AR'

export function isSupportedLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale)
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
