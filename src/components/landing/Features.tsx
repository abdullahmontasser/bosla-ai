import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Kanban,
  Languages,
  MessageSquare,
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

const blockIcons = [Sparkles, ScanSearch, MessageSquare]
const foundationIcons = [FileText, Kanban, ShieldCheck, Languages]

function CapabilityCard({
  block,
  lang,
  index,
  isAr,
}: {
  block: FeatureBlock
  lang: string
  index: number
  isAr: boolean
}) {
  const Icon = blockIcons[index] ?? Sparkles

  return (
    <article
      data-reveal
      className="group flex flex-col gap-5 bg-landing-surface px-5 py-6 transition-colors duration-300 hover:bg-landing-panel sm:px-6 sm:py-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-primary/20 bg-primary/8 text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden />
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-landing-faint">
          0{index + 1}
        </span>
      </div>

      <div>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary/80">
          {block.kicker}
        </p>
        <h3
          className={cn(
            'mt-2.5 text-balance text-[19px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[21px]',
            isAr && 'font-arabic leading-[1.4]',
          )}
        >
          {block.title}
        </h3>
        <p
          className={cn(
            'mt-3 text-[12.5px] leading-[1.7] text-muted-foreground',
            isAr && 'font-arabic leading-[1.9]',
          )}
        >
          {block.body}
        </p>
      </div>

      <Link
        href={`/${lang}${block.href}`}
        className="mt-auto inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-landing-surface"
      >
        {block.link}
        <ArrowRight
          className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </article>
  )
}

export function Features({ lang, copy }: FeaturesProps) {
  const isAr = lang === 'ar'
  const blocks: FeatureBlock[] = [copy.features.tailor, copy.features.ats, copy.features.evidence]

  return (
    <section
      id="capabilities"
      className="scroll-mt-24 border-b border-border/70 bg-landing-surface"
    >
      <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <Reveal variant="lines">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-16">
            <div>
              <p
                data-reveal
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {copy.features.label}
              </p>
              <h2
                className={cn(
                  'mt-4 max-w-[18ch] text-balance text-foreground',
                  isAr
                    ? 'font-arabic text-[clamp(1.9rem,3.6vw,2.9rem)] font-extrabold leading-[1.3]'
                    : 'text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.038em]',
                )}
              >
                <span className="line-mask">
                  <span data-line-inner className="block">
                    {isAr ? 'كل ما بين' : 'Everything'}
                  </span>
                </span>
                <span className="line-mask">
                  <span data-line-inner className="block">
                    {isAr ? 'الإعلان' : 'between the post'}
                  </span>
                </span>
                <span className="line-mask">
                  <span data-line-inner className="block text-muted-foreground">
                    {isAr ? 'والمحادثة.' : 'and the conversation.'}
                  </span>
                </span>
              </h2>
            </div>
            <p
              data-reveal
              className={cn(
                'max-w-[52ch] text-sm text-muted-foreground lg:justify-self-end',
                isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
              )}
            >
              {copy.features.body}
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10 border-y border-border/70 bg-border/50 lg:mt-12">
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {blocks.map((block, index) => (
              <CapabilityCard
                key={block.kicker}
                block={block}
                lang={lang}
                index={index}
                isAr={isAr}
              />
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-10 grid gap-6 rounded-[10px] border border-border/70 bg-landing-panel-deep px-5 py-6 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div>
            <p
              data-reveal
              className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary/80"
            >
              {copy.features.conversation.kicker}
            </p>
            <h3
              data-reveal
              className={cn(
                'mt-2 text-balance text-[19px] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[21px]',
                isAr && 'font-arabic leading-[1.45]',
              )}
            >
              {copy.features.conversation.title}
            </h3>
            <p
              data-reveal
              className={cn(
                'mt-2 max-w-[62ch] text-[12.5px] leading-[1.7] text-muted-foreground',
                isAr && 'font-arabic leading-[1.9]',
              )}
            >
              {copy.features.conversation.body}
            </p>
          </div>
          <Link
            data-reveal
            href={`/${lang}/tailor`}
            className="group inline-flex min-h-10 w-fit items-center gap-2 rounded-[7px] border border-border bg-card px-4 text-[12.5px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-landing-panel-deep"
          >
            {copy.features.conversation.link}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-landing-faint">
            {copy.features.foundationLabel}
          </span>
          {copy.features.foundation.map((item, index) => {
            const Icon = foundationIcons[index] ?? FileText
            return (
              <Link
                key={item.title}
                href={`/${lang}${item.href}`}
                title={item.body}
                className="inline-flex min-h-8 items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-3.5 w-3.5 text-primary/70" strokeWidth={1.7} aria-hidden />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
