'use client'

import * as React from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  TrendingUp,
  FileSearch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TailorCalibrationModalProps {
  isOpen: boolean
  inline?: boolean
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  streamText?: string
  summaryPreview?: string
  bulletsPreview?: string[]
  errorMessage?: string | null
  onInspect: () => void
  onStop?: () => void
  lang: 'en' | 'ar'
}

interface Milestone {
  id: number
  titleEn: string
  titleAr: string
  descEn: string
  descAr: string
  icon: React.ComponentType<{ className?: string }>
}

const MILESTONES: Milestone[] = [
  {
    id: 1,
    titleEn: 'Competency & Keyword Extraction',
    titleAr: 'استخراج المهارات والكلمات المفتاحية',
    descEn: 'Parsing job requirements against candidate background',
    descAr: 'تحليل شروط الوظيفة ومطابقتها مع خبرات المرشح',
    icon: FileSearch,
  },
  {
    id: 2,
    titleEn: 'Experience & Metric Cross-Referencing',
    titleAr: 'مطابقة الخبرات وتدقيق المؤشرات',
    descEn: 'Auditing work experience bullets and scope of impact',
    descAr: 'تدقيق نقاط الخبرة السابقة وحجم التأثير التقني',
    icon: Cpu,
  },
  {
    id: 3,
    titleEn: 'Google XYZ Metric Structuring',
    titleAr: 'صياغة إنجازات Google XYZ المقاسة',
    descEn: 'Injecting quantified accomplishments (X by Y doing Z)',
    descAr: 'إعادة الصياغة بإنجازات رقمية مثبتة ونسب نمو واضحة',
    icon: TrendingUp,
  },
  {
    id: 4,
    titleEn: 'ATS Semantic Resonance & Scoring',
    titleAr: 'التوافق الدلالي مع فلاتر ATS والتقييم',
    descEn: 'Calculating keyword density and single-column compliance',
    descAr: 'احتساب كثافة الكلمات المفتاحية وهيكل العمود الواحد',
    icon: ShieldCheck,
  },
]

