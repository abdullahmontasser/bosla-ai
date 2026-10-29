'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPasswordAction } from '@/app/actions/password-reset-actions'
import { evaluatePasswordStrength, PasswordSchema } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'
import { getAuthCopy } from './copy'

export interface ResetPasswordFormProps {
  lang: string
  token: string
}

export function ResetPasswordForm({ lang, token }: ResetPasswordFormProps) {
  const copy = getAuthCopy(lang)
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const passwordEval = React.useMemo(() => {
    return evaluatePasswordStrength(password)
  }, [password])

  const strengthColorClass = React.useMemo(() => {
    switch (passwordEval.score) {
      case 1:
        return 'text-destructive'
      case 2:
        return 'text-amber-600 dark:text-amber-400'
      case 3:
        return 'text-emerald-600 dark:text-emerald-400'
      case 4:
        return 'text-emerald-700 dark:text-emerald-300'
      default:
        return 'text-muted-foreground'
    }
  }, [passwordEval.score])

  const strengthLabel = React.useMemo(() => {
    switch (passwordEval.score) {
      case 1:
        return copy.passwordStrength.weak
      case 2:
        return copy.passwordStrength.fair
      case 3:
        return copy.passwordStrength.good
      case 4:
        return copy.passwordStrength.strong
      default:
        return copy.passwordStrength.empty
    }
  }, [passwordEval.score, copy])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const parsed = PasswordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.errors.weak_password)
      return
    }

    setPending(true)
    setError(null)

    const res = await resetPasswordAction({ token, password })
    setPending(false)

    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error ?? copy.errors.unknown)
    }
  }

  if (success) {
    return (
      <div className="space-y-5 rounded-[10px] border border-border/80 bg-card p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[17px] font-bold text-foreground">{copy.resetSuccess}</h2>
        </div>

        <div className="pt-2">
          <Link
            href={`/${lang}/login`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <span>{copy.signIn}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
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
        <label htmlFor="new-password" className="block text-[13px] font-semibold text-foreground">
          {copy.newPassword}
        </label>
        <div className="relative">
          <Input
            id="new-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            autoFocus
            required
            minLength={8}
            maxLength={72}
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-card pe-11"
            aria-describedby="reset-strength-panel"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            aria-pressed={showPassword}
            className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {/* Strength Meter Bars & Checklist */}
        <div
          id="reset-strength-panel"
          role="region"
          aria-live="polite"
          className="mt-2 space-y-2.5 rounded-[8px] border border-border/70 bg-card/70 p-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                {copy.passwordStrength.label}
              </span>
              <span className={cn('font-semibold', strengthColorClass)}>{strengthLabel}</span>
            </div>
            <div
              className="grid grid-cols-4 gap-1.5"
              role="progressbar"
              aria-valuenow={passwordEval.score}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label={copy.passwordStrength.label}
            >
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-200',
                  passwordEval.score >= 1
                    ? passwordEval.score === 1
                      ? 'bg-destructive'
                      : passwordEval.score === 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    : 'bg-muted',
                )}
              />
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-200',
                  passwordEval.score >= 2
                    ? passwordEval.score === 2
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : 'bg-muted',
                )}
              />
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-200',
                  passwordEval.score >= 3 ? 'bg-emerald-500' : 'bg-muted',
                )}
              />
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-200',
                  passwordEval.score >= 4 ? 'bg-emerald-600' : 'bg-muted',
                )}
              />
            </div>
          </div>

          <ul className="space-y-1 pt-1 text-[11.5px] leading-tight text-muted-foreground">
            <li className="flex items-center gap-2">
              {passwordEval.requirements.minLength ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : (
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span
                className={cn(
                  passwordEval.requirements.minLength
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {copy.passwordStrength.reqMinLength}
              </span>
            </li>

            <li className="flex items-center gap-2">
              {passwordEval.requirements.hasLower && passwordEval.requirements.hasUpper ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : (
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span
                className={cn(
                  passwordEval.requirements.hasLower && passwordEval.requirements.hasUpper
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {copy.passwordStrength.reqUpperLower}
              </span>
            </li>

            <li className="flex items-center gap-2">
              {passwordEval.requirements.hasNumber ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : (
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span
                className={cn(
                  passwordEval.requirements.hasNumber
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {copy.passwordStrength.reqNumber}
              </span>
            </li>

            <li className="flex items-center gap-2">
              {passwordEval.requirements.hasSpecial ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : (
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span
                className={cn(
                  passwordEval.requirements.hasSpecial
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {copy.passwordStrength.reqSpecial}
              </span>
            </li>
          </ul>
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
            <Lock className="h-4 w-4" aria-hidden />
            <span>{copy.resetPasswordAction}</span>
          </>
        )}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href={`/${lang}/login`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <span>{copy.backToLogin}</span>
        </Link>
      </div>
    </form>
  )
}
