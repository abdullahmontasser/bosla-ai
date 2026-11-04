'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RtlIcon } from '@/components/ui/rtl-icon'
import { createApplication } from '@/app/actions/application-actions'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import { Check, Kanban, Sparkles, ArrowRight, Briefcase } from 'lucide-react'

export interface TailorActionBarProps {
  tailoredResumeId: string
  jobTitle: string
  companyName: string
  initialHasApplication?: boolean
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function TailorActionBar({
  tailoredResumeId,
  jobTitle,
  companyName,
  initialHasApplication = false,
  lang,
  dict,
}: TailorActionBarProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'

  const [hasApplication, setHasApplication] = React.useState(Boolean(initialHasApplication))
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSaveToTracker = async () => {
    if (!tailoredResumeId) return
    setIsSaving(true)
    try {
      const res = await createApplication({
        title: jobTitle,
        companyName,
        status: 'SAVED',
        tailoredResumeId,
      })
      if (res.success || res.error?.toLowerCase().includes('already exists')) {
        setHasApplication(true)
      }
    } catch {
      // Graceful fallback for duplicate entries
      setHasApplication(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="w-full rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-xs"
      data-testid="tailor-action-bar"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Role Context & Readiness Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground truncate">
                {jobTitle}
                {companyName ? ` · ${companyName}` : ''}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                {isArabic ? 'جاهز للتقديم' : 'Ready to Apply'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.applicationSaved ||
                (isArabic
                  ? 'السيرة الذاتية المخصصة جاهزة للإدراج في لوحة المتابعة والتدرب على أسئلة المقابلة.'
                  : 'Tailored resume ready for tracking in Kanban and interview preparation.')}
            </p>
          </div>
        </div>

        {/* Right: Dual Career Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Tracker Action */}
          {hasApplication ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              data-testid="view-in-tracker-btn"
            >
              <Link href={`/${lang}/tracker`}>
                <Check className="size-3.5" />
                <span>
                  {dict.tracker?.viewInTracker ||
                    (isArabic ? 'عرض في لوحة المتابعة' : 'View in Tracker')}
                </span>
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSaveToTracker}
              disabled={isSaving}
              className="h-9 gap-1.5 rounded-lg text-xs font-semibold border-border hover:bg-muted text-foreground cursor-pointer"
              data-testid="add-to-tracker-btn"
            >
              <Kanban className="size-3.5 text-muted-foreground" />
              <span>
                {isSaving
                  ? dict.tracker?.saving || (isArabic ? 'جارٍ الإضافة...' : 'Adding...')
                  : dict.tracker?.addToTracker ||
                    (isArabic ? 'إضافة للوحة المتابعة' : 'Add to Tracker')}
              </span>
            </Button>
          )}

          {/* Deep link to Career Prep Hub */}
          <Button
            asChild
            size="sm"
            variant="default"
            className="h-9 gap-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer px-4"
            data-testid="practice-star-btn"
          >
            <Link href={`/${lang}/career-prep?tailoredResumeId=${tailoredResumeId}`}>
              <Sparkles className="size-3.5" />
              <span>
                {t.practiceStarQuestions ||
                  (isArabic ? 'التدرب على أسئلة STAR' : 'Practice STAR Interview Questions')}
              </span>
              <RtlIcon icon={ArrowRight} className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
