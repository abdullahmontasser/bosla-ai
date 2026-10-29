import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { BrandMark } from '@/components/landing/BrandMark'
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui'
import type { OAuthProviderId } from '@/auth'
import { AuthForm } from './AuthForm'
import { getAuthCopy } from './copy'

export interface AuthScreenProps {
  lang: string
  mode: 'login' | 'signup'
  callbackUrl: string
  providers: OAuthProviderId[]
  initialError?: string | null
}

export function AuthScreen({ lang, mode, callbackUrl, providers, initialError }: AuthScreenProps) {
  const copy = getAuthCopy(lang)
  const isLogin = mode === 'login'

  return (
    <div className="grid min-h-svh grid-cols-1 bg-background text-foreground lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#06291d] p-12 text-[#f2f7f3] lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="landing-grain opacity-[0.06]" aria-hidden />
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#45d99a]/15 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2.5 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fe3bb] focus-visible:ring-offset-4 focus-visible:ring-offset-[#06291d]"
          >
            <BrandMark className="border-[#8fe3bb]/30 bg-[#8fe3bb]/10 text-[#8fe3bb]" />
            <span className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold tracking-[-0.02em]">{copy.brand}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fe3bb]/80">
                AI
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-[30rem]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8fe3bb]/80">
            {copy.panelKicker}
          </p>
          <h2 className="mt-5 font-serif text-[clamp(2rem,3vw,2.75rem)] leading-[1.08] tracking-[-0.02em]">
            {copy.panelTitle}
          </h2>
          <p className="mt-5 max-w-[26rem] text-[14.5px] leading-relaxed text-[#d7e3da]">
            {copy.panelBody}
          </p>

          <ul className="mt-8 space-y-3">
            {copy.panelPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[13.5px] text-[#e6efe9]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#8fe3bb]/30 text-[#8fe3bb]">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-[#a9bdb1]">{copy.panelNote}</p>
      </aside>

      <main className="flex min-h-svh flex-col">
        <header className="flex h-[72px] items-center justify-between gap-3 border-b border-border px-5 sm:px-8">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 rounded-[6px] text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to home'}
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[26rem]">
            <Link
              href={`/${lang}`}
              className="mb-8 inline-flex items-center gap-2.5 lg:hidden"
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

            <h1 className="font-serif text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-foreground">
              {isLogin ? copy.loginTitle : copy.signupTitle}
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
              {isLogin ? copy.loginLead : copy.signupLead}
            </p>

            <div className="mt-7">
              <AuthForm
                lang={lang}
                mode={mode}
                callbackUrl={callbackUrl}
                providers={providers}
                initialError={initialError}
              />
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/80">
              {copy.terms}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
