'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resendVerificationAction } from '@/app/actions/email-verification-actions'
import { getAuthCopy } from './copy'

export interface VerifyEmailCardProps {
  lang: string
  email?: string
  status: 'success' | 'failed' | 'expired'
  errorMessage?: string
}

export function VerifyEmailCard({
  lang,
  email: initialEmail = '',
  status,
  errorMessage,
}: VerifyEmailCardProps) {
  const copy = getAuthCopy(lang)
  const [email, setEmail] = React.useState(initialEmail)
  const [resending, setResending] = React.useState(false)
  const [resent, setResent] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [resendError, setResendError] = React.useState<string | null>(null)

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (resending || !email.trim()) return

    setResending(true)
    setResendError(null)

    const res = await resendVerificationAction(email, lang)
    setResending(false)

    if (res.success) {
      setResent(true)
      if (res.previewUrl) setPreviewUrl(res.previewUrl)
    } else {
      setResendError(res.error ?? copy.errors.unknown)
    }
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 rounded-[10px] border border-border/80 bg-card p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>

        <div className="space-y-2">
          <h2 className="text-[19px] font-bold text-foreground">{copy.verifyEmailTitle}</h2>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            {copy.verifyEmailSuccess}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/${lang}/tailor`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <span>{copy.goToWorkspace}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-[10px] border border-border/80 bg-card p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>

      <div className="space-y-2">
        <h2 className="text-[19px] font-bold text-foreground">{copy.verifyEmailFailed}</h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {errorMessage || 'Your email verification link could not be verified.'}
        </p>
      </div>

      {resent ? (
        <div className="space-y-3 rounded-[8px] border border-emerald-500/30 bg-emerald-500/5 p-4 text-start">
          <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
            {copy.forgotPasswordSentLead}
          </p>
          {previewUrl ? (
            <a
              href={previewUrl}
              className="block break-all text-[12px] text-foreground underline hover:text-primary"
            >
              {previewUrl}
            </a>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-3 text-start">
          {resendError ? <p className="text-[12.5px] text-destructive">{resendError}</p> : null}
          <div className="space-y-1">
            <label
              htmlFor="verify-email"
              className="block text-[12.5px] font-semibold text-foreground"
            >
              {copy.email}
            </label>
            <Input
              id="verify-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              className="h-10 bg-card"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={resending}
            className="h-10 w-full justify-center gap-2 text-xs font-bold"
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            <span>{copy.resendVerification}</span>
          </Button>
        </form>
      )}

      <div className="pt-1">
        <Link
          href={`/${lang}/login`}
          className="text-[12.5px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {copy.backToLogin}
        </Link>
      </div>
    </div>
  )
}
