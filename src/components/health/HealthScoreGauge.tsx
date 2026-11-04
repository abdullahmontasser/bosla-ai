'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { healthBand, type HealthScoreBand } from '@/lib/health/constants'
import type { HealthBreakdown } from '@/lib/health/rules'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'

export interface HealthScoreGaugeProps {
  score: number
  breakdown?: HealthBreakdown
  dict: Partial<Dictionary>
  /** Number and band language, which follows the audit cards, not the page. */
  lang: 'en' | 'ar'
  /** Score to animate from; defaults to settled score on first mount. */
  fromScore?: number
  /** Shows the small last known score state while a recalculation is pending. */
  updating?: boolean
}

interface CategoryRow {
  key: keyof HealthBreakdown['categories']
  labelKey: keyof HealthDictionary
}

const CATEGORY_ROWS: CategoryRow[] = [
  { key: 'impactMetrics', labelKey: 'categoryImpact' },
  { key: 'actionVerbs', labelKey: 'categoryActionVerbs' },
  { key: 'atsCompleteness', labelKey: 'categoryCompleteness' },
  { key: 'contentDepth', labelKey: 'categoryDepth' },
]

const BAND_STYLES: Record<HealthScoreBand, { ring: string; text: string; bar: string }> = {
  needs_work: {
    ring: 'stroke-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  fair: {
    ring: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  strong: {
    ring: 'stroke-primary',
    text: 'text-primary',
    bar: 'bg-primary',
  },
  excellent: {
    ring: 'stroke-primary',
    text: 'text-primary',
    bar: 'bg-primary',
  },
}

function getCategoryBand(score: number): { bar: string; text: string } {
  if (score >= 75) {
    return { bar: 'bg-primary', text: 'text-primary' }
  }
  if (score >= 50) {
    return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' }
  }
  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' }
}

const CIRCUMFERENCE = 2 * Math.PI * 40

/** Arabic locale digits for the ar audit language, Western digits otherwise. */
function formatNumber(value: number, lang: 'en' | 'ar'): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    useGrouping: false,
  }).format(value)
}

export function HealthScoreGauge({
  score,
  breakdown,
  dict,
  lang,
  fromScore,
  updating = false,
}: HealthScoreGaugeProps) {
  const t = (dict?.health || {}) as Partial<HealthDictionary>
  const clamped = Math.max(0, Math.min(100, Math.round(score)))

  // Start at fromScore if explicitly provided, otherwise start directly at clamped
  // so initial renders never show an out-of-sync intermediate number (e.g. 36 + "Strong").
  const [displayed, setDisplayed] = React.useState(fromScore ?? clamped)
  const displayedRef = React.useRef(fromScore ?? clamped)

  React.useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(score)))
    if (displayedRef.current === target) return

    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const settle = () => {
      displayedRef.current = target
      setDisplayed(target)
    }

    if (reduce || typeof requestAnimationFrame !== 'function') {
      const timer = window.setTimeout(settle, 0)
      return () => window.clearTimeout(timer)
    }

    let raf = 0
    const start = performance.now()
    const from = displayedRef.current
    const duration = Math.max(250, Math.min(600, 180 + Math.abs(target - from) * 4))
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.round(from + (target - from) * eased)
      displayedRef.current = value
      setDisplayed(value)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const band = healthBand(clamped)
  const visualBand = healthBand(displayed)
  const bandLabels: Record<HealthScoreBand, string> = {
    needs_work: t.needsWork || 'Needs work',
    fair: t.fair || 'Fair',
    strong: t.strong || 'Strong',
    excellent: t.excellent || 'Excellent',
  }
  const bandLabel = bandLabels[band]
  const bandStyles = BAND_STYLES[visualBand]
  const scoreOutOf = t.scoreOutOf || 'out of 100'
  const excludedCount = breakdown?.excludedCount ?? 0

  const gaugeAriaLabel = `${formatNumber(clamped, lang)} ${scoreOutOf}`

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 space-y-5 shadow-xs">
      {/* Header Eyebrow */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-primary" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            SCORE / 01
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold tabular-nums text-muted-foreground">
          {t.scoreLabel || 'Health score'}
        </span>
      </div>

      {/* Main Score Display & Dial */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[44px] font-bold tracking-tight text-foreground tabular-nums leading-none">
              {formatNumber(displayed, lang)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              / {formatNumber(100, lang)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                'rounded-[3px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                band === 'needs_work'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : band === 'fair'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-primary/30 bg-primary/10 text-primary',
              )}
            >
              {bandLabel}
            </span>
            {updating && (
              <Badge variant="secondary" className="rounded-[3px] text-[10px] animate-pulse">
                {t.updating || 'Updating…'}
              </Badge>
            )}
          </div>

          {updating && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t.lastKnown || 'Last known score'}
            </p>
          )}

          {excludedCount > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatNumber(excludedCount, lang)} {t.excludedSuffix || 'dismissed issues'}
            </p>
          )}
        </div>

        {/* Circular SVG Gauge for tactile feel and test compatibility */}
        <div className="relative h-18 w-18 shrink-0" role="img" aria-label={gaugeAriaLabel}>
          <svg viewBox="0 0 96 96" className="h-18 w-18 -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="8"
              className="stroke-muted/40"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={bandStyles.ring}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - displayed / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-xs font-bold tabular-nums', bandStyles.text)}>
              {formatNumber(displayed, lang)}
            </span>
            <span className="sr-only">{formatNumber(100, lang)}</span>
          </div>
        </div>
      </div>

      {/* 10-Segment Pill Meter from Landing ATS Panel */}
      <div className="flex gap-1 w-full pt-1" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < Math.round(displayed / 10)
                ? displayed >= 75
                  ? 'bg-primary'
                  : displayed >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                : 'bg-foreground/10',
            )}
          />
        ))}
      </div>

      {/* Semantic Category Progress Bars */}
      <div className="space-y-3 pt-3 border-t border-border/70" aria-hidden="false">
        {CATEGORY_ROWS.map(({ key, labelKey }) => {
          const category = breakdown?.categories?.[key]
          const categoryScore = category?.score ?? 0
          const catStyles = getCategoryBand(categoryScore)
          const label = t[labelKey] || key

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{label}</span>
                <span className={cn('font-semibold tabular-nums', catStyles.text)}>
                  {formatNumber(categoryScore, lang)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', catStyles.bar)}
                  style={{ width: `${categoryScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Follows settled score for SR */}
      <span role="status" aria-live="polite" className="sr-only">
        {`${formatNumber(clamped, lang)} ${scoreOutOf} — ${bandLabel}`}
      </span>
    </div>
  )
}
