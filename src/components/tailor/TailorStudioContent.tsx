'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import { StudioContainer } from './StudioContainer'
import { SignInCard } from './SignInCard'
import { getTailorStudioInitialData, type TailorStudioData } from '@/app/actions/tailor'
import { RESUME_LANGUAGE_COOKIE_NAME, type ResumeLanguage } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/types'

export function TailorStudioSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" data-testid="tailor-skeleton">
      <div className="h-10 w-64 bg-muted/60 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <div className="h-64 rounded-lg bg-card/60 border border-border/40 p-4" />
          <div className="h-48 rounded-lg bg-card/60 border border-border/40 p-4" />
        </div>
        <div className="lg:col-span-6">
          <div className="h-96 rounded-lg bg-card/60 border border-border/40 p-4" />
        </div>
      </div>
    </div>
  )
}

export interface TailorStudioContentProps {
  lang: string
  dict: Dictionary
  initialData?: TailorStudioData | null
  initialResumeLanguage?: ResumeLanguage
}

export function TailorStudioContent({
  lang,
  dict,
  initialData,
  initialResumeLanguage = 'EN',
}: TailorStudioContentProps) {
  const [data, setData] = useState<TailorStudioData | null>(initialData ?? null)
  const [resumeLanguage, setResumeLanguage] = useState<ResumeLanguage>(
    initialResumeLanguage || initialData?.resumeLanguage || 'EN',
  )

  const handleResumeLanguageChange = useCallback((newLang: ResumeLanguage) => {
    setResumeLanguage(newLang)

    if (typeof document !== 'undefined') {
      document.cookie = `${RESUME_LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      document.cookie = `careercraft_profile_lang=${newLang.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`

      window.dispatchEvent(
        new CustomEvent('resume-language-changed', {
          detail: { language: newLang },
        }),
      )
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('resumeLang', newLang.toLowerCase())
      window.history.replaceState({}, '', url.toString())
    }

    startTransition(async () => {
      try {
        const result = await getTailorStudioInitialData(newLang)
        setData(result)
      } catch {
        // preserve current
      }
    })
  }, [])

  // Sync internal state when parent props change
  useEffect(() => {
    if (initialResumeLanguage && initialResumeLanguage !== resumeLanguage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResumeLanguage(initialResumeLanguage)
    }
    if (initialData) {
      setData(initialData)
    }
  }, [initialResumeLanguage, initialData])

  // Listen to global resume language changes (e.g. from header switcher)
  useEffect(() => {
    const handleGlobalResumeLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: ResumeLanguage }>
      const newLang = customEvent.detail?.language
      if (newLang && (newLang === 'EN' || newLang === 'AR') && newLang !== resumeLanguage) {
        handleResumeLanguageChange(newLang)
      }
    }

    window.addEventListener('resume-language-changed', handleGlobalResumeLangChange)
    return () => window.removeEventListener('resume-language-changed', handleGlobalResumeLangChange)
  }, [resumeLanguage, handleResumeLanguageChange])

  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getTailorStudioInitialData(resumeLanguage)
        setData(result)
      } catch {
        setData({
          resumeLanguage,
          session: null,
          profile: null,
          activeProvider: null,
          defaultModel: null,
          configuredProviders: [],
        })
      }
    })
  }, [resumeLanguage])

  useEffect(() => {
    if (initialData === undefined) {
      refreshData()
    }
  }, [initialData, refreshData])

  if (!data) {
    return <TailorStudioSkeleton />
  }

  if (!data.session?.user?.id) {
    return (
      <div className="flex items-center justify-center py-6">
        <SignInCard lang={lang} dict={dict} onSuccess={refreshData} />
      </div>
    )
  }

  return (
    <StudioContainer
      key={`${resumeLanguage}-${data.profile?.id || 'none'}-${data.latestTailoredResume?.id || 'none'}`}
      initialProfile={data.profile}
      initialActiveProvider={data.activeProvider}
      initialDefaultModel={data.defaultModel}
      configuredProviders={data.configuredProviders}
      initialLatestTailoredResume={data.latestTailoredResume}
      resumeLanguage={resumeLanguage}
      onResumeLanguageChange={handleResumeLanguageChange}
      lang={lang as 'en' | 'ar'}
      dict={dict}
    />
  )
}
