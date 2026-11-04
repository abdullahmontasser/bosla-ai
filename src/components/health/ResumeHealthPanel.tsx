import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getResumeHealthForLanguage } from '@/lib/health/queries'
import type { HealthLanguage } from '@/lib/health/rules'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'
import { HealthAuditSurface } from './HealthAuditSurface'
import { HealthAuditViewedTracker } from './HealthAuditViewedTracker'
import { HealthScoreGauge } from './HealthScoreGauge'

export interface ResumeHealthPanelProps {
  userId: string
  /** Page locale, used for the switch links. */
  pageLang: 'en' | 'ar'
  /** Audit target resolved from the `auditLang` query param. */
  auditLang: 'en' | 'ar'
  dict: Dictionary
  ingestionSlot?: React.ReactNode
}

function toHealthLanguage(lang: 'en' | 'ar'): HealthLanguage {
  return lang === 'ar' ? 'AR' : 'EN'
}

export async function ResumeHealthPanel({
  userId,
  pageLang,
  auditLang,
  dict,
  ingestionSlot,
}: ResumeHealthPanelProps) {
  const t = (dict.health || {}) as Partial<HealthDictionary>
  const view = await getResumeHealthForLanguage(userId, toHealthLanguage(auditLang))

  return (
    <section aria-labelledby="health-panel-heading">
      <HealthAuditViewedTracker locale={pageLang} />
      <div className="rounded-[10px] border border-border bg-card overflow-hidden">
        {/* Top Header Bar */}
        <div className="border-b border-border p-4 sm:p-6 bg-card/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-px w-5 bg-primary" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  AUDIT / 01
                </span>
              </div>
              <h2
                id="health-panel-heading"
                role="heading"
                aria-level={2}
                className="text-base font-bold text-foreground"
              >
                {t.panelTitle || 'Base Resume Health Audit'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.panelSubtitle || ''}</p>
            </div>

            <div className="flex items-center gap-2 rounded-[6px] border border-border/80 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-medium text-foreground">
                {pageLang === 'ar'
                  ? auditLang === 'ar'
                    ? 'تقييم: السيرة العربية'
                    : 'تقييم: السيرة الإنجليزية'
                  : auditLang === 'ar'
                    ? 'Audit Target: Arabic CV'
                    : 'Audit Target: English CV'}
              </span>
            </div>
          </div>
        </div>

        <div>
          {!view ? (
            <div
              className="grid grid-cols-1 lg:grid-cols-[380px_1fr] divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-border"
              data-testid="health-empty-state"
            >
              <div className="p-6 space-y-6 bg-landing-panel-deep/40">
                <HealthScoreGauge score={0} lang={auditLang} dict={dict} />
                {ingestionSlot}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center sm:items-start sm:text-start bg-card/40">
                <h3 className="text-sm font-bold text-foreground">
                  {t.emptyTitle || 'Start with your master profile'}
                </h3>
                <p className="max-w-prose text-xs text-muted-foreground leading-relaxed">
                  {t.emptyBody || ''}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button asChild variant="outline" size="sm" className="rounded-[6px] text-xs">
                    <Link href={`/${pageLang}/profile`}>
                      {t.emptyProfile || 'Open your profile'}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="rounded-[6px] text-xs font-semibold"
                  >
                    <Link href="#resume-ingestion">{t.emptyUpload || 'Upload a resume'}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <HealthAuditSurface
              key={`${view.profileId}-${view.language}`}
              initialView={view}
              dict={dict}
              pageLang={pageLang}
              ingestionSlot={ingestionSlot}
            />
          )}
        </div>
      </div>
    </section>
  )
}
