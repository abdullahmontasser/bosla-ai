import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileText,
  Kanban,
  Languages,
  MessageSquare,
  PenLine,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeatureBlock, LandingCopy } from './content'
import { Reveal } from './Reveal'

interface FeaturesProps {
  lang: string
  copy: LandingCopy
}

const foundationIcons = [FileText, Kanban, ShieldCheck, Languages]

function FeatureCopy({
  block,
  lang,
  isAr,
  index,
}: {
  block: FeatureBlock
  lang: string
  isAr: boolean
  index: number
}) {
  return (
    <div className={cn('max-w-[500px]', index % 2 === 1 && 'lg:justify-self-end')}>
      <div data-reveal className="flex items-center gap-3">
        <span className="text-[10px] font-bold tabular-nums text-primary/70">0{index + 1}</span>
        <span className="h-px w-6 bg-border" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {block.kicker}
        </span>
      </div>
      <h3
        data-reveal
        className={cn(
          'mt-5 text-balance text-foreground',
          isAr
            ? 'font-arabic text-[clamp(1.9rem,3.6vw,2.9rem)] font-extrabold leading-[1.3]'
            : 'text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.04] tracking-[-0.038em]',
        )}
      >
        {block.title}
      </h3>
      <p
        data-reveal
        className={cn(
          'mt-5 text-sm text-muted-foreground sm:text-[15px]',
          isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
        )}
      >
        {block.body}
      </p>
      <ul data-reveal className="mt-6 space-y-2.5">
        {block.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-[13px] text-foreground/80">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
              strokeWidth={2.2}
              aria-hidden
            />
            <span className={cn(isAr && 'font-arabic leading-[1.8]')}>{bullet}</span>
          </li>
        ))}
      </ul>
      <Link
        data-reveal
        href={`/${lang}${block.href}`}
        className="group mt-7 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {block.link}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </div>
  )
}

