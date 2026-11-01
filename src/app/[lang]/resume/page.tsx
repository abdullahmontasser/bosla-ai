import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UploadCloud, UserRound } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { ResumeIngestionContainer } from '@/components/resume'
import { ResumeHealthPanel } from '@/components/health/ResumeHealthPanel'
import { WorkspaceHeader } from '@/components/workspace'
import { Button } from '@/components/ui/button'

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
  const isAr = lang === 'ar'

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={r.title || 'Resume Health & Ingestion'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {r.title || 'Resume Health & Ingestion'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{r.subtitle || ''}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <Link href={`/${lang}/profile`}>
                <UserRound className="size-3.5" />
                <span>{isAr ? 'تعديل الملف المهني' : 'Edit Profile'}</span>
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <a href="#resume-ingestion">
                <UploadCloud className="size-3.5" />
                <span>{isAr ? 'رفع سيرة ذاتية (PDF/DOCX)' : 'Upload Resume (PDF/DOCX)'}</span>
              </a>
            </Button>
          </div>
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

        <div id="resume-ingestion" className="pt-2 scroll-mt-20">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-card" />}>
            <ResumeIngestionContainer lang={lang} dict={dict} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
