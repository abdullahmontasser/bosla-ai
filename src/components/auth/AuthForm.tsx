'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInCredentials, signInWithOAuth, signUpWithCredentials } from '@/app/actions/auth'
import type { AuthErrorCode } from '@/app/actions/auth'
import type { OAuthProviderId } from '@/auth'
import { evaluatePasswordStrength, EmailSchema, SignUpSchema } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'
import { getAuthCopy } from './copy'

const DEMO_EMAIL = 'demo@careercraft.ai'
const DEMO_PASSWORD = 'password123'

export interface AuthFormProps {
  lang: string
  mode: 'login' | 'signup'
  callbackUrl: string
  providers: OAuthProviderId[]
  initialError?: string | null
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.36-3.88-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.18 1.77 1.18 1.03 1.78 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.3 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.48 3.14-1.18 3.14-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.79 1.06.79 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.27-1.7 3.72-5.5 3.72A6.13 6.13 0 0 1 5.85 12 6.13 6.13 0 0 1 12 5.82c1.9 0 3.18.8 3.9 1.48l2.66-2.56A9.7 9.7 0 0 0 12 2a10 10 0 1 0 0 20c5.77 0 9.57-4.06 9.57-9.77 0-.66-.07-1.16-.16-1.66H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45c-.87.6-2.03 1.02-3.46 1.02-2.66 0-4.92-1.77-5.73-4.2H3l-.01.02A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.27 13.95A6 6 0 0 1 5.94 12c0-.68.12-1.34.32-1.95L6.24 10H3A10 10 0 0 0 2 12c0 1.6.38 3.12 1.06 4.46l3.21-2.51Z"
      />
      <path
        fill="#4285F4"
        d="M21.57 12.23c0-.66-.06-1.16-.16-1.66H12v3.9h5.5a4.7 4.7 0 0 1-2.04 3.07l3.16 2.45c1.85-1.7 2.95-4.22 2.95-7.76Z"
      />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

const PROVIDER_ICONS: Record<OAuthProviderId, () => React.JSX.Element> = {
  github: GitHubIcon,
  google: GoogleIcon,
  linkedin: LinkedInIcon,
}

function mapAuthJsError(error: string, copy: ReturnType<typeof getAuthCopy>): string {
  switch (error) {
    case 'OAuthAccountNotLinked':
      return copy.errors.oauth_not_linked
    case 'AccessDenied':
      return copy.errors.access_denied
    case 'Configuration':
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
      return copy.errors.configuration
    case 'CredentialsSignin':
      return copy.errors.invalid_credentials
    default:
      return copy.errors.oauth
  }
}

export function AuthForm({ lang, mode, callbackUrl, providers, initialError }: AuthFormProps) {
  const copy = getAuthCopy(lang)
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [emailTouched, setEmailTouched] = React.useState(false)
  const [passwordTouched, setPasswordTouched] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    initialError ? mapAuthJsError(initialError, copy) : null,
  )
  const [pending, setPending] = React.useState(false)
  const [oauthPending, setOauthPending] = React.useState<OAuthProviderId | null>(null)

  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)
  const nameRef = React.useRef<HTMLInputElement>(null)

  const isLogin = mode === 'login'
  const busy = pending || oauthPending !== null

  const effectiveProviders: OAuthProviderId[] = React.useMemo(() => {
    if (providers.includes('google')) return providers
    return ['google', ...providers]
  }, [providers])

  // Password evaluation for real-time strength meter
  const passwordEval = React.useMemo(() => {
    return evaluatePasswordStrength(password)
  }, [password])

  // Email validation for real-time hint
  const emailValidationResult = React.useMemo(() => {
    if (!emailTouched || email.length === 0) return null
    return EmailSchema.safeParse(email)
  }, [email, emailTouched])

  const finish = React.useCallback(() => {
    router.replace(callbackUrl)
    router.refresh()
  }, [callbackUrl, router])

  const messageFor = React.useCallback(
    (code?: AuthErrorCode, defaultMsg?: string) => {
      if (defaultMsg) return defaultMsg
      if (!code) return copy.errors.unknown
      return copy.errors[code] ?? copy.errors.unknown
    },
    [copy],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError(null)

    // Client-side Zod pre-validation for snappy feedback
    if (!isLogin) {
      const parsed = SignUpSchema.safeParse({ name, email, password })
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        const issuePath = issue?.path[0]
        setError(issue?.message ?? copy.errors.invalid_input)

        if (issuePath === 'name') {
          nameRef.current?.focus()
        } else if (issuePath === 'email') {
          emailRef.current?.focus()
        } else if (issuePath === 'password') {
          passwordRef.current?.focus()
        }
        return
      }
    }

    setPending(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    if (mode === 'signup') {
      formData.append('name', name)
    }

    const result =
      mode === 'login' ? await signInCredentials(formData) : await signUpWithCredentials(formData)

    if (result.success) {
      finish()
      return
    }

    setPending(false)
    setError(messageFor(result.code, result.error))
    if (mode === 'login') {
      setPassword('')
      passwordRef.current?.focus()
    }
  }

  async function handleProvider(provider: OAuthProviderId) {
    if (oauthPending) return
    setOauthPending(provider)
    setError(null)
    const result = await signInWithOAuth(provider, callbackUrl)
    if (!result.success) {
      setOauthPending(null)
      if (result.code === 'provider_disabled') {
        setError(
          lang === 'ar'
            ? 'تسجيل الدخول عبر Google غير مهيأ بعد في بيئة التطوير. يُرجى استخدام حساب العرض التجريبي أو البريد الإلكتروني.'
            : 'Google sign in is not configured in .env. Please use the demo account or email credentials.',
        )
      } else {
        setError(messageFor(result.code, result.error))
      }
    }
  }

  async function handleDemo() {
    if (pending) return
    setPending(true)
    setError(null)
    const result = await signInCredentials(DEMO_EMAIL, DEMO_PASSWORD)
    if (result.success) {
      finish()
      return
    }
    setPending(false)
    setError(messageFor(result.code, result.error))
  }

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

  return (
    <div className="space-y-6">
      {effectiveProviders.length > 0 ? (
        <>
          <div className="space-y-2.5">
            {effectiveProviders.map((provider) => {
              const Icon = PROVIDER_ICONS[provider]
              return (
                <Button
                  key={provider}
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={busy}
                  onClick={() => handleProvider(provider)}
                  className="h-11 w-full justify-center gap-3 border-border bg-card text-sm font-semibold text-foreground hover:bg-accent"
                >
                  {oauthPending === provider ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Icon />
                  )}
                  <span>
                    {copy.continueWith} {copy.providerNames[provider]}
                  </span>
                </Button>
              )
            })}
          </div>

          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.orEmail}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div
            id="auth-error"
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-[8px] border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-[13px] leading-relaxed text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {!isLogin ? (
          <div className="space-y-1.5">
            <label htmlFor="auth-name" className="block text-[13px] font-semibold text-foreground">
              {copy.name}
            </label>
            <Input
              ref={nameRef}
              id="auth-name"
              name="name"
              autoComplete="name"
              autoFocus
              required
              minLength={2}
              maxLength={80}
              placeholder={copy.namePlaceholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 bg-card"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="auth-email" className="block text-[13px] font-semibold text-foreground">
              {copy.email}
            </label>
            {!isLogin && emailValidationResult && (
              <span
                className={cn(
                  'text-[11.5px] font-medium transition-colors',
                  emailValidationResult.success
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive',
                )}
              >
                {emailValidationResult.success
                  ? copy.emailValidation.valid
                  : emailValidationResult.error.issues[0]?.message}
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              ref={emailRef}
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus={isLogin}
              required
              placeholder={copy.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={cn(
                'h-11 bg-card',
                !isLogin &&
                  emailValidationResult &&
                  (emailValidationResult.success
                    ? 'border-emerald-600/40 focus-visible:ring-emerald-600'
                    : 'border-destructive/60 focus-visible:ring-destructive'),
              )}
              aria-describedby={error ? 'auth-error' : undefined}
            />
            {!isLogin && emailValidationResult?.success ? (
              <Check
                className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="auth-password"
              className="block text-[13px] font-semibold text-foreground"
            >
              {copy.password}
            </label>
            {isLogin ? (
              <Link
                href={`/${lang}/forgot-password`}
                className="text-[12.5px] font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy.forgot}
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Input
              ref={passwordRef}
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={72}
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (!passwordTouched) setPasswordTouched(true)
              }}
              className="h-11 bg-card pe-11"
              aria-describedby={!isLogin ? 'password-strength-panel' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
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
          {isLogin ? (
            <div className="flex justify-end pt-1">
              <Link
                href={`/${lang}/forgot-password`}
                className="text-[12px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copy.forgot}
              </Link>
            </div>
          ) : null}

          {!isLogin ? (
            <div
              id="password-strength-panel"
              role="region"
              aria-live="polite"
              className="mt-2 space-y-2.5 rounded-[8px] border border-border/70 bg-card/70 p-3"
            >
              {/* Strength Meter Bars */}
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

              {/* Requirement Checklist */}
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
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="h-11 w-full justify-center gap-2 text-sm font-bold"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {isLogin ? copy.signingIn : copy.creatingAccount}
            </>
          ) : (
            <>
              {isLogin ? copy.signIn : copy.createAccount}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        {isLogin ? copy.noAccount : copy.haveAccount}{' '}
        <a
          href={`/${lang}/${isLogin ? 'signup' : 'login'}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isLogin ? copy.createOne : copy.signInInstead}
        </a>
      </p>

      {isLogin ? (
        <div className="rounded-[8px] border border-dashed border-border bg-muted/40 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-foreground">{copy.demoLabel}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                {copy.demoHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemo}
            disabled={busy}
            className={cn(
              'mt-2 text-[12.5px] font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            {copy.demoAction}
          </button>
        </div>
      ) : null}
    </div>
  )
}
