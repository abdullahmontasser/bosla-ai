'use client'

import React from 'react'
import { Languages, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LanguageProfileSwitchProps {
  currentProfileLang: 'EN' | 'AR'
  onSelectLanguage: (lang: 'EN' | 'AR') => void
  lang: string
}

export function LanguageProfileSwitch({
  currentProfileLang,
  onSelectLanguage,
  lang,
}: LanguageProfileSwitchProps) {
  const isAr = lang === 'ar'

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="h-4 w-4 text-primary" />
          <h3 className="text-[13px] font-semibold text-foreground">
            {isAr ? 'لغة الملف الشخصي (السيرة الذاتية)' : 'Profile Resume Language'}
          </h3>
        </div>

        <p className="mb-3 text-[12px] text-muted-foreground leading-relaxed">
          {isAr
            ? 'يمكنك الاحتفاظ بنسختين منفصلتين للملف المهني باللغتين العربية والإنجليزية مع الحفاظ على صورتك وحسابك الموحد.'
            : 'Maintain separate English and Arabic master profiles while sharing your account and avatar.'}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelectLanguage('EN')}
            className={cn(
              'flex items-center justify-between rounded-[8px] border p-2.5 text-start transition-all',
              currentProfileLang === 'EN'
                ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                : 'border-border bg-card/50 text-muted-foreground hover:border-primary/30 hover:bg-accent',
            )}
          >
            <div>
              <span className="block text-[13px]">English</span>
              <span className="block text-[10px] opacity-75">LTR Profile</span>
            </div>
            {currentProfileLang === 'EN' && <Check className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onSelectLanguage('AR')}
            className={cn(
              'flex items-center justify-between rounded-[8px] border p-2.5 text-start transition-all',
              currentProfileLang === 'AR'
                ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                : 'border-border bg-card/50 text-muted-foreground hover:border-primary/30 hover:bg-accent',
            )}
          >
            <div>
              <span className="block text-[13px] font-arabic">العربية</span>
              <span className="block text-[10px] opacity-75">ملف RTL</span>
            </div>
            {currentProfileLang === 'AR' && <Check className="h-4 w-4" />}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
