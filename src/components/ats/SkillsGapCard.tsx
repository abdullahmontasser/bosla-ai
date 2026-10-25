'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
  matchedSkills,
  missingSkills,
  dismissedSkills = [],
  dict,
  lang,
  onAddSkill,
  onDismissSkill,
  isUpdating = false,
}: SkillsGapCardProps) {
  const t = (dict?.ats || {}) as Partial<AtsDictionary>

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span>{t.matchedSkills ? `${t.matchedSkills} & Gap Analysis` : 'Skills Analysis'}</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {lang === 'ar'
            ? 'قارن مهاراتك بمتطلبات الوظيفة وأضف المهارات المفقودة أو استبعدها.'
            : 'Review matched competencies and click to add missing skills to your profile or dismiss them.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Matched Skills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t.matchedSkills || 'Matched Skills'}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">{matchedSkills.length}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs py-0.5 px-2 gap-1"
                >
                  <Check className="h-3 w-3" />
                  <span>{skill}</span>
                </Badge>
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
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>{t.missingSkills || 'Missing Skills'}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">{missingSkills.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 pl-2.5 pr-1 py-0.5 text-xs text-amber-700 dark:text-amber-300 transition-all hover:bg-amber-500/20"
                >
                  <span className="font-medium">{skill}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onAddSkill(skill)}
                      title={t.addToProfile || 'Add to profile'}
                      className="rounded-full p-1 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                      aria-label={`${t.addToProfile || 'Add'} ${skill}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onDismissSkill(skill)}
                      title={t.dismiss || 'Dismiss'}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
                      aria-label={`${t.dismiss || 'Dismiss'} ${skill}`}
                    >
                      <X className="h-3 w-3" />
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
                  className="text-[11px] py-0 px-2 line-through text-muted-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
