'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowDown, ArrowRight, Check, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { SampleTag } from './Highlight'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroProps {
  lang: string
  copy: LandingCopy
}

export function Hero({ lang, copy }: HeroProps) {
  const isAr = lang === 'ar'
  const sectionRef = useRef<HTMLElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const routeRef = useRef<SVGPathElement>(null)

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]', section)
      const items = gsap.utils.toArray<HTMLElement>('[data-hero-item]', section)
      const cards = gsap.utils.toArray<HTMLElement>('[data-hero-card]', section)
      const route = routeRef.current

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        delay: 0.12,
      })

      if (lines.length) {
        timeline.fromTo(
          lines,
          { yPercent: 170 },
          { yPercent: 0, duration: 1.15, stagger: 0.085, ease: 'power2.out' },
          0,
        )
      }

      if (cards.length) {
        timeline.fromTo(
          cards,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power2.out' },
          0.18,
        )
      }

      if (items.length) {
        timeline.fromTo(
          items,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.06, ease: 'power2.out' },
          0.34,
        )
      }

      if (route) {
        const length = route.getTotalLength()
        gsap.set(route, { strokeDasharray: length, strokeDashoffset: length })
        timeline.to(route, { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' }, 0.18)
      }

      const parallax = gsap.to(visualRef.current, {
        yPercent: -2.5,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      })

      return () => {
        timeline.kill()
        parallax.kill()
      }
    })

    let active = true
    const refresh = () => {
      if (active) ScrollTrigger.refresh()
    }
    document.fonts?.ready.then(refresh).catch(() => undefined)

    return () => {
      active = false
      media.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative isolate overflow-hidden border-b border-border/70',
        isAr && 'font-arabic',
      )}
      aria-labelledby="hero-title"
    >
      <div className="landing-grain" aria-hidden />
      <div
        className="pointer-events-none absolute -top-52 end-[-10%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,var(--landing-glow),transparent_66%)] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 end-[38%] hidden w-px bg-border/50 lg:block"
        aria-hidden
      />

      <div className="mx-auto grid w-full max-w-[1320px] gap-14 px-5 pb-10 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-8 lg:px-10 lg:pb-20 lg:pt-24">
        <div className="relative z-10 max-w-[660px]">
          <div data-hero-item className="flex items-center gap-3">
            <span className="h-px w-7 bg-primary" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {copy.hero.eyebrow}
            </span>
          </div>

          <h1
            id="hero-title"
            className={cn(
              'mt-7 text-balance text-foreground',
              isAr
                ? 'text-[clamp(2.35rem,6.3vw,4.35rem)] font-extrabold leading-[1.22] tracking-normal'
                : 'text-[clamp(2.65rem,6.7vw,4.9rem)] font-semibold leading-[0.99] tracking-[-0.04em]',
            )}
          >
            {copy.hero.headline.lines.map((line) => (
              <span key={line} className="line-mask">
                <span data-hero-line className="block">
                  {line}
                </span>
              </span>
            ))}
            <span className="line-mask">
              <span data-hero-line className="block">
                <em
                  className={cn(
                    'text-primary',
                    isAr ? 'font-extrabold not-italic' : 'font-serif font-normal italic',
                  )}
                >
                  {copy.hero.headline.accent}
                </em>{' '}
                {copy.hero.headline.tail}
              </span>
            </span>
          </h1>

          <p
            data-hero-item
            className={cn(
              'mt-7 max-w-[54ch] text-[15px] text-muted-foreground sm:text-base md:text-[17px]',
              isAr ? 'leading-[1.95]' : 'leading-[1.72]',
            )}
          >
            {copy.hero.lead}
          </p>

          <div data-hero-item className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/${lang}/tailor`}
              className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[7px] bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {copy.hero.primaryCta}
              <RtlIcon
                icon={ArrowRight}
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>

            <a
              href="#workflow"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[7px] border border-border bg-card/50 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {copy.hero.secondaryCta}
              <ArrowDown
                className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>

          <ul
            data-hero-item
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground"
          >
            {copy.hero.microProof.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div ref={visualRef} className="relative z-0 min-w-0 lg:ps-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SampleTag>{copy.hero.sampleLabel}</SampleTag>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              BOSLA / 01
            </span>
          </div>

          <div className="relative">
            <svg
              className="pointer-events-none absolute -inset-x-10 -top-16 hidden h-[640px] w-[calc(100%+5rem)] lg:block"
              viewBox="0 0 620 640"
              fill="none"
              aria-hidden
            >
              <circle
                cx="352"
                cy="282"
                r="214"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="1 7"
                className="text-foreground"
              />
              <circle
                cx="352"
                cy="282"
                r="168"
                stroke="currentColor"
                strokeOpacity="0.08"
                className="text-foreground"
              />
              <path
                ref={routeRef}
                d="M86 516c70-46 84-122 152-168 66-45 117-37 186-1 42 22 77 21 119-10"
                stroke="var(--primary)"
                strokeOpacity="0.5"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
              <path
                d="M352 68v18M352 478v18M138 282h18M548 282h18"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeLinecap="round"
                className="text-foreground"
              />
              <circle cx="352" cy="282" r="3" fill="var(--primary)" fillOpacity="0.8" />
            </svg>

            <span
              className="absolute -top-1 end-2 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-landing-faint lg:block"
              aria-hidden
            >
              N 41° / 02
            </span>

            <div className="relative z-10 flex flex-col gap-3 md:block md:h-[540px]">
              <article
                data-hero-card
                aria-hidden
                className="landing-paper landing-shadow-strong relative w-full rounded-[10px] border border-black/10 p-5 md:absolute md:end-0 md:top-0 md:w-[85%] md:p-6"
              >
                <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/60">
                    {copy.hero.visual.roleLabel}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums text-black/35">01</span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-landing-paper-ink">
                      {copy.hero.visual.role}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-black/50">
                      {copy.hero.visual.company} · {copy.hero.visual.meta}
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-black/10 text-[10px] font-bold text-black/50">
                    M
                  </span>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-black/55">
                  {copy.hero.visual.requirementsLabel}
                </p>
                <ul className="mt-2.5 space-y-2">
                  {copy.hero.visual.requirements.map((requirement, index) => (
                    <li
                      key={requirement}
                      className="flex items-start gap-2 text-[12px] leading-snug text-black/70"
                    >
                      <span
                        className={cn(
                          'mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                          index === 2
                            ? 'border-amber-700/25 bg-amber-700/10 text-amber-800'
                            : 'border-emerald-800/20 bg-emerald-800/10 text-emerald-800',
                        )}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={2.4} />
                      </span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </article>

              <article
                data-hero-card
                aria-hidden
                className="landing-shadow relative w-full rounded-[10px] border border-border bg-landing-panel p-5 md:absolute md:start-0 md:top-[36%] md:w-[61%] md:-rotate-2 md:p-5"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
                    {copy.hero.visual.resumeLabel}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                  {copy.hero.visual.resumeName}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  {copy.hero.visual.resumeRole}
                </p>
                <p className="mt-2.5 text-[11px] leading-[1.65] text-muted-foreground">
                  {copy.hero.visual.resumeSummary}
                </p>
                <div className="mt-3 rounded-[4px] border-s-2 border-primary bg-primary/8 px-2.5 py-2">
                  <p className="text-[10.5px] leading-[1.7] text-foreground/90">
                    {copy.hero.visual.resumeBullet}
                  </p>
                </div>
              </article>

              <article
                data-hero-card
                aria-hidden
                className="landing-shadow relative w-full rounded-[10px] border border-black/10 bg-landing-paper p-4 text-landing-paper-ink md:absolute md:bottom-0 md:end-0 md:w-[56%]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/60">
                      {copy.hero.visual.coverageLabel}
                    </p>
                    <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-landing-paper-ink">
                      {copy.hero.visual.coverageValue}
                    </p>
                  </div>
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-800/20 bg-emerald-800/10">
                    <Check className="h-3.5 w-3.5 text-emerald-800" strokeWidth={2.4} />
                  </div>
                </div>
                <div className="mt-3 flex gap-1" aria-hidden>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-1 flex-1 rounded-full',
                        index < 8 ? 'bg-emerald-800/65' : 'bg-black/10',
                      )}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-snug text-black/50">
                  {copy.hero.visual.coverageNote}
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] items-center gap-3 px-5 pb-7 sm:px-8 lg:px-10">
        <span className="h-px w-10 bg-border" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {copy.hero.scrollCue}
        </span>
        <ArrowDown className="h-3 w-3 text-primary" aria-hidden />
      </div>
    </section>
  )
}
