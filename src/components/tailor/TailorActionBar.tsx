'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
      className="sticky bottom-4 z-20 w-full rounded-xl border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md transition-all"
      data-testid="tailor-action-bar"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left / Start Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Briefcase className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {jobTitle} · {companyName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {t.applicationSaved ||
                (isArabic
                  ? 'السيرة الذاتية المخصصة جاهزة للمتابعة والتحضير'
                  : 'Tailored resume ready for tracking and interview practice')}
            </p>
          </div>
        </div>

        {/* Right / End Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Tracker Action */}
          {hasApplication ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
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
              className="h-9 gap-1.5 text-xs font-semibold border-border hover:bg-accent text-foreground"
              data-testid="add-to-tracker-btn"
            >
              <Kanban className="size-3.5 text-primary" />
              <span>
                {isSaving
                  ? dict.tracker?.saving || (isArabic ? 'جارٍ الإضافة...' : 'Adding...')
                  : dict.tracker?.addToTracker ||
                    (isArabic ? 'إضافة إلى لوحة المتابعة' : 'Add to Tracker')}
              </span>
            </Button>
          )}

          {/* Deep link to Career Prep Hub */}
          <Button
            asChild
            size="sm"
            variant="default"
            className="h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            data-testid="practice-star-btn"
          >
            <Link href={`/${lang}/career-prep?tailoredResumeId=${tailoredResumeId}`}>
              <Sparkles className="size-3.5" />
              <span>
                {t.practiceStarQuestions ||
                  (isArabic ? 'التدرب على أسئلة STAR' : 'Practice STAR Interview Questions')}
              </span>
              <RtlIcon icon={ArrowRight} className="size-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
