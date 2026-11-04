'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RefreshCw, Info } from 'lucide-react'
import type { AtsBreakdown } from '@/lib/validations/tailored-resume'
import type { Dictionary, AtsDictionary } from '@/lib/i18n/types'

export interface AtsScoreCardProps {
  score: number
  breakdown: AtsBreakdown
  dict: Partial<Dictionary>
  lang: 'en' | 'ar'
  isScanning?: boolean
  onDeepScan?: () => void
  onRecalculate?: () => void
}

export function AtsScoreCard({
  score,
  breakdown,
  dict,
  lang,
  isScanning = false,
  onDeepScan,
  onRecalculate,
}: AtsScoreCardProps) {
  const t = (dict?.ats || {}) as Partial<AtsDictionary>

  const getScoreColor = (val: number) => {
    if (val >= 75) return 'text-primary'
    if (val >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  const getBarColor = (val: number) => {
    if (val >= 75) return 'bg-primary/80'
    if (val >= 50) return 'bg-amber-600/70 dark:bg-amber-400/80'
    return 'bg-rose-600/70 dark:bg-rose-400/80'
  }

  const getScoreLabel = (val: number) => {
    if (val >= 80) return t.highMatch || 'Strong Match'
    if (val >= 60) return t.mediumMatch || 'Moderate Match'
    return t.lowMatch || 'Needs Optimization'
  }

  const subscores = breakdown?.categorySubscores || {
    keywordMatch: 0,
    experienceRelevance: 0,
    formattingCompliance: 0,
  }

  const matchedSkillsCount = breakdown?.matchedSkills?.length ?? 0
  const missingSkillsCount = breakdown?.missingSkills?.length ?? 0

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              {t.overallMatch || 'ATS Match Score'}
            </h3>
            {breakdown.isStale && (
              <Badge
                variant="secondary"
                className="rounded-[3px] text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              >
                {t.staleScoreNotice || 'Update Needed'}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t.subtitle ||
              'Deterministic score weighted across keywords, relevance, and formatting.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {breakdown.isStale && onRecalculate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              className="h-7 rounded-[5px] gap-1.5 text-xs font-medium"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{t.recalculate || 'Recalculate'}</span>
            </Button>
          )}

          {onDeepScan && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDeepScan}
              disabled={isScanning}
              className="h-7 rounded-[5px] gap-1.5 text-xs font-semibold border border-border/80"
            >
              <Sparkles className={`h-3 w-3 text-primary ${isScanning ? 'animate-spin' : ''}`} />
              <span>
                {isScanning ? t.deepScanning || 'Scanning...' : t.deepScanWithAi || 'AI Deep Scan'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Score & 10-Segment Meter (Styled directly after AtsPanel in StoryPanels.tsx) */}
      <div className="rounded-[7px] border border-border bg-landing-raised p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              COMPUTED SCORE
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-[42px] font-semibold leading-none tracking-[-0.04em] tabular-nums ${getScoreColor(score)}`}
              >
                {score}
              </span>
              <span className="text-[14px] font-medium text-muted-foreground">/100</span>
            </div>
          </div>
          <span
            className={`rounded-[3px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              score >= 75
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : score >= 50
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {getScoreLabel(score)}
          </span>
        </div>

        {/* 10-Segment Pill Meter */}
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index < Math.round(score / 10) ? 'bg-primary/80' : 'bg-foreground/10'
              }`}
            />
          ))}
        </div>

        <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed">
          {lang === 'ar'
            ? `تم التقييم بنجاح: ${matchedSkillsCount} مهارات متطابقة و ${missingSkillsCount} مهارات ناقصة.`
            : `Evaluation complete: ${matchedSkillsCount} matched keywords and ${missingSkillsCount} skills to optimize.`}
        </p>
      </div>

      {/* Weighted Category Subscores */}
      <div className="space-y-3 pt-1">
        {/* Keyword Match (50%) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {t.keywordMatch || 'Keyword Match (50%)'}
            </span>
            <span className="font-semibold tabular-nums text-muted-foreground">
              {subscores.keywordMatch}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getBarColor(subscores.keywordMatch)}`}
              style={{ width: `${subscores.keywordMatch}%` }}
            />
          </div>
        </div>

        {/* Experience Relevance (30%) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {t.experienceRelevance || 'Experience Relevance (30%)'}
            </span>
            <span className="font-semibold tabular-nums text-muted-foreground">
              {subscores.experienceRelevance}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getBarColor(subscores.experienceRelevance)}`}
              style={{ width: `${subscores.experienceRelevance}%` }}
            />
          </div>
        </div>

        {/* Formatting Compliance (20%) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {t.formattingCompliance || 'Formatting Compliance (20%)'}
            </span>
            <span className="font-semibold tabular-nums text-muted-foreground">
              {subscores.formattingCompliance}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getBarColor(subscores.formattingCompliance)}`}
              style={{ width: `${subscores.formattingCompliance}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Feedback List */}
      {breakdown.actionableFeedback && breakdown.actionableFeedback.length > 0 && (
        <div className="pt-3 border-t border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground block mb-2">
            {t.actionableFeedback || 'Improvement Recommendations'}
          </span>
          <ul className="space-y-1.5">
            {breakdown.actionableFeedback.map((feedback, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
