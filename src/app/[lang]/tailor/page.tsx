import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale, type ResumeLanguage } from '@/lib/i18n/config'
import { getActiveResumeLanguage } from '@/lib/i18n/resume-language'
import { requireSession } from '@/lib/auth/require-session'
import { getTailorStudioInitialData } from '@/app/actions/tailor'
import { TailorStudioContent, TailorStudioSkeleton } from '@/components/tailor'
import { WorkspaceHeader } from '@/components/workspace'

export const instant = false

export default async function TailorStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams?: Promise<{ resumeLang?: string }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
    return null
  }

  await requireSession(lang, `/${lang}/tailor`)

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const resumeLanguage: ResumeLanguage = await getActiveResumeLanguage(
    resolvedSearchParams?.resumeLang,
  )

  const [dict, initialData] = await Promise.all([
    getDictionary(lang),
    getTailorStudioInitialData(resumeLanguage),
  ])

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      <WorkspaceHeader
        lang={lang}
        section={dict.tailor?.title || 'Tailoring Studio'}
        resumeLanguage={resumeLanguage}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<TailorStudioSkeleton />}>
            <TailorStudioContent
              key={resumeLanguage}
              lang={lang}
              dict={dict}
              initialData={initialData}
              initialResumeLanguage={resumeLanguage}
            />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
