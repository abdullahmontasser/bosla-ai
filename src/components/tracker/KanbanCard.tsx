'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ApplicationStatus } from '@prisma/client'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { isFollowUpRequired, calculateDaysAgo } from '@/lib/kanban-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from '@/components/ui'
import {
  MoreVertical,
  Copy,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react'

export interface KanbanCardProps {
  card: ApplicationWithRelations
  lang: string
  dict: Dictionary
  isDragDisabled?: boolean
  onSelect: (card: ApplicationWithRelations) => void
  onStatusChange: (cardId: string, newStatus: ApplicationStatus) => void
}

export function KanbanCard({
  card,
  lang,
  dict,
  isDragDisabled = false,
  onSelect,
  onStatusChange,
}: KanbanCardProps) {
  const [copied, setCopied] = useState(false)
  const isRtl = lang === 'ar'
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isDragDisabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: 'pan-y',
  }

  // Extract connection note if available
  const outreachPayload = card.tailoredResume?.outreachMessage as
    | { connectionNoteText?: string; inMail?: { body?: string } }
    | null
    | undefined

  const outreachNote = outreachPayload?.connectionNoteText || outreachPayload?.inMail?.body || null

  const handleCopyOutreach = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!outreachNote) return
    try {
      await navigator.clipboard.writeText(outreachNote)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const followUpNeeded = isFollowUpRequired(card.status, card.appliedAt, card.interviewDate)
  const atsScore = card.tailoredResume?.atsScore
  const appliedDaysAgo =
    card.status === 'APPLIED' && card.appliedAt ? calculateDaysAgo(card.appliedAt) : null

  const stages: Array<{ key: ApplicationStatus; label: string }> = [
    { key: 'SAVED', label: t.saved || 'Saved' },
    { key: 'APPLIED', label: t.applied || 'Applied' },
    { key: 'INTERVIEWING', label: t.interviewing || 'Interviewing' },
    { key: 'OFFER', label: t.offer || 'Offer' },
    { key: 'REJECTED', label: t.rejected || 'Rejected' },
  ]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(card)}
      data-testid={`kanban-card-${card.id}`}
      className={`group relative rounded-lg border bg-card p-3 shadow-xs transition-all cursor-pointer select-none ${
        isDragging
          ? 'opacity-40 border-dashed border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border/80 hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      {/* Follow-up Staleness Warning Banner */}
      {followUpNeeded && (
        <div
          data-testid="follow-up-badge"
          className="mb-2.5 flex items-center gap-1.5 rounded-sm bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20"
        >
          <Clock className="size-3 shrink-0" />
          <span>
            {card.status === 'APPLIED'
              ? `${t.followUpBadge || 'Follow up'} (${appliedDaysAgo} ${t.daysAgo || 'days ago'})`
              : `${t.followUpBadge || 'Follow up'} (Interview passed)`}
          </span>
        </div>
      )}

      {/* Card Header: Job Title & Quick Menu */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h4
            className="font-semibold text-xs sm:text-[13px] text-foreground line-clamp-2 leading-snug tracking-tight"
            title={card.jobPosting.title}
          >
            {card.jobPosting.title}
          </h4>
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">
            {card.jobPosting.companyName}
          </p>
        </div>

        {/* Quick Stage Dropdown Menu */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                aria-label={t.changeStatus || 'Change status'}
                data-testid={`card-menu-trigger-${card.id}`}
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-40 text-xs">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.changeStatus || 'Move stage'}
              </div>
              {stages
                .filter((s) => s.key !== card.status)
                .map((stage) => (
                  <DropdownMenuItem
                    key={stage.key}
                    onClick={() => onStatusChange(card.id, stage.key)}
                    className="cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span>{stage.label}</span>
                    <ChevronRight className="size-3 text-muted-foreground/50 rtl:rotate-180" />
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Optional Metadata: Location, Salary, Interview Date */}
      {(card.location || card.compensation || card.interviewDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
          {card.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate max-w-[110px]">{card.location}</span>
            </span>
          )}
          {card.compensation && (
            <span className="flex items-center gap-1">
              <DollarSign className="size-3 shrink-0" />
              <span className="truncate max-w-[90px]">{card.compensation}</span>
            </span>
          )}
          {card.interviewDate && (
            <span className="flex items-center gap-1 font-medium text-primary">
              <Calendar className="size-3 shrink-0" />
              <span>
                {new Date(card.interviewDate).toLocaleDateString(
                  lang === 'ar' ? 'ar-EG' : 'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                  },
                )}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Card Footer: ATS Match Badge + Quick Outreach Copy */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
        {/* ATS Score Badge */}
        {atsScore != null ? (
          <Link
            href={`/${lang}/tailor?resumeId=${card.tailoredResumeId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            title="ATS Match Score"
            data-testid={`ats-score-badge-${card.id}`}
          >
            <span
              className={`size-1.5 rounded-full ${
                atsScore >= 80 ? 'bg-emerald-500' : atsScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
            <span>{Math.round(atsScore)}% ATS</span>
          </Link>
        ) : (
          <Link
            href={`/${lang}/tailor`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Sparkles className="size-3 text-muted-foreground" />
            <span>{t.atsNotCalculated || 'Tailor CV'}</span>
          </Link>
        )}

        {/* Quick Outreach Copy Button */}
        <div onClick={(e) => e.stopPropagation()}>
          {outreachNote ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyOutreach}
              data-testid={`copy-outreach-${card.id}`}
              className="h-6 px-2 text-[10px] gap-1 rounded-md border-border/80 text-foreground hover:bg-accent"
              title={outreachNote}
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.copied || 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3 text-muted-foreground" />
                  <span>{t.copyOutreach || 'Copy Note'}</span>
                </>
              )}
            </Button>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {t.noOutreach || 'No outreach note'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
