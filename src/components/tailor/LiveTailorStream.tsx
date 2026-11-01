'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, Check, RefreshCw, AlertTriangle, FileText, ListChecks } from 'lucide-react'
import { parseTailoredStream } from '@/lib/ai/tailor-prompt'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface LiveTailorStreamProps {
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  streamText: string
  errorMessage?: string | null
  dict: Partial<Dictionary>
  onRetry?: () => void
}

export function LiveTailorStream({
  status,
  streamText,
  errorMessage,
  dict,
  onRetry,
}: LiveTailorStreamProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const [copied, setCopied] = React.useState(false)

  const parsed = React.useMemo(() => {
    return parseTailoredStream(streamText)
  }, [streamText])

  const hasParsedContent = Boolean(parsed.summary || parsed.bullets.length > 0)

  async function handleCopy() {
    if (!streamText) return
    try {
      await navigator.clipboard.writeText(streamText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <Card className="border border-border bg-card flex flex-col h-full min-h-[420px]">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
                {t.previewPanelTitle || 'Live Tailoring Output'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {t.previewPanelDesc || 'Real-time AI streamed summary and bullet points.'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'GENERATING' && (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse text-xs"
              >
                <span className="size-1.5 rounded-full bg-amber-500" />
                {t.generatingBadge || 'Streaming Live'}
              </Badge>
            )}

            {status === 'COMPLETED' && (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
              >
                <Check className="size-3" />
                {t.completedBadge || 'Completed & Saved'}
              </Badge>
            )}

            {status === 'FAILED' && (
              <Badge
                variant="outline"
                className="gap-1 border-destructive/50 bg-destructive/10 text-destructive text-xs"
              >
                <AlertTriangle className="size-3" />
                {t.failedBadge || 'Failed'}
              </Badge>
            )}

            {streamText.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 gap-1.5 text-xs"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? t.copied || 'Copied' : t.copyAll || 'Copy'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-5 space-y-5 overflow-y-auto">
        {status === 'FAILED' && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-2.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{t.errorTitle || 'Generation Error'}</span>
            </div>
            <p className="text-destructive/90">
              {errorMessage || 'Upstream provider or network error interrupted tailoring.'}
            </p>
            {onRetry && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRetry}
                className="h-7 gap-1 text-xs px-2.5"
              >
                <RefreshCw className="size-3" />
                {t.retry || 'Retry Generation'}
              </Button>
            )}
          </div>
        )}

        {(status === 'IDLE' || (status === 'COMPLETED' && !hasParsedContent)) && !streamText && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl bg-muted/20 p-8 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 mb-3">
              <FileText className="size-6 stroke-[1.5] text-muted-foreground/70" />
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              {t.streamIdle ||
                'Your tailored summary and optimized bullet points will stream live into this panel once you submit.'}
            </p>
          </div>
        )}

        {(status === 'GENERATING' || (status === 'COMPLETED' && hasParsedContent) || streamText.length > 0) && (
          <div className="divide-y divide-border/50 space-y-5">
            {/* Parsed Summary Section (no redundant nested border box) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.summaryTitle || 'Tailored Professional Summary'}
                </h4>
              </div>

              {parsed.summary ? (
                <p className="text-xs sm:text-[13px] text-foreground leading-relaxed font-sans whitespace-pre-wrap rounded-lg bg-muted/25 p-3.5">
                  {parsed.summary}
                </p>
              ) : status === 'GENERATING' ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3 px-3.5 rounded-lg bg-muted/20 italic">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                  Generating tailored summary...
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2 italic">
                  No summary generated yet.
                </p>
              )}
            </div>

            {/* Parsed Bullets Section */}
            <div className="pt-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <ListChecks className="size-3.5 text-primary" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.bulletsTitle || 'Tailored Experience Bullets'}
                </h4>
              </div>

              {parsed.bullets.length > 0 ? (
                <ul className="space-y-2 rounded-lg bg-muted/25 p-3.5">
                  {parsed.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-[13px] text-foreground leading-relaxed"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground py-2.5 px-3.5 rounded-lg bg-muted/15 italic">
                  {status === 'GENERATING' ? (
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                      Waiting for bullet stream...
                    </div>
                  ) : (
                    'Click "Generate Tailored Resume" to stream tailored experience bullets.'
                  )}
                </div>
              )}
            </div>

            {status === 'COMPLETED' && hasParsedContent && (
              <p className="text-[11px] text-muted-foreground text-center pt-3">
                {t.savedNotice || 'Tailored snapshot saved to database.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
