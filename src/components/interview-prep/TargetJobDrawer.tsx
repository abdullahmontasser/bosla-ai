'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Building2, ChevronDown, ChevronUp, Sparkles, X, Target } from 'lucide-react'

export interface TargetJobDrawerProps {
  isOpen: boolean
  onClose: () => void
  roleTitle: string
  companyName: string
  parsedSkills?: string[]
  jobDescription?: string
  groundingSources?: {
    workExperiences: string[]
    projects: string[]
  }
  lang: 'en' | 'ar'
}

export function TargetJobDrawer({
  isOpen,
  onClose,
  roleTitle,
  companyName,
  parsedSkills = [],
  jobDescription,
  groundingSources,
  lang,
}: TargetJobDrawerProps) {
  const isArabic = lang === 'ar'
  const [descExpanded, setDescExpanded] = React.useState(false)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-y-0 end-0 z-50 w-full sm:w-[480px] bg-card border-s border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      data-testid="target-job-drawer"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {isArabic ? 'سياق الوظيفة المستهدفة' : 'Target Role Context'}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="size-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-foreground">
        {/* Role & Company Card */}
        <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Briefcase className="size-4 text-primary shrink-0" />
            <span className="truncate">{roleTitle}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{companyName}</span>
          </div>
        </div>

        {/* Parsed Required Skills */}
        {parsedSkills.length > 0 && (
          <div className="space-y-2">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
              {isArabic ? 'المهارات والكفاءات المطلوبة' : 'Required Competencies & Skills'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {parsedSkills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="rounded px-2 py-0.5 text-[11px] font-medium border border-border/60"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Grounding Candidate Sources */}
        {groundingSources &&
          (groundingSources.workExperiences.length > 0 || groundingSources.projects.length > 0) && (
            <div className="space-y-3 p-3.5 rounded-lg border border-border/80 bg-muted/20">
              <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px] uppercase tracking-wider">
                <Sparkles className="size-3.5 text-primary" />
                <span>
                  {isArabic
                    ? 'إنجازاتك المستند إليها (Google XYZ)'
                    : 'Candidate Grounded Achievements'}
                </span>
              </div>

              {groundingSources.workExperiences.length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px]">
                    {isArabic ? 'خبرات العمل المستخدمة:' : 'Referenced Experience:'}
                  </span>
                  <ul className="space-y-1 ps-4 list-disc text-muted-foreground">
                    {groundingSources.workExperiences.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {groundingSources.projects.length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium text-[11px]">
                    {isArabic ? 'المشاريع المستخدمة:' : 'Referenced Projects:'}
                  </span>
                  <ul className="space-y-1 ps-4 list-disc text-muted-foreground">
                    {groundingSources.projects.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        {/* Job Description */}
        {jobDescription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                {isArabic ? 'الوصف الوظيفي الكامل' : 'Job Description'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDescExpanded((prev) => !prev)}
                className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground"
              >
                <span>
                  {descExpanded ? (isArabic ? 'طي' : 'Collapse') : isArabic ? 'توسيع' : 'Expand'}
                </span>
                {descExpanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </Button>
            </div>
            <div
              className={`p-3 rounded-lg border border-border/80 bg-background leading-relaxed whitespace-pre-wrap text-muted-foreground ${
                descExpanded ? 'max-h-none' : 'max-h-48 overflow-hidden relative'
              }`}
            >
              {jobDescription}
              {!descExpanded && (
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
          {isArabic ? 'إغلاق' : 'Close'}
        </Button>
      </div>
    </div>
  )
}
