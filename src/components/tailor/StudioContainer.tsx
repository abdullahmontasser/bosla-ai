'use client'

import * as React from 'react'
import type { AiProvider, ResumeGenerationStatus } from '@prisma/client'
import { JobPostingForm } from './JobPostingForm'
import { LiveTailorStream } from './LiveTailorStream'
import { CandidateBadge } from './CandidateBadge'
import { MissingProfileBanner } from './MissingProfileBanner'
import { OutreachAccordion } from './OutreachAccordion'
import { TailorActionBar } from './TailorActionBar'
import { AtsWorkbench } from '@/components/ats'
import { ProviderSwitcher } from '@/components/provider-settings/ProviderSwitcher'
import { Button } from '@/components/ui/button'
import { Sparkles, Square, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import type { TailoredResumeContentSnapshot } from '@/lib/ai/tailor-prompt'

export interface StudioContainerProps {
  initialProfile?: {
    id: string
    headline?: string | null
    summary?: string | null
    candidateName?: string | null
    emailVerified?: boolean
    workExperiences?: Array<{
      companyName: string
      jobTitle: string
      bullets: string[]
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
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function StudioContainer({
  initialProfile,
  initialActiveProvider = null,
  initialDefaultModel = null,
  configuredProviders = [],
  initialLatestTailoredResume = null,
  lang,
  dict,
}: StudioContainerProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'
  const language = isArabic ? 'AR' : 'EN'

  // Provider State
  const [activeProvider, setActiveProvider] = React.useState<AiProvider | null>(
    initialActiveProvider,
  )
  const hasActiveProvider = Boolean(activeProvider)

  // Candidate Profile Guard State (AC-2, AC-3)
  const hasProfile = Boolean(initialProfile?.id)
  const profileId = initialProfile?.id

  // Job Posting State (Prefilled from latest resume job posting if present)
  const [jobTitle, setJobTitle] = React.useState(
    initialLatestTailoredResume?.jobPosting?.title || 'Senior Full Stack Engineer (AI Integration)',
  )
  const [companyName, setCompanyName] = React.useState(
    initialLatestTailoredResume?.jobPosting?.companyName || 'Anthropic Labs Partner',
  )
  const [rawJobDescription, setRawJobDescription] = React.useState(
    initialLatestTailoredResume?.jobPosting?.rawDescription ||
      `We are seeking a Senior Full Stack Engineer with extensive experience in Next.js App Router, TypeScript, and PostgreSQL.
Key Responsibilities:
- Design and implement AI response streaming pipelines with Vercel AI SDK.
- Architect bilingual user interfaces using Tailwind CSS and Radix UI.
- Optimize relational schemas with Prisma ORM and ensure high throughput.
Requirements:
- 5+ years building full stack web applications.
- Strong proficiency in TypeScript, React, and PostgreSQL.`,
  )

  const initialStream = (initialLatestTailoredResume?.tailoredSummary || '').trim()
  const hasValidInitialCompletion = Boolean(
    initialLatestTailoredResume?.id &&
      initialLatestTailoredResume?.status !== 'GENERATING' &&
      initialLatestTailoredResume?.status !== 'FAILED' &&
      (initialStream.length > 0 || initialLatestTailoredResume?.atsScore != null),
  )

  // Streaming & Workbench State (AC-4, AC-5)
  const [status, setStatus] = React.useState<'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'>(
    hasValidInitialCompletion ? 'COMPLETED' : 'IDLE',
  )
  const [streamText, setStreamText] = React.useState(initialStream)
  const [tailoredResumeId, setTailoredResumeId] = React.useState<string | null>(
    hasValidInitialCompletion ? initialLatestTailoredResume?.id || null : null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

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

    if (!hasActiveProvider) return
    if (rawJobDescription.trim().length < 50) {
      setStatus('FAILED')
      setErrorMessage(
        isArabic
          ? 'يجب أن يحتوي وصف الوظيفة على 50 حرفاً على الأقل.'
          : 'Job description must have at least 50 characters.',
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
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          rawJobDescription: rawJobDescription.trim(),
          language,
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
    <div className="space-y-8 pb-8">
      {/* Top Banner, Candidate Badge, and Provider Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t.title || 'Resume Tailoring Studio'}
            </h1>
            {/* Decoupled candidate header badge (AC-3) */}
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
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            {t.subtitle ||
              'Align your experience with target job descriptions in real-time using your active AI provider.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
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
            className="h-7 gap-1 text-xs px-2.5 border-amber-500/40 text-amber-800 dark:text-amber-200"
          >
            <Link href={`/${lang}/settings/providers`}>
              <span>{t.goToSettings || 'Configure Provider'}</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* Studio Workbench Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Job Posting Input & Generate Trigger */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <JobPostingForm
            jobTitle={jobTitle}
            companyName={companyName}
            rawJobDescription={rawJobDescription}
            dict={dict}
            onChange={handleJobPostingChange}
          />

          {/* Action Trigger */}
          <div>
            {isGenerating ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStopGeneration}
                className="w-full h-11 gap-2 text-xs font-semibold shadow-sm"
              >
                <Square className="size-3.5 fill-current" />
                {t.stopGenerating || 'Stop Generation'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={handleStartTailoring}
                disabled={!hasProfile || !hasActiveProvider || rawJobDescription.trim().length < 50}
                className="w-full h-11 gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                {t.tailorButton || 'Generate Tailored Resume'}
              </Button>
            )}

            {!hasProfile && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                {t.profileMissingWarning ||
                  (isArabic
                    ? 'يرجى إنشاء ملفك المهني أولاً لتفعيل إنشاء السيرة الذاتية.'
                    : 'Please create your master profile to enable resume tailoring.')}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Live Streaming Preview Island (AC-4) */}
        <div className="lg:col-span-6 flex flex-col">
          <LiveTailorStream
            status={status}
            streamText={streamText}
            errorMessage={errorMessage}
            dict={dict}
            onRetry={handleStartTailoring}
          />
        </div>
      </div>

      {/* Studio Post-Tailoring Results Workbenches (AC-5, AC-6, AC-7, AC-8, AC-9) */}
      {tailoredResumeId && status === 'COMPLETED' && (
        <div className="pt-8 border-t border-border/70 space-y-6" data-testid="studio-workbenches">
          {/* Unified Workflow Handoff Bar placed cleanly without overlapping content (AC-8, AC-9) */}
          <TailorActionBar
            tailoredResumeId={tailoredResumeId}
            jobTitle={jobTitle}
            companyName={companyName}
            initialHasApplication={Boolean(initialLatestTailoredResume?.hasApplication)}
            lang={lang}
            dict={dict}
          />

          {/* Integrated ATS Match Scoring & Vector PDF Export (AC-5, AC-6) */}
          <AtsWorkbench
            tailoredResumeId={tailoredResumeId}
            initialAtsScore={initialLatestTailoredResume?.atsScore}
            initialBreakdown={initialLatestTailoredResume?.atsBreakdown as never}
            initialExperiences={initialExperiences}
            lang={lang}
            dict={dict}
          />

          {/* Collapsible Lazy-Loaded Outreach Accordion (AC-7) */}
          <OutreachAccordion
            tailoredResumeId={tailoredResumeId}
            initialHasOutreach={Boolean(
              initialLatestTailoredResume?.hasOutreach ||
              initialLatestTailoredResume?.outreachMessage,
            )}
            initialOutreach={null}
            lang={lang}
            dict={dict}
          />
        </div>
      )}
    </div>
  )
}
