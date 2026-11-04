'use client'

import * as React from 'react'
import type { InterviewQuestion } from '@/lib/validations/career-prep'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RtlIcon } from '@/components/ui/rtl-icon'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Timer,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle as QuestionIcon,
} from 'lucide-react'

export type ConfidenceLevel = 'needs_work' | 'getting_there' | 'nailed_it'

export interface RehearsalStudioProps {
  questions: InterviewQuestion[]
  lang: 'en' | 'ar'
  onExit: () => void
  companyName?: string
  roleTitle?: string
}

export function RehearsalStudio({
  questions,
  lang,
  onExit,
  companyName,
  roleTitle,
}: RehearsalStudioProps) {
  const isArabic = lang === 'ar'
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [showHints, setShowHints] = React.useState(false)
  const [confidence, setConfidence] = React.useState<Record<string, ConfidenceLevel>>({})

  // 2-minute (120s) timer per question
  const [secondsLeft, setSecondsLeft] = React.useState(120)
  const [isRunning, setIsRunning] = React.useState(false)

  const activeQuestion = questions[currentIndex]

  const changeQuestion = React.useCallback((newIndex: number) => {
    setCurrentIndex(newIndex)
    setSecondsLeft(120)
    setIsRunning(false)
    setShowHints(false)
  }, [])

  // Timer interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight') {
        if (isArabic) {
          if (currentIndex > 0) changeQuestion(currentIndex - 1)
        } else {
          if (currentIndex < questions.length - 1) changeQuestion(currentIndex + 1)
        }
      } else if (e.key === 'ArrowLeft') {
        if (isArabic) {
          if (currentIndex < questions.length - 1) changeQuestion(currentIndex + 1)
        } else {
          if (currentIndex > 0) changeQuestion(currentIndex - 1)
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsRunning((prev) => !prev)
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setShowHints((prev) => !prev)
      } else if (e.key === 'Escape') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, questions.length, isArabic, onExit, changeQuestion])

  if (!activeQuestion) return null

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const timerProgress = ((120 - secondsLeft) / 120) * 100

  const handleRating = (level: ConfidenceLevel) => {
    if (!activeQuestion.id) return
    setConfidence((prev) => ({ ...prev, [activeQuestion.id]: level }))
  }

  const activeRating = activeQuestion.id ? confidence[activeQuestion.id] : undefined

  const categoryName =
    {
      BEHAVIORAL: isArabic ? 'سؤال سلوكي' : 'Behavioral Question',
      TECHNICAL: isArabic ? 'سؤال تقني' : 'Technical Question',
      SITUATIONAL: isArabic ? 'سؤال موقفي' : 'Situational Question',
      CUSTOM: isArabic ? 'سؤال مخصص' : 'Custom Question',
    }[activeQuestion.category] || (isArabic ? 'سؤال مخصص' : 'Custom Question')

  return (
    <div
      className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-all"
      data-testid="rehearsal-studio"
    >
      {/* Top Studio Bar */}
      <div className="flex items-center justify-between border-b border-border/70 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                {isArabic ? 'استوديو التدرّب الشفهي' : 'Verbal Rehearsal Studio'}
              </h2>
              <Badge variant="outline" className="text-[11px] font-medium border-border">
                {categoryName}
              </Badge>
            </div>
            {(roleTitle || companyName) && (
              <p className="text-xs text-muted-foreground">
                {roleTitle} {companyName ? `· ${companyName}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Question Index Progress Pills */}
          <div className="hidden sm:flex items-center gap-1.5 me-2">
            {questions.map((q, idx) => {
              const qRating = q.id ? confidence[q.id] : undefined
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => changeQuestion(idx)}
                  className={`size-2.5 rounded-full transition-all ${
                    isCurrent
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-card bg-primary scale-125'
                      : qRating === 'nailed_it'
                        ? 'bg-emerald-500'
                        : qRating === 'getting_there'
                          ? 'bg-amber-500'
                          : qRating === 'needs_work'
                            ? 'bg-destructive/80'
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  }`}
                  aria-label={`Jump to question ${idx + 1}`}
                  title={`Question ${idx + 1}`}
                />
              )
            })}
          </div>

          <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted/40 border border-border/50">
            {currentIndex + 1} / {questions.length}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            data-testid="exit-rehearsal-btn"
          >
            <X className="size-3.5" />
            <span>{isArabic ? 'إنهاء التدرّب' : 'Exit Studio'}</span>
          </Button>
        </div>
      </div>

      {/* Question Spotlight Hero */}
      <div className="space-y-4 py-2">
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-snug">
          {activeQuestion.question ||
            (isArabic ? 'سؤال المقابلة غير محدد بعد' : 'No question prompt set')}
        </h3>

        {activeQuestion.whyAsked && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
            <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {isArabic ? 'ما يبحث عنه المحاور:' : 'Interviewer Intent (Why asked):'}
              </span>
              <p className="leading-relaxed">{activeQuestion.whyAsked}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Minute Speech Timer Instrument */}
      <div className="p-4 rounded-xl border border-border bg-background/60 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                isRunning
                  ? 'bg-primary text-primary-foreground animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Timer className="size-5" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                {isArabic ? 'مؤقت الإجابة الشفهية (هدف دقيقتان)' : 'Speaking Timer (2-min target)'}
              </span>
              <span
                className={`text-2xl font-mono font-bold tracking-tight ${
                  secondsLeft <= 15 ? 'text-destructive animate-pulse' : 'text-foreground'
                }`}
              >
                {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRunning ? 'secondary' : 'default'}
              size="sm"
              onClick={() => setIsRunning((prev) => !prev)}
              className="h-8 gap-1.5 text-xs font-semibold"
              data-testid="toggle-timer-btn"
            >
              {isRunning ? (
                <>
                  <Pause className="size-3.5" />
                  <span>{isArabic ? 'إيقاف مؤقت' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>{isArabic ? 'بدء التحدث' : 'Start Speaking'}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRunning(false)
                setSecondsLeft(120)
              }}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Reset timer (120s)"
            >
              <RotateCcw className="size-3" />
              <span>{isArabic ? 'إعادة ضبط' : 'Reset'}</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsLeft <= 20
                ? 'bg-destructive'
                : secondsLeft <= 45
                  ? 'bg-amber-500'
                  : 'bg-primary'
            }`}
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      </div>

      {/* Active Recall Hint Drawer */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHints((prev) => !prev)}
            className="gap-2 text-xs font-medium rounded-lg h-9"
            data-testid="toggle-hints-btn"
          >
            {showHints ? (
              <>
                <EyeOff className="size-3.5 text-muted-foreground" />
                <span>{isArabic ? 'إخفاء نموذج الإجابة' : 'Hide STAR Model Hints'}</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5 text-primary" />
                <span>{isArabic ? 'إظهار نموذج الإجابة (STAR)' : 'Reveal STAR Model Hints'}</span>
              </>
            )}
          </Button>

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {isArabic
              ? 'تلميح: حاول التحدث بصوت عالٍ قبل كشف الإجابة'
              : 'Pro tip: Try answering out loud before looking at the hints'}
          </span>
        </div>

        {showHints && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in-50 duration-200">
            {/* Situation */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/80 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary font-mono">
                  S
                </span>
                <span className="text-xs font-bold text-foreground">
                  {isArabic ? 'الموقف (Situation)' : 'Situation'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeQuestion.starResponse.situation || (isArabic ? 'لم يُحدد' : 'Not specified')}
              </p>
            </div>

            {/* Task */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/80 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary font-mono">
                  T
                </span>
                <span className="text-xs font-bold text-foreground">
                  {isArabic ? 'المهمة (Task)' : 'Task'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeQuestion.starResponse.task || (isArabic ? 'لم يُحدد' : 'Not specified')}
              </p>
            </div>

            {/* Action */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/80 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary font-mono">
                  A
                </span>
                <span className="text-xs font-bold text-foreground">
                  {isArabic ? 'الإجراء (Action)' : 'Action'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeQuestion.starResponse.action || (isArabic ? 'لم يُحدد' : 'Not specified')}
              </p>
            </div>

            {/* Result */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-background/80 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary font-mono">
                  R
                </span>
                <span className="text-xs font-bold text-foreground">
                  {isArabic ? 'النتيجة (Result)' : 'Result'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {activeQuestion.starResponse.result || (isArabic ? 'لم يُحدد' : 'Not specified')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Self-Assessment & Step Navigation */}
      <div className="border-t border-border/70 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Self Rating */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {isArabic ? 'تقييم ثقتك بالإجابة:' : 'How was your delivery?'}
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background p-1">
            <button
              type="button"
              onClick={() => handleRating('needs_work')}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                activeRating === 'needs_work'
                  ? 'bg-destructive/15 text-destructive font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertCircle className="size-3" />
              <span>{isArabic ? 'يحتاج تدريب' : 'Needs Work'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating('getting_there')}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                activeRating === 'getting_there'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <QuestionIcon className="size-3" />
              <span>{isArabic ? 'مقبول' : 'Getting There'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRating('nailed_it')}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                activeRating === 'nailed_it'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="size-3" />
              <span>{isArabic ? 'ممتاز' : 'Nailed It'}</span>
            </button>
          </div>
        </div>

        {/* Previous / Next Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => changeQuestion(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="h-8 gap-1.5 text-xs"
          >
            <RtlIcon icon={ArrowLeft} className="size-3.5" />
            <span>{isArabic ? 'السابق' : 'Previous'}</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => changeQuestion(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <span>{isArabic ? 'التالي' : 'Next Question'}</span>
            <RtlIcon icon={ArrowRight} className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
