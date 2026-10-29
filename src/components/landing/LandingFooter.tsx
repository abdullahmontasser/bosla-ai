import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { BrandMark } from './BrandMark'

interface LandingFooterProps {
  lang: string
  copy: LandingCopy
}

export function LandingFooter({ lang, copy }: LandingFooterProps) {
  const isAr = lang === 'ar'

  return (
    <footer className="relative bg-landing-footer">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,minmax(0,0.6fr))] lg:gap-10">
          <div className="max-w-[300px]">
            <Link
              href={`/${lang}`}
              className="inline-flex items-center gap-2.5 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              aria-label={isAr ? 'بوصلة AI — الصفحة الرئيسية' : 'Bosla AI — Home'}
            >
              <BrandMark />
              <span className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-[-0.02em] text-foreground">
                  {isAr ? 'بوصلة' : 'Bosla'}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  AI
                </span>
              </span>
            </Link>
            <p
              className={cn(
                'mt-5 text-[13px] leading-[1.7] text-muted-foreground',
                isAr && 'font-arabic leading-[1.9]',
              )}
            >
              {copy.footer.tagline}
            </p>
            <p className="mt-4 text-[10.5px] leading-relaxed text-landing-faint">
              {copy.footer.note}
            </p>
          </div>

          {copy.footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-landing-faint">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => {
                  const external = link.href.startsWith('http')
                  const href = external
                    ? link.href
                    : link.href.startsWith('#')
                      ? link.href
                      : `/${lang}${link.href}`

                  return (
                    <li key={link.href}>
                      {external ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        >
                          {link.label}
                          <ArrowUpRight
                            className="h-3 w-3 text-landing-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border/60 pt-6 text-[10px] text-landing-faint sm:flex-row sm:items-center sm:justify-between">
          <span>{copy.footer.rights}</span>
          <span className={cn('inline-flex items-center gap-2', isAr && 'font-arabic')}>
            <span className="h-1 w-1 rounded-full bg-primary/60" aria-hidden />
            {isAr
              ? 'بوصلة AI — ذكاء مهني، بلا ضجيج'
              : 'Bosla AI — Career intelligence, without the noise'}
          </span>
        </div>
      </div>
    </footer>
  )
}
