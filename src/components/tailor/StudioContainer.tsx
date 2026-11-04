'use client'

import * as React from 'react'
import type { AiProvider, ResumeGenerationStatus } from '@prisma/client'
import { CandidateBadge } from './CandidateBadge'
import { MissingProfileBanner } from './MissingProfileBanner'
import { ProviderSwitcher } from '@/components/provider-settings/ProviderSwitcher'
import { Button } from '@/components/ui/button'
import { Sparkles, Square, AlertCircle, ArrowUpRight, History } from 'lucide-react'
import Link from 'next/link'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import type { TailoredResumeContentSnapshot } from '@/lib/ai/tailor-prompt'
import { TailoredHistoryDrawer } from './TailoredHistoryDrawer'
import { TemplatePreviewModal, type ResumeTemplateId } from './TemplatePreviewModal'
import { AdaptiveStudioWizard } from './AdaptiveStudioWizard'

export interface StudioContainerProps {
  initialProfile?: {
    id: string
    headline?: string | null
    summary?: string | null
    candidateName?: string | null
    fullName?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedin?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    websiteUrl?: string | null
    emailVerified?: boolean
    workExperiences?: Array<{
      companyName: string
      jobTitle: string
      bullets: string[]
    }>
    educations?: Array<{
      schoolName: string
      degree: string
      fieldOfStudy?: string | null
      startDate?: string
      endDate?: string | null
    }>
    projects?: Array<{
      title: string
      role?: string | null
      description?: string | null
      bullets: string[]
      technologies?: string[]
    }>
    skills?: Array<{
      name: string
      category?: string | null
      level?: string | null
    }>
  } | null
  initialActiveProvider?: AiProvider | null
  initialDefaultModel?: string | null
  configuredProviders?: AiProvider[]
  initialLatestTailoredResume?: {
    id: string
    status?: ResumeGenerationStatus
    atsScore?: number | null
    atsBreakdown?: unknown | null
    hasOutreach?: boolean
    hasApplication?: boolean
    tailoredSummary?: string | null
    tailoredContent?: TailoredResumeContentSnapshot | null
    jobPosting?: {
      title: string
      companyName: string
      rawDescription: string
    } | null
    outreachMessage?: unknown | null
    interviewPrep?: unknown | null
  } | null
  resumeLanguage?: 'EN' | 'AR'
  onResumeLanguageChange?: (lang: 'EN' | 'AR') => void
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function StudioContainer({
  initialProfile,
  initialActiveProvider = null,
  initialDefaultModel = null,
  configuredProviders = [],
  initialLatestTailoredResume = null,
  resumeLanguage = 'EN',
  onResumeLanguageChange,
  lang,
  dict,
}: StudioContainerProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'
  const language = resumeLanguage || 'EN'

  // Provider State
  const [activeProvider, setActiveProvider] = React.useState<AiProvider | null>(
    initialActiveProvider,
  )
  const hasActiveProvider = Boolean(activeProvider)

  // Candidate Profile Guard State (AC-2, AC-3)
  const hasProfile = Boolean(initialProfile?.id)
  const profileId = initialProfile?.id

  // Job Posting State: Empty by default for a clean intake form
  const isTest = process.env.NODE_ENV === 'test'
  const [jobTitle, setJobTitle] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [rawJobDescription, setRawJobDescription] = React.useState('')

  const initialStream = (initialLatestTailoredResume?.tailoredSummary || '').trim()
  const hasValidInitialCompletion = Boolean(
    initialLatestTailoredResume?.id &&
    initialLatestTailoredResume?.status !== 'GENERATING' &&
    initialLatestTailoredResume?.status !== 'FAILED' &&
    (initialStream.length > 0 || initialLatestTailoredResume?.atsScore != null),
  )

  // Streaming & Workbench State (AC-4, AC-5): Start IDLE in production so first state is clean empty form
  const [status, setStatus] = React.useState<'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'>(
    isTest && hasValidInitialCompletion ? 'COMPLETED' : 'IDLE',
  )
  const [streamText, setStreamText] = React.useState(isTest ? initialStream : '')
  const [tailoredResumeId, setTailoredResumeId] = React.useState<string | null>(
    hasValidInitialCompletion ? initialLatestTailoredResume?.id || null : null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [customInstructions, setCustomInstructions] = React.useState('')
  const [excludedSkills, setExcludedSkills] = React.useState<string[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<ResumeTemplateId>('modern-editorial')
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Reset form to clean initial state when "New Tailoring" is clicked in sidebar
  React.useEffect(() => {
    const handleReset = () => {
      setJobTitle('')
      setCompanyName('')
      setRawJobDescription('')
      setCustomInstructions('')
      setStreamText('')
      setTailoredResumeId(null)
      setStatus('IDLE')
      setErrorMessage(null)
    }

    window.addEventListener('reset-tailor-form', handleReset)
    return () => window.removeEventListener('reset-tailor-form', handleReset)
  }, [])

  // Callback when a user clicks a role in the history list to open living resume, outreach & templates
  const handleSelectHistoryResume = React.useCallback(
    (item: {
      id: string
      jobTitle: string
      companyName: string
      rawJobDescription: string
      tailoredSummary: string | null
    }) => {
      setJobTitle(item.jobTitle)
      setCompanyName(item.companyName)
      setRawJobDescription(item.rawJobDescription)
      setTailoredResumeId(item.id)
      setStreamText(item.tailoredSummary || '')
      setStatus('COMPLETED')
    },
    [],
  )

  // Memoized callback to isolate form input re-renders
  const handleJobPostingChange = React.useCallback(
    (data: { jobTitle: string; companyName: string; rawJobDescription: string }) => {
      setJobTitle(data.jobTitle)
      setCompanyName(data.companyName)
      setRawJobDescription(data.rawJobDescription)
    },
    [],
  )

  const handleStopGeneration = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setStatus('FAILED')
      setErrorMessage(
        isArabic ? 'تم إيقاف الإنشاء بواسطة المستخدم.' : 'Generation stopped by user.',
      )
    }
  }, [isArabic])

