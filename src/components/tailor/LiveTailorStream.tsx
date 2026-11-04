'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, RefreshCw, AlertTriangle, FileText, ListChecks, Pencil } from 'lucide-react'
import { parseTailoredStream } from '@/lib/ai/tailor-prompt'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface LiveTailorStreamProps {
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  streamText: string
  errorMessage?: string | null
  resumeLanguage?: 'EN' | 'AR'
  dict: Partial<Dictionary>
  onRetry?: () => void
  onStreamTextChange?: (text: string) => void
}

export function LiveTailorStream({
  status,
  streamText,
  errorMessage,
  resumeLanguage,
  dict,
  onRetry,
  onStreamTextChange,
}: LiveTailorStreamProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const [copied, setCopied] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  const parsed = React.useMemo(() => {
    return parseTailoredStream(streamText)
  }, [streamText])

  const [editedSummary, setEditedSummary] = React.useState(parsed.summary || '')
  const [editedBullets, setEditedBullets] = React.useState(parsed.bullets || [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedSummary(parsed.summary || '')
    setEditedBullets(parsed.bullets || [])
  }, [parsed.summary, parsed.bullets])

  const hasParsedContent = Boolean(parsed.summary || parsed.bullets.length > 0)

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes back to stream text
      const newStream = [
        '### SUMMARY',
        editedSummary.trim(),
        '### BULLETS',
        ...editedBullets.map((b) => `- ${b.trim()}`),
      ].join('\n')
      onStreamTextChange?.(newStream)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

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
    <div className="rounded-[10px] border border-border bg-card p-6 sm:p-8 space-y-6 flex flex-col h-full min-h-[440px]">
      {/* Clean Single Header: Title & Action/Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {t.previewPanelTitle || 'Live Tailoring Output'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.previewPanelDesc || 'Real-time AI streamed summary and bullet points.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === 'GENERATING' && (
            <Badge
              variant="outline"
              className="gap-1.5 rounded-[4px] border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium"
            >
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t.generatingBadge || 'Streaming Live'}
            </Badge>
          )}

          {status === 'COMPLETED' && (hasParsedContent || streamText.trim().length > 0) && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleEdit}
                className="h-7 gap-1.5 rounded-[5px] text-xs font-medium"
              >
                {isEditing ? <Check className="size-3" /> : <Pencil className="size-3" />}
                {isEditing ? 'Done' : 'Edit Draft'}
              </Button>

              <Badge
                variant="outline"
                className="gap-1 rounded-[4px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
              >
                <Check className="size-3" />
                {t.completedBadge || 'Completed & Saved'}
              </Badge>
            </div>
          )}

          {status === 'FAILED' && (
            <Badge
              variant="outline"
              className="gap-1 rounded-[4px] border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium"
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
              className="h-7 gap-1.5 rounded-[5px] text-xs font-medium"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              {copied ? t.copied || 'Copied' : t.copyAll || 'Copy'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {status === 'FAILED' && (
          <div className="rounded-[6px] border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-2.5">
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
                className="h-7 gap-1 rounded-[5px] text-xs px-2.5"
              >
                <RefreshCw className="size-3" />
                {t.retry || 'Retry Generation'}
              </Button>
            )}
          </div>
        )}

        {(status === 'IDLE' || (status === 'COMPLETED' && !hasParsedContent)) && !streamText && (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 bg-muted/10 p-8 text-center text-muted-foreground">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/40 mb-3">
              <FileText className="size-4 stroke-[1.5] text-muted-foreground/70" />
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              {t.streamIdle ||
                'Your tailored summary and optimized bullet points will stream live into this panel once you submit.'}
            </p>
          </div>
        )}

        {(status === 'GENERATING' ||
          (status === 'COMPLETED' && hasParsedContent) ||
          streamText.length > 0) && (
          <div
            className="space-y-6"
            dir={resumeLanguage ? (resumeLanguage === 'AR' ? 'rtl' : 'ltr') : undefined}
          >
            {/* Parsed Summary Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.summaryTitle || 'Tailored Professional Summary'}
                </h3>
              </div>

              {isEditing ? (
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={4}
                  className="w-full text-xs sm:text-[13px] text-foreground leading-[1.7] rounded-[6px] border border-primary/50 bg-card p-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-sans"
                  placeholder="Edit tailored professional summary..."
                />
              ) : parsed.summary ? (
                <p className="text-xs sm:text-[13px] text-foreground leading-[1.7] whitespace-pre-wrap rounded-[6px] border border-border/60 bg-muted/20 p-4">
                  {parsed.summary}
                </p>
              ) : status === 'GENERATING' ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3 px-3.5 rounded-[6px] bg-muted/20 italic">
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
            <div className="pt-4 border-t border-border/60 space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="size-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.bulletsTitle || 'Tailored Experience Bullets'}
                </h3>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {editedBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                      <textarea
                        value={bullet}
                        onChange={(e) => {
                          const next = [...editedBullets]
                          next[idx] = e.target.value
                          setEditedBullets(next)
                        }}
                        rows={2}
                        className="w-full text-xs sm:text-[13px] text-foreground leading-[1.65] rounded-[5px] border border-primary/50 bg-card p-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-sans"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedBullets([...editedBullets, ''])}
                    className="h-6 text-[11px] gap-1 px-2 mt-1"
                  >
                    + Add bullet
                  </Button>
                </div>
              ) : parsed.bullets.length > 0 ? (
                <ul className="space-y-2">
                  {parsed.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-[5px] bg-muted/15 px-3.5 py-2.5 text-xs sm:text-[13px] text-foreground leading-[1.65]"
                    >
                      <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground py-3 px-3.5 rounded-[6px] bg-muted/15 italic">
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
              <p className="text-[11px] text-muted-foreground/75 text-center pt-2">
                {t.savedNotice || 'Tailored snapshot saved to database.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
