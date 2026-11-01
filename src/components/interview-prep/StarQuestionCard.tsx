'use client'

import * as React from 'react'
import type { InterviewQuestion } from '@/lib/validations/career-prep'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, RotateCw, HelpCircle, Layers, AlertCircle, Trash2 } from 'lucide-react'

export interface StarQuestionCardProps {
  question: InterviewQuestion
  index: number
  onChange: (updatedQuestion: InterviewQuestion) => void
  onRegenerate: () => Promise<void>
  onDelete?: () => void
  isRegenerating?: boolean
  lang: 'en' | 'ar'
}

export function StarQuestionCard({
  question,
  index,
  onChange,
  onRegenerate,
  onDelete,
  isRegenerating = false,
  lang,
}: StarQuestionCardProps) {
  const isArabic = lang === 'ar'
  const [copied, setCopied] = React.useState(false)

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
    { en: string; ar: string; color: string }
  > = {
    BEHAVIORAL: {
      en: 'Behavioral Question',
      ar: 'سؤال سلوكي',
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    },
    TECHNICAL: {
      en: 'Technical Question',
      ar: 'سؤال تقني',
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    },
    SITUATIONAL: {
      en: 'Situational Question',
      ar: 'سؤال موقفي',
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    },
    CUSTOM: {
      en: 'Custom Question',
      ar: 'سؤال مخصص',
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    },
  }

  const activeCategory = categoryLabels[question.category] || categoryLabels.CUSTOM

  return (
    <Card className="border border-border/80 bg-card shadow-xs transition-colors print:border print:shadow-none break-inside-avoid">
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
              {index + 1}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold uppercase tracking-wider py-0.5 ${activeCategory.color}`}
            >
              {isArabic ? activeCategory.ar : activeCategory.en}
            </Badge>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyStar}
              className="h-7 text-xs gap-1.5 px-2.5 text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>{isArabic ? 'نسخ إجابة STAR' : 'Copy STAR Answer'}</span>
                </>
              )}
            </Button>

            {question.customOrigin ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 text-xs gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                title={isArabic ? 'حذف السؤال المخصص' : 'Delete custom question'}
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
                className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                data-testid={`regenerate-question-${question.id}`}
              >
                <RotateCw className={`size-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isArabic ? 'إعادة التوليد' : 'Regenerate'}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Question Title / Input */}
        <div className="space-y-1">
          <Textarea
            value={question.question}
            onChange={(e) => onChange({ ...question, question: e.target.value })}
            placeholder={isArabic ? 'اكتب نص السؤال هنا...' : 'Type question text here...'}
            dir={isArabic ? 'rtl' : 'ltr'}
            rows={2}
            className="text-sm font-semibold tracking-tight resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-snug text-foreground placeholder:text-muted-foreground/60"
            data-testid={`question-input-${question.id}`}
          />
        </div>

        {/* Why Asked Intent Box */}
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/40 border border-border/40 text-xs text-muted-foreground">
          <HelpCircle className="size-3.5 shrink-0 text-primary mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-semibold text-foreground/90 block">
              {isArabic ? 'هدف المقابِل (Why Asked):' : 'Interviewer Intent:'}
            </span>
            <Textarea
              value={question.whyAsked}
              onChange={(e) => onChange({ ...question, whyAsked: e.target.value })}
              placeholder={
                isArabic
                  ? 'ما الغرض من طرح هذا السؤال؟ (اختياري للأسئلة المخصصة)'
                  : 'Why is this asked? (optional intent note for custom questions)'
              }
              dir={isArabic ? 'rtl' : 'ltr'}
              rows={2}
              className="text-xs resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-foreground placeholder:text-muted-foreground/60"
              data-testid={`why-asked-input-${question.id}`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* STAR Framework Response Grid */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Layers className="size-3.5 text-primary" />
            <span>{isArabic ? 'الإجابة وفق إطار STAR' : 'STAR Model Response'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Situation */}
            <div className="space-y-1 p-2.5 rounded-md border border-border/50 bg-background/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {isArabic ? 'الموقف (Situation)' : 'Situation'}
              </span>
              <Textarea
                value={question.starResponse.situation}
                onChange={(e) =>
                  onChange({
                    ...question,
                    starResponse: { ...question.starResponse, situation: e.target.value },
                  })
                }
                dir={isArabic ? 'rtl' : 'ltr'}
                rows={3}
                className="text-xs resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-foreground"
              />
            </div>

            {/* Task */}
            <div className="space-y-1 p-2.5 rounded-md border border-border/50 bg-background/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {isArabic ? 'المهمة (Task)' : 'Task'}
              </span>
              <Textarea
                value={question.starResponse.task}
                onChange={(e) =>
                  onChange({
                    ...question,
                    starResponse: { ...question.starResponse, task: e.target.value },
                  })
                }
                dir={isArabic ? 'rtl' : 'ltr'}
                rows={3}
                className="text-xs resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-foreground"
              />
            </div>

            {/* Action */}
            <div className="space-y-1 p-2.5 rounded-md border border-border/50 bg-background/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {isArabic ? 'الإجراء (Action)' : 'Action'}
              </span>
              <Textarea
                value={question.starResponse.action}
                onChange={(e) =>
                  onChange({
                    ...question,
                    starResponse: { ...question.starResponse, action: e.target.value },
                  })
                }
                dir={isArabic ? 'rtl' : 'ltr'}
                rows={3}
                className="text-xs resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-foreground"
              />
            </div>

            {/* Result */}
            <div className="space-y-1 p-2.5 rounded-md border border-border/50 bg-background/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {isArabic ? 'النتيجة (Result)' : 'Result'}
              </span>
              <Textarea
                value={question.starResponse.result}
                onChange={(e) =>
                  onChange({
                    ...question,
                    starResponse: { ...question.starResponse, result: e.target.value },
                  })
                }
                dir={isArabic ? 'rtl' : 'ltr'}
                rows={3}
                className="text-xs resize-none bg-transparent border-0 p-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 leading-relaxed text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Missing Metric Placeholders / Guidance */}
        {question.missingMetricFlags && question.missingMetricFlags.length > 0 && (
          <div className="flex items-start gap-2 p-2 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold block">
                {isArabic
                  ? 'عناصر أرقام ينبغي استبدالها ببياناتك الحقيقية:'
                  : 'Missing metrics to supply with your authentic data:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {question.missingMetricFlags.map((flag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] bg-background/80 font-mono text-amber-700 dark:text-amber-300"
                  >
                    <span dangerouslySetInnerHTML={{ __html: flag }} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Card Footer: Sources Citation */}
      {question.referencedSources && question.referencedSources.length > 0 && (
        <CardFooter className="pt-2 pb-3 border-t border-border/40 text-xs flex items-center justify-between text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-foreground/80">
              {isArabic ? 'مستند إلى خبرات:' : 'Grounded in:'}
            </span>
            {question.referencedSources.map((source, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                {source}
              </Badge>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