function TailorVisual({ copy, isAr }: { copy: LandingCopy; isAr: boolean }) {
  return (
    <div
      data-reveal
      className="relative overflow-hidden rounded-[12px] landing-shadow border border-border/80 bg-landing-panel p-2"
    >
      <div className="flex items-center justify-between gap-4 px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/10" />
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-landing-faint">
          {copy.features.tailor.kicker} / {isAr ? 'نموذج' : 'sample'}
        </span>
      </div>

      <div className="landing-paper min-h-[430px] rounded-[8px] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-black/50">
            {isAr ? 'مسودة مخصّصة' : 'Tailored draft'}
          </p>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <span className="h-1 w-1 rounded-full bg-emerald-700" aria-hidden />
            {isAr ? 'مبنية على خبرتك' : 'Grounded'}
          </span>
        </div>

        <p className="mt-4 text-[21px] font-semibold leading-tight tracking-[-0.03em] text-landing-paper-ink">
          {isAr ? 'طارق منصور' : 'Tarek Mansour'}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-black/50">
          {isAr ? 'مهندس منتج · أنظمة تصميم' : 'Product Engineer · Design Systems'}
        </p>

        <div className="mt-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
            {isAr ? 'الملخص' : 'Summary'}
          </p>
          <p className="mt-2 text-[11.5px] leading-[1.7] text-black/65">
            {isAr
              ? 'مهندس منتج بخبرة سبع سنوات، أعمل عند التقاء التصميم بالهندسة وأحوّل المشكلات الغامضة إلى واجهات سهلة الاستخدام.'
              : 'Product engineer with seven years at the seam of design and engineering, turning ambiguous problems into accessible interfaces.'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/55">
            {isAr ? 'الخبرة ذات الصلة' : 'Relevant experience'}
          </p>
          <div className="mt-2 space-y-2.5">
            <div className="rounded-[5px] border border-black/8 bg-black/[0.02] p-2.5">
              <p className="text-[10.5px] leading-[1.65] text-black/75">
                {isAr
                  ? 'قدت إعادة تصميم رحلة الإعداد الأولى عبر ثلاث مساحات منتج، ووحّدت الفرق حول نظام تصميم واحد.'
                  : 'Led a multi-surface onboarding redesign across three product areas, aligning teams around one design system.'}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                <Check className="h-2.5 w-2.5" aria-hidden />
                {isAr ? 'مرتبط بالدور' : 'Mapped to the role'}
              </span>
            </div>
            <div className="rounded-[5px] border border-black/8 bg-black/[0.02] p-2.5">
              <p className="text-[10.5px] leading-[1.65] text-black/70">
                {isAr
                  ? 'بنيت مكتبة مكونات مشتركة، وجعلت الإتاحة الرقمية جزءاً من عملية المراجعة.'
                  : 'Built a shared component library and made accessibility part of the review process.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" aria-hidden />
          {isAr ? 'يكتب من خبرتك' : 'Drafting from your experience'}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-landing-faint">
          {isAr ? 'قابل للتعديل' : 'Editable'}
        </span>
      </div>
    </div>
  )
}

function AtsVisual({ isAr }: { isAr: boolean }) {
  return (
    <div
      data-reveal
      className="relative overflow-hidden rounded-[12px] landing-shadow border border-border/80 bg-landing-panel-deep p-5 sm:p-6"
    >
      <div
        className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary">
            {isAr ? 'تحليل التوافق' : 'Match analysis'}
          </p>
          <p className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-foreground">
            {isAr ? 'تغطية المتطلبات' : 'Requirement coverage'}
          </p>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-landing-faint">
          {isAr ? 'نموذج' : 'Sample'}
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {isAr ? 'تغطية الأدلة' : 'Evidence coverage'}
          </p>
          <p className="mt-1 text-foreground">
            <span dir="ltr" className="inline-flex items-baseline gap-1">
              <span className="text-[54px] font-semibold leading-none tabular-nums tracking-[-0.05em]">
                8
              </span>
              <span className="text-[18px] font-medium text-muted-foreground">/10</span>
            </span>
          </p>
        </div>
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <ScanSearch className="h-5 w-5 text-primary" strokeWidth={1.7} aria-hidden />
        </div>
      </div>

      <div className="relative mt-5 flex gap-1" aria-hidden>
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              index < 8 ? 'bg-primary/75' : 'bg-foreground/10',
            )}
          />
        ))}
      </div>

      <div className="relative mt-6 space-y-3.5">
        {[
          {
            label: isAr ? 'تغطية الكلمات المفتاحية' : 'Keyword coverage',
            value: '86%',
            width: '86%',
          },
          {
            label: isAr ? 'الخبرة ذات الصلة' : 'Relevant experience',
            value: isAr ? 'قوية' : 'Strong',
            width: '92%',
          },
          {
            label: isAr ? 'التنسيق' : 'Formatting',
            value: isAr ? 'آمن للقراءة' : 'Parser-safe',
            width: '100%',
          },
          {
            label: isAr ? 'دليل الصفر إلى الإطلاق' : 'Zero-to-one evidence',
            value: isAr ? 'أضف تفاصيل' : 'Add detail',
            width: '42%',
          },
        ].map((item, index) => (
          <div key={item.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[10.5px] font-medium text-foreground/80">{item.label}</span>
              <span
                className={cn(
                  'text-[9.5px] font-semibold',
                  index === 3 ? 'text-amber-700 dark:text-amber-300/90' : 'text-primary',
                )}
              >
                {item.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  'h-full rounded-full',
                  index === 3 ? 'bg-amber-600/60 dark:bg-amber-300/65' : 'bg-primary/70',
                )}
                style={{ width: item.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-6 rounded-[6px] border border-border bg-landing-raised px-3.5 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {isAr ? 'ملاحظة بوصلة' : 'Bosla note'}
        </p>
        <p className="mt-1.5 text-[10.5px] leading-[1.6] text-foreground/70">
          {isAr
            ? 'التغطية مؤشر للمسودة، وليست تنبؤاً بنتيجة التوظيف.'
            : 'Coverage is a drafting signal, not a prediction of hiring outcomes.'}
        </p>
      </div>
    </div>
  )
}

function EvidenceVisual({ isAr }: { isAr: boolean }) {
  return (
    <div
      data-reveal
      className="relative overflow-hidden rounded-[12px] landing-shadow border border-border/80 bg-landing-panel p-2"
    >
      <div className="flex items-center justify-between gap-4 px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-landing-faint">
          {isAr ? 'إعادة صياغة الإنجاز' : 'Achievement rewrite'}
        </span>
        <span className="text-[9px] font-semibold tabular-nums text-landing-faint">04</span>
      </div>

      <div className="landing-paper min-h-[390px] rounded-[8px] p-5 sm:p-6">
        <p className="text-[18px] font-semibold tracking-[-0.02em] text-landing-paper-ink">
          {isAr ? 'من مهمة إلى سطر يمكن الدفاع عنه.' : 'From a duty to a defensible line.'}
        </p>

        <div className="mt-5 rounded-[6px] border border-black/10 bg-black/[0.025] p-3.5">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/55">
            {isAr ? 'صياغة المهمة' : 'Duty statement'}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-[1.65] text-black/55">
            {isAr
              ? '«مسؤول عن تحسين تجربة الإعداد الأولى عبر المنتج.»'
              : '“Responsible for improving the onboarding experience across the product.”'}
          </p>
        </div>

        <div className="my-3 flex items-center gap-2 text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-800/70">
          <ArrowDown className="h-3 w-3" aria-hidden />
          {isAr ? 'الدليل يتقدّم' : 'Evidence moves forward'}
        </div>

        <div className="rounded-[6px] border border-emerald-800/25 border-s-2 bg-emerald-800/[0.055] p-3.5">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-800">
            {isAr ? 'إنجاز قائم على دليل' : 'Evidence-based achievement'}
          </p>
          <p className="mt-1.5 text-[12px] font-medium leading-[1.65] text-emerald-950">
            {isAr
              ? '«أعدت بناء الإعداد الأولي كمسار إرشادي موحّد، فقلّصت الطريق من ثماني خطوات إلى ثلاث، وجعلت كل شاشة قابلة للاستخدام بلوحة المفاتيح.»'
              : '“Rebuilt onboarding into a guided setup flow, reducing the path from eight steps to three and making every screen keyboard accessible.”'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {[
            isAr ? 'فعل واضح' : 'Action-led',
            isAr ? 'نطاق محدد' : 'Specific scope',
            isAr ? 'تقليل قابل للقياس' : 'Measured change',
            isAr ? 'دليل إتاحة' : 'Accessibility evidence',
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-[3px] border border-black/10 bg-black/[0.025] px-2 py-1 text-[9px] font-medium text-black/55"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConversationVisual({ copy, isAr }: { copy: LandingCopy; isAr: boolean }) {
  return (
    <div data-reveal className="grid gap-3">
      <article className="rounded-[10px] border border-border/80 bg-landing-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="inline-flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.15em] text-primary">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {copy.features.conversation.outreach.title}
          </p>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-landing-faint">
            {isAr ? 'مسودة' : 'Draft'}
          </span>
        </div>
        <p className="mt-4 text-[13px] leading-[1.8] text-foreground/80">
          {copy.features.conversation.outreach.note}
        </p>
        <p className="mt-4 border-t border-border pt-3 text-[10px] text-landing-faint">
          {copy.features.conversation.outreach.body}
        </p>
      </article>

      <article className="rounded-[10px] border border-border/80 bg-landing-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="inline-flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.15em] text-primary">
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            {copy.features.conversation.interview.title}
          </p>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-landing-faint">
            STAR
          </span>
        </div>
        <p className="mt-4 text-[13px] font-medium leading-snug text-foreground">
          {copy.features.conversation.interview.question}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { letter: 'S', label: isAr ? 'الموقف' : 'Situation' },
            { letter: 'T', label: isAr ? 'المهمة' : 'Task' },
            { letter: 'A', label: isAr ? 'الإجراء' : 'Action' },
            { letter: 'R', label: isAr ? 'النتيجة' : 'Result' },
          ].map((item) => (
            <div
              key={item.letter}
              className="rounded-[5px] border border-border bg-landing-raised px-2.5 py-2"
            >
              <span className="text-[9px] font-bold text-primary">{item.letter}</span>
              <span className="ms-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {item.label}
              </span>
              <span className="mt-1.5 block h-1 w-full rounded-full bg-foreground/10" aria-hidden />
              <span className="mt-1 block h-1 w-2/3 rounded-full bg-foreground/8" aria-hidden />
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

export function Features({ lang, copy }: FeaturesProps) {
  const isAr = lang === 'ar'
  const blocks: FeatureBlock[] = [copy.features.tailor, copy.features.ats, copy.features.evidence]
  const visuals = [
    <TailorVisual key="tailor" copy={copy} isAr={isAr} />,
    <AtsVisual key="ats" isAr={isAr} />,
    <EvidenceVisual key="evidence" isAr={isAr} />,
  ]

  return (
    <section
      id="capabilities"
      className="scroll-mt-24 border-b border-border/70 bg-landing-surface"
    >
      <div className="mx-auto w-full max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-32">
        <Reveal variant="lines">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
            <div>
              <p
                data-reveal
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {copy.features.label}
              </p>
              <h2
                className={cn(
                  'mt-5 max-w-[16ch] text-balance text-foreground',
                  isAr
                    ? 'font-arabic text-[clamp(2.15rem,4.6vw,3.9rem)] font-extrabold leading-[1.28]'
                    : 'text-[clamp(2.3rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]',
                )}
              >
                <span className="block overflow-hidden pb-[0.06em]">
                  <span data-line-inner className="block">
                    {isAr ? 'كل ما بين' : 'Everything'}
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.06em]">
                  <span data-line-inner className="block">
                    {isAr ? 'الإعلان' : 'between the post'}
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.06em]">
                  <span data-line-inner className="block text-muted-foreground">
                    {isAr ? 'والمحادثة.' : 'and the conversation.'}
                  </span>
                </span>
              </h2>
            </div>
            <p
              data-reveal
              className={cn(
                'max-w-[55ch] text-sm text-muted-foreground sm:text-base lg:justify-self-end',
                isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
              )}
            >
              {copy.features.body}
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-20 lg:mt-24 lg:space-y-28">
          {blocks.map((block, index) => (
            <Reveal
              key={block.kicker}
              className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16"
            >
              <div className={cn(index % 2 === 1 && 'lg:order-2')}>
                <FeatureCopy block={block} lang={lang} isAr={isAr} index={index} />
              </div>
              <div className={cn('min-w-0', index % 2 === 1 && 'lg:order-1')}>{visuals[index]}</div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 border-t border-border/80 pt-14 lg:mt-28 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p
                data-reveal
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {copy.features.conversation.kicker}
              </p>
              <h3
                data-reveal
                className={cn(
                  'mt-5 text-balance text-foreground',
                  isAr
                    ? 'font-arabic text-[clamp(1.9rem,3.4vw,2.8rem)] font-extrabold leading-[1.3]'
                    : 'text-[clamp(2rem,3.4vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.038em]',
                )}
              >
                {copy.features.conversation.title}
              </h3>
              <p
                data-reveal
                className={cn(
                  'mt-4 max-w-[42ch] text-sm leading-[1.75] text-muted-foreground',
                  isAr && 'font-arabic leading-[1.95]',
                )}
              >
                {copy.features.conversation.body}
              </p>
              <Link
                data-reveal
                href={`/${lang}/tailor`}
                className="group mt-6 inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                {copy.features.conversation.link}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
                  aria-hidden
                />
              </Link>
            </div>

            <ConversationVisual copy={copy} isAr={isAr} />
          </div>
        </Reveal>

        <Reveal className="mt-20 border-t border-border/80 pt-10 lg:mt-28">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h3
              data-reveal
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              {copy.features.foundationLabel}
            </h3>
            <span
              data-reveal
              className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-landing-faint sm:block"
            >
              BOSLA / FOUNDATION
            </span>
          </div>

          <div className="mt-6 grid gap-px border-y border-border/70 bg-border/50 sm:grid-cols-2 lg:grid-cols-4">
            {copy.features.foundation.map((item, index) => {
              const Icon = foundationIcons[index] ?? FileText
              return (
                <div
                  key={item.title}
                  data-reveal
                  className="group flex min-h-[190px] flex-col justify-between gap-6 bg-landing-surface px-5 py-5 transition-colors duration-300 hover:bg-landing-panel"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon
                      className="h-4 w-4 text-primary/80 transition-transform duration-300 group-hover:translate-y-0.5"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <span className="text-[10px] font-semibold tabular-nums text-landing-faint">
                      0{index + 1}
                    </span>
                  </div>
                  <div>
                    <h4
                      className={cn(
                        'text-sm font-semibold tracking-[-0.01em] text-foreground',
                        isAr && 'font-arabic',
                      )}
                    >
                      {item.title}
                    </h4>
                    <p
                      className={cn(
                        'mt-2 text-[12px] leading-[1.65] text-muted-foreground',
                        isAr && 'font-arabic leading-[1.9]',
                      )}
                    >
                      {item.body}
                    </p>
                    <Link
                      href={`/${lang}${item.href}`}
                      className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.link}
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
