'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ApplicationStatus } from '@prisma/client'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { KanbanCard } from './KanbanCard'

export interface KanbanColumnProps {
  id: ApplicationStatus
  title: string
  cards: ApplicationWithRelations[]
  lang: string
  dict: Dictionary
  isDragDisabled?: boolean
  emptyMessage?: string
  onSelectCard: (card: ApplicationWithRelations) => void
  onStatusChange: (cardId: string, newStatus: ApplicationStatus) => void
}

const statusColorStyles: Record<ApplicationStatus, { dot: string; count: string; border: string }> =
  {
    SAVED: {
      dot: 'bg-slate-400 dark:bg-slate-500',
      count: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      border: 'hover:border-slate-300 dark:hover:border-slate-700',
    },
    APPLIED: {
      dot: 'bg-blue-500',
      count: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      border: 'hover:border-blue-300 dark:hover:border-blue-800',
    },
    INTERVIEWING: {
      dot: 'bg-amber-500',
      count: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      border: 'hover:border-amber-300 dark:hover:border-amber-800',
    },
    OFFER: {
      dot: 'bg-emerald-500',
      count: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-800',
    },
    REJECTED: {
      dot: 'bg-rose-500',
      count: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      border: 'hover:border-rose-300 dark:hover:border-rose-800',
    },
  }

export function KanbanColumn({
  id,
  title,
  cards,
  lang,
  dict,
  isDragDisabled = false,
  emptyMessage,
  onSelectCard,
  onStatusChange,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const colors = statusColorStyles[id] || statusColorStyles.SAVED
  const cardIds = cards.map((c) => c.id)

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${id}`}
      className={`flex flex-col rounded-xl border bg-muted/25 p-3 transition-colors min-w-0 w-full ${
        isOver ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'border-border/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 px-1 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`size-2 rounded-full shrink-0 ${colors.dot}`} />
          <h3 className="font-semibold text-[11px] text-foreground uppercase tracking-wider truncate">
            {title}
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 tabular-nums ${colors.count}`}
          data-testid={`column-count-${id}`}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards List / Droppable Area */}
      <div className="mt-3 flex-1 space-y-2.5 min-h-[220px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              lang={lang}
              dict={dict}
              isDragDisabled={isDragDisabled}
              onSelect={onSelectCard}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {/* Empty Drop Zone Placeholder */}
        {cards.length === 0 && (
          <div
            className={`flex h-36 flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center text-[11px] transition-colors ${
              isOver
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/40 bg-background/20 text-muted-foreground/80'
            }`}
          >
            <p className="max-w-[180px] leading-relaxed">
              {emptyMessage || 'Drop applications here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
