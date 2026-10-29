import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { isSupportedLocale } from '@/lib/i18n/config'
import { BrandMark } from '@/components/landing/BrandMark'
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui'
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard'
import { verifyEmailToken } from '@/lib/auth/email-verification'
import { getAuthCopy } from '@/components/auth/copy'

export const instant = false

interface VerifyEmailPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Verify Email · Bosla AI',
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const query = await searchParams
  const email = typeof query.email === 'string' ? query.email : ''
  const token = typeof query.token === 'string' ? query.token : ''
  const copy = getAuthCopy(lang)

  let status: 'success' | 'failed' | 'expired' = 'failed'
  let errorMessage: string | undefined

  if (email && token) {
    const res = await verifyEmailToken(email, token)
    if (res.success) {
      status = 'success'
    } else {
      status = res.error?.includes('expired') ? 'expired' : 'failed'
      errorMessage = res.error
    }
  } else {
    errorMessage = 'Missing verification parameters. Request a new verification link below.'
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-[72px] items-center justify-between gap-3 border-b border-border px-5 sm:px-8">
        <Link
          href={`/${lang}/login`}
          className="inline-flex items-center gap-2 rounded-[6px] text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          <span>{copy.backToLogin}</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLang={lang} />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <div className="mb-6">
            <Link
              href={`/${lang}`}
              className="inline-flex items-center gap-2.5"
              aria-label={copy.brand}
            >
              <BrandMark />
              <span className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-[-0.02em] text-foreground">
                  {copy.brand}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  AI
                </span>
              </span>
            </Link>
          </div>

          <VerifyEmailCard lang={lang} email={email} status={status} errorMessage={errorMessage} />
        </div>
      </main>
    </div>
  )
}
