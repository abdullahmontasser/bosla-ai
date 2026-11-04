'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import type { HealthSuggestionDTO } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'
import { HealthSuggestionCard } from './HealthSuggestionCard'

export interface HealthCategorySectionProps {
  label: string
  cards: HealthSuggestionDTO[]
  dict: Dictionary
  openDefault?: boolean
  /** A quiet restore control for the most recently dismissed card. */
  restorable?: boolean
  onRestore?: () => void
  /** Renders the interactive card body; defaults to the static card. */
  renderCard?: (card: HealthSuggestionDTO) => ReactNode
}

export function HealthCategorySection({
  label,
  cards,
  dict,
  openDefault = false,
  restorable = false,
  onRestore,
  renderCard,
}: HealthCategorySectionProps) {
  if (cards.length === 0) return null

  return (
    <details
      className="group rounded-[8px] border border-border bg-card overflow-hidden transition-colors"
      open={openDefault}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 select-none hover:bg-accent/40 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <span className="rounded-[3px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {cards.length}
          </span>
          {label}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="divide-y divide-border/60 border-t border-border/60 px-4 pb-4 space-y-3">
        {cards.map((card) => (
          <div key={card.id} className="pt-3.5 first:pt-3.5">
            {renderCard ? renderCard(card) : <HealthSuggestionCard card={card} dict={dict} />}
          </div>
        ))}
        {restorable && onRestore && (
          <div className="flex justify-start pt-3">
            <button
              type="button"
              onClick={onRestore}
              className={cn(
                'cursor-pointer rounded-[4px] text-xs font-semibold text-primary underline-offset-4 transition-colors hover:underline',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              {(dict.health as { restore?: string } | undefined)?.restore || 'Restore'}
            </button>
          </div>
        )}
      </div>
    </details>
  )
}
