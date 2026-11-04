'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X, Award, AlertCircle } from 'lucide-react'
import type { Dictionary, AtsDictionary } from '@/lib/i18n/types'

export interface SkillsGapCardProps {
  matchedSkills: string[]
  missingSkills: string[]
  dismissedSkills?: string[]
  dict: Partial<Dictionary>
  lang: 'en' | 'ar'
  onAddSkill: (skillName: string) => void
  onDismissSkill: (skillName: string) => void
  isUpdating?: boolean
}

export function SkillsGapCard({
  matchedSkills = [],
  missingSkills = [],
  dismissedSkills = [],
  dict,
  lang,
  onAddSkill,
  onDismissSkill,
  isUpdating = false,
}: SkillsGapCardProps) {
  const t = (dict?.ats || {}) as Partial<AtsDictionary>
  const safeMatched = Array.isArray(matchedSkills) ? matchedSkills : []
  const safeMissing = Array.isArray(missingSkills) ? missingSkills : []
  const safeDismissed = Array.isArray(dismissedSkills) ? dismissedSkills : []

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 space-y-4">
      <div className="border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
            {t.matchedSkills ? `${t.matchedSkills} & Gap Analysis` : 'Skills Analysis'}
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {lang === 'ar'
            ? 'قارن مهاراتك بمتطلبات الوظيفة وأضف المهارات المفقودة أو استبعدها.'
            : 'Review matched competencies and click to add missing skills to your profile or dismiss them.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Matched Skills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t.matchedSkills || 'Matched Skills'}</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {safeMatched.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {safeMatched.length > 0 ? (
              safeMatched.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {lang === 'ar'
                  ? 'لم يتم العثور على مهارات متطابقة حتى الآن.'
                  : 'No matched keywords found yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Missing Skills (Interactive) */}
        <div className="space-y-2 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>{t.missingSkills || 'Missing Skills'}</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {safeMissing.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {safeMissing.length > 0 ? (
              safeMissing.map((skill, index) => (
                <div
                  key={index}
                  className="group inline-flex items-center gap-1.5 rounded-[3px] border border-amber-500/30 bg-amber-500/10 ps-2 pe-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300 transition-all hover:bg-amber-500/20"
                >
                  <span className="font-medium">{skill}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onAddSkill(skill)}
                      title={t.addToProfile || 'Add to profile'}
                      className="rounded-[2px] p-1 text-emerald-600 hover:bg-emerald-500/20 transition-colors relative min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      aria-label={`${t.addToProfile || 'Add'} ${skill}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onDismissSkill(skill)}
                      title={t.dismiss || 'Dismiss'}
                      className="rounded-[2px] p-1 text-muted-foreground hover:bg-muted transition-colors relative min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      aria-label={`${t.dismiss || 'Dismiss'} ${skill}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">
                {t.noMissingSkills || 'All key required skills are present!'}
              </p>
            )}
          </div>
        </div>

        {/* Dismissed Skills List */}
        {dismissedSkills && dismissedSkills.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground block mb-1">
              {t.dismissedSkills || 'Dismissed Skills'} ({dismissedSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5 opacity-60">
              {dismissedSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="rounded-[3px] text-[10px] py-0 px-1.5 line-through text-muted-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
