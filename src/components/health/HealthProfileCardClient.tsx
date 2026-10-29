'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { healthBand, type HealthScoreBand } from '@/lib/health/constants'
import type { HealthAuditView } from '@/lib/health/queries'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'
import { getProfileHealthAction } from '@/app/actions/resume-health'

export interface HealthProfileCardClientProps {
  initialView: HealthAuditView | null
  profileId: string
  lang: 'en' | 'ar'
  dict: Dictionary
}

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

function bandLabels(t: Partial<HealthDictionary>): Record<HealthScoreBand, string> {
  return {
    needs_work: t.needsWork || 'Needs work',
    fair: t.fair || 'Fair',
    strong: t.strong || 'Strong',
    excellent: t.excellent || 'Excellent',
  }
}

export function HealthProfileCardClient({
  initialView,
  profileId,
  lang,
  dict,
}: HealthProfileCardClientProps) {
  const [prevInitialView, setPrevInitialView] = React.useState(initialView)
  const [view, setView] = React.useState<HealthAuditView | null>(initialView)
  const t = (dict.health || {}) as Partial<HealthDictionary>

  // Sync state during render if server passes updated initialView
  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView)
    setView(initialView)
  }

  // Listen to profile language switches and profile updates from client components
  React.useEffect(() => {
    const handleProfileChange = async (event: Event) => {
      const customEvent = event as CustomEvent<{ profileId?: string }>
      const targetId = customEvent.detail?.profileId || profileId
      if (!targetId) return
      try {
        const nextView = await getProfileHealthAction(targetId)
        if (nextView) {
          setView(nextView)
        }
      } catch (err) {
        console.error('Failed to reload health card:', err)
      }
    }

    window.addEventListener('profile-language-changed', handleProfileChange)
    window.addEventListener('profile-data-updated', handleProfileChange)
    return () => {
      window.removeEventListener('profile-language-changed', handleProfileChange)
      window.removeEventListener('profile-data-updated', handleProfileChange)
    }
  }, [profileId])

  if (!view) return null

  // Number, band, and link target language follow the audit profile.
  const cardLang = view.language === 'AR' ? 'ar' : 'en'
  const clamped = Math.max(0, Math.min(100, Math.round(view.overallScore)))
  const band = healthBand(clamped)
  const bandText = bandLabels(t)[band]
  const bandStyles = BAND_STYLES[band]
  const openCount = view.openCount

  return (
    <Card className="border-border bg-card" data-testid="health-profile-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {t.profileCardTitle || 'Base resume health'}
        </CardTitle>
        <CardDescription className="mt-0.5 text-xs text-muted-foreground">
          {t.profileCardSubtitle || ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex min-w-0 flex-1 items-center gap-4"
            dir={cardLang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div
              className="relative h-20 w-20 shrink-0"
              role="img"
              aria-label={`${formatNumber(clamped, cardLang)} ${t.scoreOutOf || 'out of 100'}`}
            >
              <svg viewBox="0 0 96 96" className="h-20 w-20 -rotate-90" aria-hidden="true">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  strokeWidth="8"
                  className="stroke-muted"
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
                  strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn('text-xl font-bold leading-none tabular-nums', bandStyles.text)}
                >
                  {formatNumber(clamped, cardLang)}
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-0.5">
              <p className={cn('text-sm font-semibold', bandStyles.text)}>{bandText}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(openCount, cardLang)} {t.openIssuesSuffix || 'open issues'}
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
            <Link href={`/${lang}/resume?auditLang=${cardLang}`}>
              {t.viewAudit || 'Open the full audit'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
