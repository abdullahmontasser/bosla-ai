'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { SampleTag } from './Highlight'
import {
  AchievementPanel,
  AtsPanel,
  FinalPanel,
  InterviewPanel,
  JobPanel,
  ResumePanel,
} from './StoryPanels'
import type { ShowcaseSample } from './showcase-data'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProductStoryProps {
  lang: string
  copy: LandingCopy
  sample: ShowcaseSample
}

const panelKeys = ['job', 'resume', 'ats', 'achievement', 'interview', 'final'] as const

function StagePanel({
  stage,
  sample,
  lang,
}: {
  stage: (typeof panelKeys)[number]
  sample: ShowcaseSample
  lang: string
}) {
  switch (stage) {
    case 'job':
      return <JobPanel sample={sample} lang={lang} />
    case 'resume':
      return <ResumePanel sample={sample} lang={lang} />
    case 'ats':
      return <AtsPanel sample={sample} lang={lang} />
    case 'achievement':
      return <AchievementPanel sample={sample} lang={lang} />
    case 'interview':
      return <InterviewPanel sample={sample} lang={lang} />
    case 'final':
      return <FinalPanel sample={sample} lang={lang} />
  }
}

export function ProductStory({ lang, copy, sample }: ProductStoryProps) {
  const isAr = lang === 'ar'
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const boundsRef = useRef<{ start: number; end: number } | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const stages = [
    ...copy.showcase.stages.map((stage) => ({ title: stage.title, summary: stage.summary })),
    { title: copy.showcase.final.title, summary: copy.showcase.final.note },
  ]

  const jumpToStage = useCallback((index: number) => {
    const bounds = boundsRef.current
    if (!bounds) return

    const progress = index / (panelKeys.length - 1)
    const top = bounds.start + (bounds.end - bounds.start) * progress
    window.scrollTo({
      top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [])

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()

    media.add(
      '(min-width: 1024px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)',
      () => {
        const panels = gsap.utils.toArray<HTMLElement>('[data-story-panel]', track)
        const total = panels.length
        if (!total) return

        const direction = isAr ? 1 : -1
        const travel = () => direction * (total - 1) * track.clientWidth

        const tween = gsap.to(track, {
          x: travel,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * 3.6)}`,
            pin: section,
            pinSpacing: true,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              boundsRef.current = { start: self.start, end: self.end }
            },
            onUpdate: (self) => {
              const position = self.progress * (total - 1)
              const nextIndex = Math.round(position)

              setActiveIndex((current) => (current === nextIndex ? current : nextIndex))

              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${self.progress})`
              }
            },
          },
        })

        boundsRef.current = tween.scrollTrigger
          ? { start: tween.scrollTrigger.start, end: tween.scrollTrigger.end }
          : null

        return () => {
          boundsRef.current = null
          tween.scrollTrigger?.kill()
          tween.kill()
          gsap.set(track, { x: 0 })
        }
      },
    )

    let active = true
    const refresh = () => {
      if (active) ScrollTrigger.refresh()
    }
    document.fonts?.ready.then(refresh).catch(() => undefined)

    // A theme flip can change scrollbar and pin geometry; keep the timeline honest.
    const themeObserver = new MutationObserver(refresh)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      active = false
      themeObserver.disconnect()
      media.revert()
    }
  }, [isAr])

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative scroll-mt-24 border-b border-border/70"
    >
      <div className="landing-grain" aria-hidden />

      {/* Desktop: one pinned stage, six panels. */}
      <div className="story-pin">
        <div ref={pinRef} className="relative flex h-svh flex-col overflow-hidden bg-background">
          <div
            className="pointer-events-none absolute -top-40 start-[16%] h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,var(--landing-glow),transparent_68%)] blur-2xl"
            aria-hidden
          />

          <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-10 pb-8 pt-[92px]">
            <div className="flex items-end justify-between gap-10 border-b border-border/70 pb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-primary" aria-hidden />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {copy.showcase.label}
                  </p>
                </div>
                <h2
                  className={cn(
                    'mt-3 text-foreground',
                    isAr
                      ? 'font-arabic text-[clamp(1.7rem,3vw,2.45rem)] font-extrabold leading-[1.35]'
                      : 'text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.035em]',
                  )}
                >
                  {copy.showcase.title}
                </h2>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3 pb-1 text-end">
                <SampleTag>{copy.showcase.sampleNote}</SampleTag>
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-landing-faint xl:inline">
                  {copy.showcase.scrollHint}
                </span>
              </div>
            </div>

            <div className="mt-6 grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-10 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-14">
              <div className="flex min-h-0 flex-col">
                <ol
                  className="flex flex-1 flex-col justify-center gap-0.5"
                  aria-label={copy.showcase.title}
                >
                  {stages.map((stage, index) => {
                    const isActive = activeIndex === index
                    return (
                      <li key={stage.title}>
                        <button
                          type="button"
                          onClick={() => jumpToStage(index)}
                          aria-current={isActive ? 'step' : undefined}
                          className={cn(
                            'group grid w-full grid-cols-[26px_minmax(0,1fr)] items-start gap-3 rounded-[6px] border-s-2 py-2.5 pe-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
                            isActive
                              ? 'border-primary bg-primary/[0.04]'
                              : 'border-transparent hover:border-border',
                          )}
                        >
                          <span
                            className={cn(
                              'pt-0.5 text-[10px] font-semibold tabular-nums transition-colors',
                              isActive
                                ? 'text-primary'
                                : 'text-landing-faint group-hover:text-muted-foreground',
                            )}
                          >
                            0{index + 1}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block text-[13px] font-semibold leading-tight transition-colors',
                                isActive
                                  ? 'text-foreground'
                                  : 'text-landing-faint group-hover:text-foreground/80',
                              )}
                            >
                              {stage.title}
                            </span>
                            <span
                              className={cn(
                                'mt-1 block text-[10.5px] leading-[1.5] transition-colors',
                                isActive ? 'text-muted-foreground' : 'text-landing-faint',
                              )}
                            >
                              {stage.summary}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>

                <div className="mt-5 border-t border-border/70 pt-4">
                  <div className="h-px w-full overflow-hidden bg-foreground/10">
                    <div
                      ref={progressRef}
                      className="h-full w-full bg-primary/80 transition-none"
                      style={{ transformOrigin: isAr ? 'right' : 'left', transform: 'scaleX(0)' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] font-semibold uppercase tracking-[0.16em] text-landing-faint">
                    <span className={cn(isAr && 'font-arabic')}>{copy.showcase.sampleShort}</span>
                    <span className="tabular-nums" dir="ltr">
                      {String(Math.min(activeIndex + 1, stages.length)).padStart(2, '0')} / 0
                      {stages.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col">
                <div className="flex items-center justify-between gap-4 rounded-t-[10px] border border-b-0 border-border/80 bg-landing-panel px-4 py-2.5">
                  <span className="truncate text-[10px] font-medium tracking-[0.03em] text-muted-foreground">
                    {sample.workspace.breadcrumb}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    {sample.workspace.status}
                  </span>
                </div>

                <div className="relative min-h-0 overflow-hidden rounded-b-[10px] border border-border/80 bg-landing-surface p-2.5">
                  <div
                    ref={trackRef}
                    className="flex h-[clamp(420px,58vh,590px)] will-change-transform"
                  >
                    {panelKeys.map((key) => (
                      <div key={key} data-story-panel className="h-full w-full shrink-0">
                        <div className="h-full overflow-hidden rounded-[7px] landing-shadow-soft border border-landing-line bg-landing-panel-deep">
                          <StagePanel stage={key} sample={sample} lang={lang} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-[9.5px] font-medium uppercase tracking-[0.16em] text-landing-faint">
                  <span className="truncate">{stages[activeIndex]?.title}</span>
                  <span className="flex items-center gap-2">
                    <span className="hidden sm:inline">{copy.showcase.scrollHint}</span>
                    <ArrowDown className="h-3 w-3 text-primary/80" aria-hidden />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile, tablet, and reduced motion: the same story, stacked. */}
      <div className="story-static">
        <div className="mx-auto w-full max-w-[1320px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-primary" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {copy.showcase.label}
              </p>
            </div>
            <h2
              className={cn(
                'mt-5 text-balance text-foreground',
                isAr
                  ? 'font-arabic text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.3]'
                  : 'text-[clamp(2.2rem,5vw,3.7rem)] font-semibold leading-[1.02] tracking-[-0.04em]',
              )}
            >
              {copy.showcase.title}
            </h2>
            <p
              className={cn(
                'mt-5 max-w-[56ch] text-sm text-muted-foreground sm:text-base',
                isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
              )}
            >
              {copy.showcase.body}
            </p>
            <div className="mt-6">
              <SampleTag>{copy.showcase.sampleNote}</SampleTag>
            </div>
          </div>

          <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
            {panelKeys.map((key, index) => {
              const stage = stages[index]
              return (
                <article key={key} className="min-w-0">
                  <div className="flex items-start gap-4 border-t border-border/80 pt-5 sm:gap-6">
                    <span className="pt-1 font-serif text-[1.6rem] leading-none tabular-nums text-muted-foreground/35 sm:text-[2rem]">
                      0{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl',
                          isAr && 'font-arabic leading-[1.5]',
                        )}
                      >
                        {stage.title}
                      </h3>
                      <p
                        className={cn(
                          'mt-2 max-w-[52ch] text-[13px] leading-[1.7] text-muted-foreground',
                          isAr && 'font-arabic leading-[1.9]',
                        )}
                      >
                        {stage.summary}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[10px] border border-border/80 bg-landing-surface p-2">
                    <div className="overflow-hidden rounded-[7px] landing-shadow-soft border border-landing-line bg-landing-panel-deep">
                      <StagePanel stage={key} sample={sample} lang={lang} />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
