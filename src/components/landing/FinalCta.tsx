import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { Reveal } from './Reveal'

interface FinalCtaProps {
  lang: string
  copy: LandingCopy
}

export function FinalCta({ lang, copy }: FinalCtaProps) {
  const isAr = lang === 'ar'

  return (
    <section className="relative isolate overflow-hidden border-b border-border/70 bg-landing-surface">
      <div className="landing-grain" aria-hidden />
      <div
        className="pointer-events-none absolute -bottom-64 start-1/2 h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,var(--landing-glow),transparent_66%)] blur-2xl"
        aria-hidden
      />

      <svg
        className="pointer-events-none absolute -end-40 top-1/2 hidden h-[720px] w-[720px] -translate-y-1/2 text-foreground/8 lg:block"
        viewBox="0 0 720 720"
        fill="none"
        aria-hidden
      >
        <circle cx="360" cy="360" r="292" stroke="currentColor" strokeOpacity="0.32" />
        <circle
          cx="360"
          cy="360"
          r="232"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeDasharray="1 8"
        />
        <circle cx="360" cy="360" r="150" stroke="currentColor" strokeOpacity="0.14" />
        <path
          d="M360 36v54M360 630v54M36 360h54M630 360h54"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M492 228 410 356l-82 128 82-128 82-128Z"
          stroke="var(--primary)"
          strokeOpacity="0.42"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="360" cy="360" r="3.5" fill="var(--primary)" fillOpacity="0.7" />
      </svg>

      <div className="relative mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <Reveal variant="lines" className="max-w-[880px]">
          <div data-reveal className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {copy.cta.label}
            </p>
          </div>

          <h2
            className={cn(
              'mt-6 text-balance text-foreground',
              isAr
                ? 'font-arabic text-[clamp(2rem,4.6vw,3.6rem)] font-extrabold leading-[1.26]'
                : 'text-[clamp(2.1rem,4.8vw,3.8rem)] font-semibold leading-[1] tracking-[-0.045em]',
            )}
          >
            <span className="line-mask">
              <span data-line-inner className="block">
                {isAr ? 'اجعل طلبك القادم' : 'Make the next application'}
              </span>
            </span>
            <span className="line-mask">
              <span data-line-inner className="block">
                {isAr ? (
                  'أوضح طلباتك.'
                ) : (
                  <>
                    your <em className="font-serif font-normal italic text-primary">clearest</em>{' '}
                    one.
                  </>
                )}
              </span>
            </span>
          </h2>

          <p
            data-reveal
            className={cn(
              'mt-6 max-w-[48ch] text-sm text-muted-foreground sm:text-base',
              isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
            )}
          >
            {copy.cta.body}
          </p>

          <div data-reveal className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/${lang}/tailor`}
              className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[7px] bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {copy.cta.button}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
                aria-hidden
              />
            </Link>

            <Link
              href={`/${lang}/resume`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[7px] border border-border bg-card/50 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {isAr ? 'افتح محرك ATS' : 'Explore the ATS engine'}
            </Link>
          </div>

          <ul
            data-reveal
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground"
          >
            {copy.cta.notes.map((note) => (
              <li key={note} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className={cn(isAr && 'font-arabic')}>{note}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 flex items-center gap-4 border-t border-border/70 pt-5 lg:mt-16">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-landing-faint">
            BOSLA / 06
          </span>
          <span className="h-px flex-1 bg-border/60" aria-hidden />
          <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-landing-faint sm:block">
            {isAr ? 'ابدأ من خبرتك' : 'Start with your experience'}
          </span>
        </div>
      </div>
    </section>
  )
}