export function TailorCalibrationModal({
  isOpen,
  inline = false,
  status,
  streamText = '',
  summaryPreview,
  bulletsPreview = [],
  errorMessage,
  onInspect,
  onStop,
  lang,
}: TailorCalibrationModalProps) {
  const isArabic = lang === 'ar'
  const [elapsedMs, setElapsedMs] = React.useState<number>(0)

  // Dynamic elapsed timer (calm progress indicator, zero artificial blocking)
  React.useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedMs(0)
      return
    }

    if (status === 'IDLE') {
      return
    }

    const intervalTime = 100
    const interval = setInterval(() => {
      setElapsedMs((prev) => prev + intervalTime)
    }, intervalTime)

    return () => {
      clearInterval(interval)
    }
  }, [isOpen, status])

  if (!isOpen) return null

  // Instant readiness upon completion (no artificial 10-second blocking)
  const isReadyToInspect = status === 'COMPLETED'
  // Milestone progression based on actual streaming status
  const currentMilestoneIndex = isReadyToInspect ? 3 : Math.min(3, Math.floor(elapsedMs / 1000))
  const progressPercent = isReadyToInspect
    ? 100
    : Math.min(95, Math.max(10, Math.round((elapsedMs / 3000) * 100)))

  const modalBody = (
    <div
      className={`relative w-full max-w-xl rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200 ${inline ? 'shadow-sm mx-auto my-2' : 'shadow-2xl'}`}
    >
      {/* Restrained Editorial Status Icon */}
      <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
        {isReadyToInspect ? (
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs transition-transform transform scale-100">
            <CheckCircle2 className="h-7 w-7 stroke-[2.2]" />
          </div>
        ) : status === 'FAILED' ? (
          <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/40 text-destructive flex items-center justify-center shadow-xs">
            <AlertCircle className="h-7 w-7 stroke-[2.2]" />
          </div>
        ) : (
          <div className="relative h-14 w-14 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
        )}
      </div>

      {/* Modal Header */}
      <div className="space-y-1.5 max-w-md mx-auto">
        {status === 'FAILED' && (
          <span className="text-xs font-bold text-destructive uppercase tracking-wider block">
            Failed
          </span>
        )}
        <h2
          id="calibration-modal-title"
          className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
        >
          {isReadyToInspect
            ? isArabic
              ? 'اكتملت معايرة السيرة الذاتية بنجاح!'
              : 'Living Resume Calibrated & Ready!'
            : status === 'FAILED'
              ? isArabic
                ? 'تعذر استكمال المعايرة'
                : 'Calibration Interrupted'
              : isArabic
                ? 'جاري معايرة السيرة الذاتية لهيمنة ATS'
                : 'Calibrating Profile for ATS Dominance'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isReadyToInspect
            ? isArabic
              ? 'تم فحص الكلمات المفتاحية وهيكلة إنجازات Google XYZ وتجهيز لوحة التعديل المباشر.'
              : 'High-density metrics, XYZ structured bullets, and single-column formatting have been synthesized.'
            : status === 'FAILED'
              ? errorMessage ||
                (isArabic
                  ? 'حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي.'
                  : 'AI generation error occurred.')
              : isArabic
                ? 'تدقيق الكفاءات وتحليل المؤشرات لضمان توافق كامل مع فلاتر التوظيف.'
                : 'Extracting competencies and engineering quantifiable impact with zero hallucination.'}
        </p>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
          <span>
            {isReadyToInspect
              ? isArabic
                ? 'اكتمل بنسبة 100%'
                : '100% Calibrated'
              : `${progressPercent}% Complete`}
          </span>
          <span>{`${(elapsedMs / 1000).toFixed(1)}s`}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-150 ease-out ${
              isReadyToInspect ? 'bg-emerald-500' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Multi-stage Milestone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-start">
        {MILESTONES.map((m, idx) => {
          const isCompleted = isReadyToInspect || currentMilestoneIndex > idx
          const isActive =
            !isReadyToInspect && currentMilestoneIndex === idx && status === 'GENERATING'
          const Icon = m.icon

          return (
            <div
              key={m.id}
              className={`p-3 rounded-xl border text-xs transition-all duration-200 flex items-start gap-2.5 ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                  : isActive
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                    : 'border-border/40 bg-muted/10 text-muted-foreground/60'
              }`}
            >
              <div
                className={`mt-0.5 rounded-full p-1 shrink-0 ${
                  isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isActive
                      ? 'text-primary animate-pulse'
                      : 'text-muted-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-foreground truncate">
                    {isArabic ? m.titleAr : m.titleEn}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">0{m.id}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                  {isArabic ? m.descAr : m.descEn}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Streaming Content Preview (Milestone 4 or active streaming) */}
      {(summaryPreview || bulletsPreview.length > 0 || streamText) && (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-start text-xs space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 animate-pulse" />
              {isArabic ? 'المحتوى المتدفق في الوقت الفعلي:' : 'Live Streaming Telemetry:'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {streamText.length} chars
            </span>
          </div>
          {summaryPreview ? (
            <p className="text-foreground leading-relaxed font-sans text-[11px]">
              {summaryPreview}
            </p>
          ) : streamText ? (
            <p className="text-muted-foreground leading-relaxed font-mono text-[10px] line-clamp-3">
              {streamText.slice(-250)}
            </p>
          ) : null}
          {bulletsPreview.length > 0 && (
            <ul className="space-y-1 list-disc list-inside text-[11px] text-muted-foreground">
              {bulletsPreview.slice(0, 2).map((b, i) => (
                <li key={i} className="truncate">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {isReadyToInspect ? (
          <Button
            type="button"
            size="lg"
            onClick={onInspect}
            className="relative gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-xs transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] motion-reduce:transform-none bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isArabic ? 'معاينة السيرة المخصصة' : 'Inspect Living Resume'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : status === 'FAILED' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInspect}
            className="text-xs cursor-pointer"
          >
            {isArabic ? 'إغلاق ومراجعة الأخطاء' : 'Close & Review'}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            {onStop && status === 'GENERATING' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStop}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                {isArabic ? 'إيقاف الإنشاء' : 'Stop Generation'}
              </Button>
            )}
            <span className="text-xs text-muted-foreground animate-pulse">
              {isArabic
                ? 'المعايرة جارية وفق معايير Google XYZ و ATS...'
                : 'Synthesizing XYZ accomplishments & ATS metrics...'}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (inline) {
    return modalBody
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ direction: isArabic ? 'rtl' : 'ltr' }}
    >
      {modalBody}
    </div>
  )
}
