'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
    if (val >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    if (val >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30'
  }

  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500'
    if (val >= 60) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const getScoreLabel = (val: number) => {
    if (val >= 80) return t.highMatch || 'Strong Match'
    if (val >= 60) return t.mediumMatch || 'Moderate Match'
    return t.lowMatch || 'Needs Optimization'
  }

  const subscores = breakdown.categorySubscores || {
    keywordMatch: 0,
    experienceRelevance: 0,
    formattingCompliance: 0,
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span>{t.overallMatch || 'ATS Match Score'}</span>
              {breakdown.isStale && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30"
                >
                  {t.staleScoreNotice ? 'Update Needed' : 'Update Needed'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t.subtitle ||
                'Deterministic score weighted across keywords, relevance, and formatting.'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {breakdown.isStale && onRecalculate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRecalculate}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t.recalculate || 'Recalculate'}</span>
              </Button>
            )}

            {onDeepScan && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDeepScan}
                disabled={isScanning}
                className="h-8 gap-1.5 text-xs font-semibold border border-border/80"
              >
                <Sparkles className={`h-3.5 w-3.5 text-primary ${isScanning ? 'animate-spin' : ''}`} />
                <span>
                  {isScanning
                    ? t.deepScanning || 'Scanning...'
                    : t.deepScanWithAi || 'AI Deep Scan'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
          <div
            className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shrink-0 font-bold tabular-nums ${getScoreColor(
              score,
            )}`}
          >
            <span className="text-xl leading-none">{score}</span>
            <span className="text-[10px] text-muted-foreground font-normal">/100</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{getScoreLabel(score)}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? `تم التقييم بنجاح: ${breakdown.matchedSkills.length} مهارات متطابقة و ${breakdown.missingSkills.length} مهارات ناقصة.`
                : `Evaluation complete: ${breakdown.matchedSkills.length} matched keywords and ${breakdown.missingSkills.length} skills to optimize.`}
            </p>
          </div>
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
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getBarColor(subscores.formattingCompliance)}`}
                style={{ width: `${subscores.formattingCompliance}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actionable Feedback List */}
        {breakdown.actionableFeedback && breakdown.actionableFeedback.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-xs font-semibold text-foreground block mb-2">
              {t.actionableFeedback || 'Improvement Recommendations'}
            </span>
            <ul className="space-y-1.5">
              {breakdown.actionableFeedback.map((feedback, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{feedback}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
