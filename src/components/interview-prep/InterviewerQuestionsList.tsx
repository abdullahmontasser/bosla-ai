'use client'

import * as React from 'react'
import type { QuestionsToAskInterviewer } from '@/lib/validations/career-prep'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check, HelpCircle, MessageSquareQuote } from 'lucide-react'

export interface InterviewerQuestionsListProps {
  questions: QuestionsToAskInterviewer[]
  onChange: (updatedQuestions: QuestionsToAskInterviewer[]) => void
  lang: 'en' | 'ar'
}

export function InterviewerQuestionsList({
  questions,
  onChange,
  lang,
}: InterviewerQuestionsListProps) {
  const isArabic = lang === 'ar'
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const handleCopyQuestion = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // Fallback
    }
  }

  const handleQuestionTextChange = (index: number, newText: string) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], question: newText }
    onChange(updated)
  }

  return (
    <Card className="border border-border/80 bg-card shadow-2xs transition-colors print:border print:shadow-none break-inside-avoid rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            {isArabic
              ? 'أسئلة استراتيجية تطرحها على المحاور'
              : 'Strategic Questions to Ask the Interviewer'}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="flex flex-col justify-between p-3.5 rounded-lg border border-border/70 bg-background/60 space-y-3 print:border"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center justify-center size-5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                    {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyQuestion(q.question, idx)}
                    className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground print:hidden rounded"
                    aria-label={isArabic ? 'نسخ السؤال' : 'Copy question'}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="size-3 text-primary" />
                        <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-muted-foreground" />
                        <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </Button>
                </div>

                <label htmlFor={`interviewer-question-${idx}`} className="sr-only">
                  {isArabic ? 'سؤال للمحاور' : 'Question for interviewer'}
                </label>
                <Textarea
                  id={`interviewer-question-${idx}`}
                  value={q.question}
                  onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                  aria-label={isArabic ? 'سؤال للمحاور' : 'Question for interviewer'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-card/60 hover:bg-card border border-transparent hover:border-border/60 focus:border-ring rounded-md p-2 focus-visible:ring-1 focus-visible:ring-ring leading-relaxed font-medium text-foreground transition-colors"
                />
              </div>

              <div className="flex items-start gap-1.5 p-2 rounded-md bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                <HelpCircle className="size-3.5 shrink-0 text-primary mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-foreground block text-[11px]">
                    {isArabic ? 'الهدف الاستراتيجي:' : 'Strategic Goal:'}
                  </span>
                  <label htmlFor={`strategic-goal-input-${idx}`} className="sr-only">
                    {isArabic ? 'الهدف الاستراتيجي' : 'Strategic goal'}
                  </label>
                  <Textarea
                    id={`strategic-goal-input-${idx}`}
                    value={q.strategicGoal}
                    onChange={(e) => {
                      const updated = [...questions]
                      updated[idx] = { ...updated[idx], strategicGoal: e.target.value }
                      onChange(updated)
                    }}
                    placeholder={
                      isArabic
                        ? 'ما هو الهدف الاستراتيجي من طرح هذا السؤال؟'
                        : 'What is the strategic goal of asking this question?'
                    }
                    aria-label={isArabic ? 'الهدف الاستراتيجي' : 'Strategic goal'}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    rows={2}
                    className="text-xs resize-none bg-transparent hover:bg-background/40 border border-transparent hover:border-border/60 focus:border-ring rounded p-1 focus-visible:ring-1 focus-visible:ring-ring leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors"
                    data-testid={`strategic-goal-input-${idx}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
