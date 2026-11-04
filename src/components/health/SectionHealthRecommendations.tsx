'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Check,
  RotateCw,
  X,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HealthSuggestionDTO } from '@/lib/health/queries'

export interface SectionHealthRecommendationsProps {
  sectionTitle: string
  suggestions: HealthSuggestionDTO[]
  lang: string
  defaultExpanded?: boolean
  onAccept: (suggestion: HealthSuggestionDTO) => Promise<void>
  onDismiss: (suggestion: HealthSuggestionDTO) => Promise<void>
  onRegenerate: (suggestion: HealthSuggestionDTO) => Promise<void>
  onFixAll?: (suggestions: HealthSuggestionDTO[]) => Promise<void>
  onAddDetails?: (suggestion: HealthSuggestionDTO) => void
}

const CATEGORY_TAGS_EN: Record<string, string> = {
  IMPACT_METRICS: 'Impact Metrics',
  ACTION_VERBS: 'Action Verbs',
  ATS_COMPLETENESS: 'Missing Info',
  CONTENT_DEPTH: 'Content Depth',
}

const CATEGORY_TAGS_AR: Record<string, string> = {
  IMPACT_METRICS: 'قياس الأثر والأرقام',
  ACTION_VERBS: 'أفعال إنجاز قوية',
  ATS_COMPLETENESS: 'بيانات ناقصة',
  CONTENT_DEPTH: 'عمق وجودة المحتوى',
}

/**
 * Determines whether an issue represents un-generatable personal contact details
 * or structural data (such as missing phone number, location, email, skills count,
 * or education entries). For these items, manual entry is required rather than AI fabrication.
 */
function isMissingDataSuggestion(s: HealthSuggestionDTO): boolean {
  return (
    s.targetKind === 'PROFILE_CONTACT' ||
    s.targetKind === 'PROFILE_SKILLS' ||
    s.targetKind === 'PROFILE_EDUCATION' ||
    s.targetKind === 'PROFILE_GENERAL'
  )
}

