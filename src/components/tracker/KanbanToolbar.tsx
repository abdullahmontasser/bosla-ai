'use client'

import React from 'react'
import type { Dictionary } from '@/lib/i18n/types'
import { Button, Input } from '@/components/ui'
import { Search, Clock, Plus, Info, X } from 'lucide-react'

export interface KanbanToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  minAtsScore: number
  onMinAtsScoreChange: (score: number) => void
  followUpOnly: boolean
  onFollowUpOnlyToggle: () => void
  onAddApplication: () => void
  lang?: string
  dict: Dictionary
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function KanbanToolbar({
  searchQuery,
  onSearchChange,
  minAtsScore,
  onMinAtsScoreChange,
  followUpOnly,
  onFollowUpOnlyToggle,
  onAddApplication,
  dict,
  searchInputRef,
}: KanbanToolbarProps) {
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>
  const hasActiveFilters = searchQuery.trim().length > 0 || minAtsScore > 0 || followUpOnly

  const clearFilters = () => {
    onSearchChange('')
    onMinAtsScoreChange(0)
    if (followUpOnly) onFollowUpOnlyToggle()
  }

  return (
    <div className="space-y-3" data-testid="kanban-toolbar">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Live Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder || 'Search by company or role...'}
              className="ps-9 pe-14 h-9 text-xs"
              data-testid="search-input"
            />
            <div className="absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  aria-label={dict.common.close || 'Clear search'}
                >
                  <X className="size-3.5" />
                  <span className="sr-only">{dict.common.close || 'Clear search'}</span>
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex items-center justify-center rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/80 select-none pointer-events-none"
                  title="Press / to search"
                >
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* ATS Score Filter Buttons */}
          <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onMinAtsScoreChange(0)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                minAtsScore === 0
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.allScores || 'All ATS'}
            </button>
            <button
              type="button"
              onClick={() => onMinAtsScoreChange(70)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                minAtsScore === 70
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              70%+
            </button>
            <button
              type="button"
              onClick={() => onMinAtsScoreChange(85)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                minAtsScore === 85
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              85%+
            </button>
          </div>

          {/* Needs Follow-Up Toggle */}
          <Button
            type="button"
            variant={followUpOnly ? 'default' : 'outline'}
            size="sm"
            onClick={onFollowUpOnlyToggle}
            data-testid="follow-up-filter-btn"
            className={`h-9 text-xs gap-1.5 px-3 rounded-lg ${
              followUpOnly
                ? 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600'
                : 'text-muted-foreground hover:text-foreground border-border/80'
            }`}
          >
            <Clock className="size-3.5" />
            <span>{t.filterFollowUp || 'Needs Follow-up'}</span>
          </Button>

          {/* Clear Filters Button if any filter active */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5 me-1" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Primary Action: Add Application Button */}
        <div className="shrink-0">
          <Button
            type="button"
            onClick={onAddApplication}
            data-testid="add-application-btn"
            className="h-9 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="size-4" />
            <span>{t.addApplication || 'Add Application'}</span>
            <kbd className="hidden sm:inline-flex items-center justify-center rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[9px] font-mono text-primary-foreground ms-0.5 opacity-90 select-none">
              N
            </kbd>
          </Button>
        </div>
      </div>

      {/* Notice Banner when Drag-and-Drop is Paused due to Active Filters (AC-9) */}
      {hasActiveFilters && (
        <div
          data-testid="drag-disabled-banner"
          className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-700 dark:text-blue-300"
        >
          <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            {t.dragDisabledNotice ||
              'Drag and drop reordering is paused while filters or search are active.'}
          </span>
        </div>
      )}
    </div>
  )
}
