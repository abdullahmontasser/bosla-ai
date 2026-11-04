'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Briefcase, CheckCircle2 } from 'lucide-react'
import type { Dictionary, AtsDictionary } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

export interface ExperienceBulletItem {
  original?: string
  rewritten?: string
  tailored?: string
  matchedKeywords?: string[]
}

export interface ExperienceItem {
  companyName: string
  jobTitle: string
  bullets: ExperienceBulletItem[]
}

export interface XyzBulletListProps {
  experiences: ExperienceItem[]
  dict: Partial<Dictionary>
  lang: 'en' | 'ar'
  optimizingKey?: string | null
  onRewriteBullet: (expIndex: number, bulletIndex: number) => void
}

export function XyzBulletList({
  experiences,
  dict,
  lang,
  optimizingKey,
  onRewriteBullet,
}: XyzBulletListProps) {
  const t = (dict?.ats || {}) as Partial<AtsDictionary>

  if (!experiences || experiences.length === 0) {
    return null
  }

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 space-y-5">
      <div className="border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
            {lang === 'ar'
              ? 'تحسين نقاط الخبرة (معادلة Google XYZ)'
              : 'Experience Bullet Optimization'}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {lang === 'ar'
            ? 'أعد صياغة كل إنجاز مهني وفق معادلة Google XYZ ("حقق [س] من خلال [ص]، مما أدى إلى [أثر]") مع الالتزام التام بعدم اختلاق أي أرقام.'
            : 'Restructure achievements into the Google XYZ formula ("Accomplished [X] by doing [Z], resulting in [impact]") without artificial numbers.'}
        </p>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, expIdx) => (
          <div key={expIdx} className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
              <span className="font-semibold text-sm text-foreground">{exp.jobTitle}</span>
              <span className="text-xs font-medium text-muted-foreground">{exp.companyName}</span>
            </div>

            <div className="space-y-2.5">
              {exp.bullets.map((bullet, bulletIdx) => {
                const key = `${expIdx}-${bulletIdx}`
                const isOptimizing = optimizingKey === key
                const currentText = bullet.rewritten || bullet.tailored || bullet.original || ''
                const isRewritten = Boolean(
                  bullet.rewritten && bullet.original && bullet.rewritten !== bullet.original,
                )

                return (
                  <div
                    key={bulletIdx}
                    className={cn(
                      'p-3 transition-colors space-y-2 rounded-e-[4px]',
                      isRewritten
                        ? 'border-s-2 border-primary bg-primary/[0.06] ps-3.5'
                        : 'rounded-[6px] border border-border/60 bg-muted/20 hover:bg-muted/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-[13px] text-foreground leading-[1.65] flex-1">
                        {currentText}
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isOptimizing}
                        onClick={() => onRewriteBullet(expIdx, bulletIdx)}
                        className="h-7 px-2.5 gap-1.5 rounded-[5px] text-[11px] shrink-0 font-medium border-border/80"
                      >
                        <Sparkles
                          className={`h-3 w-3 text-primary ${isOptimizing ? 'animate-spin' : ''}`}
                        />
                        <span>
                          {isOptimizing
                            ? t.optimizingBullet || 'Rewriting...'
                            : t.optimizeBulletXyz || 'Google XYZ'}
                        </span>
                      </Button>
                    </div>

                    {isRewritten && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="rounded-[3px] text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 gap-1 font-semibold uppercase tracking-[0.1em]"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>{t.optimizedBadge || 'Google XYZ'}</span>
                        </Badge>
                        <span className="italic truncate max-w-md">
                          {lang === 'ar' ? 'الصياغة الأصلية: ' : 'Original: '}
                          {bullet.original}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
