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
import {
  StarQuestionCard,
  InterviewerQuestionsList,
  RehearsalStudio,
  TargetJobDrawer,
} from '@/components/interview-prep'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RtlIcon } from '@/components/ui/rtl-icon'
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Layers,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export interface CareerPrepClientProps {
  lang: 'en' | 'ar'
  dict: Dictionary
  initialSelectorRows: CareerPrepSelectorRow[]
  initialHasMore: boolean
  initialSelectedResume: CareerPrepSelectedResume | null
  fallbackNotice: boolean
}

function formatShortDate(isoDate: string, lang: 'en' | 'ar'): string {
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
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
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'ready' | 'needs_prep'>('all')
  const selectedResume = initialSelectedResume
  const [payload, setPayload] = React.useState<InterviewPrepPayload | null>(
    initialSelectedResume?.payload ?? null,
  )
  const [fallbackNotice, setFallbackNotice] = React.useState(initialFallbackNotice)

  // Studio & Rehearsal States
  const [viewMode, setViewMode] = React.useState<'edit' | 'rehearse'>('edit')
  const [isTargetDrawerOpen, setIsTargetDrawerOpen] = React.useState(false)
  const [allExpanded, setAllExpanded] = React.useState(true)

  // Safety & History Rollback Caches
  const [previousDrafts, setPreviousDrafts] = React.useState<Record<string, InterviewQuestion>>({})
  const [deletedDraft, setDeletedDraft] = React.useState<InterviewQuestion | null>(null)
  const [undoToastVisible, setUndoToastVisible] = React.useState(false)
  const undoTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatingStep, setGeneratingStep] = React.useState<string | null>(null)
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

  React.useEffect(() => {
    const handleGlobalResumeLangChange = () => {
      router.refresh()
    }
    window.addEventListener('resume-language-changed', handleGlobalResumeLangChange)
    return () => window.removeEventListener('resume-language-changed', handleGlobalResumeLangChange)
  }, [router])

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
        setSelectorRows((prev) => {
          const seenKeys = new Set(
            prev.map(
              (r) =>
                `${r.roleTitle.toLowerCase().replace(/\s+/g, ' ').trim()}:::${r.companyName.toLowerCase().replace(/\s+/g, ' ').trim()}`,
            ),
          )
          const seenIds = new Set(prev.map((r) => r.tailoredResumeId))
          const nonDuplicateRows = res.data.rows.filter((r) => {
            const key = `${r.roleTitle.toLowerCase().replace(/\s+/g, ' ').trim()}:::${r.companyName.toLowerCase().replace(/\s+/g, ' ').trim()}`
            return !seenKeys.has(key) && !seenIds.has(r.tailoredResumeId)
          })
          return [...prev, ...nonDuplicateRows]
        })
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
    setGeneratingStep(
      isArabic
        ? 'الخطوة 1/3: استخراج الكفاءات من الوصف الوظيفي...'
        : 'Step 1/3: Extracting Job Competencies...',
    )

    const stepTimer = setTimeout(() => {
      setGeneratingStep(
        isArabic
          ? 'الخطوة 2/3: مطابقة إنجازاتك (Google XYZ)...'
          : 'Step 2/3: Aligning Google XYZ Achievements...',
      )
    }, 4000)

    const stepTimer2 = setTimeout(() => {
      setGeneratingStep(
        isArabic
          ? 'الخطوة 3/3: صياغة إجابات STAR وأسئلة المقابِل...'
          : 'Step 3/3: Composing STAR Questions & Answers...',
      )
    }, 9000)

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
      clearTimeout(stepTimer)
      clearTimeout(stepTimer2)
      setIsGenerating(false)
      setGeneratingStep(null)
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

    // Save for undo recovery
    setDeletedDraft(target)
    setUndoToastVisible(true)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoToastVisible(false)
      setDeletedDraft(null)
    }, 7000)

    const updatedQuestions = payload.questions.filter((q) => q.id !== questionId)
    const updated: InterviewPrepPayload = {
      ...payload,
      questions: updatedQuestions,
    }
    triggerDebouncedAutosave(updated)
  }

  const handleUndoDelete = () => {
    if (!deletedDraft || !payload) return
    const updated: InterviewPrepPayload = {
      ...payload,
      questions: [...payload.questions, deletedDraft],
    }
    triggerDebouncedAutosave(updated)
    setUndoToastVisible(false)
    setDeletedDraft(null)
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
    if (!selectedResume?.id || !payload) return
    await flushAutosave()

    // Store existing draft in history stack before regenerating
    const existing = payload.questions.find((q) => q.id === questionId)
    if (existing) {
      setPreviousDrafts((prev) => ({ ...prev, [questionId]: existing }))
    }

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

  const handleRestoreDraft = (questionId: string) => {
    const prevDraft = previousDrafts[questionId]
    if (!prevDraft || !payload) return

    const updatedQuestions = payload.questions.map((q) => (q.id === questionId ? prevDraft : q))
    triggerDebouncedAutosave({ ...payload, questions: updatedQuestions })

    // Clear restored draft from history
    setPreviousDrafts((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
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
  const hasAnyQuestions = Boolean(payload && payload.questions.length > 0)
  const showGenerateCta = !payload || payload.questions.every((q) => q.customOrigin)

  const filteredSelectorRows = selectorRows.filter((row) => {
    if (statusFilter === 'ready') return row.hasInterviewPrep
    if (statusFilter === 'needs_prep') return !row.hasInterviewPrep
    return true
  })

  return (
    <div className="space-y-6" data-testid="career-prep-hub">
      {/* Undo Delete Toast */}
      {undoToastVisible && deletedDraft && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom duration-200">
          <span className="text-xs text-foreground font-medium">
            {isArabic ? 'تم حذف السؤال المخصص.' : 'Custom question deleted.'}
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleUndoDelete}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <RotateCcw className="size-3" />
            <span>{isArabic ? 'تراجع' : 'Undo'}</span>
          </Button>
        </div>
      )}

      {fallbackNotice && (
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-lg border border-border bg-accent/40 text-xs text-foreground"
          data-testid="career-prep-fallback-notice"
        >
          <AlertCircle className="size-4 shrink-0 text-primary" />
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

      {/* Target Job Context Side Drawer */}
      {selectedResume && (
        <TargetJobDrawer
          isOpen={isTargetDrawerOpen}
          onClose={() => setIsTargetDrawerOpen(false)}
          roleTitle={selectedResume.roleTitle}
          companyName={selectedResume.companyName}
          parsedSkills={selectedResume.parsedSkills}
          jobDescription={selectedResume.jobDescription}
          groundingSources={selectedResume.groundingSources}
          lang={lang}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] border-t border-border divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-border">
        {/* Job Selector Sidebar / Master List */}
        <aside className="p-5 space-y-4 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto bg-card/30">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <span className="text-xs font-mono font-bold tracking-wider text-primary">ROLES</span>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-mono font-semibold tabular-nums text-foreground">
              {selectorRows.length} {selectorRows.length === 1 ? 'ROLE' : 'ROLES'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.jobSelector || 'Tailored Jobs'}
            </h2>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-1.5 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/${lang}/tailor`}>
                <span>{t.openInStudio || 'Tailor Studio'}</span>
                <ExternalLink className="size-3 text-primary" />
              </Link>
            </Button>
          </div>

          {selectorRows.length > 3 && (
            <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
              {(
                [
                  { key: 'all', label: isArabic ? 'الكل' : 'All' },
                  { key: 'ready', label: t.statusGenerated || (isArabic ? 'جاهز' : 'Ready') },
                  {
                    key: 'needs_prep',
                    label: t.statusNotGenerated || (isArabic ? 'يحتاج تحضير' : 'Needs prep'),
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-accent text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="divide-y divide-border/60 max-h-[600px] overflow-y-auto pe-1"
            data-testid="career-prep-selector-list"
          >
            {filteredSelectorRows.map((row) => {
              const isSelected = row.tailoredResumeId === selectedResume?.id
              const dateStr = formatShortDate(row.createdAt, lang)
              return (
                <button
                  key={row.tailoredResumeId}
                  type="button"
                  onClick={() => handleSelectJob(row.tailoredResumeId)}
                  className={`w-full text-start p-3 rounded-lg transition-colors ${
                    isSelected ? 'bg-primary/10 border-s-2 border-s-primary' : 'hover:bg-accent/40'
                  }`}
                  data-testid={`selector-row-${row.tailoredResumeId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {row.roleTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{row.companyName}</span>
                        {dateStr && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1 shrink-0 text-xs text-muted-foreground/80">
                              <Calendar className="size-2.5" />
                              {dateStr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 shrink-0 font-semibold uppercase rounded-md border ${
                        row.hasInterviewPrep
                          ? 'border-border bg-accent text-accent-foreground'
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {row.hasInterviewPrep
                        ? t.statusGenerated || 'Ready'
                        : t.statusNotGenerated || 'Needs prep'}
                    </span>
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
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground mt-3 rounded-lg"
                data-testid="career-prep-load-more-btn"
              >
                {isLoadingMore ? t.loadingMore || 'Loading...' : t.loadMore || 'Load more jobs'}
              </Button>
            )}
          </div>
        </aside>

        {/* Main Focus Practice View */}
        <div className="p-6 lg:p-8 space-y-6">
          {selectedResume && (
            <div className="space-y-6">
              {/* Header and Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-2xs">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold tracking-tight text-foreground truncate">
                      {selectedResume.roleTitle}
                    </h2>
                    <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                      {selectedResume.companyName}
                    </span>
                    <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs uppercase font-mono text-muted-foreground">
                      {selectedResume.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {saveStatus === 'saving' && (
                      <span className="animate-pulse text-muted-foreground flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-primary animate-ping" />
                        {t.autosaving || 'Autosaving...'}
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-foreground flex items-center gap-1 font-medium">
                        <CheckCircle2 className="size-3 text-primary" />
                        {t.saved || 'Saved'}
                      </span>
                    )}
                    {saveStatus === 'stale' && (
                      <span className="text-destructive font-medium">
                        {t.staleError || 'Conflict detected'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Action Toolbar */}
                {hasAnyQuestions && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Mode Switcher */}
                    <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('edit')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          viewMode === 'edit'
                            ? 'bg-background text-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        data-testid="mode-edit-btn"
                      >
                        <Layers className="size-3.5" />
                        <span>{isArabic ? 'تعديل النماذج' : 'Edit Stories'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('rehearse')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          viewMode === 'rehearse'
                            ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        data-testid="mode-rehearse-btn"
                      >
                        <Timer className="size-3.5" />
                        <span>{isArabic ? 'استوديو التدرّب' : 'Rehearse'}</span>
                      </button>
                    </div>

                    {/* Role Context Drawer Toggle */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTargetDrawerOpen(true)}
                      className="h-8 gap-1.5 text-xs text-foreground rounded-lg"
                      title={isArabic ? 'عرض سياق الوظيفة المستهدفة' : 'View Target Role Context'}
                      data-testid="open-context-drawer-btn"
                    >
                      <Target className="size-3.5 text-primary" />
                      <span className="hidden sm:inline">
                        {isArabic ? 'سياق الوظيفة' : 'Job Context'}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyFullSheet}
                      className="h-8 gap-1.5 text-xs text-foreground rounded-lg"
                      data-testid="copy-full-sheet-btn"
                    >
                      {copiedFull ? (
                        <>
                          <Check className="size-3 text-primary" />
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
                      className="h-8 gap-1.5 text-xs text-foreground rounded-lg"
                      data-testid="print-sheet-btn"
                    >
                      <Printer className="size-3.5" />
                      <span>{t.printCheatSheet || 'Print'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      disabled={isCustomAtCap}
                      className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
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
                )}
              </div>

              {/* Instructional Guidance Banner */}
              {!selectedResume.hasGrounding && (
                <div
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-accent/30 text-xs text-foreground"
                  data-testid="grounding-guidance-banner"
                >
                  <Info className="size-4 shrink-0 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block text-foreground">
                      {t.guidanceTitle || 'Guidance for Candidates with No Recorded Projects'}
                    </span>
                    <p className="leading-relaxed text-muted-foreground">
                      {t.guidanceBody ||
                        'No work experiences or projects are currently recorded in your profile. The AI will generate model STAR structures with bracketed placeholders indicating where to supply your own authentic metrics.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Stepped Generation Progress Feedback */}
              {isGenerating && generatingStep && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 text-xs text-foreground animate-in fade-in duration-200">
                  <Sparkles className="size-4 text-primary animate-spin shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <span className="font-semibold text-primary block">
                      {isArabic
                        ? 'جاري تجهيز استوديو المقابلة...'
                        : 'Preparing Interview Studio...'}
                    </span>
                    <p className="text-muted-foreground">{generatingStep}</p>
                  </div>
                </div>
              )}

              {/* Generate Inline CTA */}
              {showGenerateCta && !isGenerating && (
                <Card className="border border-dashed border-border/80 bg-card/50 rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center p-8 sm:p-10 text-center space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BookOpenCheck className="size-6" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {t.generateCtaTitle || 'No interview cheat sheet generated yet'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.generateCtaDesc ||
                          'Generate 3 targeted STAR questions grounded in your achievements plus 3 strategic questions to ask the interviewer.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-center pt-1">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleGenerateAll}
                        disabled={isGenerating}
                        className="h-9 gap-2 text-xs font-semibold bg-primary text-primary-foreground shadow-2xs"
                        data-testid="generate-prep-btn"
                      >
                        <Sparkles className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>
                          {isGenerating
                            ? t.generating || 'Generating Questions...'
                            : t.generateButton || 'Generate Cheat Sheet'}
                        </span>
                      </Button>

                      {!hasAnyQuestions && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomQuestion}
                          disabled={isCustomAtCap}
                          className="h-9 gap-1.5 text-xs text-foreground rounded-lg"
                          data-testid="add-custom-question-btn"
                        >
                          <Plus className="size-3.5" />
                          <span>{t.addCustomQuestion || 'Add Custom Question'}</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Mode Switching: Rehearsal Studio vs Edit Stories */}
              {payload && payload.questions.length > 0 && (
                <div dir={contentDir}>
                  {viewMode === 'rehearse' ? (
                    <RehearsalStudio
                      questions={payload.questions}
                      lang={lang}
                      onExit={() => setViewMode('edit')}
                      roleTitle={selectedResume.roleTitle}
                      companyName={selectedResume.companyName}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Collapse All / Expand All Toggle */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                        <span>
                          {isArabic
                            ? `${payload.questions.length} أسئلة STAR مجهزة`
                            : `${payload.questions.length} STAR questions prepared`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAllExpanded((prev) => !prev)}
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {allExpanded ? (
                            <>
                              <ChevronUp className="size-3.5" />
                              <span>{isArabic ? 'طي الكل' : 'Collapse All'}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-3.5" />
                              <span>{isArabic ? 'توسيع الكل' : 'Expand All'}</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {/* STAR Questions List */}
                      <div className="space-y-4">
                        {payload.questions.map((q, idx) => (
                          <StarQuestionCard
                            key={q.id || idx}
                            question={q}
                            index={idx}
                            onChange={(updated) => handleQuestionChange(idx, updated)}
                            onRegenerate={() => handleRegenerateQuestion(q.id)}
                            onDelete={() => handleDeleteCustomQuestion(q.id)}
                            onRestorePrevious={() => handleRestoreDraft(q.id)}
                            hasPreviousDraft={Boolean(previousDrafts[q.id])}
                            isRegenerating={regeneratingQuestionId === q.id}
                            isInitiallyExpanded={allExpanded}
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
                          className="gap-1.5 text-xs text-foreground rounded-lg"
                          data-testid="add-custom-question-bottom-btn"
                        >
                          <Plus className="size-3.5" />
                          <span>{t.addCustomQuestion || 'Add Custom Question'}</span>
                        </Button>
                        {isCustomAtCap && (
                          <span className="text-xs text-muted-foreground">
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
          )}
        </div>
      </div>
    </div>
  )
}
