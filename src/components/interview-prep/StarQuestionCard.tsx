'use client'

import * as React from 'react'
import type { InterviewQuestion } from '@/lib/validations/career-prep'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Copy,
  Check,
  RotateCw,
  HelpCircle,
  Layers,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react'

export interface StarQuestionCardProps {
  question: InterviewQuestion
  index: number
  onChange: (updatedQuestion: InterviewQuestion) => void
  onRegenerate: () => Promise<void>
  onDelete?: () => void
  onRestorePrevious?: () => void
  hasPreviousDraft?: boolean
  isRegenerating?: boolean
  isInitiallyExpanded?: boolean
  lang: 'en' | 'ar'
}

export function StarQuestionCard({
  question,
  index,
  onChange,
  onRegenerate,
  onDelete,
  onRestorePrevious,
  hasPreviousDraft = false,
  isRegenerating = false,
  isInitiallyExpanded = true,
  lang,
}: StarQuestionCardProps) {
  const isArabic = lang === 'ar'
  const [copied, setCopied] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(isInitiallyExpanded)

  const handleCopyStar = async () => {
    try {
      const fullStar = `${question.question}\n\n${
        isArabic ? 'الموقف (Situation)' : 'Situation'
      }: ${question.starResponse.situation}\n${
        isArabic ? 'المهمة (Task)' : 'Task'
      }: ${question.starResponse.task}\n${
        isArabic ? 'الإجراء (Action)' : 'Action'
      }: ${question.starResponse.action}\n${
        isArabic ? 'النتيجة (Result)' : 'Result'
      }: ${question.starResponse.result}`

      await navigator.clipboard.writeText(fullStar)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const categoryLabels: Record<
    InterviewQuestion['category'],
    { en: string; ar: string; badgeVariant: 'default' | 'secondary' | 'outline' }
  > = {
    BEHAVIORAL: {
      en: 'Behavioral Question',
      ar: 'سؤال سلوكي',
      badgeVariant: 'secondary',
    },
    TECHNICAL: {
      en: 'Technical Question',
      ar: 'سؤال تقني',
      badgeVariant: 'secondary',
    },
    SITUATIONAL: {
      en: 'Situational Question',
      ar: 'سؤال موقفي',
      badgeVariant: 'outline',
    },
    CUSTOM: {
      en: 'Custom Question',
      ar: 'سؤال مخصص',
      badgeVariant: 'outline',
    },
  }

  const activeCategory = categoryLabels[question.category] || categoryLabels.CUSTOM

  // Helper to safely strip HTML/scripts from flags
  const sanitizeMetricFlag = (flag: string) => {
    return flag.replace(/<[^>]*>?/gm, '').trim()
  }

  // Handle inserting an authentic metric placeholder into Result
  const handleInsertMetric = (flagText: string) => {
    const clean = sanitizeMetricFlag(flagText)
    const currentResult = question.starResponse.result
    const updatedResult = currentResult ? `${currentResult} (${clean})` : clean
    onChange({
      ...question,
      starResponse: {
        ...question.starResponse,
        result: updatedResult,
      },
    })
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xs transition-all print:border print:shadow-none break-inside-avoid"
      data-testid={`star-question-card-${question.id}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold tracking-wider text-primary">
            {`Q${index + 1}`}
          </span>
          <Badge
            variant={activeCategory.badgeVariant}
            className="text-xs font-medium px-2 py-0.5 rounded-md"
          >
            {isArabic ? activeCategory.ar : activeCategory.en}
          </Badge>

          {/* Quick status indicator when collapsed */}
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate max-w-xs font-medium hidden sm:inline">
              {question.question || (isArabic ? 'بدون نص' : 'Untitled')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 print:hidden">
          {/* Restore Previous Draft if available */}
          {hasPreviousDraft && onRestorePrevious && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRestorePrevious}
              className="h-7 text-xs gap-1 px-2 text-primary border-primary/30 hover:bg-primary/10 rounded-md"
              title={isArabic ? 'استعادة المسودة السابقة' : 'Restore previous draft'}
              data-testid={`restore-draft-${question.id}`}
            >
              <History className="size-3" />
              <span className="hidden sm:inline">
                {isArabic ? 'استعادة المسودة' : 'Undo Regen'}
              </span>
            </Button>
          )}

          {/* Copy STAR Answer */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyStar}
            className="h-7 text-xs gap-1.5 px-2.5 text-foreground rounded-md"
            aria-label={isArabic ? 'نسخ إجابة STAR' : 'Copy STAR Answer'}
          >
            {copied ? (
              <>
                <Check className="size-3 text-primary" />
                <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="size-3 text-muted-foreground" />
                <span>{isArabic ? 'نسخ إجابة STAR' : 'Copy STAR Answer'}</span>
              </>
            )}
          </Button>

          {/* Custom vs AI Actions */}
          {question.customOrigin ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 text-xs gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md"
              title={isArabic ? 'حذف السؤال المخصص' : 'Delete custom question'}
              aria-label={isArabic ? 'حذف السؤال' : 'Delete question'}
              data-testid={`delete-custom-question-${question.id}`}
            >
              <Trash2 className="size-3" />
              <span className="hidden sm:inline">{isArabic ? 'حذف' : 'Delete'}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground rounded-md"
              title={isArabic ? 'إعادة التوليد بالذكاء الاصطناعي' : 'Regenerate with AI'}
              aria-label={isArabic ? 'إعادة التوليد' : 'Regenerate question'}
              data-testid={`regenerate-question-${question.id}`}
            >
              <RotateCw className={`size-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isArabic ? 'إعادة التوليد' : 'Regenerate'}</span>
            </Button>
          )}

          {/* Expand / Collapse toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 size-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? 'Collapse question' : 'Expand question'}
          >
            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Question Title / Input (Always visible) */}
      <div className="space-y-1">
        <label htmlFor={`question-input-${question.id}`} className="sr-only">
          {isArabic ? 'نص السؤال' : 'Question text'}
        </label>
        <Textarea
          id={`question-input-${question.id}`}
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          placeholder={isArabic ? 'اكتب نص السؤال هنا...' : 'Type question text here...'}
          aria-label={isArabic ? 'نص السؤال' : 'Question prompt'}
          dir={isArabic ? 'rtl' : 'ltr'}
          rows={isExpanded ? 2 : 1}
          className="text-sm font-semibold tracking-tight resize-none bg-background/50 hover:bg-background border border-border/40 hover:border-border focus:border-ring rounded-md p-2.5 focus-visible:ring-1 focus-visible:ring-ring transition-colors leading-snug text-foreground placeholder:text-muted-foreground/60"
          data-testid={`question-input-${question.id}`}
        />
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          {/* Why Asked Intent Box */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/70 text-xs text-muted-foreground">
            <HelpCircle className="size-3.5 shrink-0 text-primary mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-semibold text-foreground/90 block">
                {isArabic ? 'هدف المقابِل (Why Asked):' : 'Interviewer Intent (Why asked):'}
              </span>
              <label htmlFor={`why-asked-input-${question.id}`} className="sr-only">
                {isArabic ? 'هدف المقابِل' : 'Interviewer intent'}
              </label>
              <Textarea
                id={`why-asked-input-${question.id}`}
                value={question.whyAsked}
                onChange={(e) => onChange({ ...question, whyAsked: e.target.value })}
                placeholder={
                  isArabic
                    ? 'ما الغرض من طرح هذا السؤال؟ (اختياري للأسئلة المخصصة)'
                    : 'Why is this asked? (optional intent note for custom questions)'
                }
                aria-label={isArabic ? 'هدف المقابِل' : 'Interviewer intent'}
                dir={isArabic ? 'rtl' : 'ltr'}
                rows={2}
                className="text-xs resize-none bg-transparent hover:bg-background/40 border border-transparent hover:border-border/60 focus:border-ring rounded p-1.5 focus-visible:ring-1 focus-visible:ring-ring leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors"
                data-testid={`why-asked-input-${question.id}`}
              />
            </div>
          </div>

          {/* STAR Framework 2x2 Hairline Grid */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Layers className="size-3.5 text-primary" />
              <span>{isArabic ? 'الإجابة وفق إطار STAR' : 'STAR Model Response'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
              {/* Situation */}
              <div className="p-3 bg-card space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">
                    S
                  </span>
                  <label
                    htmlFor={`star-situation-${question.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-primary"
                  >
                    {isArabic ? 'الموقف (Situation)' : 'Situation'}
                  </label>
                </div>
                <Textarea
                  id={`star-situation-${question.id}`}
                  value={question.starResponse.situation}
                  onChange={(e) =>
                    onChange({
                      ...question,
                      starResponse: { ...question.starResponse, situation: e.target.value },
                    })
                  }
                  aria-label={isArabic ? 'الموقف (Situation)' : 'Situation'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-background/40 hover:bg-background border border-transparent hover:border-border/60 focus:border-ring focus:bg-background rounded-md p-2 focus-visible:ring-1 focus-visible:ring-ring transition-colors leading-relaxed text-foreground"
                />
              </div>

              {/* Task */}
              <div className="p-3 bg-card space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">
                    T
                  </span>
                  <label
                    htmlFor={`star-task-${question.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-primary"
                  >
                    {isArabic ? 'المهمة (Task)' : 'Task'}
                  </label>
                </div>
                <Textarea
                  id={`star-task-${question.id}`}
                  value={question.starResponse.task}
                  onChange={(e) =>
                    onChange({
                      ...question,
                      starResponse: { ...question.starResponse, task: e.target.value },
                    })
                  }
                  aria-label={isArabic ? 'المهمة (Task)' : 'Task'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-background/40 hover:bg-background border border-transparent hover:border-border/60 focus:border-ring focus:bg-background rounded-md p-2 focus-visible:ring-1 focus-visible:ring-ring transition-colors leading-relaxed text-foreground"
                />
              </div>

              {/* Action */}
              <div className="p-3 bg-card space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">
                    A
                  </span>
                  <label
                    htmlFor={`star-action-${question.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-primary"
                  >
                    {isArabic ? 'الإجراء (Action)' : 'Action'}
                  </label>
                </div>
                <Textarea
                  id={`star-action-${question.id}`}
                  value={question.starResponse.action}
                  onChange={(e) =>
                    onChange({
                      ...question,
                      starResponse: { ...question.starResponse, action: e.target.value },
                    })
                  }
                  aria-label={isArabic ? 'الإجراء (Action)' : 'Action'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-background/40 hover:bg-background border border-transparent hover:border-border/60 focus:border-ring focus:bg-background rounded-md p-2 focus-visible:ring-1 focus-visible:ring-ring transition-colors leading-relaxed text-foreground"
                />
              </div>

              {/* Result */}
              <div className="p-3 bg-card space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">
                    R
                  </span>
                  <label
                    htmlFor={`star-result-${question.id}`}
                    className="text-xs font-bold uppercase tracking-wider text-primary"
                  >
                    {isArabic ? 'النتيجة (Result)' : 'Result'}
                  </label>
                </div>
                <Textarea
                  id={`star-result-${question.id}`}
                  value={question.starResponse.result}
                  onChange={(e) =>
                    onChange({
                      ...question,
                      starResponse: { ...question.starResponse, result: e.target.value },
                    })
                  }
                  aria-label={isArabic ? 'النتيجة (Result)' : 'Result'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-background/40 hover:bg-background border border-transparent hover:border-border/60 focus:border-ring focus:bg-background rounded-md p-2 focus-visible:ring-1 focus-visible:ring-ring transition-colors leading-relaxed text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Missing Metric Guidance (Supportive Prompts) */}
          {question.missingMetricFlags && question.missingMetricFlags.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/80 bg-accent/30 text-xs text-foreground">
              <Sparkles className="size-4 shrink-0 mt-0.5 text-primary" />
              <div className="space-y-1.5 flex-1">
                <span className="font-semibold block text-foreground">
                  {isArabic
                    ? 'اقتراحات تعزيز الأرقام والنتائج القابلة للقياس:'
                    : 'Quantified Metric Opportunities (click to insert into Result):'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {question.missingMetricFlags.map((flag, i) => {
                    const cleanFlag = sanitizeMetricFlag(flag)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInsertMetric(cleanFlag)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-medium border border-border bg-background hover:bg-accent hover:border-primary/50 text-foreground transition-colors cursor-pointer"
                        title={
                          isArabic
                            ? 'انقر للإضافة إلى النتيجة'
                            : 'Click to add placeholder to Result'
                        }
                      >
                        <span>+</span>
                        <span>{cleanFlag}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Sources Citation */}
          {question.referencedSources && question.referencedSources.length > 0 && (
            <div className="pt-2 border-t border-border/60 text-xs flex items-center justify-between text-muted-foreground flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground/80">
                  {isArabic ? 'مستند إلى خبرات:' : 'Grounded in:'}
                </span>
                {question.referencedSources.map((source, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="rounded-md text-[11px] font-normal px-2 py-0 border-border"
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
