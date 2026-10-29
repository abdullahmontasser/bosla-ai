'use client'

import React, { useState, useTransition, useOptimistic, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import type { ApplicationStatus } from '@prisma/client'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { calculateSortOrder, isFollowUpRequired } from '@/lib/kanban-utils'
import {
  updateApplicationStatusAndOrder,
  createApplication,
  updateApplicationDetails,
  deleteApplication,
} from '@/app/actions/application-actions'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { KanbanToolbar } from './KanbanToolbar'
import { QuickAddApplicationModal } from './QuickAddApplicationModal'
import { ApplicationDetailsDrawer } from './ApplicationDetailsDrawer'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AlertCircle } from 'lucide-react'

export interface KanbanContainerProps {
  initialApplications: ApplicationWithRelations[]
  lang: string
  dict: Dictionary
}

type OptimisticAction =
  | {
      type: 'MOVE'
      cardId: string
      targetStatus: ApplicationStatus
      newSortOrder: number
      appliedAt?: Date | null
    }
  | {
      type: 'ADD'
      card: ApplicationWithRelations
    }
  | {
      type: 'UPDATE'
      card: ApplicationWithRelations
    }
  | {
      type: 'DELETE'
      cardId: string
    }

const COLUMN_ORDER: ApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED']

