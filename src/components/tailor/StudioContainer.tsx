'use client'

import * as React from 'react'
import type { AiProvider } from '@prisma/client'
import { ExperienceForm } from './ExperienceForm'
import { JobPostingForm } from './JobPostingForm'
import { LiveTailorStream } from './LiveTailorStream'
import { ProviderSwitcher } from '@/components/provider-settings/ProviderSwitcher'
import { Button } from '@/components/ui/button'
import { Sparkles, Square, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { CandidateExperienceInput } from '@/lib/validations/tailor'
import { saveCandidateProfile } from '@/app/actions/tailor'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

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
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function StudioContainer({
  initialProfile,
  initialActiveProvider = null,
  initialDefaultModel = null,
  configuredProviders = [],
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

  // Streaming State
  const [status, setStatus] = React.useState<'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'>('IDLE')
  const [streamText, setStreamText] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

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
    </div>
  )
}
