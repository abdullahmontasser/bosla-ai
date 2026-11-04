'use client'

import * as React from 'react'
import { Clock, ArrowRight, CheckCircle2, ChevronRight, X, Sparkles, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTailoredResumeHistoryAction, type TailoredJobHistoryItem } from '@/app/actions/tailor'

export interface TailoredHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectRole: (item: {
    jobTitle: string
    companyName: string
    rawDescription: string
    summary?: string
  }) => void
  lang: 'en' | 'ar'
  language: 'EN' | 'AR'
}

export function TailoredHistoryDrawer({
  isOpen,
  onClose,
  onSelectRole,
  lang,
  language,
}: TailoredHistoryDrawerProps) {
  const isArabic = lang === 'ar'
  const [history, setHistory] = React.useState<TailoredJobHistoryItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  // Strict deduplication by normalized (jobTitle + companyName) to prevent repeated cards
  const deduplicatedHistory = React.useMemo(() => {
    const seen = new Set<string>()
    return history.filter((item) => {
      const normalizedTitle = (item.jobTitle || '').trim().toLowerCase().replace(/\s+/g, ' ')
      const normalizedCompany = (item.companyName || '').trim().toLowerCase().replace(/\s+/g, ' ')
      const key = `${normalizedTitle}:::${normalizedCompany}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [history])

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      getTailoredResumeHistoryAction(language)
        .then((res) => {
          setHistory(res?.data || [])
        })
        .catch(() => {
          setHistory([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, language])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'سجل الوظائف المخصصة سابقاً' : 'Recent Tailored Jobs History'}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
    >
      <div
        className="w-full max-w-md h-full bg-background border-s border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {isArabic ? 'سجل الوظائف المخصصة' : 'Recent Tailored Jobs'}
            </h2>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {deduplicatedHistory.length}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label={isArabic ? 'إغلاق السجل' : 'Close history'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Sparkles className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs">
                {isArabic ? 'جاري تحميل السجل...' : 'Loading past tailored jobs...'}
              </span>
            </div>
          ) : deduplicatedHistory.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs font-medium text-foreground">
                {isArabic ? 'لا توجد وظائف مخصصة بعد' : 'No tailored jobs yet'}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                {isArabic
                  ? 'بمجرد تخصيص سيرتك الذاتية لوظيفة مستهدفة، سيظهر ملخصها هنا للرجوع إليها بسرعة.'
                  : 'Once you tailor your resume for a job brief, it will appear here for fast review and reloading.'}
              </p>
            </div>
          ) : (
            deduplicatedHistory.map((item) => {
              const isExpanded = expandedId === item.id
              const dateStr = new Date(item.createdAt).toLocaleDateString(
                isArabic ? 'ar-EG' : 'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' },
              )

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2.5 transition-all hover:border-primary/40 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold text-foreground leading-snug">
                        {item.jobTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{item.companyName}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{dateStr}</span>
                      </div>
                    </div>

                    {item.atsScore != null && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        {Math.round(item.atsScore)}%
                      </span>
                    )}
                  </div>

                  {item.tailoredSummary && (
                    <div className="text-[11px] text-muted-foreground/90 bg-muted/30 rounded p-2 border border-border/40">
                      <p className={isExpanded ? '' : 'line-clamp-2'}>{item.tailoredSummary}</p>
                      {item.tailoredSummary.length > 120 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-[10px] text-primary font-medium mt-1 hover:underline block"
                        >
                          {isExpanded
                            ? isArabic
                              ? 'عرض أقل'
                              : 'Show less'
                            : isArabic
                              ? 'عرض الملخص كاملاً'
                              : 'Read full summary'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 px-2.5"
                      onClick={() => {
                        onSelectRole({
                          jobTitle: item.jobTitle,
                          companyName: item.companyName,
                          rawDescription: item.rawJobDescription,
                          summary: item.tailoredSummary || undefined,
                        })
                        onClose()
                      }}
                    >
                      <span>{isArabic ? 'استعادة هذه الوظيفة' : 'Reload brief'}</span>
                      {isArabic ? (
                        <ArrowRight className="h-3 w-3 rotate-180" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
