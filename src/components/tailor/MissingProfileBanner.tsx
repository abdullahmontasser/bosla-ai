'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RtlIcon } from '@/components/ui/rtl-icon'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import { UserPlus, ArrowRight } from 'lucide-react'

export interface MissingProfileBannerProps {
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function MissingProfileBanner({ lang, dict }: MissingProfileBannerProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 shadow-xs"
      data-testid="missing-profile-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <UserPlus className="size-4" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">
            {t.missingProfileAlertTitle ||
              (isArabic ? 'الملف المهني الأساسي مطلوب' : 'Master Candidate Profile Required')}
          </h4>
          <p className="text-muted-foreground text-xs mt-0.5">
            {t.missingProfileAlertDesc ||
              (isArabic
                ? 'لتوليد سيرة ذاتية مخصصة ومبنية على حقائقك المهنية الواقعية، يرجى إنشاء ملفك المهني الأساسي أولاً.'
                : 'To generate tailored resumes grounded in your real career facts, please create your master profile first.')}
          </p>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        variant="default"
        className="h-8 gap-1.5 text-xs font-semibold shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
        data-testid="create-profile-btn"
      >
        <Link href={`/${lang}/profile`}>
          <span>
            {t.createProfileButton || (isArabic ? 'إنشاء الملف المهني' : 'Create Master Profile')}
          </span>
          <RtlIcon icon={ArrowRight} className="size-3" />
        </Link>
      </Button>
    </div>
  )
}
