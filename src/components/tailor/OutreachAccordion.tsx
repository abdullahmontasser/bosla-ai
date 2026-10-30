'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OutreachWorkbench } from '@/components/outreach'
import { getOutreachMessageAction } from '@/app/actions/outreach-actions'
import type { OutreachMessagePayload } from '@/lib/validations/career-prep'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import { Send, ChevronDown, Check, Clock, AlertCircle, Loader2 } from 'lucide-react'

export interface OutreachAccordionProps {
  tailoredResumeId: string
  initialHasOutreach?: boolean
  initialOutreach?: OutreachMessagePayload | null
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function OutreachAccordion({
  tailoredResumeId,
  initialHasOutreach = false,
  initialOutreach = null,
  lang,
  dict,
}: OutreachAccordionProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'

  const [isOpen, setIsOpen] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(Boolean(initialOutreach))
  const [isLoading, setIsLoading] = React.useState(false)
  const [outreachPayload, setOutreachPayload] = React.useState<OutreachMessagePayload | null>(
    initialOutreach,
  )
  const [hasOutreach, setHasOutreach] = React.useState(
    Boolean(initialHasOutreach || initialOutreach),
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleToggle = async () => {
    const nextState = !isOpen
    setIsOpen(nextState)

    // Lazy load on first expand if outreach exists but payload not yet fetched
    if (nextState && hasOutreach && !outreachPayload && !hasLoaded && !isLoading) {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const res = await getOutreachMessageAction(tailoredResumeId)
        if (res.success) {
          if (res.data) {
            setOutreachPayload(res.data)
            setHasOutreach(true)
          }
          setHasLoaded(true)
        } else {
          setErrorMessage(
            res.error ||
              (isArabic ? 'فشل تحميل رسائل التواصل' : 'Failed to load outreach messages'),
          )
        }
      } catch {
        setErrorMessage(
          isArabic
            ? 'حدث خطأ أثناء تحميل رسائل التواصل'
            : 'An error occurred while loading outreach messages',
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRetry = () => {
    setHasLoaded(false)
    handleToggle()
  }

  return (
    <Card
      className="border border-border/80 bg-card overflow-hidden transition-all shadow-xs"
      data-testid="outreach-accordion"
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="w-full text-start p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-testid="outreach-accordion-toggle"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Send className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                {t.outreachAccordionTitle ||
                  (isArabic ? 'رسائل التواصل المهني' : 'Outreach Messaging & Networking')}
              </span>
              <Badge
                variant={hasOutreach ? 'secondary' : 'outline'}
                className={`text-[11px] px-2 py-0.5 font-medium gap-1 ${
                  hasOutreach
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                }`}
                data-testid="outreach-status-badge"
              >
                {hasOutreach ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span>{t.readyBadge || (isArabic ? 'جاهز' : 'Ready')}</span>
                  </>
                ) : (
                  <>
                    <Clock className="size-3" />
                    <span>{t.pendingBadge || (isArabic ? 'معلّق' : 'Pending')}</span>
                  </>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t.outreachAccordionDesc ||
                (isArabic
                  ? 'صياغة مخصصة لملاحظات لينكد إن ورسائل البريد المتوافقة مع متطلبات الوظيفة.'
                  : 'Personalized LinkedIn notes, InMail pitches, and emails matched to this job.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex size-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown className="size-4" />
          </div>
        </div>
      </button>

      {isOpen && (
        <CardContent
          className="border-t border-border/60 p-4 sm:p-6 space-y-4 pt-5"
          data-testid="outreach-accordion-content"
        >
          {isLoading && (
            <div
              className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2"
              data-testid="outreach-loading-spinner"
            >
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">
                {isArabic ? 'جارٍ تحميل رسائل التواصل...' : 'Loading outreach messages...'}
              </p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-7 text-xs px-2.5"
              >
                {t.retry || (isArabic ? 'إعادة المحاولة' : 'Retry')}
              </Button>
            </div>
          )}

          {!isLoading && !errorMessage && (
            <OutreachWorkbench
              tailoredResumeId={tailoredResumeId}
              initialOutreach={outreachPayload}
              lang={lang}
              onPayloadChange={(newPayload) => {
                setOutreachPayload(newPayload)
                setHasOutreach(true)
                setHasLoaded(true)
              }}
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}
