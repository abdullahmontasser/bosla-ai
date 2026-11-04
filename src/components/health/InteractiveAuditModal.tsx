'use client'

import * as React from 'react'
import { Sparkles, Check, RotateCw, X, Wand2, AlertCircle, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { HealthScoreGauge } from './HealthScoreGauge'
import { healthBand } from '@/lib/health/constants'
import type { HealthAuditView, HealthSuggestionDTO } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'
import {
  acceptHealthSuggestionAction,
  dismissHealthSuggestionAction,
  generateHealthRewriteAction,
  forceRecalculateHealthAction,
} from '@/app/actions/resume-health'
import {
  enhanceExperienceBulletAction,
  enhanceProfileSummaryAction,
} from '@/app/actions/profile-ai'

export interface InteractiveAuditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileId: string
  initialView: HealthAuditView | null
  lang: 'en' | 'ar'
  dict?: Partial<Dictionary>
}

const CATEGORY_TITLES_EN: Record<string, string> = {
  IMPACT_METRICS: 'Impact Metrics & Numbers',
  ACTION_VERBS: 'Action Verbs & Leadership',
  ATS_COMPLETENESS: 'ATS Completeness & Details',
  CONTENT_DEPTH: 'Content Depth & Polish',
}

const CATEGORY_TITLES_AR: Record<string, string> = {
  IMPACT_METRICS: 'قياس الأثر والأرقام',
  ACTION_VERBS: 'أفعال إنجاز قوية',
  ATS_COMPLETENESS: 'اكتمال بيانات الـ ATS',
  CONTENT_DEPTH: 'عمق وجودة المحتوى',
}

