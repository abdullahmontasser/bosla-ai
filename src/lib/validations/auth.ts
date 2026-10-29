import { z } from 'zod'

/**
 * Common disposable / temporary email domains that should be rejected
 * to prevent spam, burner accounts, and abuse.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'inboxkitten.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'emailondeck.com',
  'mohmal.com',
  'burnermail.io',
  'crazymailing.com',
  'mytempemail.com',
  'getnada.com',
])

/**
 * Common easily guessable passwords that must be rejected regardless of length.
 */
export const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'admin123',
  'administrator',
  'letmein123',
  'welcome123',
  'iloveyou123',
  'abc12345',
  'pass1234',
  'secret123',
  'master123',
  'changeme123',
  'password123!',
  'password@123',
  'admin123!',
  'welcome123!',
])

/**
 * Returns true if an email address belongs to a known disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const domain = email.trim().toLowerCase().split('@')[1]
  if (!domain) return false
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

/**
 * Returns true if the password is an easily guessable or sequential common weak password.
 */
export function isCommonWeakPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return true
  const normalized = password.trim().toLowerCase()

  // 1. Check exact matches in common dictionary
  if (COMMON_WEAK_PASSWORDS.has(normalized)) return true

  // 2. Reject single character repetitions (e.g. 'aaaaaaaa', '11111111')
  if (/^(.)\1+$/.test(password)) return true

  // 3. Reject trivial sequential numbers (e.g. '12345678')
  if (/^(0123456789|1234567890|9876543210)/.test(password)) return true

  return false
}

export interface PasswordRequirements {
  minLength: boolean
  hasLower: boolean
  hasUpper: boolean
  hasNumber: boolean
  hasSpecial: boolean
  notCommon: boolean
}

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4
export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordEvaluation {
  score: PasswordStrengthScore
  level: PasswordStrengthLevel
  requirements: PasswordRequirements
  metCount: number
  totalCount: number
}

/**
 * Evaluates password strength and returns criteria breakdown for interactive UI feedback.
 */
export function evaluatePasswordStrength(password: string): PasswordEvaluation {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'empty',
      requirements: {
        minLength: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSpecial: false,
        notCommon: true,
      },
      metCount: 0,
      totalCount: 5,
    }
  }

  const minLength = password.length >= 8
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const notCommon = !isCommonWeakPassword(password)

  const checks = [minLength, hasLower, hasUpper, hasNumber, hasSpecial]
  const metCount = checks.filter(Boolean).length

  let score: PasswordStrengthScore = 1
  let level: PasswordStrengthLevel = 'weak'

  if (!notCommon || password.length < 8) {
    score = 1
    level = 'weak'
  } else if (metCount === 5 && password.length >= 10) {
    score = 4
    level = 'strong'
  } else if (metCount >= 4) {
    score = 3
    level = 'good'
  } else if (metCount >= 3) {
    score = 2
    level = 'fair'
  } else {
    score = 1
    level = 'weak'
  }

  return {
    score,
    level,
    requirements: {
      minLength,
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
      notCommon,
    },
    metCount,
    totalCount: 5,
  }
}

/**
 * Strict Email Schema with domain validation and disposable email rejection.
 */
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(120, 'Email address is too long')
  .refine((val) => !/\s/.test(val), {
    message: 'Email address cannot contain spaces',
  })
  .refine(
    (val) => {
      const parts = val.split('@')
      if (parts.length !== 2) return false
      const domain = parts[1]
      if (!domain || !domain.includes('.')) return false
      const domainParts = domain.split('.')
      const tld = domainParts[domainParts.length - 1]
      return Boolean(tld && tld.length >= 2 && /^[a-z]+$/.test(tld))
    },
    {
      message: 'Enter a valid email domain (e.g. domain.com)',
    },
  )
  .refine((val) => !isDisposableEmail(val), {
    message: 'Disposable or temporary email addresses are not accepted',
  })

/**
 * Strict Password Schema enforcing complexity and disallowing common weak passwords.
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .refine((pwd) => /[a-z]/.test(pwd), {
    message: 'Password must include at least one lowercase letter',
  })
  .refine((pwd) => /[A-Z]/.test(pwd), {
    message: 'Password must include at least one uppercase letter',
  })
  .refine((pwd) => /[0-9]/.test(pwd), {
    message: 'Password must include at least one number',
  })
  .refine((pwd) => /[^a-zA-Z0-9]/.test(pwd), {
    message: 'Password must include at least one special character (!@#$%...)',
  })
  .refine((pwd) => !isCommonWeakPassword(pwd), {
    message: 'This password is too common or easily guessable. Choose a stronger one.',
  })

/**
 * Schema for sign up validation.
 */
export const SignUpSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long'),
  email: EmailSchema,
  password: PasswordSchema,
})

/**
 * Schema for sign in validation.
 */
export const SignInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(72, 'Password is too long'),
})
