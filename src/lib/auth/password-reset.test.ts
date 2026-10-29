import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPasswordWithToken,
} from './password-reset'
import { prisma } from '@/lib/prisma'
import { _resetRateLimitStore } from '@/lib/telemetry/rate-limiter'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_new_password_123'),
  },
}))

describe('Password Reset Flow (covers: Hardening Item 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetRateLimitStore()
  })

  describe('requestPasswordReset', () => {
    it('returns error when email is missing', async () => {
      const res = await requestPasswordReset('')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Email is required')
    })

    it('returns success safely when email is not found to prevent user enumeration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      const res = await requestPasswordReset('unknown@example.com')
      expect(res.success).toBe(true)
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
    })

    it('generates token and creates PasswordResetToken record when user exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user_123',
        email: 'person@example.com',
      } as never)

      const res = await requestPasswordReset('person@example.com', 'https://careercraft.ai', 'en')
      expect(res.success).toBe(true)
      expect(res.previewUrl).toContain('https://careercraft.ai/en/reset-password?token=')
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user_123',
          }),
        }),
      )
    })

    it('enforces rate limiting of 3 requests per hour', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user_123',
        email: 'person@example.com',
      } as never)

      for (let i = 0; i < 3; i++) {
        const res = await requestPasswordReset('person@example.com')
        expect(res.success).toBe(true)
      }

      const blocked = await requestPasswordReset('person@example.com')
      expect(blocked.success).toBe(false)
      expect(blocked.error).toContain('Too many password reset requests')
    })
  })

  describe('verifyPasswordResetToken', () => {
    it('rejects empty or malformed token', async () => {
      const res = await verifyPasswordResetToken('')
      expect(res.valid).toBe(false)
    })

    it('rejects token not present in database', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce(null)
      const res = await verifyPasswordResetToken('nonexistent_token')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Invalid or unrecognized')
    })

    it('rejects already used token', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce({
        id: 'prt_1',
        userId: 'user_123',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user_123', email: 'person@example.com' },
      } as never)

      const res = await verifyPasswordResetToken('used_token')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('already been used')
    })

    it('rejects expired token', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce({
        id: 'prt_1',
        userId: 'user_123',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
        user: { id: 'user_123', email: 'person@example.com' },
      } as never)

      const res = await verifyPasswordResetToken('expired_token')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('expired')
    })

    it('validates active, unspent token', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce({
        id: 'prt_1',
        userId: 'user_123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user_123', email: 'person@example.com' },
      } as never)

      const res = await verifyPasswordResetToken('valid_token')
      expect(res.valid).toBe(true)
      expect(res.userId).toBe('user_123')
      expect(res.email).toBe('person@example.com')
    })
  })

  describe('resetPasswordWithToken', () => {
    it('rejects weak new password', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce({
        id: 'prt_1',
        userId: 'user_123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user_123', email: 'person@example.com' },
      } as never)

      const res = await resetPasswordWithToken('valid_token', 'weak')
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('updates password and marks token used on valid submission', async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValueOnce({
        id: 'prt_1',
        userId: 'user_123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user_123', email: 'person@example.com' },
      } as never)

      const res = await resetPasswordWithToken('valid_token', 'StrongP@ssw0rd!2026')
      expect(res.success).toBe(true)
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd!2026', 12)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
