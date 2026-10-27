'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { RtlIcon } from '@/components/ui'
import type { LandingCopy } from './content'
import { LandingThemeToggle } from './LandingThemeToggle'

interface LandingMobileNavProps {
  lang: string
  copy: LandingCopy
}

export function LandingMobileNav({ lang, copy }: LandingMobileNavProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  const close = () => {
    detailsRef.current?.removeAttribute('open')
  }

  return (
    <details ref={detailsRef} className="group relative lg:hidden">
      <summary
        className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-[7px] border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
        aria-label={copy.nav.menuLabel}
      >
        <Menu className="h-5 w-5 group-open:hidden" aria-hidden />
        <X className="hidden h-5 w-5 group-open:block" aria-hidden />
      </summary>

      <div className="absolute end-0 top-full z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-border bg-popover p-2 shadow-2xl shadow-black/10 dark:shadow-black/40">
        <nav aria-label={copy.nav.menu} className="flex flex-col">
          {copy.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex min-h-11 items-center rounded-[6px] px-3 text-sm font-medium text-popover-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="my-2 h-px bg-border" />

        <div className="flex items-center justify-between gap-3 rounded-[6px] px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">{copy.nav.theme.label}</span>
          <LandingThemeToggle labels={copy.nav.theme} />
        </div>

        <div className="my-2 h-px bg-border" />

        <nav aria-label={copy.footer.columns[0].title} className="flex flex-col">
          {copy.footer.columns[0].links.map((link) => (
            <Link
              key={link.href}
              href={`/${lang}${link.href}`}
              onClick={close}
              className="flex min-h-11 items-center justify-between rounded-[6px] px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          ))}
        </nav>

        <Link
          href={`/${lang}/tailor`}
          onClick={close}
          className="mt-2 flex min-h-11 items-center justify-between rounded-[6px] bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
        >
          {copy.nav.start}
          <RtlIcon icon={ArrowRight} className="h-4 w-4" />
        </Link>
      </div>
    </details>
  )
}
