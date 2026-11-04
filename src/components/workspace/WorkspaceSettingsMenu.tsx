'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Cpu, Globe, Laptop, Moon, Settings, Sun, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LOCALE_COOKIE_NAME,
  RESUME_LANGUAGE_COOKIE_NAME,
  supportedLocales,
  type Locale,
  type ResumeLanguage,
} from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export interface WorkspaceSettingsMenuProps {
  lang: string
  currentResumeLang?: ResumeLanguage
  variant?: 'icon' | 'row'
  side?: 'top' | 'bottom' | 'right' | 'left'
  align?: 'start' | 'center' | 'end'
}

export function WorkspaceSettingsMenu({
  lang,
  currentResumeLang = 'EN',
  variant = 'row',
  side,
  align,
}: WorkspaceSettingsMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAr = lang === 'ar'

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [activeResumeLang, setActiveResumeLang] = React.useState<ResumeLanguage>(currentResumeLang)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveResumeLang(currentResumeLang)
  }, [currentResumeLang])

  // Synchronize with external resume language events
  React.useEffect(() => {
    const handleResumeLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: ResumeLanguage }>
      const newLang = customEvent.detail?.language
      if (newLang && (newLang === 'EN' || newLang === 'AR')) {
        setActiveResumeLang(newLang)
      }
    }

    window.addEventListener('resume-language-changed', handleResumeLangChange)
    return () => window.removeEventListener('resume-language-changed', handleResumeLangChange)
  }, [])

  // Switch UI Language
  const switchInterfaceLanguage = (newLocale: Locale) => {
    if (newLocale === lang) return

    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

    const segments = pathname.split('/')
    if (segments[1] && supportedLocales.includes(segments[1] as Locale)) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }

    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const newPath = `${segments.join('/') || `/${newLocale}`}${search}${hash}`
    router.push(newPath)
  }

  // Switch Resume Language
  const switchResumeLanguage = (newLang: ResumeLanguage) => {
    if (newLang === activeResumeLang) return
    setActiveResumeLang(newLang)

    if (typeof document !== 'undefined') {
      document.cookie = `${RESUME_LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      document.cookie = `careercraft_profile_lang=${newLang.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`

      window.dispatchEvent(
        new CustomEvent('resume-language-changed', {
          detail: { language: newLang },
        }),
      )
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      let changed = false
      if (url.searchParams.has('profileLang')) {
        url.searchParams.set('profileLang', newLang.toLowerCase())
        changed = true
      }
      if (url.searchParams.has('resumeLang')) {
        url.searchParams.set('resumeLang', newLang.toLowerCase())
        changed = true
      }
      if (url.searchParams.has('auditLang')) {
        url.searchParams.set('auditLang', newLang.toLowerCase())
        changed = true
      }
      if (changed) {
        window.history.replaceState({}, '', url.toString())
      }
    }

    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <button
            type="button"
            aria-label={isAr ? 'الإعدادات والتفضيلات' : 'Settings and preferences'}
            className="flex size-8.5 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={isAr ? 'الإعدادات والتفضيلات' : 'Settings and preferences'}
            className="group flex h-9 w-full items-center gap-2.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="size-3.5 shrink-0 transition-transform duration-300 group-hover:rotate-45" />
            <span className="truncate">
              {isAr ? 'الإعدادات والتفضيلات' : 'Settings & Preferences'}
            </span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side ?? (variant === 'icon' ? (isAr ? 'left' : 'right') : 'top')}
        align={align ?? 'start'}
        sideOffset={8}
        className="w-68 p-2"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {isAr ? 'إعدادات المنصة' : 'Platform Preferences'}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        {/* 1. Interface Language */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Globe className="size-3.5 text-muted-foreground" />
            <span>{isAr ? 'لغة الواجهة' : 'Interface'}</span>
          </div>
          <div className="inline-flex rounded-[5px] border border-border bg-muted/40 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => switchInterfaceLanguage('en')}
              className={cn(
                'rounded-[3px] px-2 py-0.5 font-medium transition-colors',
                lang === 'en'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => switchInterfaceLanguage('ar')}
              className={cn(
                'rounded-[3px] px-2 py-0.5 font-medium transition-colors font-arabic',
                lang === 'ar'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              عربي
            </button>
          </div>
        </div>

        {/* 2. Visual Theme */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <div className="flex items-center gap-2 text-xs text-foreground">
            {mounted && theme === 'dark' ? (
              <Moon className="size-3.5 text-muted-foreground" />
            ) : (
              <Sun className="size-3.5 text-muted-foreground" />
            )}
            <span>{isAr ? 'المظهر' : 'Theme'}</span>
          </div>
          <div className="inline-flex rounded-[5px] border border-border bg-muted/40 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Light mode"
              className={cn(
                'rounded-[3px] p-1 transition-colors',
                mounted && theme === 'light'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sun className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Dark mode"
              className={cn(
                'rounded-[3px] p-1 transition-colors',
                mounted && theme === 'dark'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Moon className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              aria-label="System mode"
              className={cn(
                'rounded-[3px] p-1 transition-colors',
                mounted && theme === 'system'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Laptop className="size-3" />
            </button>
          </div>
        </div>

        {/* 3. Resume Language */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <FileText className="size-3.5 text-primary" />
            <span>{isAr ? 'السيرة النشطة' : 'Active CV'}</span>
          </div>
          <div className="inline-flex rounded-[5px] border border-border bg-muted/40 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => switchResumeLanguage('EN')}
              className={cn(
                'rounded-[3px] px-2 py-0.5 font-medium transition-colors',
                activeResumeLang === 'EN'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => switchResumeLanguage('AR')}
              className={cn(
                'rounded-[3px] px-2 py-0.5 font-medium transition-colors font-arabic',
                activeResumeLang === 'AR'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              عربي
            </button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* AI Provider Settings Link */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/${lang}/settings/providers`} className="gap-2.5 px-2.5 py-2 text-xs">
            <Cpu className="size-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {isAr ? 'مزودو الذكاء الاصطناعي' : 'AI Providers & Models'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isAr ? 'إدارة مفاتيح API (OpenAI, Anthropic)' : 'Manage API keys and providers'}
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
