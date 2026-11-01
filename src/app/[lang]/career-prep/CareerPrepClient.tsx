'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/types'
import {
  assembleFullSheetText,
  type InterviewPrepPayload,
  type InterviewQuestion,
  type QuestionsToAskInterviewer,
} from '@/lib/validations/career-prep'
import type { CareerPrepSelectorRow, CareerPrepSelectedResume } from '@/lib/db/career-prep'
import { getCareerPrepSelectorRowsAction } from '@/app/actions/career-prep-actions'
import {
  generateInterviewPrepAction,
  saveInterviewPrepAction,
  regenerateInterviewQuestionAction,
} from '@/app/actions/interview-prep-actions'
import { StarQuestionCard } from '@/components/interview-prep/StarQuestionCard'
import { InterviewerQuestionsList } from '@/components/interview-prep/InterviewerQuestionsList'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RtlIcon } from '@/components/ui/rtl-icon'
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Printer,
  Sparkles,
} from 'lucide-react'

export interface CareerPrepClientProps {
  lang: 'en' | 'ar'
  dict: Dictionary
  initialSelectorRows: CareerPrepSelectorRow[]
  initialHasMore: boolean
  initialSelectedResume: CareerPrepSelectedResume | null
  fallbackNotice: boolean
}

export function CareerPrepClient({
  lang,
  dict,
  initialSelectorRows,
  initialHasMore,
  initialSelectedResume,
  fallbackNotice: initialFallbackNotice,
}: CareerPrepClientProps) {
  const router = useRouter()
  const isArabic = lang === 'ar'
  const t = dict.careerPrep ?? {}

  const [selectorRows, setSelectorRows] =
    React.useState<CareerPrepSelectorRow[]>(initialSelectorRows)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const selectedResume = initialSelectedResume
  const [payload, setPayload] = React.useState<InterviewPrepPayload | null>(
    initialSelectedResume?.payload ?? null,
  )
  const [fallbackNotice, setFallbackNotice] = React.useState(initialFallbackNotice)

  const [isGenerating, setIsGenerating] = React.useState(false)
  const [regeneratingQuestionId, setRegeneratingQuestionId] = React.useState<string | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'error' | 'stale' | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [copiedFull, setCopiedFull] = React.useState(false)

  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestPayloadRef = React.useRef<InterviewPrepPayload | null>(payload)
  const selectedResumeRef = React.useRef(selectedResume)

  React.useEffect(() => {
    selectedResumeRef.current = selectedResume
  }, [selectedResume])

  React.useEffect(() => {
    latestPayloadRef.current = payload
  }, [payload])

  const flushAutosave = React.useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
      const currentResume = selectedResumeRef.current
      if (latestPayloadRef.current && currentResume?.id) {
        setSaveStatus('saving')
        try {
          const res = await saveInterviewPrepAction(currentResume.id, latestPayloadRef.current)
          if (res.success && res.data) {
            setPayload(res.data)
            latestPayloadRef.current = res.data
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else if (res.status === 409) {
            setSaveStatus('stale')
            setErrorMessage(t.staleError || 'Conflict: a newer version exists. Refreshing data...')
            router.refresh()
          } else {
            setSaveStatus('error')
            if (res.error) setErrorMessage(res.error)
          }
        } catch {
          setSaveStatus('error')
        }
      }
    }
  }, [t.staleError, router])

  const triggerDebouncedAutosave = React.useCallback(
    (newPayload: InterviewPrepPayload) => {
      setPayload(newPayload)
      latestPayloadRef.current = newPayload

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }

      setSaveStatus('saving')
      autosaveTimerRef.current = setTimeout(async () => {
        autosaveTimerRef.current = null
        const currentResume = selectedResumeRef.current
        if (!currentResume?.id) return
        try {
          const res = await saveInterviewPrepAction(currentResume.id, newPayload)
          if (res.success && res.data) {
            setPayload(res.data)
            latestPayloadRef.current = res.data
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else if (res.status === 409) {
            setSaveStatus('stale')
            setErrorMessage(t.staleError || 'Conflict: a newer version exists. Refreshing data...')
            router.refresh()
          } else {
            setSaveStatus('error')
            if (res.error) setErrorMessage(res.error)
          }
        } catch {
          setSaveStatus('error')
          setErrorMessage(t.saveError || 'Failed to save changes')
        }
      }, 1000)
    },
    [t.staleError, t.saveError, router],
  )

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (autosaveTimerRef.current && latestPayloadRef.current && selectedResume?.id) {
        void saveInterviewPrepAction(selectedResume.id, latestPayloadRef.current)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [selectedResume?.id])

  // After router.refresh() (e.g. a stale 409 recovery) the Server Component re-renders with
  // fresh props; adopt the server payload so the client never ping-pongs stale 409s.
  const serverPayloadRef = React.useRef<InterviewPrepPayload | null>(
    initialSelectedResume?.payload ?? null,
  )
  React.useEffect(() => {
    const serverPayload = initialSelectedResume?.payload ?? null
    if (serverPayload && serverPayload !== serverPayloadRef.current) {
      serverPayloadRef.current = serverPayload
      if (!autosaveTimerRef.current) {
        setPayload(serverPayload)
        latestPayloadRef.current = serverPayload
      }
    }
  }, [initialSelectedResume])

  const handleSelectJob = async (tailoredResumeId: string) => {
    if (tailoredResumeId === selectedResume?.id) return
    await flushAutosave()
    setFallbackNotice(false)
    router.push(`/${lang}/career-prep?tailoredResumeId=${tailoredResumeId}`, { scroll: false })
  }

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const res = await getCareerPrepSelectorRowsAction(selectorRows.length)
      if (res.success && res.data) {
        setSelectorRows((prev) => [...prev, ...res.data.rows])
        setHasMore(res.data.hasMore)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleGenerateAll = async () => {
    if (!selectedResume?.id) return
    await flushAutosave()
    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const res = await generateInterviewPrepAction(selectedResume.id, {
        language: selectedResume.language,
      })
      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
        setSelectorRows((prev) =>
          prev.map((r) =>
            r.tailoredResumeId === selectedResume.id ? { ...r, hasInterviewPrep: true } : r,
          ),
        )
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر توليد أسئلة المقابلة. يرجى التحقق من إعدادات المزود.'
          : 'Failed to generate interview questions. Please verify your AI provider settings.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddCustomQuestion = () => {
    if (!selectedResume) return
    const currentQuestions = payload?.questions ?? []
    const customCount = currentQuestions.filter((q) => q.customOrigin).length
    if (customCount >= 10) return

    const newQuestion: InterviewQuestion = {
      id: crypto.randomUUID(),
      category: 'CUSTOM',
      customOrigin: true,
      question: '',
      whyAsked: '',
      starResponse: {
        situation: '',
        task: '',
        action: '',
        result: '',
      },
      referencedSources: [],
      missingMetricFlags: [],
    }

    const basePayload: InterviewPrepPayload = payload ?? {
      version: 2,
      generatedAt: null,
      updatedAt: new Date().toISOString(),
      language: selectedResume.language,
      roleTitle: selectedResume.roleTitle,
      companyName: selectedResume.companyName,
      questions: [],
      questionsToAskInterviewer: [],
    }

    const updated: InterviewPrepPayload = {
      ...basePayload,
      questions: [...basePayload.questions, newQuestion],
    }

    triggerDebouncedAutosave(updated)
  }

  const handleDeleteCustomQuestion = (questionId: string) => {
    if (!payload) return
    const target = payload.questions.find((q) => q.id === questionId)
    if (!target || !target.customOrigin) return

    const updatedQuestions = payload.questions.filter((q) => q.id !== questionId)
    const updated: InterviewPrepPayload = {
      ...payload,
      questions: updatedQuestions,
    }
    triggerDebouncedAutosave(updated)
  }

  const handleQuestionChange = (index: number, updatedQuestion: InterviewQuestion) => {
    if (!payload) return
    const updatedQuestions = [...payload.questions]
    updatedQuestions[index] = updatedQuestion
    triggerDebouncedAutosave({ ...payload, questions: updatedQuestions })
  }

  const handleInterviewerQuestionsChange = (updated: QuestionsToAskInterviewer[]) => {
    if (!payload) return
    triggerDebouncedAutosave({ ...payload, questionsToAskInterviewer: updated })
  }

  const handleRegenerateQuestion = async (questionId: string) => {
    if (!selectedResume?.id) return
    await flushAutosave()
    setRegeneratingQuestionId(questionId)
    setErrorMessage(null)

    try {
      const res = await regenerateInterviewQuestionAction(selectedResume.id, questionId, {
        language: selectedResume.language,
      })
      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
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

  const handleCopyFullSheet = async () => {
    if (!payload) return
    const fullText = assembleFullSheetText(payload)
    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedFull(true)
      setTimeout(() => setCopiedFull(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handlePrint = async () => {
    if (!selectedResume?.id) return
    await flushAutosave()
    window.open(`/${lang}/career-prep/print?tailoredResumeId=${selectedResume.id}`, '_blank')
  }

  if (selectorRows.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-4"
        data-testid="career-prep-empty-state"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Briefcase className="size-7" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {t.emptyStateTitle || 'No tailored resumes yet'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.emptyStateBody ||
              'Tailor your first resume to a target job description to practice STAR responses and generate customized interview questions.'}
          </p>
        </div>
        <Button asChild size="default" className="gap-2 text-xs font-semibold">
          <Link href={`/${lang}/tailor`}>
            <Sparkles className="size-4" />
            <span>{t.emptyStateCta || 'Go to Tailor Studio'}</span>
            <RtlIcon icon={ArrowRight} className="size-3.5" />
          </Link>
        </Button>
      </div>
    )
  }

  const customQuestionsCount = payload?.questions.filter((q) => q.customOrigin).length ?? 0
  const isCustomAtCap = customQuestionsCount >= 10
  const contentDir = selectedResume?.language === 'AR' ? 'rtl' : 'ltr'

  return (
    <div className="space-y-6" data-testid="career-prep-hub">
      {fallbackNotice && (
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200"
          data-testid="career-prep-fallback-notice"
        >
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {t.fallbackNotice ||
              'The requested interview prep could not be found or was removed. Showing your most recent tailored role instead.'}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Job Selector Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {t.jobSelector || 'Tailored Jobs'}
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/${lang}/tailor`}>
                <span>{t.openInStudio || 'Studio'}</span>
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2" data-testid="career-prep-selector-list">
            {selectorRows.map((row) => {
              const isSelected = row.tailoredResumeId === selectedResume?.id
              return (
                <button
                  key={row.tailoredResumeId}
                  type="button"
                  onClick={() => handleSelectJob(row.tailoredResumeId)}
                  className={`w-full text-start p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border/60 bg-card hover:bg-accent/50'
                  }`}
                  data-testid={`selector-row-${row.tailoredResumeId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {row.roleTitle}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {row.companyName}
                      </p>
                    </div>
                    <Badge
                      variant={row.hasInterviewPrep ? 'default' : 'secondary'}
                      className="text-[10px] px-1.5 py-0 shrink-0 font-normal"
                    >
                      {row.hasInterviewPrep
                        ? t.statusGenerated || 'Ready'
                        : t.statusNotGenerated || 'Needs prep'}
                    </Badge>
                  </div>
                </button>
              )
            })}

            {hasMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground mt-2"
                data-testid="career-prep-load-more-btn"
              >
                {isLoadingMore ? t.loadingMore || 'Loading...' : t.loadMore || 'Load more jobs'}
              </Button>
            )}
          </div>
        </aside>

        {/* Main Focus Practice View */}
        <div className="lg:col-span-8 space-y-6">
          {selectedResume && (
            <div className="space-y-6">
              {/* Header and Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-xs">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold tracking-tight text-foreground truncate">
                      {selectedResume.roleTitle}
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-mono py-0">
                      {selectedResume.companyName}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono py-0">
                      {selectedResume.language}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {saveStatus === 'saving' && (
                      <span className="animate-pulse text-muted-foreground flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-primary animate-ping" />
                        {t.autosaving || 'Autosaving...'}
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {t.saved || 'Saved'}
                      </span>
                    )}
                    {saveStatus === 'stale' && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {t.staleError || 'Conflict detected'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {payload && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyFullSheet}
                        className="h-8 gap-1.5 text-xs text-foreground"
                        data-testid="copy-full-sheet-btn"
                      >
                        {copiedFull ? (
                          <>
                            <Check className="size-3 text-emerald-600" />
                            <span>{t.copiedFullSheet || 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>{t.copyFullSheet || 'Copy Full Sheet'}</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="h-8 gap-1.5 text-xs text-foreground"
                        data-testid="print-sheet-btn"
                      >
                        <Printer className="size-3.5" />
                        <span>{t.printCheatSheet || 'Print'}</span>
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddCustomQuestion}
                    disabled={isCustomAtCap}
                    className="h-8 gap-1.5 text-xs font-semibold"
                    title={
                      isCustomAtCap
                        ? t.customQuestionLimit || 'Maximum 10 custom questions reached'
                        : undefined
                    }
                    data-testid="add-custom-question-btn"
                  >
                    <Plus className="size-3.5" />
                    <span>{t.addCustomQuestion || 'Add Question'}</span>
                  </Button>
                </div>
              </div>

              {/* Instructional Guidance Banner when profile has zero experiences/projects */}
              {!selectedResume.hasGrounding && (
                <div
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-900 dark:text-blue-200"
                  data-testid="grounding-guidance-banner"
                >
                  <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block">
                      {t.guidanceTitle || 'Guidance for Candidates with No Recorded Projects'}
                    </span>
                    <p className="leading-relaxed">
                      {t.guidanceBody ||
                        'No work experiences or projects are currently recorded in your profile. The AI will generate model STAR structures with bracketed placeholders indicating where to supply your own authentic metrics.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Inline CTA: no payload yet, or the AI question set is absent
                  (the empty AI set is a legal state when custom questions led the draft, AC-5) */}
              {(!payload || payload.questions.every((q) => q.customOrigin)) && (
                <Card className="border border-dashed border-border/80 bg-card/40">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpenCheck className="size-6" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h3 className="text-sm font-bold text-foreground">
                        {t.generateCtaTitle || 'No interview cheat sheet generated yet'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.generateCtaDesc ||
                          'Generate 3 targeted STAR questions grounded in your achievements plus 3 strategic questions to ask the interviewer.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleGenerateAll}
                        disabled={isGenerating}
                        className="h-9 gap-2 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
                        data-testid="generate-prep-btn"
                      >
                        <Sparkles className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>
                          {isGenerating
                            ? t.generating || 'Generating Questions...'
                            : t.generateButton || 'Generate Cheat Sheet'}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomQuestion}
                        className="h-9 gap-1.5 text-xs text-foreground"
                      >
                        <Plus className="size-3.5" />
                        <span>{t.addCustomQuestion || 'Add Question First'}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Focus Content Questions and Answers */}
              {payload && payload.questions.length > 0 && (
                <div className="space-y-6" dir={contentDir}>
                  <div className="space-y-4">
                    {payload.questions.map((q, idx) => (
                      <StarQuestionCard
                        key={q.id || idx}
                        question={q}
                        index={idx}
                        onChange={(updated) => handleQuestionChange(idx, updated)}
                        onRegenerate={() => handleRegenerateQuestion(q.id)}
                        onDelete={() => handleDeleteCustomQuestion(q.id)}
                        isRegenerating={regeneratingQuestionId === q.id}
                        lang={lang}
                      />
                    ))}
                  </div>

                  {/* Bottom Add Question Affordance */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      disabled={isCustomAtCap}
                      className="gap-1.5 text-xs text-foreground"
                      data-testid="add-custom-question-bottom-btn"
                    >
                      <Plus className="size-3.5" />
                      <span>{t.addCustomQuestion || 'Add Custom Question'}</span>
                    </Button>
                    {isCustomAtCap && (
                      <span className="text-[11px] text-muted-foreground">
                        {t.customQuestionLimit || 'Cap of 10 custom questions reached'}
                      </span>
                    )}
                  </div>

                  {/* Strategic Questions for Interviewer */}
                  {payload.questionsToAskInterviewer.length > 0 && (
                    <InterviewerQuestionsList
                      questions={payload.questionsToAskInterviewer}
                      onChange={handleInterviewerQuestionsChange}
                      lang={lang}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
