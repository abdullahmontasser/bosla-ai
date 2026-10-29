import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { ResumeIngestionContainer } from '@/components/resume'
import { ResumeHealthPanel } from '@/components/health/ResumeHealthPanel'
import { WorkspaceHeader } from '@/components/workspace'

export const instant = false

export default async function ResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const session = await requireSession(lang, `/${lang}/resume`)
  const userId = session.user?.id
  if (!userId) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const auditLangParam = resolvedSearchParams.auditLang
  // The audit target language is a per view override, not a page navigation.
  const auditLang: 'en' | 'ar' =
    typeof auditLangParam === 'string' && isSupportedLocale(auditLangParam)
      ? (auditLangParam as 'en' | 'ar')
      : lang

  const dict = await getDictionary(lang)
  const r = dict.resume || {}

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={r.title || 'Resume Health & Ingestion'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {r.title || 'Resume Health & Ingestion'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{r.subtitle || ''}</p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-lg bg-card animate-pulse" />}>
          <ResumeHealthPanel
            key={auditLang}
            userId={userId}
            pageLang={lang}
            auditLang={auditLang}
            dict={dict}
          />
        </Suspense>

        <div id="resume-ingestion" className="mt-8">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-card" />}>
            <ResumeIngestionContainer lang={lang} dict={dict} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
