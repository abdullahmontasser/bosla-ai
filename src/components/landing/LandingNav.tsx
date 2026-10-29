import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LanguageSwitcher, RtlIcon } from '@/components/ui'
import { BrandMark } from './BrandMark'
import { LandingMobileNav } from './LandingMobileNav'
import { LandingThemeToggle } from './LandingThemeToggle'
import type { LandingCopy } from './content'

interface LandingNavProps {
  lang: string
  copy: LandingCopy
  signedIn?: boolean
}

export function LandingNav({ lang, copy, signedIn = false }: LandingNavProps) {
  const isAr = lang === 'ar'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href={`/${lang}`}
          className="group flex shrink-0 items-center gap-2.5 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          aria-label={`${isAr ? 'بوصلة AI' : 'Bosla AI'} — ${isAr ? 'الصفحة الرئيسية' : 'Home'}`}
        >
          <BrandMark className="transition-transform duration-300 group-hover:rotate-12" />
          <span className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tracking-[-0.02em] text-foreground">
              {isAr ? 'بوصلة' : 'Bosla'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              AI
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={isAr ? 'التنقل الرئيسي' : 'Primary navigation'}
        >
          {copy.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="landing-link-underline rounded-[3px] py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher
            currentLang={lang}
            className="h-11 gap-2 border-border bg-card/60 px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground sm:h-9"
            contentClassName="w-40 border-border bg-popover"
          />

          <LandingThemeToggle labels={copy.nav.theme} className="hidden sm:inline-flex" />

          {!signedIn ? (
            <Link
              href={`/${lang}/login`}
              className="hidden h-9 items-center rounded-[6px] px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:inline-flex"
            >
              {copy.nav.signIn}
            </Link>
          ) : null}

          <Link
            href={
              signedIn
                ? `/${lang}/tailor`
                : `/${lang}/signup?callbackUrl=${encodeURIComponent(`/${lang}/tailor`)}`
            }
            className="hidden h-10 items-center gap-2 rounded-[6px] bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:inline-flex"
          >
            {signedIn ? copy.nav.workspace : copy.nav.start}
            <RtlIcon icon={ArrowRight} className="h-3.5 w-3.5" />
          </Link>

          <LandingMobileNav lang={lang} copy={copy} signedIn={signedIn} />
        </div>
      </div>
    </header>
  )
}
