'use client'

import { useState } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react'
import { BENCHMARK_PRESETS, BenchmarkPreset } from './showcase-data'
import { Badge, RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AtsBenchmarkShowcaseProps {
  lang: string
}

export function AtsBenchmarkShowcase({ lang }: AtsBenchmarkShowcaseProps) {
  const isAr = lang === 'ar'
  const [selectedId, setSelectedId] = useState<string>(BENCHMARK_PRESETS[0].id)

  const activePreset: BenchmarkPreset =
    BENCHMARK_PRESETS.find((p) => p.id === selectedId) || BENCHMARK_PRESETS[0]

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-sm shadow-xs transition-all">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-0.5 gap-1.5 border-primary/30 text-primary"
            >
              <Sparkles className="h-3 w-3" />
              <span>{isAr ? 'محاكاة ATS التفاعلية' : 'Live ATS Benchmark Engine'}</span>
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isAr ? 'بدون تسجيل دخول' : 'Instant client preview · No login needed'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {isAr
              ? 'معايير فحص السير الذاتية وصيغة Google XYZ'
              : 'ATS Keyword Match & Google XYZ Optimization'}
          </h2>
        </div>

        {/* Role Preset Switcher */}
        <div
          role="tablist"
          aria-label={isAr ? 'نماذج المقارنة المرجعية' : 'Benchmark Role Presets'}
          className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-lg self-start md:self-auto overflow-x-auto max-w-full"
        >
          {BENCHMARK_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedId
            return (
              <button
                key={preset.id}
                role="tab"
                id={`preset-tab-${preset.id}`}
                aria-selected={isSelected}
                onClick={() => setSelectedId(preset.id)}
                type="button"
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                  isSelected
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isAr ? preset.roleTitle.ar : preset.roleTitle.en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Score Column & XYZ Bullet Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: ATS Score & Subscores (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="rounded-lg border border-border bg-background p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isAr ? 'درجة توافق النظام' : 'Overall Match Score'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {activePreset.company}
              </span>
            </div>

            {/* Score Ring / Dial */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-2xl font-extrabold tracking-tight text-primary font-mono">
                  {activePreset.overallScore}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'توافق قياسي ممتاز' : 'Target Keyword Match: Strong'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'يستوفي معايير أنظمة التوظيف العالمية بدون كلمات مفتاحية وهمية.'
                    : 'Meets high-conviction recruiter filters with zero hallucinated keywords.'}
                </p>
              </div>
            </div>

            {/* Subscore Bars */}
            <div className="mt-5 space-y-3 pt-4 border-t border-border/60">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isAr ? 'تغطية الكلمات المفتاحية (50%)' : 'Keyword Coverage (50%)'}
                  </span>
                  <span className="font-mono font-medium">{activePreset.keywordScore}%</span>
                </div>
                <div
                  className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={activePreset.keywordScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isAr ? 'تغطية كلمات المفتاحية' : 'Keyword Coverage'}
                >
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${activePreset.keywordScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isAr ? 'ملاءمة الخبرات العملية (30%)' : 'Experience Relevance (30%)'}
                  </span>
                  <span className="font-mono font-medium">{activePreset.relevanceScore}%</span>
                </div>
                <div
                  className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={activePreset.relevanceScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isAr ? 'ملاءمة الخبرات العملية' : 'Experience Relevance'}
                >
                  <div
                    className="h-full bg-primary/80 transition-all duration-500 rounded-full"
                    style={{ width: `${activePreset.relevanceScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isAr ? 'امتثال التنسيق الفني (20%)' : 'Formatting Compliance (20%)'}
                  </span>
                  <span className="font-mono font-medium">{activePreset.formattingScore}%</span>
                </div>
                <div
                  className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={activePreset.formattingScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isAr ? 'امتثال التنسيق الفني' : 'Formatting Compliance'}
                >
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${activePreset.formattingScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skill Coverage Chips */}
          <div className="rounded-lg border border-border bg-background p-4 shadow-2xs space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {isAr ? 'المهارات المكتشفة والفجوات' : 'Skills Detected & Missing Gaps'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activePreset.matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {skill}
                </span>
              ))}
              {activePreset.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-sm bg-amber-500/10 px-2 py-0.5 text-2xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Google XYZ Bullet Optimization Diff (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Before Card */}
          <div className="rounded-lg border border-border/80 bg-background/50 p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isAr
                  ? 'صيغة السيرة التقليدية (غير مخصصة)'
                  : 'Original Resume Bullet (Unoptimized)'}
              </span>
              <Badge variant="outline" className="text-2xs text-muted-foreground border-border">
                {isAr ? 'ضعيف في أنظمة التصفية' : 'Low Recruiter Impact'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;{isAr ? activePreset.beforeBullet.ar : activePreset.beforeBullet.en}&rdquo;
            </p>
          </div>

          {/* Transition Pill */}
          <div className="flex items-center justify-center -my-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold shadow-xs">
              <FileCheck className="h-3.5 w-3.5" />
              <span>{isAr ? 'صيغة جوجل المعيارية (XYZ)' : 'Engineered with Google XYZ'}</span>
              <RtlIcon icon={ArrowRight} className="h-3 w-3" />
            </div>
          </div>

          {/* After Card (Optimized) */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 relative shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isAr ? 'الصياغة المحسنة بعد الذكاء الاصطناعي' : 'Tailored & Grounded Bullet Point'}
              </span>
              <Badge className="bg-primary text-primary-foreground text-2xs hover:bg-primary">
                {isAr ? activePreset.metricTag.ar : activePreset.metricTag.en}
              </Badge>
            </div>
            <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
              &ldquo;{isAr ? activePreset.afterBullet.ar : activePreset.afterBullet.en}&rdquo;
            </p>
            <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isAr
                  ? 'إنجاز مقاس بالأرقام + سياق تقني دقيق'
                  : 'Accomplished [X], measured by [Y], by doing [Z]'}
              </span>
              <span className="font-mono text-2xs text-primary font-semibold">100% GROUNDED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
