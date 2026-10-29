'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { headers } from 'next/headers'
import { signIn, signOut } from '@/auth'
import { getEnabledOAuthProviders, type OAuthProviderId } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeCallbackUrl } from '@/lib/auth/callback-url'
import {
  checkRateLimit,
  hashClientIdentifier,
  isRateLimited,
  recordFailedAttempt,
  clearRateLimit,
} from '@/lib/telemetry/rate-limiter'
import { SignUpSchema } from '@/lib/validations/auth'
import { createEmailVerificationToken } from '@/lib/auth/email-verification'

export type AuthErrorCode =
  | 'invalid_input'
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'provider_disabled'
  | 'too_many_requests'
  | 'unknown'

export interface AuthActionResult {
  success: boolean
  error?: string
  code?: AuthErrorCode
}

async function resolveClientIp(): Promise<string> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]!.trim()
    const realIp = h.get('x-real-ip')
    if (realIp) return realIp.trim()
  } catch {
    // Outside request context
  }
  return '127.0.0.1'
}

function isRedirectError(error: unknown): boolean {
  return Boolean(
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as Record<string, unknown>).digest === 'string' &&
    (error as Record<string, unknown>).digest?.toString().startsWith('NEXT_REDIRECT'),
  )
}

export async function signInCredentials(
  emailOrFormData: string | FormData,
  passwordArg?: string,
): Promise<AuthActionResult> {
  let email = ''
  let password = ''

  if (typeof emailOrFormData === 'object' && emailOrFormData !== null && 'get' in emailOrFormData) {
    email = String(emailOrFormData.get('email') || '')
    password = String(emailOrFormData.get('password') || '')
  } else {
    email = String(emailOrFormData || '')
    password = String(passwordArg || '')
  }

  const trimmedEmail = email?.trim()
  if (!trimmedEmail || !password) {
    return { success: false, error: 'Missing email or password', code: 'invalid_input' }
  }

  // Rate limiting per IP + email: max 5 failed attempts per 15 minutes before lockout
  const ip = await resolveClientIp()
  const rateLimitKey = hashClientIdentifier(`signin:${ip}:${trimmedEmail.toLowerCase()}`)
  if (isRateLimited(rateLimitKey, 5)) {
    return {
      success: false,
      error: 'Too many login attempts. Please wait a few minutes before trying again.',
      code: 'too_many_requests',
    }
  }

  try {
    await signIn('credentials', {
      email: trimmedEmail,
      password,
      redirect: false,
    })
    // Reset failed attempts on successful login
    clearRateLimit(rateLimitKey)
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    // Track failed login attempt
    recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000)
    if (error instanceof AuthError) {
      return { success: false, error: 'Invalid email or password', code: 'invalid_credentials' }
    }
    return { success: false, error: 'Authentication failed', code: 'unknown' }
  }
}

export async function signUpWithCredentials(
  inputOrFormData: { name: string; email: string; password: string } | FormData,
): Promise<AuthActionResult> {
  let name = ''
  let email = ''
  let password = ''

  if (typeof inputOrFormData === 'object' && inputOrFormData !== null && 'get' in inputOrFormData) {
    name = String(inputOrFormData.get('name') || '')
    email = String(inputOrFormData.get('email') || '')
    password = String(inputOrFormData.get('password') || '')
  } else {
    name = inputOrFormData.name
    email = inputOrFormData.email
    password = inputOrFormData.password
  }

  const parsed = SignUpSchema.safeParse({ name, email, password })
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? 'Check the form and try again',
      code: firstIssue?.path[0] === 'password' ? 'weak_password' : 'invalid_input',
    }
  }

  const { name: validName, email: validEmail, password: validPassword } = parsed.data

  // Rate limiting per IP: max 3 signup attempts per hour to prevent abuse
  const ip = await resolveClientIp()
  const rateLimitKey = hashClientIdentifier(`signup:${ip}`)
  const limitCheck = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: 'Too many account creation attempts. Please wait a few minutes before trying again.',
      code: 'too_many_requests',
    }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: validEmail },
      select: { id: true },
    })
    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists',
        code: 'email_taken',
      }
    }

    const passwordHash = await bcrypt.hash(validPassword, 12)
    await prisma.user.create({
      data: { name: validName, email: validEmail, passwordHash },
    })
    // Seed verification token for the newly registered account
    await createEmailVerificationToken(validEmail).catch(() => {})
  } catch (error) {
    if (isRedirectError(error)) throw error
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return {
        success: false,
        error: 'An account with this email already exists',
        code: 'email_taken',
      }
    }
    return { success: false, error: 'Could not create the account', code: 'unknown' }
  }

  return signInCredentials(validEmail, validPassword)
}

export async function signInWithOAuth(
  provider: OAuthProviderId,
  callbackUrl: string,
): Promise<AuthActionResult> {
  if (!getEnabledOAuthProviders().includes(provider)) {
    return {
      success: false,
      error: 'This sign in method is not configured',
      code: 'provider_disabled',
    }
  }

  const redirectTo = sanitizeCallbackUrl(callbackUrl, '/en/tailor')

  try {
    await signIn(provider, { redirectTo })
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    return { success: false, error: 'Could not start sign in', code: 'unknown' }
  }
}

export async function signOutAction(lang: string): Promise<void> {
  const locale = lang === 'ar' ? 'ar' : 'en'
  await signOut({ redirectTo: `/${locale}` })
}