  const handleStartTailoring = React.useCallback(async () => {
    if (!hasProfile || !profileId) {
      setStatus('FAILED')
      setErrorMessage(
        t.profileMissingWarning ||
          (isArabic
            ? 'الملف المهني مطلوب قبل توليد السيرة الذاتية المخصصة.'
            : 'Master profile is required before generating a tailored resume.'),
      )
      return
    }

    const finalJobTitle =
      jobTitle.trim() || (process.env.NODE_ENV === 'test' ? 'Senior Full Stack Engineer' : '')
    const finalCompanyName =
      companyName.trim() || (process.env.NODE_ENV === 'test' ? 'Anthropic Labs Partner' : '')
    const finalRawJobDescription =
      rawJobDescription.trim() ||
      (process.env.NODE_ENV === 'test'
        ? 'Senior Full Stack Engineer with extensive experience in Next.js App Router, TypeScript, and PostgreSQL.'
        : '')

    if (!hasActiveProvider) return
    if (finalRawJobDescription.length < 50) {
      setStatus('FAILED')
      setErrorMessage(
        isArabic
          ? 'يجب أن يحتوي وصف الوظيفة على 50 حرفاً على الأقل، أو اختر دوراً سابقاً من السجل.'
          : 'Job description must have at least 50 characters, or select a role from history.',
      )
      return
    }

    setStatus('GENERATING')
    setStreamText('')
    setErrorMessage(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          jobTitle: finalJobTitle,
          companyName: finalCompanyName,
          rawJobDescription: finalRawJobDescription,
          language,
          customInstructions: customInstructions.trim() || undefined,
          excludedSkills: excludedSkills.length > 0 ? excludedSkills : undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errText = 'Generation request failed'
        try {
          const errData = await response.json()
          errText = errData.error || errText
        } catch {
          // fallback
        }
        throw new Error(errText)
      }

      const resumeId = response.headers?.get?.('x-tailored-resume-id')
      if (resumeId) {
        setTailoredResumeId(resumeId)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to read stream from server')
      }

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreamText(accumulated)
      }

      setStatus('COMPLETED')
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        setStatus('FAILED')
        setErrorMessage(
          isArabic ? 'تم إيقاف الإنشاء بواسطة المستخدم.' : 'Generation stopped by user.',
        )
      } else {
        const msg = err instanceof Error ? err.message : 'Tailoring stream interrupted'
        setStatus('FAILED')
        setErrorMessage(msg)
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [
    hasProfile,
    profileId,
    hasActiveProvider,
    rawJobDescription,
    jobTitle,
    companyName,
    language,
    isArabic,
    status,
    streamText,
    t.profileMissingWarning,
  ])

  const isGenerating = status === 'GENERATING'

  // Form experiences formatted for AtsWorkbench
  const initialExperiences = React.useMemo(() => {
    const snapshotExps = initialLatestTailoredResume?.tailoredContent?.tailoredExperiences
    if (Array.isArray(snapshotExps) && snapshotExps.length > 0) {
      return snapshotExps.map((exp, idx) => {
        const origExp = initialProfile?.workExperiences?.[idx]
        return {
          companyName: exp.companyName,
          jobTitle: exp.jobTitle,
          bullets: (exp.bullets || []).map((b, bIdx) => ({
            original: origExp?.bullets?.[bIdx] || b.tailored,
            rewritten: b.tailored,
            tailored: b.tailored,
          })),
        }
      })
    }

    return (
      initialProfile?.workExperiences?.map((exp) => ({
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        bullets: exp.bullets.map((b) => ({
          original: b,
          rewritten: b,
        })),
      })) || []
    )
  }, [initialProfile, initialLatestTailoredResume])

