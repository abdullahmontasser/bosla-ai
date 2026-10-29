import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth, getEnabledOAuthProviders } from '@/auth'
import { connection } from 'next/server'
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url'
import { isSupportedLocale } from '@/lib/i18n/config'
import { AuthScreen } from '@/components/auth'

export const instant = false

interface SignUpPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'Create account · Bosla AI',
  robots: { index: false, follow: false },
}

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const query = await searchParams
  const callbackUrl = sanitizeCallbackUrl(
    typeof query.callbackUrl === 'string' ? query.callbackUrl : undefined,
    `/${lang}/tailor`,
  )

  await connection()
  const session = await auth()
  if (session?.user) {
    redirect(callbackUrl)
  }

  const rawError = typeof query.error === 'string' ? query.error : null

  return (
    <AuthScreen
      lang={lang}
      mode="signup"
      callbackUrl={callbackUrl}
      providers={getEnabledOAuthProviders()}
      initialError={rawError}
    />
  )
}
