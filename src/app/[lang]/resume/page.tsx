import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { ResumeIngestionContainer } from '@/components/resume'
import { LanguageSwitcher, ThemeSwitcher, Button } from '@/components/ui'
import { ArrowLeft, FileText } from 'lucide-react'

export default async function ResumePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)
  const r = dict.resume || {}

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navbar */}
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
              <FileText className="size-3.5 text-primary" />
              <span>{r.title || 'Resume Ingestion'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {r.title || 'Resume Ingestion & Parsing'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {r.subtitle ||
              'Upload your existing PDF or Word resume in English or Arabic to populate your career profile.'}
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-lg bg-card animate-pulse" />}>
          <ResumeIngestionContainer lang={lang} dict={dict} />
        </Suspense>
      </main>
    </div>
  )
}
