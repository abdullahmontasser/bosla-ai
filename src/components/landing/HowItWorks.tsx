import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RtlIcon } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { LandingCopy } from './content'
import { Reveal } from './Reveal'

interface HowItWorksProps {
  lang: string
  copy: LandingCopy
}

export function HowItWorks({ lang, copy }: HowItWorksProps) {
  const isAr = lang === 'ar'

  return (
    <section id="how" className="scroll-mt-24 border-b border-border/70">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <Reveal variant="lines">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-20">
            <div>
              <p
                data-reveal
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {copy.how.label}
              </p>
              <h2
                className={cn(
                  'mt-5 max-w-[13ch] text-balance text-foreground',
                  isAr
                    ? 'font-arabic text-[clamp(1.9rem,3.8vw,3rem)] font-extrabold leading-[1.28]'
                    : 'text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.04] tracking-[-0.04em]',
                )}
              >
                <span className="line-mask">
                  <span data-line-inner className="block">
                    {isAr ? 'مسار واضح' : 'A clear path'}
                  </span>
                </span>
                <span className="line-mask">
                  <span data-line-inner className="block">
                    {isAr ? 'من الإعلان' : 'from posting'}
                  </span>
                </span>
                <span className="line-mask">
                  <span data-line-inner className="block text-muted-foreground">
                    {isAr ? 'إلى التحضير.' : 'to preparation.'}
                  </span>
                </span>
              </h2>
            </div>

            <p
              data-reveal
              className={cn(
                'max-w-[54ch] text-sm text-muted-foreground sm:text-base lg:justify-self-end',
                isAr ? 'font-arabic leading-[1.95]' : 'leading-[1.75]',
              )}
            >
              {copy.how.body}
            </p>
          </div>

          <div className="mt-10 grid gap-0 border-t border-border/80 md:grid-cols-3 lg:mt-14">
            {copy.how.steps.map((step, index) => (
              <div
                key={step.title}
                data-reveal
                className={cn(
                  'group relative flex min-h-[200px] flex-col justify-between border-border/80 px-0 py-7 md:px-7 md:py-8',
                  index > 0 && 'border-t md:border-s md:border-t-0',
                  index === 0 && 'md:ps-0',
                  index === 2 && 'md:pe-0',
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={cn(
                        'font-serif text-[2.6rem] leading-none tracking-[-0.04em] text-muted-foreground/35 transition-colors duration-300 group-hover:text-primary/60',
                        isAr && 'font-arabic font-extrabold',
                      )}
                      aria-hidden
                    >
                      0{index + 1}
                    </span>
                    <span className="h-px w-9 bg-border transition-colors duration-300 group-hover:bg-primary/50" />
                  </div>
                  <h3
                    className={cn(
                      'mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground',
                      isAr && 'font-arabic leading-[1.5]',
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-3 max-w-[34ch] text-[13px] leading-[1.7] text-muted-foreground',
                      isAr && 'font-arabic leading-[1.9]',
                    )}
                  >
                    {step.body}
                  </p>
                </div>

                <Link
                  href={`/${lang}${step.href}`}
                  className="mt-7 inline-flex min-h-9 w-fit items-center gap-2 text-[12px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {step.link}
                  <RtlIcon
                    icon={ArrowRight}
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
