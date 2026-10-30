import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { getTailorStudioInitialData } from '@/app/actions/tailor'
import { TailorStudioContent, TailorStudioSkeleton } from '@/components/tailor'
import { WorkspaceHeader } from '@/components/workspace'

export const instant = false

export default async function TailorStudioPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  await requireSession(lang, `/${lang}/tailor`)

  const language = lang === 'ar' ? 'AR' : 'EN'
  const [dict, initialData] = await Promise.all([
    getDictionary(lang),
    getTailorStudioInitialData(language),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={dict.tailor?.title || 'Tailoring Studio'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<TailorStudioSkeleton />}>
          <TailorStudioContent lang={lang} dict={dict} initialData={initialData} />
        </Suspense>
      </main>
    </div>
  )
}
