import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { ProviderCardsContainer, ProviderCardsSkeleton } from '@/components/provider-settings'
import { LanguageSwitcher, ThemeSwitcher, Button } from '@/components/ui'
import { ArrowLeft, Cpu, ShieldCheck } from 'lucide-react'

export default async function SettingsProvidersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="font-semibold text-foreground tracking-tight">
                  {dict.common.brand}
                </span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 flex-1">
        {/* Page Header */}
        <div className="mb-8 space-y-2 text-start">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {dict.providerSettings.title}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            {dict.providerSettings.description}
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>AES-256-GCM encrypted server side before storage</span>
          </div>
        </div>

        {/* 5 Provider Cards Grid inside Suspense */}
        <Suspense fallback={<ProviderCardsSkeleton />}>
          <ProviderCardsContainer dict={dict} />
        </Suspense>
      </main>
    </div>
  )
}