export function InteractiveAuditModal({
  open,
  onOpenChange,
  profileId,
  initialView,
  lang,
  dict,
}: InteractiveAuditModalProps) {
  const isAr = lang === 'ar'
  const [view, setView] = React.useState<HealthAuditView | null>(initialView)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [isFixingAll, setIsFixingAll] = React.useState(false)
  const [isRecalculating, setIsRecalculating] = React.useState(false)
  const [localProposals, setLocalProposals] = React.useState<Record<string, string>>({})

  const [prevInitialView, setPrevInitialView] = React.useState(initialView)
  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView)
    if (initialView) setView(initialView)
  }

  const pendingSuggestions = view?.suggestions.filter((s) => s.status === 'PENDING') || []

  const rewritableSuggestions = pendingSuggestions.filter((s) =>
    ['WORK_EXPERIENCE_BULLET', 'WORK_EXPERIENCE', 'PROFILE_SUMMARY'].includes(s.targetKind),
  )

  const syncProfile = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
    }
  }

  const handleApplySingle = async (suggestion: HealthSuggestionDTO) => {
    if (busyId) return
    setBusyId(suggestion.id)
    try {
      const proposal = suggestion.proposedText || localProposals[suggestion.id]

      if (suggestion.proposedText) {
        const res = await acceptHealthSuggestionAction(suggestion.id)
        if (res.ok) {
          setView(res.view)
          syncProfile()
          return
        }
      }

      // If action returned conflict or text was generated locally
      if (proposal) {
        if (suggestion.targetKind === 'WORK_EXPERIENCE_BULLET' && suggestion.targetId) {
          const profileRes = await fetch(`/api/profile?language=${view?.language || 'EN'}`, {
            cache: 'no-store',
          })
          if (profileRes.ok) {
            const data = await profileRes.json()
            const exp = (data.experiences || []).find(
              (e: { id: string }) => e.id === suggestion.targetId,
            )
            if (exp) {
              const bullets = [...exp.bullets]
              let targetIdx = suggestion.targetIndex ?? -1
              if (targetIdx < 0 || targetIdx >= bullets.length) {
                targetIdx = bullets.findIndex(
                  (b: string) => b.trim() === suggestion.originalText.trim(),
                )
              }
              if (targetIdx >= 0) {
                bullets[targetIdx] = proposal
                await fetch(`/api/profile/experiences/${suggestion.targetId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    companyName: exp.companyName,
                    jobTitle: exp.jobTitle,
                    location: exp.location,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    isCurrent: exp.isCurrent,
                    bullets,
                  }),
                })
              }
            }
          }
        } else if (suggestion.targetKind === 'PROFILE_SUMMARY') {
          await fetch('/api/profile/identity', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: proposal }),
          })
        }
        const nextView = await forceRecalculateHealthAction(profileId)
        if (nextView) setView(nextView)
        syncProfile()
      }
    } catch (err) {
      console.error('Failed to apply suggestion:', err)
    } finally {
      setBusyId(null)
    }
  }

  const handleDismissSingle = async (suggestion: HealthSuggestionDTO) => {
    if (busyId) return
    setBusyId(suggestion.id)
    try {
      const res = await dismissHealthSuggestionAction(suggestion.id)
      if (res.ok) {
        setView(res.view)
        syncProfile()
      }
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err)
    } finally {
      setBusyId(null)
    }
  }

  const handleRegenerateSingle = async (suggestion: HealthSuggestionDTO) => {
    if (busyId) return
    setBusyId(suggestion.id)
    try {
      const res = await generateHealthRewriteAction(suggestion.id)
      if (res.ok) {
        setView(res.view)
        return
      }

      // Fallback: smart deterministic generation
      if (suggestion.targetKind === 'WORK_EXPERIENCE_BULLET') {
        const enhanced = await enhanceExperienceBulletAction({
          currentBullet: suggestion.originalText,
          language: isAr ? 'AR' : 'EN',
        })
        if (enhanced.success && enhanced.enhancedBullet) {
          setLocalProposals((prev) => ({ ...prev, [suggestion.id]: enhanced.enhancedBullet! }))
        }
      } else if (suggestion.targetKind === 'PROFILE_SUMMARY') {
        const enhanced = await enhanceProfileSummaryAction({
          currentSummary: suggestion.originalText,
          language: isAr ? 'AR' : 'EN',
        })
        if (enhanced.success && enhanced.enhancedSummary) {
          setLocalProposals((prev) => ({ ...prev, [suggestion.id]: enhanced.enhancedSummary! }))
        }
      }
    } catch (err) {
      console.error('Failed to generate suggestion rewrite:', err)
    } finally {
      setBusyId(null)
    }
  }

  const handleFixAll = async () => {
    if (isFixingAll || rewritableSuggestions.length === 0) return
    setIsFixingAll(true)
    try {
      for (const item of rewritableSuggestions) {
        let proposal = item.proposedText || localProposals[item.id]
        if (!proposal) {
          if (item.targetKind === 'WORK_EXPERIENCE_BULLET') {
            const enh = await enhanceExperienceBulletAction({
              currentBullet: item.originalText,
              language: isAr ? 'AR' : 'EN',
            })
            if (enh.success && enh.enhancedBullet) {
              proposal = enh.enhancedBullet
            }
          } else if (item.targetKind === 'PROFILE_SUMMARY') {
            const enh = await enhanceProfileSummaryAction({
              currentSummary: item.originalText,
              language: isAr ? 'AR' : 'EN',
            })
            if (enh.success && enh.enhancedSummary) {
              proposal = enh.enhancedSummary
            }
          }
        }

        if (proposal) {
          await handleApplySingle({ ...item, proposedText: proposal })
        }
      }

      const nextView = await forceRecalculateHealthAction(profileId)
      if (nextView) setView(nextView)
      syncProfile()
    } catch (err) {
      console.error('Failed to auto fix all:', err)
    } finally {
      setIsFixingAll(false)
    }
  }

  const handleRecalculate = async () => {
    if (isRecalculating) return
    setIsRecalculating(true)
    try {
      const nextView = await forceRecalculateHealthAction(profileId)
      if (nextView) setView(nextView)
      syncProfile()
    } catch (err) {
      console.error('Failed to recalculate audit:', err)
    } finally {
      setIsRecalculating(false)
    }
  }

  const score = view?.overallScore ?? 0
  const band = healthBand(score)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-xl">
        {/* Header Bar with Overall Score Gauge */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/80 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 scale-90 sm:scale-100 origin-start">
                <HealthScoreGauge
                  score={score}
                  breakdown={view?.breakdown}
                  lang={lang}
                  dict={dict || {}}
                />
              </div>
              <div>
                <DialogTitle className="text-base font-bold font-serif">
                  {isAr ? 'فحص ومعالجة الـ ATS الذكية' : 'Smart ATS Check & Fix'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {isAr
                    ? 'فحص شامل وإصلاح فوري بالذكاء الاصطناعي دون مغادرة ملفك الشخصي.'
                    : 'Analyze and fix ATS recommendations instantly without leaving your profile.'}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="h-8 px-2.5 text-xs gap-1.5 rounded-[6px]"
                title={isAr ? 'إعادة الفحص والتقييم' : 'Recalculate score'}
              >
                <RotateCw
                  className={cn('h-3.5 w-3.5', isRecalculating && 'animate-spin text-primary')}
                />
                <span className="hidden sm:inline">{isAr ? 'إعادة الفحص' : 'Recalculate'}</span>
              </Button>
            </div>
          </div>

          {/* Action Bar with Fix All */}
          {rewritableSuggestions.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {isAr
                  ? `يوجد ${rewritableSuggestions.length} تحسينات جاهزة للإصلاح بالذكاء الاصطناعي:`
                  : `${rewritableSuggestions.length} items ready for AI enhancement:`}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleFixAll}
                disabled={isFixingAll}
                className="h-7.5 px-3 text-xs gap-1.5 rounded-[6px] font-semibold bg-primary text-primary-foreground shadow-xs"
              >
                {isFixingAll ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span>
                  {isFixingAll
                    ? isAr
                      ? 'جارٍ تطبيق الكل...'
                      : 'Fixing all with AI...'
                    : isAr
                      ? `إصلاح وتطبيق الكل (${rewritableSuggestions.length})`
                      : `Fix All with AI (${rewritableSuggestions.length})`}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* Scrollable Issues List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-border/40">
          {pendingSuggestions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {isAr ? 'سيرتك الذاتية ممتازة ومتوافقة بالكامل!' : 'No open ATS issues found!'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAr
                  ? 'جميع الأقسام والإنجازات مصاغة بأفعال قوية ومقاسة بالأرقام.'
                  : 'All sections and achievements meet high ATS standards with strong metrics.'}
              </p>
            </div>
          ) : (
            pendingSuggestions.map((card) => {
              const isBusy = busyId === card.id
              const activeProposal = card.proposedText || localProposals[card.id]
              const hasProposed = Boolean(activeProposal && activeProposal.trim().length > 0)
              const catLabel = isAr
                ? CATEGORY_TITLES_AR[card.category] || card.category
                : CATEGORY_TITLES_EN[card.category] || card.category

              return (
                <div key={card.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-[13px]">{card.title}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-medium">
                          {catLabel}
                        </Badge>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                        {card.rationale}
                      </p>

                      {hasProposed && activeProposal && (
                        <div className="mt-2 rounded-md border border-primary/20 bg-primary/[0.02] p-2.5 text-[11px] space-y-1">
                          {card.originalText && (
                            <div className="text-muted-foreground line-through text-[10px] font-mono opacity-80">
                              {card.originalText}
                            </div>
                          )}
                          <div className="text-foreground font-medium flex items-start gap-1.5 pt-0.5">
                            <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <span>{activeProposal}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      {hasProposed ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleApplySingle(card)}
                            className="h-7 px-2.5 text-xs gap-1 rounded-[5px] font-medium"
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
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRegenerateSingle(card)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title={isAr ? 'إعادة صياغة بالذكاء الاصطناعي' : 'Regenerate'}
                          >
                            <RotateCw className={cn('h-3 w-3', isBusy && 'animate-spin')} />
                          </Button>
                        </>
                      ) : ['WORK_EXPERIENCE_BULLET', 'WORK_EXPERIENCE', 'PROFILE_SUMMARY'].includes(
                          card.targetKind,
                        ) ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleRegenerateSingle(card)}
                          className="h-7 px-2.5 text-xs gap-1.5 rounded-[5px] bg-primary/90 text-primary-foreground font-medium"
                        >
                          {isBusy ? (
                            <RotateCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span>{isAr ? 'توليد بالذكاء' : 'Generate with AI'}</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenChange(false)}
                          className="h-7 px-2.5 text-xs rounded-[5px]"
                        >
                          <span>{isAr ? 'إضافة البيانات' : 'Add Info'}</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleDismissSingle(card)}
                        className="h-7 w-7 p-0 rounded-[5px] text-muted-foreground hover:text-destructive"
                        title={isAr ? 'تجاهل' : 'Dismiss'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
