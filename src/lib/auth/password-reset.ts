import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, hashClientIdentifier } from '@/lib/telemetry/rate-limiter'
import { PasswordSchema } from '@/lib/validations/auth'
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email/send-email'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const RESET_RATE_LIMIT_MS = 60 * 60 * 1000 // 1 hour window

export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export interface PasswordResetRequestResult {
  success: boolean
  error?: string
  previewUrl?: string
}

export interface VerifyTokenResult {
  valid: boolean
  userId?: string
  email?: string
  error?: string
}

export interface ResetPasswordResult {
  success: boolean
  error?: string
}

/**
 * Requests a password reset link for the given email address.
 * Rate limited to 3 requests per hour per email to prevent spam.
 */
export async function requestPasswordReset(
  email: string,
  baseUrl = 'http://localhost:3000',
  lang = 'en',
): Promise<PasswordResetRequestResult> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return { success: false, error: 'Email is required' }
  }

  // Rate limit check
  const rateLimitKey = hashClientIdentifier(`reset_req:${normalizedEmail}`)
  const limitCheck = checkRateLimit(rateLimitKey, 3, RESET_RATE_LIMIT_MS)
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: 'Too many password reset requests. Please wait a while before trying again.',
    }
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  })

  // Prevent user enumeration: always return success even if user not found
  if (!user) {
    return { success: true }
  }

  // Generate 32-byte secure random token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  // Store hashed token in database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  })

  const previewUrl = `${baseUrl}/${lang}/reset-password?token=${rawToken}`

  // Dispatch email in production or via configured provider
  await sendPasswordResetEmail({
    to: user.email,
    resetUrl: previewUrl,
    lang,
  }).catch((err) => {
    console.error('[Password Reset Email Error]', err)
  })

  // Return previewUrl only in non-production or if email service is not configured
  const exposePreview = process.env.NODE_ENV !== 'production' || !isEmailConfigured()

  return {
    success: true,
    previewUrl: exposePreview ? previewUrl : undefined,
  }
}

/**
 * Verifies that a raw reset token exists, is unspent, and is not expired.
 */
export async function verifyPasswordResetToken(rawToken: string): Promise<VerifyTokenResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, error: 'Invalid or missing reset token' }
  }

  const tokenHash = hashResetToken(rawToken)

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true } } },
  })

  if (!record) {
    return { valid: false, error: 'Invalid or unrecognized reset token' }
  }

  if (record.usedAt) {
    return { valid: false, error: 'This password reset link has already been used' }
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, error: 'This password reset link has expired' }
  }

  return {
    valid: true,
    userId: record.userId,
    email: record.user.email,
  }
}

/**
 * Resets the user's password using the verified token and invalidates the token.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const verification = await verifyPasswordResetToken(rawToken)
  if (!verification.valid || !verification.userId) {
    return { success: false, error: verification.error ?? 'Invalid token' }
  }

  const parseResult = PasswordSchema.safeParse(newPassword)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? 'Password does not meet requirements',
    }
  }

  const passwordHash = await bcrypt.hash(parseResult.data, 12)
  const tokenHash = hashResetToken(rawToken)

  // Atomic update: change user password and mark token used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true }
}
