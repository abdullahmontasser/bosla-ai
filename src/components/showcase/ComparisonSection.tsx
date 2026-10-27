'use client'

import { XCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparisonSectionProps {
  lang: string
}

export function ComparisonSection({ lang }: ComparisonSectionProps) {
  const isAr = lang === 'ar'

  const comparisonRows = [
    {
      label: { en: 'Resume Customization', ar: 'تخصيص السيرة الذاتية' },
      oldWay: {
        en: '3+ hours manual rewriting for each individual job application',
        ar: 'أكثر من 3 ساعات تعديل يدوي مرهق لكل وظيفة على حدة',
      },
      newWay: {
        en: '30 seconds AI streaming tailored to job requirements in real time',
        ar: '30 ثانية لتخصيص فوري مستند بدقة لخبراتك الواقعية',
      },
    },
    {
      label: { en: 'ATS Screening', ar: 'اجتياز فحص الـ ATS' },
      oldWay: {
        en: 'Blind automated rejection without knowing missing keywords',
        ar: 'استبعاد تلقائي مجهول السبب دون معرفة الكلمات المفقودة',
      },
      newWay: {
        en: 'Instant 96% match scoring with one-click keyword gap filling',
        ar: 'توافق مؤكد فوق 96% وسد الفجوات المهارية بنقرة واحدة',
      },
    },
    {
      label: { en: 'Achievement Bullets', ar: 'صياغة نقاط الإنجاز' },
      oldWay: {
        en: 'Passive duty lists: "Responsible for managing servers and databases"',
        ar: 'مهام روتينية باهتة: "مسؤول عن إدارة الخوادم وقواعد البيانات"',
      },
      newWay: {
        en: 'Google XYZ metrics: "Cut P99 latency by 44% across 18k req/sec"',
        ar: 'صيغة جوجل XYZ: "خفضت زمن الاستجابة 44% عند 18 ألف طلب/ثانية"',
      },
    },
    {
      label: { en: 'Recruiter Outreach', ar: 'التواصل مع مسؤولي التوظيف' },
      oldWay: {
        en: 'Generic copy-pasted messages ignored 95% of the time',
        ar: 'رسائل مكررة يتم تجاهلها بنسبة 95%',
      },
      newWay: {
        en: '280-char personalized pitches delivering 3.8x response rates',
        ar: 'رسائل مركزة في أقل من 280 حرف تحقق ردوداً أعلى بمعدل 3.8x',
      },
    },
  ]

  const t = (en: string, ar: string) => (isAr ? ar : en)
  const rowLabel = (row: (typeof comparisonRows)[number]) => row.label[isAr ? 'ar' : 'en']
  const rowOld = (row: (typeof comparisonRows)[number]) => row.oldWay[isAr ? 'ar' : 'en']
  const rowNew = (row: (typeof comparisonRows)[number]) => row.newWay[isAr ? 'ar' : 'en']
  const copyLeading = isAr ? 'leading-[1.75]' : 'leading-relaxed'

  return (
    <section className={cn('w-full', isAr ? 'font-arabic' : 'font-sans')}>
      <div className="flex gap-6 md:items-end md:justify-between md:gap-12">
        <h2 className="max-w-[16ch] text-balance text-start text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t('The Old Job Hunt vs. Bosla AI', 'البحث التقليدي عن عمل مقابل بوصلة AI')}
        </h2>
        <p className={cn('max-w-sm text-sm text-muted-foreground md:text-end', copyLeading)}>
          {t(
            'Stop wasting hours tweaking Word documents. See the quantifiable difference.',
            'قارن بين الساعات الضائعة في التعديل اليدوي وبين النتائج الفورية بالذكاء الاصطناعي.',
          )}
        </p>
      </div>

      <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/70 md:grid-cols-2">
        <div className="flex flex-col bg-red-500/[0.07] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-red-500/20 pb-5 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('The Traditional Grind', 'الطريقة التقليدية المرهقة')}
            </span>
          </div>
          <div className="divide-y divide-red-500/10">
            {comparisonRows.map((row, i) => (
              <div key={i} className="py-5 last:pb-0">
                <div className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  {rowLabel(row)}
                </div>
                <p
                  className={cn(
                    'mt-2 text-sm text-muted-foreground line-through decoration-red-500/45 decoration-1',
                    copyLeading,
                  )}
                >
                  {rowOld(row)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col bg-emerald-500/[0.07] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-emerald-500/25 pb-5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('The Bosla AI Way', 'طريقة بوصلة AI')}
            </span>
          </div>
          <div className="divide-y divide-emerald-500/15">
            {comparisonRows.map((row, i) => (
              <div key={i} className="py-5 last:pb-0">
                <div className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  {rowLabel(row)}
                </div>
                <p className={cn('mt-2 text-sm font-semibold text-foreground', copyLeading)}>
                  {rowNew(row)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
