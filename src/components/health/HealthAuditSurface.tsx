'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UNDO_WINDOW_MS } from '@/lib/health/constants'
import {
  acceptHealthSuggestionAction,
  dismissHealthSuggestionAction,
  generateHealthRewriteAction,
  restoreHealthSuggestionAction,
  undoHealthSuggestionAction,
  type HealthActionErrorCode,
} from '@/app/actions/resume-health'
import type { HealthAuditView, HealthSuggestionDTO } from '@/lib/health/queries'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'
import { HealthCategorySection } from './HealthCategorySection'
import { HealthScoreGauge } from './HealthScoreGauge'
import { HealthSuggestionCard } from './HealthSuggestionCard'

export interface HealthAuditSurfaceProps {
  initialView: HealthAuditView
  dict: Dictionary
  pageLang: 'en' | 'ar'
}

/** AI errors join the decision codes the server actions can return. */
export type HealthCardNotice =
  HealthActionErrorCode | 'RATE_LIMITED' | 'NO_PROVIDER' | 'AI_FAILED' | 'UNGROUNDED_REWRITE'

type CardAction = 'accept' | 'undo' | 'dismiss' | 'restore' | 'askAi'

/**
 * Owns the audit view state on the client so every card decision, the gauge
 * animation, and the 10 second undo window react in place, without a full
 * page reload.
 */
export function HealthAuditSurface({ initialView, dict, pageLang }: HealthAuditSurfaceProps) {
  const router = useRouter()
  const t = (dict.health || {}) as Partial<HealthDictionary>

  const [prevInitialView, setPrevInitialView] = React.useState(initialView)
  const [view, setView] = React.useState(initialView)
  const [busyCardId, setBusyCardId] = React.useState<string | null>(null)
  const [notices, setNotices] = React.useState<Record<string, HealthCardNotice>>({})
  // Accepted cards stay in their group with an undo control for 10 seconds.
  const [acceptedRecently, setAcceptedRecently] = React.useState<Record<string, number>>({})

  // Resync view during render when language or profile changes on the parent
  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView)
    setView(initialView)
    setNotices({})
    setAcceptedRecently({})
  }

  const cardLang = view.language === 'AR' ? 'ar' : 'en'

  const runAction = React.useCallback(
    async (card: HealthSuggestionDTO, action: CardAction) => {
      setBusyCardId(card.id)
      let result: Awaited<ReturnType<typeof acceptHealthSuggestionAction>>
      switch (action) {
        case 'accept':
          result = await acceptHealthSuggestionAction(card.id)
          break
        case 'undo':
          result = await undoHealthSuggestionAction(card.id)
          break
        case 'dismiss':
          result = await dismissHealthSuggestionAction(card.id)
          break
        case 'restore':
          result = await restoreHealthSuggestionAction(card.id)
          break
        case 'askAi': {
          const rewrite = await generateHealthRewriteAction(card.id)
          if (rewrite.ok) {
            setView(rewrite.view)
            setNotices((prev) => {
              const next = { ...prev }
              delete next[card.id]
              return next
            })
          } else {
            setNotices((prev) => ({ ...prev, [card.id]: rewrite.error }))
            if (rewrite.error === 'CONFLICT') router.refresh()
          }
          setBusyCardId(null)
          return
        }
      }
      setBusyCardId(null)

      if (!result.ok) {
        setNotices((prev) => ({ ...prev, [card.id]: result.error }))
        if (result.error === 'CONFLICT') router.refresh()
        return
      }

      setView(result.view)
      setNotices((prev) => {
        const next = { ...prev }
        delete next[card.id]
        return next
      })
      if (action === 'accept') {
        setAcceptedRecently((prev) => ({ ...prev, [card.id]: Date.now() + UNDO_WINDOW_MS }))
        window.setTimeout(() => {
          setAcceptedRecently((prev) => {
            const next = { ...prev }
            delete next[card.id]
            return next
          })
        }, UNDO_WINDOW_MS)
      }
      if (action === 'undo') {
        setAcceptedRecently((prev) => {
          const next = { ...prev }
          delete next[card.id]
          return next
        })
      }
    },
    [router],
  )

  // Timer culling keeps the map membership in sync with the window, so no
  // render time read is needed to decide which accepted cards still show.
  const showableCards = view.suggestions.filter(
    (card) => card.status === 'PENDING' || Boolean(acceptedRecently[card.id]),
  )
  const dismissedByCategory = view.suggestions
    .filter((card) => card.status === 'DISMISSED')
    .reduce<Record<string, HealthSuggestionDTO>>((latest, card) => {
      const current = latest[card.category]
      if (!current || (card.decidedAt?.getTime() ?? 0) > (current.decidedAt?.getTime() ?? 0)) {
        latest[card.category] = card
      }
      return latest
    }, {})

  // Keep the spec's category order when several groups hold open cards.
  const CATEGORY_ORDER = ['IMPACT_METRICS', 'ACTION_VERBS', 'ATS_COMPLETENESS', 'CONTENT_DEPTH']
  const categoriesInOrder = [...showableCards.map((card) => card.category)]
  categoriesInOrder.sort(
    (a, b) => (CATEGORY_ORDER.indexOf(a) ?? 9) - (CATEGORY_ORDER.indexOf(b) ?? 9),
  )
  const categoryOrder = Array.from(new Set(categoriesInOrder))

  return (
    <div className="space-y-5" data-testid="health-audit-surface">
      <HealthScoreGauge
        score={view.overallScore}
        breakdown={view.breakdown}
        lang={cardLang}
        dict={dict}
        updating={busyCardId !== null}
      />

      {categoryOrder.length === 0 && (
        <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          {t.profileCardSubtitle || ''}
        </p>
      )}

      {categoryOrder.map((category, index) => {
        const cards = showableCards.filter((card) => card.category === category)
        const latestDismissed = dismissedByCategory[category]
        return (
          <HealthCategorySection
            key={category}
            label={sectionLabel(category, t)}
            cards={cards}
            dict={dict}
            openDefault={index === 0}
            restorable={Boolean(latestDismissed)}
            onRestore={latestDismissed ? () => runAction(latestDismissed, 'restore') : undefined}
            renderCard={(card) => (
              <CardShell
                card={card}
                dict={dict}
                pageLang={pageLang}
                isAccepted={Boolean(acceptedRecently[card.id])}
                notice={notices[card.id]}
                busy={busyCardId === card.id}
                onAction={runAction}
              />
            )}
          />
        )
      })}
    </div>
  )
}

