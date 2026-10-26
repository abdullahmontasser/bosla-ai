'use client'

import React, { useState, useEffect, useCallback, startTransition } from 'react'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { getApplications } from '@/app/actions/application-actions'
import { KanbanContainer } from './KanbanContainer'
import { SignInCard } from '@/components/tailor/SignInCard'

export function TrackerContentSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse pt-4"
      data-testid="tracker-skeleton"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-96 rounded-xl bg-card/60 border border-border/40" />
      ))}
    </div>
  )
}

export interface TrackerContentProps {
  lang: string
  dict: Dictionary
  initialApplications?: ApplicationWithRelations[] | null
}

export function TrackerContent({ lang, dict, initialApplications }: TrackerContentProps) {
  const [applications, setApplications] = useState<ApplicationWithRelations[] | null>(
    initialApplications ?? null,
  )
  const [isUnauthorized, setIsUnauthorized] = useState(false)

  const loadApplications = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await getApplications()
        if (res.success) {
          setApplications(res.applications)
          setIsUnauthorized(false)
        } else if (res.error === 'Unauthorized') {
          setIsUnauthorized(true)
        } else {
          setApplications([])
        }
      } catch {
        setApplications([])
      }
    })
  }, [])

  useEffect(() => {
    if (initialApplications === undefined) {
      loadApplications()
    }
  }, [initialApplications, loadApplications])

  if (isUnauthorized) {
    return (
      <div className="flex items-center justify-center py-12">
        <SignInCard lang={lang} dict={dict} onSuccess={loadApplications} />
      </div>
    )
  }

  if (applications === null) {
    return <TrackerContentSkeleton />
  }

  return <KanbanContainer initialApplications={applications} lang={lang} dict={dict} />
}
