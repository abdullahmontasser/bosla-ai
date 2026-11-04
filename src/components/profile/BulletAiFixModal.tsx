'use client'

import React, { useState } from 'react'
import { Sparkles, Check, RotateCw, X, Sliders, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { HealthSuggestionDTO } from '@/lib/health/queries'
import { enhanceExperienceBulletAction } from '@/app/actions/profile-ai'

export interface BulletAiFixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: string
  bulletText: string
  suggestion?: HealthSuggestionDTO | null
  onApplyFix: (newText: string, suggestionId?: string) => Promise<void>
  onRegenerateAi?: (suggestionId: string) => Promise<void>
  onOpenXyzBuilder?: () => void
}

export function BulletAiFixModal({
  open,
  onOpenChange,
  lang,
  bulletText,
  suggestion,
  onApplyFix,
  onRegenerateAi,
  onOpenXyzBuilder,
}: BulletAiFixModalProps) {
  const isAr = lang === 'ar'
  const [isApplying, setIsApplying] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [directProposedText, setDirectProposedText] = useState('')
  const hasAutoTriggeredRef = React.useRef(false)

  const activeProposal = suggestion?.proposedText || directProposedText

  const triggerGeneration = React.useCallback(async () => {
    if (isRegenerating) return
    setIsRegenerating(true)
    try {
      if (suggestion?.id && onRegenerateAi) {
        await onRegenerateAi(suggestion.id)
      } else {
        const res = await enhanceExperienceBulletAction({
          currentBullet: bulletText,
          language: isAr ? 'AR' : 'EN',
        })
        if (res.success && res.enhancedBullet) {
          setDirectProposedText(res.enhancedBullet)
        }
      }
    } catch (err) {
      console.error('Failed to generate rewrite:', err)
    } finally {
      setIsRegenerating(false)
    }
  }, [bulletText, isAr, isRegenerating, onRegenerateAi, suggestion])

  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setDirectProposedText('')
    }
  }

  React.useEffect(() => {
    if (!open) hasAutoTriggeredRef.current = false
  }, [open])

  React.useEffect(() => {
    if (open && !activeProposal && !hasAutoTriggeredRef.current) {
      hasAutoTriggeredRef.current = true
      void triggerGeneration()
    }
  }, [open, activeProposal, triggerGeneration])

  const handleApply = async () => {
    if (!activeProposal || isApplying) return
    setIsApplying(true)
    try {
      await onApplyFix(activeProposal, suggestion?.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to apply fix from modal:', err)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRegenerate = async () => {
    await triggerGeneration()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:rounded-xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-base font-bold font-serif">
              {isAr ? 'تحسين صياغة الإنجاز بالذكاء الاصطناعي' : 'Enhance Achievement with AI'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'صياغة مدعومة بمعيار Google XYZ وأفعال إنجاز قوية لرفع تقييم السيرة في أنظمة الفرز (ATS).'
              : 'Enhanced with strong action verbs and quantifiable results to maximize ATS impact.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Current Bullet Box */}
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <span>{isAr ? 'النص الحالي' : 'Current Bullet'}</span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                {isAr ? 'بدون أرقام' : 'Needs metric'}
              </span>
            </span>
            <p className="text-foreground/80 leading-relaxed font-sans">{bulletText}</p>
          </div>

          {/* AI Proposal Box or Loading State */}
          {isRegenerating ? (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-5 text-center space-y-2.5 animate-pulse">
              <RotateCw className="h-6 w-6 text-primary animate-spin mx-auto" />
              <span className="text-xs font-semibold text-foreground block">
                {isAr
                  ? 'جارٍ صياغة وتوليد الإنجاز بالذكاء الاصطناعي...'
                  : 'Generating ATS-optimized rewrite with AI...'}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {isAr
                  ? 'تطبيق معايير صيغة Google XYZ وأفعال الإنجاز القوية'
                  : 'Applying Google XYZ formula and commanding action verbs'}
              </span>
            </div>
          ) : activeProposal ? (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>{isAr ? 'الصياغة المقترحة بالذكاء الاصطناعي' : 'AI Suggested Rewrite'}</span>
              </span>
              <p className="text-foreground font-medium leading-relaxed">{activeProposal}</p>

              {suggestion?.rationale && (
                <p className="text-[11px] text-muted-foreground/90 border-t border-border/40 pt-1.5 mt-1 leading-normal italic">
                  💡 {suggestion.rationale}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center bg-card/50 space-y-2">
              <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-[11px]">
                {isAr
                  ? 'انقر لتوليد صياغة ذكية محسنة لهذا الإنجاز.'
                  : 'Click below to generate an enhanced rewrite for this achievement.'}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-1.5 rounded-[6px] h-8 text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAr ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}</span>
              </Button>
            </div>
          )}

          {/* Alternative: Google XYZ Builder */}
          {onOpenXyzBuilder && (
            <div className="rounded-lg border border-border/60 bg-muted/15 p-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-foreground block">
                  {isAr
                    ? 'هل تريد تحديد أرقامك الحقيقية بدقة؟'
                    : 'Prefer to specify exact numbers yourself?'}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {isAr
                    ? 'استخدم منشئ صيغة Google XYZ لإدخال الإنجاز والنسبة وطريقة العمل.'
                    : 'Use the Google XYZ Builder to input your exact metrics.'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onOpenXyzBuilder()
                }}
                className="h-7 text-xs gap-1 rounded-[5px] shrink-0 border-border hover:bg-accent"
              >
                <Sliders className="h-3 w-3 text-primary" />
                <span>{isAr ? 'منشئ XYZ' : 'XYZ Builder'}</span>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-1.5 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs rounded-[6px]"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>

          {activeProposal && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating || isApplying}
                className="h-8 text-xs gap-1 rounded-[6px]"
                title={isAr ? 'توليد بديل آخر بالذكاء الاصطناعي' : 'Regenerate alternative with AI'}
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isAr ? 'إعادة صياغة' : 'Regenerate'}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={isApplying || isRegenerating}
                className="h-8 text-xs gap-1.5 rounded-[6px] font-semibold shadow-xs"
              >
                {isApplying ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>
                  {isApplying
                    ? isAr
                      ? 'جارٍ التطبيق...'
                      : 'Applying...'
                    : isAr
                      ? 'تطبيق التعديل'
                      : 'Apply Fix'}
                </span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
