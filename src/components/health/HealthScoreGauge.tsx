'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { healthBand, type HealthScoreBand } from '@/lib/health/constants'
import type { HealthBreakdown } from '@/lib/health/rules'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'

export interface HealthScoreGaugeProps {
  score: number
  breakdown?: HealthBreakdown
  dict: Partial<Dictionary>
  /** Number and band language, which follows the audit cards, not the page. */
  lang: 'en' | 'ar'
  /** Score to animate from; defaults to 0 on first mount. */
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

const BAND_STYLES: Record<HealthScoreBand, { ring: string; text: string }> = {
  needs_work: {
    ring: 'stroke-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  fair: {
    ring: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  strong: {
    ring: 'stroke-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  excellent: {
    ring: 'stroke-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
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

  const [displayed, setDisplayed] = React.useState(fromScore ?? 0)
  const displayedRef = React.useRef(fromScore ?? 0)

  React.useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(score)))
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const settle = () => {
      displayedRef.current = target
      setDisplayed(target)
    }

    // Every state write is deferred into a callback, so the effect body
    // never sets state synchronously; reduced motion settles on next tick.
    if (reduce || typeof requestAnimationFrame !== 'function') {
      const timer = window.setTimeout(settle, 0)
      return () => window.clearTimeout(timer)
    }

    let raf = 0
    const start = performance.now()
    const from = displayedRef.current
    const duration = Math.max(250, Math.min(700, 200 + Math.abs(target - from) * 5))
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
  const bandLabels: Record<HealthScoreBand, string> = {
    needs_work: t.needsWork || 'Needs work',
    fair: t.fair || 'Fair',
    strong: t.strong || 'Strong',
    excellent: t.excellent || 'Excellent',
  }
  const bandLabel = bandLabels[band]
  const bandStyles = BAND_STYLES[band]
  const scoreOutOf = t.scoreOutOf || 'out of 100'
  const excludedCount = breakdown?.excludedCount ?? 0

  const gaugeAriaLabel = `${formatNumber(clamped, lang)} ${scoreOutOf}`

  return (
    <div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative h-24 w-24 shrink-0" role="img" aria-label={gaugeAriaLabel}>
          <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
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
            <span className={`text-3xl font-bold leading-none tabular-nums ${bandStyles.text}`}>
              {formatNumber(displayed, lang)}
            </span>
            <span className="mt-1 text-[10px] font-normal text-muted-foreground" aria-hidden="true">
              {formatNumber(100, lang)}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-start">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className={`text-sm font-semibold ${bandStyles.text}`}>{bandLabel}</span>
            {updating && (
              <Badge variant="secondary" className="text-[10px] animate-pulse">
                {t.updating || 'Updating…'}
              </Badge>
            )}
          </div>
          {updating && (
            <p className="text-xs text-muted-foreground">{t.lastKnown || 'Last known score'}</p>
          )}
          {excludedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatNumber(excludedCount, lang)} {t.excludedSuffix || 'dismissed issues'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3" aria-hidden="false">
        {CATEGORY_ROWS.map(({ key, labelKey }) => {
          const category = breakdown?.categories?.[key]
          const categoryScore = category?.score ?? 0
          const label = t[labelKey] || key
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{label}</span>
                <span className="font-semibold tabular-nums text-muted-foreground">
                  {formatNumber(categoryScore, lang)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${categoryScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Follows the settled score, so animation frames never announce. */}
      <span role="status" aria-live="polite" className="sr-only">
        {`${formatNumber(clamped, lang)} ${scoreOutOf} — ${bandLabel}`}
      </span>
    </div>
  )
}
