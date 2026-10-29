import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { TrackerContent, TrackerContentSkeleton } from '@/components/tracker'
import { WorkspaceHeader } from '@/components/workspace'

export const instant = false

export interface TrackerPageProps {
  params: Promise<{ lang: string }>
}

export default async function TrackerPage({ params }: TrackerPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  await requireSession(lang, `/${lang}/tracker`)

  const dict = await getDictionary(lang)
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={t.title || 'Job Application Tracker'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t.title || 'Job Application Tracker'}
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t.subtitle ||
                'Track and organize your applications across hiring stages with connected resumes, ATS scores, and outreach notes.'}
            </p>
          </div>

          <Suspense fallback={<TrackerContentSkeleton />}>
            <TrackerContent lang={lang} dict={dict} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
