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

const stageIndexMap: Record<ApplicationStatus, string> = {
  SAVED: '01',
  APPLIED: '02',
  INTERVIEWING: '03',
  OFFER: '04',
  REJECTED: '05',
}

const statusColorStyles: Record<ApplicationStatus, { dot: string; count: string; border: string }> =
  {
    SAVED: {
      dot: 'bg-muted-foreground/70',
      count: 'border-border/80 bg-muted/30 text-muted-foreground',
      border: 'hover:border-border',
    },
    APPLIED: {
      dot: 'bg-primary/80',
      count: 'border-primary/20 bg-primary/10 text-primary',
      border: 'hover:border-primary/40',
    },
    INTERVIEWING: {
      dot: 'bg-amber-500',
      count: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      border: 'hover:border-amber-500/40',
    },
    OFFER: {
      dot: 'bg-emerald-600 dark:bg-emerald-400',
      count: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      border: 'hover:border-emerald-500/40',
    },
    REJECTED: {
      dot: 'bg-muted-foreground/50',
      count: 'border-border bg-muted/40 text-muted-foreground',
      border: 'hover:border-border',
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
      className={`flex flex-col p-3 sm:p-3.5 transition-colors w-[280px] sm:w-[310px] shrink-0 snap-start lg:w-full lg:shrink min-h-[480px] ${
        isOver ? 'bg-primary/5' : 'bg-transparent'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 px-1 border-b border-border/70">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-bold text-primary">{stageIndexMap[id]}</span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider truncate">
            {title}
          </h3>
        </div>
        <span
          className={`rounded-[4px] border px-1.5 py-0.5 text-xs font-mono font-bold shrink-0 tabular-nums ${colors.count}`}
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
            className={`flex h-36 flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs transition-colors ${
              isOver
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 bg-muted/10 text-muted-foreground'
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
