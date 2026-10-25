'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Briefcase, CheckCircle2 } from 'lucide-react'
import type { Dictionary, AtsDictionary } from '@/lib/i18n/types'

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
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <span>
            {lang === 'ar'
              ? 'تحسين نقاط الخبرة (معادلة Google XYZ)'
              : 'Experience Bullet Optimization'}
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {lang === 'ar'
            ? 'أعد صياغة كل إنجاز مهني وفق معادلة Google XYZ ("حقق [س] من خلال [ص]، مما أدى إلى [أثر]") مع الالتزام التام بعدم اختلاق أي أرقام.'
            : 'Restructure achievements into the Google XYZ formula ("Accomplished [X] by doing [Z], resulting in [impact]") without artificial numbers.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {experiences.map((exp, expIdx) => (
          <div key={expIdx} className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5">
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
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-foreground leading-relaxed flex-1">
                        {currentText}
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isOptimizing}
                        onClick={() => onRewriteBullet(expIdx, bulletIdx)}
                        className="h-7 px-2.5 gap-1.5 text-[11px] shrink-0 font-medium"
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
                      <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20 gap-1"
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
      </CardContent>
    </Card>
  )
}
