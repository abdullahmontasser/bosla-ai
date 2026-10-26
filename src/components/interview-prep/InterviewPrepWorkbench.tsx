'use client'

import * as React from 'react'
import type {
  InterviewPrepPayload,
  InterviewQuestion,
  QuestionsToAskInterviewer,
} from '@/lib/validations/career-prep'
import {
  generateInterviewPrepAction,
  saveInterviewPrepAction,
  regenerateInterviewQuestionAction,
} from '@/app/actions/interview-prep-actions'
import { StarQuestionCard } from './StarQuestionCard'
import { InterviewerQuestionsList } from './InterviewerQuestionsList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Printer, AlertCircle, CheckCircle2, BookOpenCheck, Info } from 'lucide-react'

export interface InterviewPrepWorkbenchProps {
  tailoredResumeId: string
  initialInterviewPrep?: InterviewPrepPayload | null
  hasRecordedExperiences?: boolean
  lang: 'en' | 'ar'
  onPayloadChange?: (payload: InterviewPrepPayload) => void
}

export function InterviewPrepWorkbench({
  tailoredResumeId,
  initialInterviewPrep = null,
  hasRecordedExperiences = true,
  lang,
  onPayloadChange,
}: InterviewPrepWorkbenchProps) {
  const isArabic = lang === 'ar'
  const [payload, setPayload] = React.useState<InterviewPrepPayload | null>(initialInterviewPrep)
  const [isGeneratingAll, setIsGeneratingAll] = React.useState(false)
  const [regeneratingQuestionId, setRegeneratingQuestionId] = React.useState<string | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Ref for debounced autosave
  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestPayloadRef = React.useRef<InterviewPrepPayload | null>(payload)

  React.useEffect(() => {
    latestPayloadRef.current = payload
  }, [payload])

  // Flush any pending debounced autosave
  const flushPendingAutosave = React.useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
      if (latestPayloadRef.current && tailoredResumeId) {
        setSaveStatus('saving')
        try {
          const res = await saveInterviewPrepAction(tailoredResumeId, latestPayloadRef.current)
          if (res.success && res.data) {
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else {
            setSaveStatus('error')
          }
        } catch {
          setSaveStatus('error')
        }
      }
    }
  }, [tailoredResumeId])

  // Trigger 1000ms debounced autosave
  const triggerDebouncedAutosave = React.useCallback(
    (newPayload: InterviewPrepPayload) => {
      setPayload(newPayload)
      latestPayloadRef.current = newPayload
      onPayloadChange?.(newPayload)

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }

      setSaveStatus('saving')
      autosaveTimerRef.current = setTimeout(async () => {
        autosaveTimerRef.current = null
        try {
          const res = await saveInterviewPrepAction(tailoredResumeId, newPayload)
          if (res.success && res.data) {
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else {
            setSaveStatus('error')
            if (res.error) setErrorMessage(res.error)
          }
        } catch {
          setSaveStatus('error')
          setErrorMessage(
            isArabic
              ? 'حدث خطأ أثناء حفظ خطة المقابلة تلقائياً.'
              : 'Failed to autosave interview prep.',
          )
        }
      }, 1000)
    },
    [tailoredResumeId, isArabic, onPayloadChange],
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  // Handle Full Generation
  const handleGenerateAll = async () => {
    await flushPendingAutosave()
    setIsGeneratingAll(true)
    setErrorMessage(null)

    try {
      const res = await generateInterviewPrepAction(tailoredResumeId, {
        language: isArabic ? 'AR' : 'EN',
      })

      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
        onPayloadChange?.(res.data)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر توليد ورقة التحضير للمقابلة. يرجى التحقق من إعدادات مزود الذكاء الاصطناعي.'
          : 'Failed to generate interview prep. Please check your AI provider configuration.',
      )
    } finally {
      setIsGeneratingAll(false)
    }
  }

  // Handle Single Question Regeneration
  const handleRegenerateQuestion = async (questionId: string) => {
    await flushPendingAutosave()
    setRegeneratingQuestionId(questionId)
    setErrorMessage(null)

    try {
      const res = await regenerateInterviewQuestionAction(tailoredResumeId, questionId, {
        language: isArabic ? 'AR' : 'EN',
      })

      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
        onPayloadChange?.(res.data)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر إعادة توليد السؤال المحدد.'
          : 'Failed to regenerate selected interview question.',
      )
    } finally {
      setRegeneratingQuestionId(null)
    }
  }

  const handleQuestionChange = (index: number, updatedQuestion: InterviewQuestion) => {
    if (!payload) return
    const updatedQuestions = [...payload.questions]
    updatedQuestions[index] = updatedQuestion
    triggerDebouncedAutosave({ ...payload, questions: updatedQuestions })
  }

  const handleInterviewerQuestionsChange = (updatedQuestions: QuestionsToAskInterviewer[]) => {
    if (!payload) return
    triggerDebouncedAutosave({ ...payload, questionsToAskInterviewer: updatedQuestions })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6" data-testid="interview-prep-workbench">
      {/* Workbench Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {isArabic ? 'ورقة التحضير للمقابلات الشخصية' : 'Targeted Interview Prep Cheat Sheet'}
            </h3>
            {saveStatus === 'saving' && (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground animate-pulse py-0"
              >
                {isArabic ? 'جارٍ الحفظ...' : 'Autosaving...'}
              </Badge>
            )}
            {saveStatus === 'saved' && (
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 border-emerald-500/30 gap-1 py-0"
              >
                <CheckCircle2 className="size-2.5" />
                {isArabic ? 'تم الحفظ' : 'Saved'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {isArabic
              ? 'أسئلة موجهة مع إجابات مبنية على نموذج STAR مستندة بالكامل إلى مشاريعك الحقيقية دون أي اختلاق.'
              : 'Targeted STAR questions grounded strictly in your authentic background, plus questions for the interviewer.'}
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {payload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 text-xs text-foreground"
            >
              <Printer className="size-3.5" />
              <span>{isArabic ? 'طباعة الورقة (PDF)' : 'Print Cheat Sheet'}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Sparkles className={`size-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAll
                ? isArabic
                  ? 'جارٍ إعداد الأسئلة...'
                  : 'Generating Questions...'
                : payload
                  ? isArabic
                    ? 'إعادة توليد الكل'
                    : 'Regenerate Cheat Sheet'
                  : isArabic
                    ? 'إنشاء ورقة التحضير'
                    : 'Generate Cheat Sheet'}
            </span>
          </Button>
        </div>
      </div>

      {/* Banner for candidate with zero experiences / projects */}
      {!hasRecordedExperiences && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-900 dark:text-blue-200 print:hidden">
          <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">
              {isArabic
                ? 'إرشاد للمرشحين الجدد'
                : 'Guidance for Candidates with No Recorded Projects'}
            </span>
            <p className="leading-relaxed">
              {isArabic
                ? 'لم يتم العثور على مشاريع أو خبرات سابقة مسجلة في ملفك. سيقوم النظام بصياغة إجابات STAR نموذجية مع وضع عناصر نائبة واضحة لتزودها ببياناتك الحقيقية.'
                : 'No work experiences or projects are currently recorded in your profile. The AI will generate model STAR structures with bracketed placeholders indicating where to supply your own authentic metrics.'}
            </p>
          </div>
        </div>
      )}

      {/* Printable Title Header */}
      {payload && (
        <div className="hidden print:block mb-4 space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-black">
            {isArabic ? 'ورقة التحضير للمقابلة' : 'Interview Prep Cheat Sheet'}
          </h2>
          <p className="text-xs text-neutral-600">
            {payload.roleTitle} · {payload.companyName}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs print:hidden">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Generated Content Cards */}
      {payload ? (
        <div className="space-y-6">
          {/* Categorized STAR Questions */}
          <div className="space-y-4">
            {payload.questions.map((q, idx) => (
              <StarQuestionCard
                key={q.id || idx}
                question={q}
                index={idx}
                onChange={(updated) => handleQuestionChange(idx, updated)}
                onRegenerate={() => handleRegenerateQuestion(q.id)}
                isRegenerating={regeneratingQuestionId === q.id}
                lang={lang}
              />
            ))}
          </div>

          {/* Strategic Questions to Ask Interviewer */}
          <InterviewerQuestionsList
            questions={payload.questionsToAskInterviewer}
            onChange={handleInterviewerQuestionsChange}
            lang={lang}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80 rounded-lg bg-card/30 space-y-3 print:hidden">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <BookOpenCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              {isArabic
                ? 'لم يتم توليد ورقة التحضير بعد'
                : 'No interview cheat sheet generated yet'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {isArabic
                ? 'اضغط على زر التوليد للحصول على 3 أسئلة مقابلة مستهدفة بإجابات STAR و3 أسئلة استراتيجية للمحاور.'
                : 'Click generate to create 3 targeted STAR questions grounded in your achievements, plus questions for the interviewer.'}
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground mt-2"
          >
            <Sparkles className="size-3.5" />
            <span>{isArabic ? 'إنشاء ورقة التحضير الآن' : 'Generate Cheat Sheet'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
