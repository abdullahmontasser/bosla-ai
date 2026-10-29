import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
}

function toHealthLanguage(lang: 'en' | 'ar'): HealthLanguage {
  return lang === 'ar' ? 'AR' : 'EN'
}

export async function ResumeHealthPanel({
  userId,
  pageLang,
  auditLang,
  dict,
}: ResumeHealthPanelProps) {
  const t = (dict.health || {}) as Partial<HealthDictionary>
  const view = await getResumeHealthForLanguage(userId, toHealthLanguage(auditLang))

  return (
    <section aria-labelledby="health-panel-heading">
      <HealthAuditViewedTracker locale={pageLang} />
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle
                id="health-panel-heading"
                className="text-base font-semibold text-foreground"
              >
                {t.panelTitle || 'Base Resume Health Audit'}
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                {t.panelSubtitle || ''}
              </CardDescription>
            </div>

            <nav
              aria-label={t.auditLanguageLabel || 'Card language'}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
            >
              {(['en', 'ar'] as const).map((code) => {
                const isActive = auditLang === code
                return (
                  <Link
                    key={code}
                    href={`/${pageLang}/resume?auditLang=${code}`}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={code === 'en' ? t.switchToEnglish : t.switchToArabic}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {code === 'en' ? 'English' : 'العربية'}
                  </Link>
                )
              })}
            </nav>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {!view ? (
            <div
              className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch"
              data-testid="health-empty-state"
            >
              <HealthScoreGauge score={0} lang={auditLang} dict={dict} />
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-center sm:items-start sm:text-start">
                <h3 className="text-sm font-semibold text-foreground">
                  {t.emptyTitle || 'Start with your master profile'}
                </h3>
                <p className="max-w-prose text-xs text-muted-foreground">{t.emptyBody || ''}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${pageLang}/profile`}>
                      {t.emptyProfile || 'Open your profile'}
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm">
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
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
