import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, hashClientIdentifier } from '@/lib/telemetry/rate-limiter'
import { sendVerificationEmail, isEmailConfigured } from '@/lib/email/send-email'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const VERIFY_RATE_LIMIT_MS = 30 * 60 * 1000 // 30 mins

export interface VerificationTokenResult {
  success: boolean
  error?: string
  previewUrl?: string
}

export interface VerifyEmailResult {
  success: boolean
  error?: string
}

/**
 * Creates or refreshes a verification token for an email address.
 */
export async function createEmailVerificationToken(
  email: string,
  baseUrl = 'http://localhost:3000',
  lang = 'en',
): Promise<VerificationTokenResult> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return { success: false, error: 'Email is required' }
  }

  // Rate limit check
  const rateLimitKey = hashClientIdentifier(`verify_req:${normalizedEmail}`)
  const limitCheck = checkRateLimit(rateLimitKey, 3, VERIFY_RATE_LIMIT_MS)
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: 'Too many verification requests. Please wait a few minutes.',
    }
  }

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true },
  })

  if (!user) {
    return { success: false, error: 'Account not found' }
  }

  if (user.emailVerified) {
    return { success: true }
  }

  // Delete any old verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  })

  // Generate 32-byte secure token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  })

  const previewUrl = `${baseUrl}/${lang}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

  // Dispatch email in production or via configured provider
  await sendVerificationEmail({
    to: normalizedEmail,
    verifyUrl: previewUrl,
    lang,
  }).catch((err) => {
    console.error('[Email Verification Send Error]', err)
  })

  const exposePreview = process.env.NODE_ENV !== 'production' || !isEmailConfigured()

  return {
    success: true,
    previewUrl: exposePreview ? previewUrl : undefined,
  }
}

/**
 * Verifies email address using the provided token.
 */
export async function verifyEmailToken(email: string, token: string): Promise<VerifyEmailResult> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !token) {
    return { success: false, error: 'Missing email or verification token' }
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: normalizedEmail,
        token,
      },
    },
  })

  if (!record) {
    return { success: false, error: 'Invalid or expired verification link' }
  }

  if (new Date() > record.expires) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    })
    return { success: false, error: 'Verification link has expired. Request a new one.' }
  }

  // Mark user verified and delete token
  await prisma.$transaction([
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    }),
  ])

  return { success: true }
}
