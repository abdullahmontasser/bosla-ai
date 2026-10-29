import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { Reveal } from './Reveal'

interface ComparisonProps {
  copy: LandingCopy
}

export function Comparison({ copy }: ComparisonProps) {
  return (
    <section id="compare" className="scroll-mt-24 border-b border-border/70">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <Reveal variant="lines">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
            <div>
              <p
                data-reveal
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {copy.comparison.label}
              </p>
              <h2
                className={cn(
                  'mt-5 max-w-[14ch] text-balance text-foreground',
                  'text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.04] tracking-[-0.038em]',
                )}
              >
                {copy.comparison.title
                  .split('. ')
                  .filter(Boolean)
                  .map((line, index, lines) => (
                    <span key={line} className="line-mask">
                      <span
                        data-line-inner
                        className={cn(
                          'block',
                          index === lines.length - 1 && 'text-muted-foreground',
                        )}
                      >
                        {line}
                        {index < lines.length - 1 ? '.' : ''}
                      </span>
                    </span>
                  ))}
              </h2>
            </div>
            <p
              data-reveal
              className="max-w-[48ch] text-sm leading-[1.75] text-muted-foreground sm:text-base lg:justify-self-end"
            >
              {copy.comparison.body}
            </p>
          </div>
        </Reveal>

        <div className="mt-9 border-t border-border/80">
          <div className="hidden grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)] md:grid">
            <span className="py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-landing-faint">
              —
            </span>
            <span className="border-s border-border/60 px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-landing-faint">
              {copy.comparison.headers.without}
            </span>
            <span className="border-s border-primary/15 bg-primary/[0.025] px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              {copy.comparison.headers.with}
            </span>
          </div>

          <div className="border-t border-border/60">
            {copy.comparison.rows.map((row, index) => (
              <Reveal key={row.dimension}>
                <div className="grid border-b border-border/60 md:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)]">
                  <div data-reveal className="flex items-baseline gap-2.5 pb-2 pt-4 md:py-4">
                    <span className="text-[9px] font-semibold tabular-nums text-muted-foreground/35">
                      0{index + 1}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/75">
                      {row.dimension}
                    </span>
                  </div>

                  <div
                    data-reveal
                    className="flex items-start gap-2.5 pb-4 md:border-s md:border-border/60 md:px-6 md:py-4"
                  >
                    <Minus
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/35"
                      aria-hidden
                    />
                    <p className="text-[12.5px] leading-[1.7] text-landing-faint">{row.without}</p>
                  </div>

                  <div
                    data-reveal
                    className="flex items-start gap-2.5 border-t border-border/40 pb-5 pt-4 md:border-s md:border-t-0 md:border-primary/15 md:bg-primary/[0.025] md:px-6 md:py-4"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                      <Check className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} aria-hidden />
                    </span>
                    <p className="text-[12.5px] font-medium leading-[1.7] text-foreground/85">
                      {row.with}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal>
          <p data-reveal className="mt-6 max-w-3xl text-[11px] leading-relaxed text-landing-faint">
            {copy.comparison.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
