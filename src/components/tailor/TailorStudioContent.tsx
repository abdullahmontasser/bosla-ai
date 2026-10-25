'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import { StudioContainer } from './StudioContainer'
import { SignInCard } from './SignInCard'
import { getTailorStudioInitialData, type TailorStudioData } from '@/app/actions/tailor'
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
}

export function TailorStudioContent({ lang, dict, initialData }: TailorStudioContentProps) {
  const [data, setData] = useState<TailorStudioData | null>(initialData ?? null)
  const language = lang === 'ar' ? 'AR' : 'EN'

  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getTailorStudioInitialData(language)
        setData(result)
      } catch {
        setData({
          session: null,
          profile: null,
          activeProvider: null,
          defaultModel: null,
          configuredProviders: [],
        })
      }
    })
  }, [language])

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
      initialProfile={data.profile}
      initialActiveProvider={data.activeProvider}
      initialDefaultModel={data.defaultModel}
      configuredProviders={data.configuredProviders}
      lang={lang as 'en' | 'ar'}
      dict={dict}
    />
  )
}