export function SectionHealthRecommendations({
  sectionTitle,
  suggestions,
  lang,
  defaultExpanded = false,
  onAccept,
  onDismiss,
  onRegenerate,
  onFixAll,
  onAddDetails,
}: SectionHealthRecommendationsProps) {
  const isAr = lang === 'ar'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null)
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set())
  const [isFixingAll, setIsFixingAll] = useState(false)

  // Filter out any that were accepted in current session animation
  const activeSuggestions = suggestions.filter((s) => !acceptedIds.has(s.id))
  if (activeSuggestions.length === 0) return null

  // Fixable count includes only content rewrites that have valid proposedText
  const fixableCount = activeSuggestions.filter(
    (s) =>
      !isMissingDataSuggestion(s) &&
      s.proposedText &&
      s.proposedText.trim().length > 0 &&
      !s.isAiStale,
  ).length

  const handleSingleAccept = async (suggestion: HealthSuggestionDTO) => {
    if (busySuggestionId) return
    setBusySuggestionId(suggestion.id)
    try {
      await onAccept(suggestion)
      setAcceptedIds((prev) => new Set([...prev, suggestion.id]))
    } catch (err) {
      console.error('Failed to accept suggestion:', err)
    } finally {
      setBusySuggestionId(null)
    }
  }

  const handleSingleDismiss = async (suggestion: HealthSuggestionDTO) => {
    if (busySuggestionId) return
    setBusySuggestionId(suggestion.id)
    try {
      await onDismiss(suggestion)
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err)
    } finally {
      setBusySuggestionId(null)
    }
  }

  const handleSingleRegenerate = async (suggestion: HealthSuggestionDTO) => {
    if (busySuggestionId) return
    setBusySuggestionId(suggestion.id)
    try {
      await onRegenerate(suggestion)
    } catch (err) {
      console.error('Failed to regenerate suggestion:', err)
    } finally {
      setBusySuggestionId(null)
    }
  }

  const handleFixAllClick = async () => {
    if (!onFixAll || isFixingAll) return
    setIsFixingAll(true)
    try {
      const rewritable = activeSuggestions.filter(
        (s) => !isMissingDataSuggestion(s) && s.proposedText && !s.isAiStale,
      )
      await onFixAll(rewritable)
      setAcceptedIds((prev) => {
        const next = new Set(prev)
        for (const s of rewritable) next.add(s.id)
        return next
      })
    } catch (err) {
      console.error('Failed to fix all suggestions:', err)
    } finally {
      setIsFixingAll(false)
    }
  }

  const handleAddDataAction = (card: HealthSuggestionDTO) => {
    if (onAddDetails) {
      onAddDetails(card)
      return
    }

    const fieldId = card.targetField ? `identity-field-${card.targetField}` : null
    const targetInput = fieldId ? document.getElementById(fieldId) : null
    if (targetInput) {
      targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
      targetInput.focus()
      targetInput.classList.add('ring-2', 'ring-primary')
      setTimeout(() => targetInput.classList.remove('ring-2', 'ring-primary'), 2000)
      return
    }

    if (card.targetKind === 'PROFILE_SKILLS') {
      const skillsEl = document.getElementById('section-skills')
      if (skillsEl) {
        skillsEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = skillsEl.querySelector<HTMLElement>('input, button')
        input?.focus()
        return
      }
    }

    if (card.targetKind === 'PROFILE_EDUCATION') {
      const eduEl = document.getElementById('section-education')
      if (eduEl) {
        eduEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const btn = eduEl.querySelector<HTMLElement>('button')
        btn?.focus()
        return
      }
    }

    if (card.targetKind === 'WORK_EXPERIENCE' || card.targetKind === 'WORK_EXPERIENCE_BULLET') {
      const expEl = document.getElementById('section-experience')
      if (expEl) {
        expEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const btn = expEl.querySelector<HTMLElement>('button')
        btn?.focus()
        return
      }
    }

    const identityEl = document.getElementById('section-identity')
    if (identityEl) {
      identityEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const firstInput = identityEl.querySelector<HTMLElement>('input, textarea')
      if (firstInput) {
        firstInput.focus()
      }
    }
  }

  // 1. COLLAPSED VIEW: Minimal, small indicator pill
  if (!isExpanded) {
    return (
      <div
        data-testid="section-health-recommendations-indicator"
        className="px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/[0.08] hover:border-primary/40 transition-all duration-200 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label={
            isAr
              ? `عرض توصيات الذكاء الاصطناعي (${activeSuggestions.length})`
              : `View AI suggestions (${activeSuggestions.length})`
          }
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-2.5 w-2.5 animate-pulse" />
          </span>
          <span className="font-semibold text-primary text-[11px]">
            {isAr
              ? `${activeSuggestions.length} ${activeSuggestions.length === 1 ? 'توصية تحسين' : 'توصيات تحسين'}`
              : `${activeSuggestions.length} AI ${activeSuggestions.length === 1 ? 'Suggestion' : 'Suggestions'}`}
          </span>
          <span className="text-muted-foreground/60 text-[11px] hidden sm:inline">
            · {isAr ? 'انقر للمراجعة' : 'Click to review & fix'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-y-0.5 rtl:group-hover:-translate-x-0.5" />
        </button>
      </div>
    )
  }

  // 2. EXPANDED VIEW: Clear, non-cluttered drawer with contextual actions
  return (
    <div
      data-testid="section-health-recommendations"
      className="mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-b from-primary/[0.04] via-card to-card p-3.5 sm:p-4 shadow-xs transition-all duration-300 animate-in fade-in-50 slide-in-from-top-2 motion-reduce:animate-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-xs">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {isAr
                  ? `توصيات الذكاء الاصطناعي لقسم: ${sectionTitle}`
                  : `AI Recommendations for ${sectionTitle}`}
              </span>
              <Badge
                variant="outline"
                className="text-xs font-mono border-primary/40 text-primary bg-primary/10"
              >
                {activeSuggestions.length} {isAr ? 'ملاحظات' : 'items'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr
                ? 'إصلاح هذه الملاحظات يرفع درجة توافق سيرتك الذاتية مع الـ ATS مباشرة.'
                : 'Resolving these items directly improves your ATS score and keyword resonance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {fixableCount > 0 && onFixAll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFixingAll}
              onClick={handleFixAllClick}
              className="h-7 px-2.5 text-xs gap-1.5 rounded-[6px] border-primary/30 text-primary hover:bg-primary/15 transition-all shadow-xs"
              title={
                isAr
                  ? 'تطبيق كافة التعديلات المقترحة فوراً'
                  : 'Apply all suggested improvements at once'
              }
            >
              {isFixingAll ? (
                <RotateCw className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <Wand2 className="h-3 w-3 text-primary" />
              )}
              <span>
                {isFixingAll
                  ? isAr
                    ? 'جارٍ الإصلاح...'
                    : 'Fixing all...'
                  : isAr
                    ? `إصلاح الكل (${fixableCount})`
                    : `Fix All (${fixableCount})`}
              </span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-7 px-2 text-xs gap-1 rounded-[6px] text-muted-foreground hover:text-foreground"
            aria-label={isAr ? 'إخفاء التوصيات' : 'Hide suggestions'}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden sm:inline">{isAr ? 'إخفاء' : 'Hide'}</span>
          </Button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="mt-3.5 space-y-3 pt-3 border-t border-border/50 animate-in fade-in-50 duration-200">
        {activeSuggestions.map((card) => {
          const isBusy = busySuggestionId === card.id
          const isMissing = isMissingDataSuggestion(card)
          const hasProposed = Boolean(
            !isMissing &&
            card.proposedText &&
            card.proposedText.trim().length > 0 &&
            !card.isAiStale,
          )
          const catLabel = isAr
            ? CATEGORY_TAGS_AR[card.category] || card.category
            : CATEGORY_TAGS_EN[card.category] || card.category

          return (
            <div
              key={card.id}
              className={cn(
                'rounded-lg border p-3 text-xs transition-all duration-300 relative',
                isMissing
                  ? 'border-amber-500/20 bg-amber-500/[0.02]'
                  : hasProposed
                    ? 'border-primary/20 bg-card hover:border-primary/40'
                    : 'border-border bg-card/60',
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-[12px]">{card.title}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[9px] font-semibold',
                        isMissing
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-border bg-muted/50 text-muted-foreground',
                      )}
                    >
                      {catLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {card.rationale}
                  </p>

                  {/* Proposed Fix vs Original Preview (shown ONLY for improvable content, not missing data) */}
                  {!isMissing && hasProposed && card.proposedText && (
                    <div className="mt-2 space-y-1.5 rounded-[6px] border border-border/60 bg-muted/20 p-2.5 text-[11px]">
                      {card.originalText && (
                        <div className="text-muted-foreground/80 line-through text-[10px] pb-1 border-b border-border/40 font-mono">
                          {card.originalText}
                        </div>
                      )}
                      <div className="text-foreground font-medium flex items-start gap-1.5 pt-0.5">
                        <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{card.proposedText}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions for this specific recommendation */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                  {/* CASE 1: MISSING USER DATA -> Provide "Add Details", NEVER AI regenerate! */}
                  {isMissing ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddDataAction(card)}
                      className="h-7 px-2.5 text-xs gap-1 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
                      title={
                        isAr ? 'الانتقال لإضافة البيانات المفقودة' : 'Add missing details in form'
                      }
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>{isAr ? 'إضافة البيانات' : 'Add Details'}</span>
                    </Button>
                  ) : (
                    /* CASE 2: REWRITABLE CONTENT -> Provide "Apply Fix" and "Regenerate with AI", or "Generate with AI" if not yet proposed */
                    <>
                      {hasProposed ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleSingleAccept(card)}
                            className="h-7 px-2.5 text-xs gap-1 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
                            title={isAr ? 'تطبيق هذا التعديل المقترح' : 'Apply this proposed fix'}
                          >
                            {isBusy ? (
                              <RotateCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>{isAr ? 'تطبيق' : 'Apply'}</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleSingleRegenerate(card)}
                            className="h-7 px-2 text-xs gap-1 rounded-[5px] text-muted-foreground hover:text-foreground hover:border-primary/40"
                            title={
                              isAr
                                ? 'إعادة صياغة الاقتراح بالذكاء الاصطناعي'
                                : 'Regenerate alternative with AI'
                            }
                          >
                            <RotateCw
                              className={cn('h-3 w-3', isBusy && 'animate-spin text-primary')}
                            />
                            <span className="hidden sm:inline">
                              {isAr ? 'إعادة توليد' : 'Regenerate'}
                            </span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleSingleRegenerate(card)}
                          className="h-7 px-2.5 text-xs gap-1.5 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
                          title={
                            isAr
                              ? 'توليد صياغة مقترحة بالذكاء الاصطناعي'
                              : 'Generate proposed fix with AI'
                          }
                        >
                          {isBusy ? (
                            <RotateCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span>{isAr ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}</span>
                        </Button>
                      )}
                    </>
                  )}

                  {/* Discard option is always available */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleSingleDismiss(card)}
                    className="h-7 px-2 text-xs gap-1 rounded-[5px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title={isAr ? 'تجاهل هذه التوصية' : 'Discard this recommendation'}
                  >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">{isAr ? 'تجاهل' : 'Discard'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
