'use client'

import * as React from 'react'
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, SplitSquareVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface BeforeAfterComparisonProps {
  originalHeadline?: string | null
  originalSummary?: string | null
  originalBullets?: string[]
  tailoredHeadline?: string | null
  tailoredSummary?: string | null
  tailoredBullets?: string[]
  atsScore?: number | null
  lang: 'en' | 'ar'
}

export function BeforeAfterComparison({
  originalHeadline,
  originalSummary,
  originalBullets = [],
  tailoredHeadline,
  tailoredSummary,
  tailoredBullets = [],
  atsScore,
  lang,
}: BeforeAfterComparisonProps) {
  const isArabic = lang === 'ar'
  const [viewMode, setViewMode] = React.useState<'side-by-side' | 'before' | 'after'>(
    'side-by-side',
  )

  const hasOriginal = Boolean(originalSummary || originalBullets.length > 0)
  const hasTailored = Boolean(tailoredSummary || tailoredBullets.length > 0)

  if (!hasTailored && !hasOriginal) return null

  return (
    <div
      data-testid="before-after-comparison"
      className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs transition-all duration-300"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <SplitSquareVertical className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {isArabic ? 'مقارنة التحسين: قبل وبعد التخصيص' : 'CV Optimization: Before vs. After'}
          </h3>
          {atsScore != null && (
            <Badge
              variant="outline"
              className="border-primary/30 text-primary font-mono text-[10px] gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              <span>{Math.round(atsScore)}% ATS Fit</span>
            </Badge>
          )}
        </div>

        {/* View Toggle on smaller viewports */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'جنباً إلى جنب' : 'Side-by-Side'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('before')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition-colors ${
              viewMode === 'before'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'قبل التخصيص' : 'Before (Master)'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('after')}
            className={`px-2.5 py-1 rounded-[3px] font-medium transition-colors ${
              viewMode === 'after'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isArabic ? 'بعد التخصيص' : 'After (Tailored)'}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div
        className={`grid divide-y lg:divide-y-0 lg:divide-x ${
          isArabic ? 'lg:divide-x-reverse' : ''
        } ${viewMode === 'side-by-side' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
      >
        {/* BEFORE COLUMN */}
        {(viewMode === 'side-by-side' || viewMode === 'before') && (
          <div className="p-4 sm:p-5 space-y-4 bg-muted/10">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isArabic ? 'السيرة الأصلية (الملف العام)' : 'Original Master CV'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {isArabic ? 'نص أولي عام' : 'Baseline Profile'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-foreground/80 block">
                {isArabic ? 'الملخص المهني الأصلي' : 'Original Professional Summary'}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed bg-background/60 p-3 rounded border border-border/50 italic">
                {originalSummary ||
                  (isArabic
                    ? 'لا يوجد ملخص مسجل للملف العام'
                    : 'No summary provided in master profile.')}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-foreground/80 block">
                {isArabic ? 'نقاط الخبرة السابقة' : 'Sample Experience Bullets'}
              </span>
              <div className="space-y-1.5">
                {originalBullets.length > 0 ? (
                  originalBullets.slice(0, 4).map((bullet, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground/90 flex items-start gap-2 bg-background/40 p-2 rounded"
                    >
                      <span className="text-muted-foreground/60 select-none">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isArabic ? 'لم تسجل نقاط خبرة' : 'No raw bullets recorded.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AFTER COLUMN */}
        {(viewMode === 'side-by-side' || viewMode === 'after') && (
          <div className="p-4 sm:p-5 space-y-4 bg-primary/5">
            <div className="flex items-center justify-between pb-2 border-b border-primary/20">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isArabic ? 'النسخة المخصصة بالذكاء الاصطناعي' : 'AI-Tailored Impact CV'}
                </span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {isArabic ? 'صيغة Google XYZ' : 'Google XYZ Format'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-foreground block">
                {isArabic ? 'الملخص المخصص الموجه للوظيفة' : 'Targeted Executive Summary'}
              </span>
              <div className="text-xs text-foreground leading-relaxed bg-card p-3 rounded border border-primary/20 shadow-xs">
                {tailoredSummary ? (
                  <p className="font-medium">{tailoredSummary}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isArabic ? 'في انتظار توليد الملخص المخصص...' : 'Awaiting tailored summary...'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground block">
                  {isArabic ? 'النقاط المهنية المقاسة (X-Y-Z)' : 'Quantified Achievement Bullets'}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {tailoredBullets.length} {isArabic ? 'نقاط محسنة' : 'tailored'}
                </span>
              </div>
              <div className="space-y-2">
                {tailoredBullets.length > 0 ? (
                  tailoredBullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-foreground flex items-start gap-2 bg-card p-2.5 rounded border border-border/80 hover:border-primary/40 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{bullet}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {isArabic ? 'لم يتم توليد نقاط بعد' : 'No tailored bullets yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
