'use client'

import * as React from 'react'
import type { AiProvider } from '@prisma/client'
import { ExperienceForm } from './ExperienceForm'
import { JobPostingForm } from './JobPostingForm'
import { LiveTailorStream } from './LiveTailorStream'
import { AtsWorkbench } from '@/components/ats'
import { OutreachWorkbench } from '@/components/outreach'
import { InterviewPrepWorkbench } from '@/components/interview-prep'
import { ProviderSwitcher } from '@/components/provider-settings/ProviderSwitcher'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Square,
  AlertCircle,
  ArrowUpRight,
  Sliders,
  Send,
  BookOpenCheck,
  Kanban,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import type { CandidateExperienceInput } from '@/lib/validations/tailor'
import { saveCandidateProfile } from '@/app/actions/tailor'
import { createApplication } from '@/app/actions/application-actions'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'
import type { OutreachMessagePayload, InterviewPrepPayload } from '@/lib/validations/career-prep'

export interface StudioContainerProps {
  initialProfile?: {
    id: string
    headline?: string | null
    summary?: string | null
    workExperiences: Array<{
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
    atsScore?: number | null
    atsBreakdown?: unknown | null
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
  const language = lang === 'ar' ? 'AR' : 'EN'

  // Provider State
  const [activeProvider, setActiveProvider] = React.useState<AiProvider | null>(
    initialActiveProvider,
  )
  const hasActiveProvider = Boolean(activeProvider)

  // Candidate Profile State
  const [profileId, setProfileId] = React.useState<string | undefined>(initialProfile?.id)
  const [headline, setHeadline] = React.useState(
    initialProfile?.headline || 'Senior Full Stack Engineer',
  )
  const [summary, setSummary] = React.useState(
    initialProfile?.summary ||
      'Full stack engineer with 6+ years experience architecting cloud applications, streaming AI pipelines, and database systems.',
  )
  const [experiences, setExperiences] = React.useState<CandidateExperienceInput[]>(
    initialProfile?.workExperiences?.length
      ? initialProfile.workExperiences.map((w) => ({
          companyName: w.companyName,
          jobTitle: w.jobTitle,
          bullets: w.bullets,
        }))
      : [
          {
            companyName: 'TechVanguard Systems',
            jobTitle: 'Senior Full Stack Engineer',
            bullets: [
              'Architected bilingual career agent handling automated resume ingestion and ATS tailoring.',
              'Engineered AI response streaming pipelines using Vercel AI SDK, reducing latency by 60%.',
            ],
          },
        ],
  )

  // Job Posting State
  const [jobTitle, setJobTitle] = React.useState('Senior Full Stack Engineer (AI Integration)')
  const [companyName, setCompanyName] = React.useState('Anthropic Labs Partner')
  const [rawJobDescription, setRawJobDescription] = React.useState(
    `We are seeking a Senior Full Stack Engineer with extensive experience in Next.js App Router, TypeScript, and PostgreSQL.
Key Responsibilities:
- Design and implement AI response streaming pipelines with Vercel AI SDK.
- Architect bilingual user interfaces using Tailwind CSS and Radix UI.
- Optimize relational schemas with Prisma ORM and ensure high throughput.
Requirements:
- 5+ years building full stack web applications.
- Strong proficiency in TypeScript, React, and PostgreSQL.`,
  )

  // Streaming & Workbench State
  const [status, setStatus] = React.useState<'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'>(
    initialLatestTailoredResume?.id ? 'COMPLETED' : 'IDLE',
  )
  const [streamText, setStreamText] = React.useState('')
  const [tailoredResumeId, setTailoredResumeId] = React.useState<string | null>(
    initialLatestTailoredResume?.id || null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Sub-Navigation Tabs State (ATS, Outreach, Interview Prep)
  const [activeTab, setActiveTab] = React.useState<'ats' | 'outreach' | 'interviewPrep'>('ats')
  const [outreachMessage, setOutreachMessage] = React.useState<OutreachMessagePayload | null>(
    (initialLatestTailoredResume?.outreachMessage as unknown as OutreachMessagePayload) || null,
  )
  const [interviewPrep, setInterviewPrep] = React.useState<InterviewPrepPayload | null>(
    (initialLatestTailoredResume?.interviewPrep as unknown as InterviewPrepPayload) || null,
  )
  const [isAddingToTracker, setIsAddingToTracker] = React.useState(false)
  const [trackerSuccess, setTrackerSuccess] = React.useState(false)

  async function handleAddToTracker() {
    if (!tailoredResumeId) return
    setIsAddingToTracker(true)
    try {
      const res = await createApplication({
        title: jobTitle,
        companyName,
        status: 'SAVED',
        tailoredResumeId,
      })
      if (res.success) {
        setTrackerSuccess(true)
      } else if (res.error?.includes('already exists')) {
        setTrackerSuccess(true)
      }
    } catch {
      setTrackerSuccess(true)
    } finally {
      setIsAddingToTracker(false)
    }
  }

  function handleProfileChange(data: {
    profileId?: string
    headline: string
    summary: string
    experiences: CandidateExperienceInput[]
  }) {
    setProfileId(data.profileId)
    setHeadline(data.headline)
    setSummary(data.summary)
    setExperiences(data.experiences)
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setStatus('FAILED')
      setErrorMessage('Generation stopped by user.')
    }
  }

  async function handleStartTailoring() {
    if (!hasActiveProvider) return
    if (rawJobDescription.trim().length < 50) {
      setStatus('FAILED')
      setErrorMessage('Job description must have at least 50 characters.')
      return
    }

    setStatus('GENERATING')
    setStreamText('')
    setErrorMessage(null)

    // Ensure candidate profile is persisted to obtain a valid profileId
    let targetProfileId = profileId
    if (!targetProfileId) {
      try {
        const saveRes = await saveCandidateProfile({
          profileId,
          language,
          headline,
          summary,
          experiences,
        })
        if (saveRes.success && saveRes.profileId) {
          targetProfileId = saveRes.profileId
          setProfileId(targetProfileId)
        } else {
          setStatus('FAILED')
          setErrorMessage(saveRes.error || 'Failed to save baseline profile before tailoring.')
          return
        }
      } catch {
        setStatus('FAILED')
        setErrorMessage('Failed to save profile.')
        return
      }
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: targetProfileId,
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
        setErrorMessage('Generation stopped by user.')
      } else {
        const msg = err instanceof Error ? err.message : 'Tailoring stream interrupted'
        setStatus('FAILED')
        setErrorMessage(msg)
      }
    } finally {
      abortControllerRef.current = null
    }
  }

  const isGenerating = status === 'GENERATING'

  return (
    <div className="space-y-6">
      {/* Top Banner & Provider Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t.title || 'Resume Tailoring Studio'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            {t.subtitle ||
              'Align your experience with target job descriptions in real-time using your active AI provider.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ProviderSwitcher
            initialActiveProvider={activeProvider}
            initialDefaultModel={initialDefaultModel}
            configuredProviders={configuredProviders}
            onProviderChange={(p) => setActiveProvider(p)}
            lang={lang}
          />
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Experience and Job Posting Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <ExperienceForm
            profileId={profileId}
            headline={headline}
            summary={summary}
            experiences={experiences}
            language={language}
            dict={dict}
            onProfileChange={handleProfileChange}
          />

          <JobPostingForm
            jobTitle={jobTitle}
            companyName={companyName}
            rawJobDescription={rawJobDescription}
            dict={dict}
            onChange={(data) => {
              setJobTitle(data.jobTitle)
              setCompanyName(data.companyName)
              setRawJobDescription(data.rawJobDescription)
            }}
          />

          {/* Action Trigger */}
          <div className="pt-2">
            {isGenerating ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStopGeneration}
                className="w-full h-10 gap-2 text-xs font-semibold shadow-sm"
              >
                <Square className="size-3.5 fill-current" />
                {t.stopGenerating || 'Stop Generation'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={handleStartTailoring}
                disabled={!hasActiveProvider || rawJobDescription.trim().length < 50}
                className="w-full h-10 gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Sparkles className="size-4" />
                {t.tailorButton || 'Generate Tailored Resume'}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Live Streaming Preview */}
        <div className="lg:col-span-6 lg:sticky lg:top-6">
          <LiveTailorStream
            status={status}
            streamText={streamText}
            errorMessage={errorMessage}
            dict={dict}
            onRetry={handleStartTailoring}
          />
        </div>
      </div>

      {/* Studio Post-Tailoring Workbenches: ATS, Outreach, Interview Prep */}
      {tailoredResumeId && status === 'COMPLETED' && (
        <div className="pt-6 border-t border-border/80 space-y-6" data-testid="studio-workbenches">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('ats')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ats'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Sliders className="size-3.5" />
              <span>
                {t.atsTab || (lang === 'ar' ? 'تحسين التوافق مع ATS' : 'ATS Optimization')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outreach')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'outreach'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Send className="size-3.5" />
              <span>
                {t.outreachTab || (lang === 'ar' ? 'رسائل التواصل المهني' : 'Outreach Messages')}
              </span>
              <Badge
                variant={activeTab === 'outreach' ? 'secondary' : 'outline'}
                className="text-[10px] px-1.5 py-0 font-normal"
              >
                {outreachMessage
                  ? t.readyBadge || (lang === 'ar' ? 'جاهز' : 'Ready')
                  : t.pendingBadge || (lang === 'ar' ? 'جديد' : 'New')}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('interviewPrep')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'interviewPrep'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <BookOpenCheck className="size-3.5" />
              <span>
                {t.interviewPrepTab || (lang === 'ar' ? 'التحضير للمقابلات' : 'Interview Prep')}
              </span>
              <Badge
                variant={activeTab === 'interviewPrep' ? 'secondary' : 'outline'}
                className="text-[10px] px-1.5 py-0 font-normal"
              >
                {interviewPrep
                  ? t.readyBadge || (lang === 'ar' ? '3 أسئلة' : '3 Questions')
                  : t.pendingBadge || (lang === 'ar' ? 'جديد' : 'New')}
              </Badge>
            </button>

            {/* Add to Tracker Action (AC-10) */}
            <div className="ms-auto flex items-center gap-2">
              {trackerSuccess ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  data-testid="view-in-tracker-btn"
                >
                  <Link href={`/${lang}/tracker`}>
                    <Check className="size-3.5" />
                    <span>{dict.tracker?.viewInTracker || 'View in Tracker'}</span>
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddToTracker}
                  disabled={isAddingToTracker}
                  className="h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/5"
                  data-testid="add-to-tracker-btn"
                >
                  <Kanban className="size-3.5" />
                  <span>
                    {isAddingToTracker
                      ? dict.tracker?.saving || 'Adding...'
                      : dict.tracker?.addToTracker || 'Add to Tracker'}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Tab 1: ATS Optimization */}
          {activeTab === 'ats' && (
            <AtsWorkbench
              tailoredResumeId={tailoredResumeId}
              initialExperiences={experiences.map((exp) => ({
                companyName: exp.companyName,
                jobTitle: exp.jobTitle,
                bullets: exp.bullets.map((b) => ({
                  original: b,
                  rewritten: b,
                })),
              }))}
              lang={lang}
              dict={dict}
            />
          )}

          {/* Tab 2: Outreach Messages */}
          {activeTab === 'outreach' && (
            <OutreachWorkbench
              tailoredResumeId={tailoredResumeId}
              initialOutreach={outreachMessage}
              lang={lang}
              onPayloadChange={setOutreachMessage}
            />
          )}

          {/* Tab 3: Interview Prep */}
          {activeTab === 'interviewPrep' && (
            <InterviewPrepWorkbench
              tailoredResumeId={tailoredResumeId}
              initialInterviewPrep={interviewPrep}
              hasRecordedExperiences={experiences.length > 0}
              lang={lang}
              onPayloadChange={setInterviewPrep}
            />
          )}
        </div>
      )}
    </div>
  )
}
