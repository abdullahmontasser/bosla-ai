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
    <Card className="border border-border/80 bg-card shadow-xs transition-colors print:border print:shadow-none break-inside-avoid">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="flex flex-col justify-between p-3 rounded-lg border border-border/60 bg-background/50 space-y-2.5 print:border"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
                    {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyQuestion(q.question, idx)}
                    className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground print:hidden"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={q.question}
                  onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  rows={3}
                  className="text-xs resize-none bg-transparent border-0 p-0 focus-visible:ring-0 leading-relaxed font-medium text-foreground"
                />
              </div>

              <div className="flex items-start gap-1.5 p-2 rounded bg-muted/40 text-[11px] text-muted-foreground">
                <HelpCircle className="size-3 shrink-0 text-primary mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground/80 me-1">
                    {isArabic ? 'الهدف الاستراتيجي:' : 'Strategic Goal:'}
                  </span>
                  <span>{q.strategicGoal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
