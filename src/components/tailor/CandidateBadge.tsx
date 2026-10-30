'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import { ShieldCheck, AlertCircle, ArrowUpRight, User } from 'lucide-react'

export interface CandidateBadgeProps {
  headline?: string | null
  candidateName?: string | null
  emailVerified?: boolean
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function CandidateBadge({
  headline,
  candidateName,
  emailVerified = false,
  lang,
  dict,
}: CandidateBadgeProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'

  const displayHeadline =
    headline || (isArabic ? 'الملف المهني الأساسي' : 'Master Candidate Profile')

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-foreground shadow-2xs flex-wrap"
      data-testid="candidate-badge"
    >
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <User className="size-3.5" />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {candidateName && (
          <span className="font-semibold text-foreground truncate max-w-[140px]">
            {candidateName}
          </span>
        )}
        <span className="text-muted-foreground truncate max-w-[200px]" title={displayHeadline}>
          {displayHeadline}
        </span>
      </div>

      {/* Verified Email Status */}
      {emailVerified ? (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0 font-medium"
          data-testid="email-verified-badge"
        >
          <ShieldCheck className="size-2.5" />
          <span>{t.verified || (isArabic ? 'موثق' : 'Verified')}</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0 font-medium"
          data-testid="email-unverified-badge"
        >
          <AlertCircle className="size-2.5" />
          <span>{t.unverified || (isArabic ? 'غير موثق' : 'Unverified')}</span>
        </Badge>
      )}

      {/* Edit Profile Link */}
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Link href={`/${lang}/profile`}>
          <span>{t.editProfile || (isArabic ? 'تعديل الملف' : 'Edit Profile')}</span>
          <ArrowUpRight className="size-2.5" />
        </Link>
      </Button>
    </div>
  )
}