export function KanbanContainer({ initialApplications = [], lang, dict }: KanbanContainerProps) {
  const isRtl = lang === 'ar'
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>

  // Master server synchronized cards state
  const [cards, setCards] = useState<ApplicationWithRelations[]>(initialApplications || [])
  const [, startTransition] = useTransition()

  // Optimistic Cards State with React 19 useOptimistic (AC-4)
  const [optimisticCards, dispatchOptimistic] = useOptimistic(
    cards,
    (currentCards, action: OptimisticAction) => {
      switch (action.type) {
        case 'MOVE':
          return currentCards.map((card) => {
            if (card.id !== action.cardId) return card
            return {
              ...card,
              status: action.targetStatus,
              sortOrder: action.newSortOrder,
              appliedAt:
                action.targetStatus === 'APPLIED' && !card.appliedAt
                  ? action.appliedAt || new Date()
                  : card.appliedAt,
            }
          })
        case 'ADD':
          return [...currentCards, action.card]
        case 'UPDATE':
          return currentCards.map((card) => (card.id === action.card.id ? action.card : card))
        case 'DELETE':
          return currentCards.filter((card) => card.id !== action.cardId)
        default:
          return currentCards
      }
    },
  )

  // Dragging active card state for DragOverlay
  const [activeCard, setActiveCard] = useState<ApplicationWithRelations | null>(null)

  // Error toast/notification state
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Toolbar search and filters state (AC-9)
  const [searchQuery, setSearchQuery] = useState('')
  const [minAtsScore, setMinAtsScore] = useState(0)
  const [followUpOnly, setFollowUpOnly] = useState(false)

  // Drawer and Modal UI state
  const [selectedCard, setSelectedCard] = useState<ApplicationWithRelations | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  const isFilterActive = searchQuery.trim().length > 0 || minAtsScore > 0 || followUpOnly

  // Sensor configuration: 8px pointer activation constraint (AC-2) + RTL coordinate inversion
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  // TouchSensor with delay constraint so touch scrolling works smoothly on mobile
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })

  // RTL Coordinate Inversion for Arabic progression (AC-2)
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: (event, args) => {
      if (isRtl && (event.code === 'ArrowRight' || event.code === 'ArrowLeft')) {
        const syntheticEvent = {
          ...event,
          code: event.code === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight',
          key: event.key === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight',
          preventDefault: () => event.preventDefault(),
        } as unknown as KeyboardEvent
        return sortableKeyboardCoordinates(syntheticEvent, args)
      }
      return sortableKeyboardCoordinates(event, args)
    },
  })

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  const columnTitles: Record<ApplicationStatus, string> = {
    SAVED: t.saved || 'Saved',
    APPLIED: t.applied || 'Applied',
    INTERVIEWING: t.interviewing || 'Interviewing',
    OFFER: t.offer || 'Offer',
    REJECTED: t.rejected || 'Rejected',
  }

  const columnEmptyMessages: Record<ApplicationStatus, string> = {
    SAVED: t.emptySaved || 'No saved applications yet.',
    APPLIED: t.emptyApplied || 'No active applications submitted yet.',
    INTERVIEWING: t.emptyInterviewing || 'No interviews scheduled.',
    OFFER: t.emptyOffer || 'No offers received yet.',
    REJECTED: t.emptyRejected || 'No rejected applications.',
  }

  // Filter cards based on toolbar inputs
  const filteredCards = optimisticCards.filter((card) => {
    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = card.jobPosting.title.toLowerCase().includes(q)
      const companyMatch = card.jobPosting.companyName.toLowerCase().includes(q)
      if (!titleMatch && !companyMatch) return false
    }

    // Min ATS match score
    if (minAtsScore > 0) {
      const score = card.tailoredResume?.atsScore || 0
      if (score < minAtsScore) return false
    }

    // Follow up filter
    if (followUpOnly) {
      const needed = isFollowUpRequired(card.status, card.appliedAt, card.interviewDate)
      if (!needed) return false
    }

    return true
  })

  // Group filtered cards by column and sort by sortOrder
  const groupedCards: Record<ApplicationStatus, ApplicationWithRelations[]> = {
    SAVED: [],
    APPLIED: [],
    INTERVIEWING: [],
    OFFER: [],
    REJECTED: [],
  }

  for (const card of filteredCards) {
    if (groupedCards[card.status]) {
      groupedCards[card.status].push(card)
    }
  }

  // Ensure deterministic sortOrder inside each column
  for (const col of COLUMN_ORDER) {
    groupedCards[col].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  // Find column from id (either column ID itself or an item ID inside a column)
  const findColumnOf = useCallback(
    (id: string): ApplicationStatus | null => {
      if (COLUMN_ORDER.includes(id as ApplicationStatus)) {
        return id as ApplicationStatus
      }
      const item = optimisticCards.find((c) => c.id === id)
      return item ? item.status : null
    },
    [optimisticCards],
  )

  // Drag Event Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const card = optimisticCards.find((c) => c.id === event.active.id)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceColumn = findColumnOf(activeId)
    const targetColumn = findColumnOf(overId)

    if (!sourceColumn || !targetColumn) return

    const targetCards = [...groupedCards[targetColumn]]
    const activeCardItem = optimisticCards.find((c) => c.id === activeId)
    if (!activeCardItem) return

    // Calculate new position inside target column
    let newSortOrder: number
    const overIndex = targetCards.findIndex((c) => c.id === overId)

    if (overIndex === -1) {
      // Dropped onto empty column or column container itself
      if (targetCards.length === 0) {
        newSortOrder = calculateSortOrder(null, null)
      } else {
        // Append to bottom
        const lastCard = targetCards[targetCards.length - 1]
        newSortOrder = calculateSortOrder(lastCard.sortOrder, null)
      }
    } else {
      // Dropped over an existing card
      const targetCard = targetCards[overIndex]
      if (targetCard.id === activeId && sourceColumn === targetColumn) {
        // No movement
        return
      }

      // Determine whether dropping above or below target card
      const prevCard = targetCards[overIndex - 1]

      if (overIndex === 0) {
        newSortOrder = calculateSortOrder(null, targetCard.sortOrder)
      } else if (overIndex === targetCards.length - 1) {
        newSortOrder = calculateSortOrder(targetCard.sortOrder, null)
      } else {
        newSortOrder = calculateSortOrder(prevCard?.sortOrder, targetCard.sortOrder)
      }
    }

    // Capture previous state for rollback
    const previousCards = [...cards]
    const updatedAppliedAt =
      targetColumn === 'APPLIED' && !activeCardItem.appliedAt
        ? new Date()
        : activeCardItem.appliedAt

    // Apply instantaneous optimistic update (AC-4)
    startTransition(async () => {
      dispatchOptimistic({
        type: 'MOVE',
        cardId: activeId,
        targetStatus: targetColumn,
        newSortOrder,
        appliedAt: updatedAppliedAt,
      })

      try {
        const result = await updateApplicationStatusAndOrder(activeId, targetColumn, newSortOrder)

        if (!result.success || !result.application) {
          throw new Error(result.error || 'Server rejected card update')
        }

        // Commit real server state
        setCards((prev) => prev.map((c) => (c.id === activeId ? result.application! : c)))
      } catch (err) {
        // Rollback smoothly (AC-4)
        setCards(previousCards)
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to update application position. Changes reverted.',
        )
        setTimeout(() => setErrorMessage(null), 5000)
      }
    })
  }

  // Quick Status Change from card dropdown or drawer
  const handleStatusChange = async (cardId: string, newStatus: ApplicationStatus) => {
    const card = optimisticCards.find((c) => c.id === cardId)
    if (!card || card.status === newStatus) return

    const targetCards = groupedCards[newStatus] || []
    const lastCard = targetCards[targetCards.length - 1]
    const newSortOrder = calculateSortOrder(lastCard?.sortOrder || null, null)

    const previousCards = [...cards]
    const updatedAppliedAt =
      newStatus === 'APPLIED' && !card.appliedAt ? new Date() : card.appliedAt

    startTransition(async () => {
      dispatchOptimistic({
        type: 'MOVE',
        cardId,
        targetStatus: newStatus,
        newSortOrder,
        appliedAt: updatedAppliedAt,
      })

      try {
        const result = await updateApplicationStatusAndOrder(cardId, newStatus, newSortOrder)
        if (!result.success || !result.application) {
          throw new Error(result.error || 'Failed to update status')
        }
        setCards((prev) => prev.map((c) => (c.id === cardId ? result.application! : c)))
      } catch (err) {
        setCards(previousCards)
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to update status. Changes reverted.',
        )
        setTimeout(() => setErrorMessage(null), 5000)
      }
    })
  }

  // Quick Add Application
  const handleQuickAdd = async (data: {
    title: string
    companyName: string
    jobUrl?: string
    status: ApplicationStatus
  }) => {
    const result = await createApplication(data)
    if (!result.success || !result.application) {
      throw new Error(result.error || 'Failed to create application')
    }

    startTransition(() => {
      dispatchOptimistic({
        type: 'ADD',
        card: result.application!,
      })
      setCards((prev) => [...prev, result.application!])
    })
  }

  // Update Application Details from Drawer
  const handleUpdateDetails = async (payload: {
    applicationId: string
    title?: string
    companyName?: string
    jobUrl?: string | null
    compensation?: string | null
    location?: string | null
    interviewDate?: string | null
    contactName?: string | null
    contactEmail?: string | null
    notes?: string | null
  }) => {
    const result = await updateApplicationDetails(payload)
    if (!result.success || !result.application) {
      throw new Error(result.error || 'Failed to update application details')
    }

    startTransition(() => {
      dispatchOptimistic({
        type: 'UPDATE',
        card: result.application!,
      })
      setCards((prev) =>
        prev.map((c) => (c.id === payload.applicationId ? result.application! : c)),
      )
      setSelectedCard(result.application!)
    })
  }

  // Delete Application
  const handleDeleteApplication = async (cardId: string) => {
    const result = await deleteApplication(cardId)
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete application')
    }

    startTransition(() => {
      dispatchOptimistic({
        type: 'DELETE',
        cardId,
      })
      setCards((prev) => prev.filter((c) => c.id !== cardId))
      setSelectedCard(null)
      setIsDrawerOpen(false)
    })
  }

  // Screen Reader Accessibility Announcements (AC-2)
  const accessibilityAnnouncements = {
    onDragStart({ active }: DragStartEvent) {
      const card = optimisticCards.find((c) => c.id === active.id)
      return isRtl
        ? `تم التقاط البطاقة ${card?.jobPosting.title || ''}. استخدم مفاتيح الأسهم لتغيير الموضع، ومفتاح المسافة للإفلات.`
        : `Picked up card ${card?.jobPosting.title || ''}. Use arrow keys to move, spacebar to drop.`
    },
    onDragOver({ over }: DragOverEvent) {
      if (!over) return ''
      const col = findColumnOf(over.id as string)
      const colTitle = col ? columnTitles[col] : ''
      return isRtl ? `البطاقة فوق عمود ${colTitle}` : `Card is over column ${colTitle}`
    },
    onDragEnd({ over }: DragEndEvent) {
      if (!over) return isRtl ? 'تم إلغاء السحب.' : 'Drag cancelled.'
      const col = findColumnOf(over.id as string)
      const colTitle = col ? columnTitles[col] : ''
      return isRtl ? `تم إفلات البطاقة في عمود ${colTitle}` : `Card dropped into column ${colTitle}`
    },
    onDragCancel() {
      return isRtl ? 'تم إلغاء السحب.' : 'Drag cancelled.'
    },
  }

  return (
    <div className="space-y-6" data-testid="kanban-tracker-container">
      {/* Error Toast Notification Banner (AC-4) */}
      {errorMessage && (
        <div
          role="alert"
          data-testid="rollback-error-banner"
          className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive hover:opacity-75 font-semibold text-xs ms-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar: Search, Filters, Add Button (AC-9) */}
      <KanbanToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minAtsScore={minAtsScore}
        onMinAtsScoreChange={setMinAtsScore}
        followUpOnly={followUpOnly}
        onFollowUpOnlyToggle={() => setFollowUpOnly(!followUpOnly)}
        onAddApplication={() => setIsQuickAddOpen(true)}
        lang={lang}
        dict={dict}
      />

      {/* Kanban Multi-Column Board (AC-1, AC-2) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: accessibilityAnnouncements,
        }}
      >
        <div
          className="flex items-start gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin"
          data-testid="kanban-columns-wrapper"
        >
          {COLUMN_ORDER.map((columnId) => (
            <KanbanColumn
              key={columnId}
              id={columnId}
              title={columnTitles[columnId]}
              cards={groupedCards[columnId]}
              lang={lang}
              dict={dict}
              isDragDisabled={isFilterActive}
              emptyMessage={columnEmptyMessages[columnId]}
              onSelectCard={(card) => {
                setSelectedCard(card)
                setIsDrawerOpen(true)
              }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {/* DragOverlay for Smooth Drag Preview Without DOM Reorder (AC-2) */}
        <DragOverlay>
          {activeCard ? (
            <div className="w-[300px] rotate-2 scale-105 shadow-2xl ring-2 ring-primary">
              <KanbanCard
                card={activeCard}
                lang={lang}
                dict={dict}
                isDragDisabled
                onSelect={() => {}}
                onStatusChange={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Slide-Over Details Drawer (AC-7) */}
      <ApplicationDetailsDrawer
        card={selectedCard}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedCard(null)
        }}
        onUpdateDetails={handleUpdateDetails}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteApplication}
        lang={lang}
        dict={dict}
      />

      {/* Quick Add Application Modal (AC-10) */}
      <QuickAddApplicationModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickAdd}
        lang={lang}
        dict={dict}
      />
    </div>
  )
}