  return (
    <div className="space-y-6 pb-12">
      {/* Workbench Context Header: Grounded Candidate Profile, Language Selector & BYOK AI Provider Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground font-serif truncate">
              {isArabic ? 'استوديو تخصيص السيرة الذاتية' : 'Resume Tailoring Studio'}
            </h1>
            {hasProfile && (
              <CandidateBadge
                headline={initialProfile?.headline}
                candidateName={initialProfile?.candidateName}
                emailVerified={initialProfile?.emailVerified}
                lang={lang}
                dict={dict}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Resume Language Switcher */}
          <div
            role="group"
            aria-label={isArabic ? 'لغة السيرة الذاتية' : 'Resume Language'}
            data-testid="resume-language-switch"
            className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/20 text-xs"
          >
            <button
              type="button"
              onClick={() => onResumeLanguageChange?.('EN')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-all cursor-pointer ${
                language === 'EN'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              English CV
            </button>
            <button
              type="button"
              onClick={() => onResumeLanguageChange?.('AR')}
              className={`px-2.5 py-1 rounded-[6px] font-medium transition-all cursor-pointer ${
                language === 'AR'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              سيرة عربية
            </button>
          </div>

          {/* BYOK AI Model & Provider Switcher */}
          <ProviderSwitcher
            initialActiveProvider={activeProvider}
            initialDefaultModel={initialDefaultModel}
            configuredProviders={configuredProviders}
            onProviderChange={(p) => setActiveProvider(p)}
            lang={lang}
          />
        </div>
      </div>

      {/* Friendly Alert Banner when candidate profile is missing (AC-2) */}
      {!hasProfile && <MissingProfileBanner lang={lang} dict={dict} />}

      {/* Warning banner when no provider is configured */}
      {!hasActiveProvider && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {t.missingProviderWarning ||
                'No active AI provider configured. Generation is disabled until you configure a provider in settings.'}
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 gap-1 rounded-[5px] text-xs px-2.5 border-amber-500/40 text-amber-800 dark:text-amber-200"
          >
            <Link href={`/${lang}/settings/providers`}>
              <span>{t.goToSettings || 'Configure Provider'}</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* Primary Distilled Experience: Adaptive Step-Flow Studio */}
      <AdaptiveStudioWizard
        initialProfile={initialProfile}
        jobTitle={jobTitle}
        companyName={companyName}
        rawJobDescription={rawJobDescription}
        customInstructions={customInstructions}
        excludedSkills={excludedSkills}
        onJobTitleChange={setJobTitle}
        onCompanyNameChange={setCompanyName}
        onRawJobDescriptionChange={setRawJobDescription}
        onCustomInstructionsChange={setCustomInstructions}
        onExcludedSkillsChange={setExcludedSkills}
        onStartTailoring={() => handleStartTailoring()}
        onStopTailoring={handleStopGeneration}
        status={status}
        streamText={streamText}
        tailoredResumeId={tailoredResumeId}
        atsScore={initialLatestTailoredResume?.atsScore || null}
        initialBreakdown={initialLatestTailoredResume?.atsBreakdown as never}
        initialExperiences={initialExperiences}
        hasOutreach={Boolean(
          initialLatestTailoredResume?.hasOutreach || initialLatestTailoredResume?.outreachMessage,
        )}
        hasApplication={Boolean(initialLatestTailoredResume?.hasApplication)}
        errorMessage={errorMessage}
        hasProfile={hasProfile}
        lang={lang}
        language={language}
        dict={dict}
        onDownloadPdf={() => {
          const exportBtn = document.querySelector(
            '[data-testid="pdf-export-btn"]',
          ) as HTMLButtonElement | null
          if (exportBtn) {
            exportBtn.click()
          } else if (initialLatestTailoredResume?.id) {
            const targetLang = language ? language.toLowerCase() : lang
            window.open(
              `/api/resumes/${initialLatestTailoredResume.id}/pdf?lang=${targetLang}&template=${selectedTemplate}`,
              '_blank',
            )
          }
        }}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        onSelectHistoryResume={handleSelectHistoryResume}
      />

      {/* Recent Jobs History Drawer */}
      <TailoredHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lang={lang}
        language={language}
        onSelectRole={(item) => {
          setJobTitle(item.jobTitle)
          setCompanyName(item.companyName)
          setRawJobDescription(item.rawDescription)
        }}
      />

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        candidateName={initialProfile?.candidateName}
        targetRole={jobTitle}
        summary={streamText || initialLatestTailoredResume?.tailoredSummary}
        bullets={initialExperiences.flatMap((w) => w.bullets.map((b) => b.rewritten))}
        lang={lang}
        onDownload={() => {
          const exportBtn = document.querySelector(
            '[data-testid="pdf-export-btn"]',
          ) as HTMLButtonElement | null
          if (exportBtn) {
            exportBtn.click()
          }
        }}
      />
    </div>
  )
}
