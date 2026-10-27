'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ScrollReveal } from './ScrollReveal'

interface SaaSCallToActionProps {
  lang: string
}

export function SaaSCallToAction({ lang }: SaaSCallToActionProps) {
  const isAr = lang === 'ar'

  return (
    <ScrollReveal
      variant="settle"
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12 md:p-16"
    >
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <h2
          className={cn(
            'text-balance text-3xl text-foreground sm:text-4xl md:text-5xl',
            isAr
              ? 'font-arabic font-extrabold tracking-normal leading-[1.25]'
              : 'font-sans font-black tracking-tight leading-[1.1]',
          )}
        >
          {isAr
            ? 'جاهز لاقتناص الوظيفة التي تستحقها حقاً؟'
            : 'Ready to Land High-Conviction Interviews in Record Time?'}
        </h2>

        <p
          className={cn(
            'text-sm sm:text-base text-muted-foreground max-w-xl mx-auto font-normal',
            isAr ? 'font-arabic leading-[1.8]' : 'leading-relaxed',
          )}
        >
          {isAr
            ? 'انضم إلى آلاف المحترفين التقنيين الذين ضاعفوا مقابلاتهم الوظيفية مع بوصلة AI.'
            : 'Join ambitious software engineers, product leads, and designers who 3.8x their recruiter response rates with Bosla AI.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href={`/${lang}/tailor`}
            className="bg-foreground text-background hover:opacity-90 font-bold px-8 py-4 rounded-xl text-sm transition-all duration-150 inline-flex items-center gap-2.5 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span className={isAr ? 'font-arabic' : undefined}>
              {isAr ? 'ابدأ بتخصيص سيرتك الآن مجاناً' : 'Start Tailoring Free — In 30 Seconds'}
            </span>
            <RtlIcon icon={ArrowRight} className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className={isAr ? 'font-arabic' : undefined}>
              {isAr ? 'بدون بطاقة ائتمان' : 'No credit card required'}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className={isAr ? 'font-arabic' : undefined}>
              {isAr ? 'تشفير كامل للخصوصية (BYOK)' : '100% Private (BYOK AES-256)'}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className={isAr ? 'font-arabic' : undefined}>
              {isAr ? 'تصدير متجهي فوري' : 'Instant ATS-compliant PDF export'}
            </span>
          </span>
        </div>
      </div>
    </ScrollReveal>
  )
}
