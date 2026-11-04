'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { healthBand, type HealthScoreBand } from '@/lib/health/constants'
import type { HealthAuditView } from '@/lib/health/queries'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'
import { getProfileHealthAction, forceRecalculateHealthAction } from '@/app/actions/resume-health'
import { ArrowUpRight, RotateCw, Sparkles } from 'lucide-react'
import { InteractiveAuditModal } from './InteractiveAuditModal'

export interface HealthProfileCardClientProps {
  initialView: HealthAuditView | null
  profileId: string
  lang: 'en' | 'ar'
  dict: Dictionary
}

const BAND_STYLES: Record<
  HealthScoreBand,
  { bar: string; text: string; dot: string; bg: string; border: string }
> = {
  needs_work: {
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  fair: {
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  strong: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  excellent: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
}

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
  const [isRecalculating, setIsRecalculating] = React.useState(false)
  const [auditModalOpen, setAuditModalOpen] = React.useState(false)
  const t = (dict.health || {}) as Partial<HealthDictionary>

  // Sync state during render if server passes updated initialView
  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView)
    setView(initialView)
  }

  // Force recalculation manually
  const handleRecalculate = async () => {
    if (isRecalculating || !profileId) return
    setIsRecalculating(true)
    try {
      const nextView = await forceRecalculateHealthAction(profileId)
      if (nextView) {
        setView(nextView)
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile-data-updated', {
            detail: { profileId },
          }),
        )
      }
    } catch (err) {
      console.error('Failed to recalculate health:', err)
    } finally {
      setIsRecalculating(false)
    }
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
  const filledSegments = Math.round(clamped / 10)

  return (
    <div
      className="group relative overflow-hidden rounded-[10px] border border-border/80 bg-gradient-to-r from-card via-card to-card/70 p-3.5 sm:p-4 shadow-xs transition-all hover:border-border hover:shadow-sm"
      data-testid="health-profile-card"
      data-lang={cardLang}
      dir={cardLang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left side: Score Stamp + Health Status & Issue Count */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Numeric Score Stamp */}
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[8px] border border-border/80 bg-muted/30 shadow-2xs">
            <span
              className={cn(
                'text-base font-bold tabular-nums leading-none font-mono',
                bandStyles.text,
              )}
            >
              {formatNumber(clamped, cardLang)}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/70 mt-0.5 leading-none">
              / {formatNumber(100, cardLang)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                {t.profileCardTitle || 'Base resume health'}
              </span>
              <span className="text-muted-foreground/40" aria-hidden="true">
                ·
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                  bandStyles.bg,
                  bandStyles.border,
                  bandStyles.text,
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full animate-pulse', bandStyles.dot)}
                  aria-hidden="true"
                />
                <span>{bandText}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
              <span className="font-semibold text-foreground">
                {formatNumber(openCount, cardLang)} {t.openIssuesSuffix || 'open issues'}
              </span>
              <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-muted-foreground truncate hidden sm:inline">
                {t.profileCardSubtitle || 'Recalculated from your master profile on every visit.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: 10-Segment Micro Meter + Direct Link to Full Audit */}
        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-border/50">
          <div
            className="flex items-center gap-1 w-20 sm:w-24"
            role="img"
            aria-label={`${formatNumber(clamped, cardLang)} ${t.scoreOutOf || 'out of 100'}`}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i < filledSegments ? bandStyles.bar : 'bg-muted-foreground/15',
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            aria-label={
              cardLang === 'ar' ? 'إعادة حساب صحة السيرة الذاتية' : 'Recalculate resume health'
            }
            className="h-7.5 px-2.5 rounded-[6px] text-xs font-medium border-border hover:bg-accent hover:text-foreground transition-all shadow-2xs group flex items-center gap-1.5"
          >
            <RotateCw
              className={cn(
                'size-3 text-muted-foreground group-hover:text-foreground transition-transform',
                isRecalculating && 'animate-spin text-primary',
              )}
            />
            <span className="hidden sm:inline">
              {cardLang === 'ar' ? 'إعادة الحساب' : 'Recalculate'}
            </span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setAuditModalOpen(true)}
            className="h-7.5 px-3 rounded-[6px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs group flex items-center gap-1.5"
          >
            <Sparkles className="size-3 text-primary-foreground group-hover:scale-110 transition-transform" />
            <span>{cardLang === 'ar' ? 'فحص ومعالجة الـ ATS' : 'Check & Fix ATS'}</span>
          </Button>
        </div>
      </div>

      <InteractiveAuditModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        profileId={profileId}
        initialView={view}
        lang={cardLang}
        dict={dict}
      />
    </div>
  )
}
