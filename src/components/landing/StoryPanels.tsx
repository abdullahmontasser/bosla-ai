import Link from 'next/link'
import { AlertCircle, ArrowDown, ArrowRight, Check, CircleCheck, Sparkles } from 'lucide-react'
import { RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Highlight } from './Highlight'
import type { ShowcaseSample } from './showcase-data'

interface PanelProps {
  sample: ShowcaseSample
  lang: string
}

export function JobPanel({ sample }: PanelProps) {
  const job = sample.job

  return (
    <div className="landing-paper flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">
          {job.sectionLabel}
        </p>
        <span className="text-[10px] font-semibold tabular-nums text-black/55">JOB / 01</span>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[21px] font-semibold leading-tight tracking-[-0.03em] text-landing-paper-ink">
            {job.title}
          </p>
          <p className="mt-1 text-[11px] font-medium text-black/55">
            {job.company} · {job.meta}
          </p>
        </div>
        <span className="mt-0.5 rounded-[3px] border border-emerald-800/20 bg-emerald-800/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-800">
          {sample.workspace.status}
        </span>
      </div>

      <p className="mt-3 max-w-[64ch] text-[12.5px] leading-[1.7] text-black/65">{job.intro}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section aria-label={job.responsibilitiesLabel}>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
            {job.responsibilitiesLabel}
          </p>
          <ul className="mt-2 space-y-1.5">
            {job.responsibilities.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[11.5px] leading-[1.55] text-black/70"
              >
                <span
                  className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-black/30"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={job.requirementsLabel}>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
            {job.requirementsLabel}
          </p>
          <ul className="mt-2 space-y-1.5">
            {job.requirements.map((item, index) => (
              <li
                key={item}
                className={cn(
                  'flex items-start gap-2 text-[11.5px] leading-[1.55]',
                  index === 2 ? 'text-amber-900' : 'text-black/70',
                )}
              >
                <span
                  className={cn(
                    'mt-[0.15em] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                    index === 2
                      ? 'border-amber-800/25 bg-amber-800/10 text-amber-800'
                      : 'border-black/12 bg-black/[0.03] text-black/35',
                  )}
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 border-t border-black/10 pt-3">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
          {job.signalsLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.signals.map((signal, index) => (
            <span
              key={signal}
              className={cn(
                'rounded-[3px] border px-2 py-1 text-[10px] font-semibold',
                index < 3
                  ? 'border-emerald-800/20 bg-emerald-800/[0.07] text-emerald-900'
                  : 'border-black/10 bg-black/[0.025] text-black/60',
              )}
            >
              {signal}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-black/10 pt-3">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
          {job.briefLabel}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
          {job.brief.map((item) => (
            <div key={item.label}>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-black/55">
                {item.label}
              </p>
              <p className="mt-0.5 text-[9.5px] font-medium leading-snug text-black/70">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-auto pt-3 text-[10px] leading-relaxed text-black/60">{job.note}</p>
    </div>
  )
}

export function ResumePanel({ sample }: PanelProps) {
  const resume = sample.resume

  return (
    <div className="grid h-full bg-landing-paper text-landing-paper-ink sm:grid-cols-[1.45fr_0.55fr]">
      <div className="min-w-0 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">
            {resume.eyebrow}
          </p>
          <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-emerald-800">
            {resume.statusLabel}
          </span>
        </div>

        <p className="mt-3 text-[20px] font-semibold leading-tight tracking-[-0.03em]">
          {resume.name}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-black/55">{resume.headline}</p>
        <p className="mt-2 max-w-[54ch] text-[11.5px] leading-[1.65] text-black/65">
          {resume.summary}
        </p>

        <div className="mt-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
            {resume.experienceLabel}
          </p>
          <div className="mt-2 space-y-3">
            {resume.experience.map((entry) => (
              <div key={`${entry.role}-${entry.dates}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-[11.5px] font-semibold text-landing-paper-ink">
                    {entry.role}{' '}
                    <span className="font-normal text-black/60">· {entry.company}</span>
                  </p>
                  <p className="text-[9px] font-medium tabular-nums text-black/55">{entry.dates}</p>
                </div>
                <ul className="mt-1 space-y-1">
                  {entry.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-1.5 text-[10.5px] leading-[1.6] text-black/65"
                    >
                      <span
                        className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-emerald-800/50"
                        aria-hidden
                      />
                      <span>
                        <Highlight text={bullet} tone="paper" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 border-t border-black/10 pt-2.5 text-[10px] leading-relaxed text-black/60">
          {resume.note}
        </p>
      </div>

      <aside className="border-t border-black/10 bg-landing-paper-deep p-4 sm:border-s sm:border-t-0 sm:p-4">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/60">
          {resume.alignmentLabel}
        </p>
        <ul className="mt-3 space-y-2.5">
          {resume.alignment.map((item) => (
            <li key={item.label} className="flex items-start gap-2">
              {item.tone === 'good' ? (
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-800" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold leading-tight text-black/75">
                  {item.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-[9px] font-medium',
                    item.tone === 'good' ? 'text-emerald-800/80' : 'text-amber-800/80',
                  )}
                >
                  {item.value}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-[5px] border border-emerald-800/20 bg-emerald-800/[0.06] p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
            {resume.noteTitle}
          </p>
          <p className="mt-1 text-[10px] leading-[1.55] text-emerald-950/70">{resume.noteBody}</p>
        </div>
      </aside>
    </div>
  )
}

export function AtsPanel({ sample }: PanelProps) {
  const ats = sample.ats

  return (
    <div className="flex h-full flex-col bg-landing-panel-deep p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {ats.eyebrow}
          </p>
          <p className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-foreground">
            {ats.title}
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-landing-faint">ATS / 03</span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{ats.subtitle}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[7px] border border-border bg-landing-raised p-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {ats.scoreLabel}
          </p>
          <p className="mt-1 text-foreground">
            <span dir="ltr" className="inline-flex items-baseline gap-1">
              <span className="text-[42px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                {ats.score}
              </span>
              <span className="text-[15px] font-medium text-muted-foreground">
                {ats.scoreSuffix}
              </span>
            </span>
          </p>
          <div className="mt-4 flex gap-1" aria-hidden>
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
          <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300/70">
            {ats.meterLabel}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {ats.coverageLabel}
          </p>
          {ats.coverage.map((item) => (
            <div key={item.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[10.5px] font-medium text-foreground/85">{item.label}</span>
                <span
                  className={cn(
                    'text-[9.5px] font-semibold',
                    item.tone === 'good' ? 'text-primary' : 'text-amber-700 dark:text-amber-300',
                  )}
                >
                  {item.value}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className={cn(
                    'h-full rounded-full',
                    item.tone === 'good' ? 'bg-primary/70' : 'bg-amber-600/60 dark:bg-amber-300/70',
                  )}
                  style={{ width: item.tone === 'good' ? '86%' : '42%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {ats.matchedLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ats.matched.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-[3px] border border-primary/20 bg-primary/[0.07] px-2 py-1 text-[10px] font-medium text-primary"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {ats.attentionLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ats.attention.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-[3px] border border-amber-600/25 dark:border-amber-300/20 bg-amber-500/10 dark:bg-amber-300/[0.06] px-2 py-1 text-[10px] font-medium text-amber-800 dark:text-amber-200/85"
              >
                <AlertCircle className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {ats.fixLabel}
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {ats.fixes.map((fix, index) => (
            <li key={fix} className="flex items-start gap-2">
              <span className="mt-px text-[9px] font-bold tabular-nums text-amber-700 dark:text-amber-300/70">
                0{index + 1}
              </span>
              <span className="text-[10px] leading-[1.55] text-foreground/75">{fix}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-auto border-t border-border pt-3 text-[9.5px] leading-relaxed text-landing-faint">
        {ats.caveat}
      </p>
    </div>
  )
}

export function AchievementPanel({ sample }: PanelProps) {
  const achievement = sample.achievement

  return (
    <div className="landing-paper flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
          {achievement.eyebrow}
        </p>
        <span className="text-[10px] font-semibold tabular-nums text-black/55">REWRITE / 04</span>
      </div>

      <p className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-landing-paper-ink">
        {achievement.title}
      </p>

      <div className="mt-4 space-y-2.5">
        <div className="rounded-[6px] border border-black/10 bg-black/[0.025] p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/60">
            {achievement.beforeLabel}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-[1.65] text-black/55">
            &ldquo;{achievement.before}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 ps-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-800/70">
          <ArrowDown className="h-3 w-3" aria-hidden />
          {achievement.arrowLabel}
        </div>

        <div className="rounded-[6px] border border-emerald-800/25 border-s-2 bg-emerald-800/[0.055] p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-800">
            {achievement.afterLabel}
          </p>
          <p className="mt-1.5 text-[12px] font-medium leading-[1.65] text-emerald-950">
            &ldquo;{achievement.after}&rdquo;
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-black/10 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/60">
          {achievement.changesLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {achievement.changes.map((change) => (
            <span
              key={change}
              className="rounded-[3px] border border-black/10 bg-black/[0.025] px-2 py-1 text-[9.5px] font-medium text-black/60"
            >
              {change}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-black/10 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/60">
          {achievement.evidenceLabel}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
          {achievement.evidence.map((item) => (
            <div key={item.label}>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-black/55">
                {item.label}
              </p>
              <p className="mt-0.5 text-[9.5px] font-medium leading-snug text-black/70">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-auto pt-3 text-[10px] leading-relaxed text-black/60">{achievement.caveat}</p>
    </div>
  )
}

export function InterviewPanel({ sample }: PanelProps) {
  const interview = sample.interview

  return (
    <div className="flex h-full flex-col bg-landing-panel-deep p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {interview.eyebrow}
        </p>
        <span className="text-[10px] font-semibold tabular-nums text-landing-faint">PREP / 05</span>
      </div>

      <p className="mt-3 max-w-[42ch] text-[16px] font-semibold leading-snug tracking-[-0.02em] text-foreground">
        {interview.title}
      </p>

      <div className="mt-3 rounded-[7px] border border-border bg-landing-raised p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {interview.questionLabel}
        </p>
        <p className="mt-1 text-[12px] font-medium leading-snug text-foreground">
          {interview.question}
        </p>
      </div>

      <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {interview.starLabel}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {interview.star.map((item) => (
          <div
            key={item.letter}
            className="rounded-[6px] border border-border bg-landing-raised p-2.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-primary/12 text-[9px] font-bold text-primary">
                {item.letter}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-[1.55] text-foreground/80">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {interview.nextLabel}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {interview.next.map((step) => (
            <li
              key={step}
              className="inline-flex items-center gap-1.5 text-[10px] text-foreground/75"
            >
              <Check className="h-3 w-3 text-primary" aria-hidden />
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {interview.evidenceLabel}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {interview.evidence.map((item) => (
            <li
              key={item}
              className="rounded-[3px] border border-border bg-landing-raised px-2 py-1 text-[9.5px] text-foreground/70"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-auto pt-3 text-[9.5px] leading-relaxed text-landing-faint">
        {interview.caveat}
      </p>
    </div>
  )
}

export function FinalPanel({ sample, lang }: PanelProps) {
  const final = sample.final

  return (
    <div className="relative h-full min-h-[380px] overflow-hidden bg-landing-final p-6 sm:p-8">
      <svg
        className="pointer-events-none absolute -end-28 -top-28 h-[360px] w-[360px] text-primary/20"
        viewBox="0 0 360 360"
        fill="none"
        aria-hidden
      >
        <circle cx="180" cy="180" r="142" stroke="currentColor" strokeOpacity="0.32" />
        <circle
          cx="180"
          cy="180"
          r="102"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeDasharray="1 7"
        />
        <path
          d="M180 30v34M180 296v34M30 180h34M296 180h34"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {final.eyebrow}
          </p>
          <p className="mt-3 max-w-[18ch] text-[clamp(1.7rem,4vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground">
            {final.title}
          </p>
          <p className="mt-3 max-w-[40ch] text-[12px] leading-[1.7] text-foreground/65">
            {final.body}
          </p>
        </div>

        <div>
          <Link
            href={`/${lang}/tailor`}
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-[6px] bg-primary px-5 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-landing-final"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {final.cta}
            <RtlIcon
              icon={ArrowRight}
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <p className="mt-3 text-[9.5px] leading-relaxed text-foreground/60">{final.note}</p>
        </div>
      </div>
    </div>
  )
}
