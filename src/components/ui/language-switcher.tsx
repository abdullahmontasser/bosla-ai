'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LOCALE_COOKIE_NAME, supportedLocales, type Locale } from '@/lib/i18n/config'

interface LanguageSwitcherProps {
  currentLang?: string
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Determine active locale from currentLang or current pathname
  const activeLocale: Locale = React.useMemo(() => {
    if (currentLang && supportedLocales.includes(currentLang as Locale)) {
      return currentLang as Locale
    }
    const segments = pathname.split('/')
    if (segments[1] && supportedLocales.includes(segments[1] as Locale)) {
      return segments[1] as Locale
    }
    return 'en'
  }, [currentLang, pathname])

  const switchLanguage = React.useCallback(
    (newLocale: Locale) => {
      if (newLocale === activeLocale) return

      // Set cookie for persistence
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

      // Replace /[lang] in current pathname
      const segments = pathname.split('/')
      if (segments[1] && supportedLocales.includes(segments[1] as Locale)) {
        segments[1] = newLocale
      } else {
        segments.splice(1, 0, newLocale)
      }

      // Preserve existing search parameters and hash fragments
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const newPath = `${segments.join('/') || `/${newLocale}`}${search}${hash}`
      router.push(newPath)
    },
    [activeLocale, pathname, router],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 px-3 text-xs font-medium"
          aria-label="Switch Language"
        >
          <Globe className="h-4 w-4" />
          <span>{activeLocale === 'ar' ? 'العربية' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => switchLanguage('en')}
          className={activeLocale === 'en' ? 'font-semibold text-primary' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage('ar')}
          className={
            activeLocale === 'ar' ? 'font-semibold text-primary font-arabic' : 'font-arabic'
          }
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
