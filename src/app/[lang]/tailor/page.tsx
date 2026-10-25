import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { TailorStudioContent, TailorStudioSkeleton } from '@/components/tailor'
import { LanguageSwitcher, ThemeSwitcher, Button } from '@/components/ui'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default async function TailorStudioPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Studio Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="font-semibold text-foreground tracking-tight">
                  {dict.common.brand}
                </span>
              </Button>
            </Link>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>{dict.tailor?.title || 'Tailoring Studio'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Studio Canvas */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 flex-1">
        <Suspense fallback={<TailorStudioSkeleton />}>
          <TailorStudioContent lang={lang} dict={dict} />
        </Suspense>
      </main>
    </div>
  )
}
