import { Languages, KeyRound, ScanSearch, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { Reveal } from './Reveal'

interface TrustStripProps {
  copy: LandingCopy
}

const icons = [KeyRound, Languages, ScanSearch, FileText]

export function TrustStrip({ copy }: TrustStripProps) {
  return (
    <section aria-labelledby="trust-title" className="border-b border-border/70 bg-landing-surface">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <Reveal className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="trust-title"
              data-reveal
              className="max-w-md text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              {copy.trust.title}
            </h2>
            <span
              data-reveal
              className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-landing-faint sm:block"
            >
              BOSLA / TRUST
            </span>
          </div>

          <div className="mt-8 grid gap-px border-y border-border/70 bg-border/50 sm:grid-cols-2 lg:grid-cols-4">
            {copy.trust.items.map((item, index) => {
              const Icon = icons[index] ?? KeyRound
              return (
                <div
                  key={item.title}
                  data-reveal
                  className="group flex min-h-[164px] flex-col justify-between gap-6 bg-background px-5 py-5 transition-colors duration-300 hover:bg-landing-panel sm:px-6"
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
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        'mt-2 text-[12px] leading-[1.65] text-muted-foreground',
                        item.body.length > 90 && 'max-w-[30ch]',
                      )}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p data-reveal className="mt-5 max-w-3xl text-[11px] leading-relaxed text-landing-faint">
            {copy.trust.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
