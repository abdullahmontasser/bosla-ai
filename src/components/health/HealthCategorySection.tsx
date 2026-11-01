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
      className="group rounded-xl border border-border/60 bg-muted/15 overflow-hidden"
      open={openDefault}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 select-none hover:bg-muted/30 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {cards.length}
          </span>
          {label}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="divide-y divide-border/40 border-t border-border/40 px-4 pb-4">
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
                'cursor-pointer rounded text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline',
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
