import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { ProviderCardsContainer, ProviderCardsSkeleton } from '@/components/provider-settings'
import { WorkspaceHeader } from '@/components/workspace'
import { Cpu, ShieldCheck } from 'lucide-react'

export const instant = false

export default async function SettingsProvidersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  await requireSession(lang, `/${lang}/settings/providers`)

  const dict = await getDictionary(lang)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={dict.providerSettings.title} />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2 text-start">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {dict.providerSettings.title}
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {dict.providerSettings.description}
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
            <span>
              {lang === 'ar'
                ? 'مشفّر على الخادم بـ AES-256-GCM قبل التخزين'
                : 'AES-256-GCM encrypted server side before storage'}
            </span>
          </div>
        </div>

        <Suspense fallback={<ProviderCardsSkeleton />}>
          <ProviderCardsContainer dict={dict} />
        </Suspense>
      </main>
    </div>
  )
}
