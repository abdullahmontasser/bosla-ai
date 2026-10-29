import { describe, it, expect } from 'vitest'
import {
  isDisposableEmail,
  isCommonWeakPassword,
  evaluatePasswordStrength,
  EmailSchema,
  PasswordSchema,
  SignUpSchema,
  SignInSchema,
} from './auth'

describe('Auth Validations (covers: Hardening Zod & Strength Check)', () => {
  describe('isDisposableEmail', () => {
    it('detects known disposable email domains', () => {
      expect(isDisposableEmail('test@mailinator.com')).toBe(true)
      expect(isDisposableEmail('burner@tempmail.com')).toBe(true)
      expect(isDisposableEmail('spammer@10minutemail.com')).toBe(true)
      expect(isDisposableEmail('user@guerrillamail.com')).toBe(true)
    })

    it('allows genuine email domains', () => {
      expect(isDisposableEmail('candidate@gmail.com')).toBe(false)
      expect(isDisposableEmail('engineer@careercraft.ai')).toBe(false)
      expect(isDisposableEmail('person@outlook.com')).toBe(false)
    })
  })

  describe('isCommonWeakPassword', () => {
    it('detects dictionary and sequential passwords', () => {
      expect(isCommonWeakPassword('password')).toBe(true)
      expect(isCommonWeakPassword('12345678')).toBe(true)
      expect(isCommonWeakPassword('qwerty123')).toBe(true)
      expect(isCommonWeakPassword('admin123')).toBe(true)
      expect(isCommonWeakPassword('aaaaaaaa')).toBe(true)
      expect(isCommonWeakPassword('11111111')).toBe(true)
    })

    it('allows diverse and complex passwords', () => {
      expect(isCommonWeakPassword('Correct-Horse-Battery-99!')).toBe(false)
      expect(isCommonWeakPassword('StR0ng#P@ssw0rd!2026')).toBe(false)
    })
  })

  describe('evaluatePasswordStrength', () => {
    it('returns score 0 and empty level for blank password', () => {
      const evalEmpty = evaluatePasswordStrength('')
      expect(evalEmpty.score).toBe(0)
      expect(evalEmpty.level).toBe('empty')
      expect(evalEmpty.metCount).toBe(0)
    })

    it('returns weak for short or common passwords', () => {
      const evalShort = evaluatePasswordStrength('Ab1!')
      expect(evalShort.score).toBe(1)
      expect(evalShort.level).toBe('weak')
      expect(evalShort.requirements.minLength).toBe(false)

      const evalCommon = evaluatePasswordStrength('password123')
      expect(evalCommon.score).toBe(1)
      expect(evalCommon.level).toBe('weak')
      expect(evalCommon.requirements.notCommon).toBe(false)
    })

    it('returns fair for passwords satisfying 3 criteria', () => {
      // 8 chars, lowercase, numbers (no uppercase, no special)
      const evalFair = evaluatePasswordStrength('mypassword2026')
      expect(evalFair.score).toBe(2)
      expect(evalFair.level).toBe('fair')
      expect(evalFair.metCount).toBe(3)
    })

    it('returns good for passwords satisfying 4 criteria', () => {
      // 8 chars, lowercase, uppercase, numbers (no special)
      const evalGood = evaluatePasswordStrength('MyPassword2026')
      expect(evalGood.score).toBe(3)
      expect(evalGood.level).toBe('good')
      expect(evalGood.metCount).toBe(4)
    })

    it('returns strong for 10+ characters with all 5 criteria satisfied', () => {
      const evalStrong = evaluatePasswordStrength('V3ry$ecureP@ss!')
      expect(evalStrong.score).toBe(4)
      expect(evalStrong.level).toBe('strong')
      expect(evalStrong.metCount).toBe(5)
      expect(evalStrong.requirements.minLength).toBe(true)
      expect(evalStrong.requirements.hasLower).toBe(true)
      expect(evalStrong.requirements.hasUpper).toBe(true)
      expect(evalStrong.requirements.hasNumber).toBe(true)
      expect(evalStrong.requirements.hasSpecial).toBe(true)
    })
  })

  describe('EmailSchema', () => {
    it('accepts valid email addresses', () => {
      expect(EmailSchema.safeParse('user@example.com').success).toBe(true)
      expect(EmailSchema.safeParse('first.last+tag@company.co.uk').success).toBe(true)
    })

    it('rejects invalid email formats', () => {
      expect(EmailSchema.safeParse('not-an-email').success).toBe(false)
      expect(EmailSchema.safeParse('user@domain').success).toBe(false)
      expect(EmailSchema.safeParse('user @domain.com').success).toBe(false)
    })

    it('rejects disposable email domains', () => {
      const res = EmailSchema.safeParse('test@mailinator.com')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Disposable')
      }
    })
  })

  describe('PasswordSchema', () => {
    it('rejects passwords under 8 characters', () => {
      const res = PasswordSchema.safeParse('Ab1!')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('8 characters')
      }
    })

    it('rejects passwords without uppercase letters', () => {
      const res = PasswordSchema.safeParse('securepass123!')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('uppercase')
      }
    })

    it('rejects passwords without lowercase letters', () => {
      const res = PasswordSchema.safeParse('SECUREPASS123!')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('lowercase')
      }
    })

    it('rejects passwords without numbers', () => {
      const res = PasswordSchema.safeParse('SecurePassword!')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('number')
      }
    })

    it('rejects passwords without special characters', () => {
      const res = PasswordSchema.safeParse('SecurePassword123')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('special character')
      }
    })

    it('rejects common weak passwords', () => {
      const res = PasswordSchema.safeParse('Password123!')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('easily guessable')
      }
    })

    it('accepts strong complex passwords', () => {
      const res = PasswordSchema.safeParse('ComplexP@ssw0rd!')
      expect(res.success).toBe(true)
    })
  })

  describe('SignUpSchema & SignInSchema', () => {
    it('validates a complete signup payload', () => {
      const valid = SignUpSchema.safeParse({
        name: 'Sarah Connor',
        email: 'sarah@resistance.org',
        password: 'Terminator2!1991',
      })
      expect(valid.success).toBe(true)
    })

    it('rejects signup with short name', () => {
      const invalid = SignUpSchema.safeParse({
        name: 'S',
        email: 'sarah@resistance.org',
        password: 'Terminator2!1991',
      })
      expect(invalid.success).toBe(false)
    })

    it('validates a valid sign in payload', () => {
      const valid = SignInSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(valid.success).toBe(true)
    })
  })
})
