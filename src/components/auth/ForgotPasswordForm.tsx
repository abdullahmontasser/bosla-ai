'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPasswordResetAction } from '@/app/actions/password-reset-actions'
import { getAuthCopy } from './copy'

export interface ForgotPasswordFormProps {
  lang: string
}

export function ForgotPasswordForm({ lang }: ForgotPasswordFormProps) {
  const copy = getAuthCopy(lang)
  const [email, setEmail] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    if (!email.trim() || !email.includes('@')) {
      setError(copy.emailValidation.invalid)
      return
    }

    setPending(true)
    setError(null)

    const res = await requestPasswordResetAction(email, lang)
    setPending(false)

    if (res.success) {
      setSubmitted(true)
      if (res.previewUrl) {
        setPreviewUrl(res.previewUrl)
      }
    } else {
      setError(res.error ?? copy.errors.unknown)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-5 rounded-[10px] border border-border/80 bg-card p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[17px] font-bold text-foreground">{copy.forgotPasswordSentTitle}</h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {copy.forgotPasswordSentLead}
          </p>
        </div>

        {previewUrl ? (
          <div className="rounded-[8px] border border-dashed border-primary/40 bg-primary/5 p-3.5 text-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Development Preview Link
            </p>
            <a
              href={previewUrl}
              className="mt-1.5 block break-all text-[12.5px] font-medium text-foreground underline hover:text-primary"
            >
              {previewUrl}
            </a>
          </div>
        ) : null}

        <div className="pt-2">
          <Link
            href={`/${lang}/login`}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            <span>{copy.backToLogin}</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-[8px] border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-[13px] leading-relaxed text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="block text-[13px] font-semibold text-foreground">
          {copy.email}
        </label>
        <div className="relative">
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-card pe-10"
          />
          <Mail
            className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full justify-center gap-2 text-sm font-bold"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>{copy.sending}</span>
          </>
        ) : (
          <>
            <span>{copy.sendResetLink}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </>
        )}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href={`/${lang}/login`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          <span>{copy.backToLogin}</span>
        </Link>
      </div>
    </form>
  )
}
