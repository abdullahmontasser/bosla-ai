import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { getCareerPrepData } from '@/lib/db/career-prep'
import { WorkspaceHeader } from '@/components/workspace'
import { CareerPrepClient } from './CareerPrepClient'

export const instant = false

export interface CareerPrepPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ tailoredResumeId?: string; invalid?: string }>
}

export default async function CareerPrepPage({ params, searchParams }: CareerPrepPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const session = await requireSession(lang, `/${lang}/career-prep`)
  const userId = session.user?.id
  if (!userId) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const tailoredResumeId = resolvedSearchParams?.tailoredResumeId
  // Consume the notice the print route appends when redirecting an invalid/owned-less id (AC-8)
  const invalidNotice = resolvedSearchParams?.invalid === '1'

  const dict = await getDictionary(lang)
  const t = dict.careerPrep ?? {}

  const data = await getCareerPrepData(userId, tailoredResumeId)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={t.title || 'Career Prep & STAR Hub'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t.title || 'Career Prep & STAR Hub'}
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t.subtitle ||
                'Targeted STAR interview practice grounded in your authentic achievements, with printable cheat sheets and custom questions.'}
            </p>
          </div>

          <CareerPrepClient
            key={data.selectedResume?.id ?? 'empty'}
            lang={lang as 'en' | 'ar'}
            dict={dict}
            initialSelectorRows={data.selectorRows}
            initialHasMore={data.hasMore}
            initialSelectedResume={data.selectedResume}
            fallbackNotice={data.fallbackNotice || invalidNotice}
          />
        </div>
      </main>
    </div>
  )
}