function sectionLabel(category: string, t: Partial<HealthDictionary>): string {
  const labels: Record<string, string> = {
    IMPACT_METRICS: t.categoryImpact || 'Impact & metrics',
    ACTION_VERBS: t.categoryActionVerbs || 'Action verbs',
    ATS_COMPLETENESS: t.categoryCompleteness || 'ATS completeness',
    CONTENT_DEPTH: t.categoryDepth || 'Content depth',
  }
  return labels[category] || category
}

interface CardShellProps {
  card: HealthSuggestionDTO
  dict: Dictionary
  pageLang: 'en' | 'ar'
  isAccepted: boolean
  notice?: HealthCardNotice
  busy: boolean
  onAction: (card: HealthSuggestionDTO, action: CardAction) => void
}

/** One card: display shell, action row, and the conflict or stale notice. */
function CardShell({ card, dict, pageLang, isAccepted, notice, busy, onAction }: CardShellProps) {
  const t = (dict.health || {}) as Partial<HealthDictionary>
  const hasRewrite = Boolean(card.proposedText) && !card.isAiStale
  const noticeText = notice ? noticeTextFor(notice, t) : null

  return (
    <div className="space-y-2">
      <div
        className={
          isAccepted ? 'rounded-lg border border-emerald-500/40 bg-emerald-500/5' : undefined
        }
      >
        {isAccepted && (
          <div className="flex items-center justify-between px-3 pt-2">
            <Badge variant="success" className="text-[10px]">
              {t.acceptedBadge || 'Accepted'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onAction(card, 'undo')}
              className="h-7 gap-1 text-xs"
            >
              {t.undo || 'Undo'}
            </Button>
          </div>
        )}
        <HealthSuggestionCard card={card} dict={dict} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {card.status === 'PENDING' && !isAccepted && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onAction(card, 'dismiss')}
          >
            {t.dismiss || 'Dismiss'}
          </Button>
        )}
        {card.status === 'PENDING' && !isAccepted && card.isAiStale && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => onAction(card, 'askAi')}
          >
            {t.regenerate || 'Regenerate'}
          </Button>
        )}
        {!isAccepted && (card.status === 'PENDING' || card.isAiStale) && (
          <>
            {hasRewrite && (
              <Button
                variant="default"
                size="sm"
                disabled={busy}
                onClick={() => onAction(card, 'accept')}
              >
                {t.accept || 'Accept fix'}
              </Button>
            )}
            {!hasRewrite && isRewritable(card) && !card.isAiStale && (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => onAction(card, 'askAi')}
              >
                {busy ? t.rewriting || 'AI is rewriting…' : t.askAi || 'Ask AI to rewrite'}
              </Button>
            )}
            {!hasRewrite && !isRewritable(card) && (
              <Link
                href={`/${pageLang}/profile`}
                className={cn(
                  'rounded text-xs font-medium text-primary underline-offset-4 hover:underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                {t.goProfile || 'Fix in profile'}
              </Link>
            )}
          </>
        )}
      </div>

      {noticeText && (
        <p
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
          role="alert"
        >
          {noticeText}
        </p>
      )}
    </div>
  )
}

/** Cards anchored to a line the AI can rewrite: a bullet or the summary. */
function isRewritable(card: HealthSuggestionDTO): boolean {
  return card.targetKind === 'WORK_EXPERIENCE_BULLET' || card.targetKind === 'PROFILE_SUMMARY'
}

function noticeTextFor(notice: HealthCardNotice, t: Partial<HealthDictionary>): string {
  switch (notice) {
    case 'STALE':
      return t.staleNotice || 'This line changed. Regenerate the rewrite or dismiss the card.'
    case 'NO_PROPOSED_TEXT':
      return t.goProfile || 'Fix in profile'
    case 'RATE_LIMITED':
      return t.rateLimited || 'You reached the AI rewrite limit. Try again soon.'
    case 'NO_PROVIDER':
      return t.noProvider || 'No AI provider is configured.'
    case 'UNGROUNDED_REWRITE':
      return (
        t.ungroundedNotice ||
        'The rewrite introduced facts missing from your profile, so it was rejected.'
      )
    case 'AI_FAILED':
      return t.aiFailed || 'The AI rewrite failed. Your card and its advice are unchanged.'
    case 'UNAUTHORIZED':
    case 'NOT_FOUND':
    case 'CONFLICT':
      return t.conflictNotice || 'Another tab already changed this card. Refreshed for you.'
  }
}
