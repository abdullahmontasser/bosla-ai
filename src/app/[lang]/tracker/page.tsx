import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { TrackerContent, TrackerContentSkeleton } from '@/components/tracker'
import { LanguageSwitcher, ThemeSwitcher, Button } from '@/components/ui'
import { ArrowLeft, Kanban, Sparkles, FileText } from 'lucide-react'

export interface TrackerPageProps {
  params: Promise<{ lang: string }>
}

export default async function TrackerPage({ params }: TrackerPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
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
              <Kanban className="size-3.5 text-primary" />
              <span>{t.title || 'Job Application Tracker'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/${lang}/tailor`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden md:inline">Tailor Studio</span>
              </Button>
            </Link>
            <Link href={`/${lang}/resume`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <FileText className="size-3.5" />
                <span className="hidden md:inline">Resumes</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 flex-1">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t.title || 'Job Application Tracker'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              {t.subtitle ||
                'Track and organize your applications across hiring stages with connected resumes, ATS scores, and outreach notes.'}
            </p>
          </div>

          {/* Kanban Board Container Wrapped in Suspense */}
          <Suspense fallback={<TrackerContentSkeleton />}>
            <TrackerContent lang={lang} dict={dict} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
