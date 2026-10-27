'use client'

import Link from 'next/link'
import { TrendingUp, Lock, Globe, FileCheck, Kanban, ArrowRight } from 'lucide-react'
import { RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ScrollReveal } from './ScrollReveal'

interface SaaSBentoGridProps {
  lang: string
}

export function SaaSBentoGrid({ lang }: SaaSBentoGridProps) {
  const isAr = lang === 'ar'

  const features = [
    {
      icon: TrendingUp,
      title: isAr ? 'محرك صياغة Google XYZ الصارم' : 'Google XYZ Achievement Formula',
      body: isAr
        ? 'يحول مهامك العادية إلى إنجازات رقمية مبهرة: "حققت [X] مقاساً بـ [Y] عبر تنفيذ [Z]" مع منع تام لاختلاق معلومات.'
        : 'Transforms passive duties into quantified impact statements: "Accomplished [X], measured by [Y], by doing [Z]". Zero hallucinations.',
      sample: isAr
        ? 'خفضت زمن استجابة النظام بنسبة 44% عبر تصميم طوابير معالجة موزعة تعالج 18,000 طلب/ثانية.'
        : 'Reduced checkout P99 latency by 44% across 18k req/sec by architecting distributed Redis queues.',
      meta: isAr ? '+3.4x مقابلات' : '+3.4x Callbacks',
      tone: 'emerald' as const,
    },
    {
      icon: FileCheck,
      title: isAr ? 'تصدير متجهي آمن 100% لـ ATS' : '100% Safe Vector PDF Export',
      body: isAr
        ? 'تصدير بصيغة PDF متجهية بنمط العمود الواحد متوافق بنسبة 100% مع أنظمة Greenhouse وWorkday وLever.'
        : 'Clean single-column searchable vector PDFs. Zero layout distortions or parsing errors in Greenhouse, Workday, and Lever.',
      meta: isAr ? 'مختبر مع Greenhouse وWorkday' : 'Greenhouse & Workday Tested',
      tone: 'emerald' as const,
    },
    {
      icon: Lock,
      title: isAr ? 'خصوصية كاملة ومفاتيحك الخاصة' : '100% Private & BYOK',
      body: isAr
        ? 'مفاتيحك مشفرة محلياً بتشفير AES-256-GCM. بياناتك لا تُباع ولا تُستخدم لتدريب الذكاء الاصطناعي.'
        : 'Bring your own keys (OpenAI, Anthropic, Gemini, Groq, Ollama). Encrypted at rest. Never used for model training.',
      tone: 'neutral' as const,
    },
    {
      icon: Kanban,
      title: isAr ? 'لوحة كانبان لمتابعة الطلبات' : 'Visual Application Pipeline',
      body: isAr
        ? 'تتبع طلباتك بالسحب والإفلات، مع ربط كل وظيفة بنسختها المخصصة وتنبيهات المتابعة.'
        : 'Drag-and-drop Kanban board linking every job to its tailored resume, outreach pitch, and interview dates.',
      tone: 'neutral' as const,
    },
    {
      icon: Globe,
      title: isAr ? 'ثنائية لغة أصيلة وعصرية' : 'Bilingual First (RTL & LTR)',
      body: isAr
        ? 'تشكيل حروف عربي متقن بخط Alexandria وصياغة مهنية تناسب كبرى الشركات العالمية.'
        : 'Native Arabic text shaping with Alexandria & Amiri and natural English phrasing with Geist Sans.',
      tone: 'neutral' as const,
    },
  ]

  return (
    <section className="w-full">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:gap-16">
        <ScrollReveal variant="fade" className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <h2
            className={cn(
              'text-balance text-start text-3xl text-foreground sm:text-4xl md:text-5xl',
              isAr
                ? 'font-arabic font-extrabold tracking-normal leading-[1.25]'
                : 'font-sans font-black tracking-tight leading-[1.08]',
            )}
          >
            {isAr ? 'كل ميزة صُممت لتضعك في الصدارة' : 'Every Feature Engineered to Get You Hired'}
          </h2>
          <p
            className={cn(
              'max-w-sm text-start text-sm text-muted-foreground sm:text-base',
              isAr ? 'font-arabic leading-[1.8]' : 'leading-relaxed',
            )}
          >
            {isAr
              ? 'تجاوز أنظمة التصفية الآلية وتواصل مع مسؤولي التوظيف بثقة عبر منظومة متكاملة.'
              : 'Beat hiring algorithms, customize applications in seconds, and track every offer.'}
          </p>
          <Link
            href={`/${lang}/tailor`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className={isAr ? 'font-arabic' : undefined}>
              {isAr ? 'افتح استوديو التخصيص' : 'Open the tailor studio'}
            </span>
            <RtlIcon icon={ArrowRight} className="h-4 w-4" />
          </Link>
        </ScrollReveal>

        <ScrollReveal variant="rise" className="border-y border-border/70">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)] gap-4 py-6 sm:gap-5',
                  index > 0 && 'border-t border-border/70',
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    feature.tone === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-secondary text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3
                      className={cn(
                        'text-base font-bold leading-snug text-foreground sm:text-lg',
                        isAr && 'font-arabic',
                      )}
                    >
                      {feature.title}
                    </h3>
                    {feature.meta && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold',
                          feature.tone === 'emerald'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-border bg-secondary text-muted-foreground',
                        )}
                      >
                        {feature.tone === 'emerald' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {feature.meta}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm text-muted-foreground',
                      isAr ? 'font-arabic leading-[1.8]' : 'leading-relaxed',
                    )}
                  >
                    {feature.body}
                  </p>
                  {feature.sample && (
                    <p
                      className={cn(
                        'mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground',
                        isAr ? 'font-arabic leading-[1.8]' : 'font-mono leading-relaxed',
                      )}
                    >
                      &ldquo;{feature.sample}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </ScrollReveal>
      </div>
    </section>
  )
}
