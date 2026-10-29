import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { connection } from 'next/server'
import { isSupportedLocale } from '@/lib/i18n/config'
import { BrandMark } from '@/components/landing/BrandMark'
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { verifyPasswordResetToken } from '@/lib/auth/password-reset'
import { getAuthCopy } from '@/components/auth/copy'

export const instant = false

interface ResetPasswordPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Set New Password · Bosla AI',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  await connection()
  const session = await auth()
  if (session?.user) {
    redirect(`/${lang}/tailor`)
  }

  const query = await searchParams
  const rawToken = typeof query.token === 'string' ? query.token : ''
  const copy = getAuthCopy(lang)

  let verificationResult: { valid: boolean; error?: string } = {
    valid: false,
    error: 'Missing or invalid token',
  }
  if (rawToken) {
    verificationResult = await verifyPasswordResetToken(rawToken)
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

          <h1 className="font-serif text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-foreground">
            {copy.resetPasswordTitle}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {copy.resetPasswordLead}
          </p>

          <div className="mt-7">
            {verificationResult.valid ? (
              <ResetPasswordForm lang={lang} token={rawToken} />
            ) : (
              <div className="space-y-4 rounded-[10px] border border-destructive/30 bg-destructive/8 p-5 text-center text-destructive">
                <AlertCircle className="mx-auto h-8 w-8" aria-hidden />
                <div className="space-y-1">
                  <p className="text-[14px] font-bold">
                    {verificationResult.error || 'Invalid or expired reset link'}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">
                    Please request a new password reset link.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/${lang}/forgot-password`}
                    className="inline-flex h-10 items-center justify-center rounded-[8px] bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {copy.sendResetLink}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
