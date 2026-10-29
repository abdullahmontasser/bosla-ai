import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEmailVerificationToken, verifyEmailToken } from './email-verification'
import { prisma } from '@/lib/prisma'
import { _resetRateLimitStore } from '@/lib/telemetry/rate-limiter'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}))

describe('Email Verification Flow (covers: Hardening Item 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetRateLimitStore()
  })

  describe('createEmailVerificationToken', () => {
    it('returns error when email is blank', async () => {
      const res = await createEmailVerificationToken('')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Email is required')
    })

    it('returns error if user account is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      const res = await createEmailVerificationToken('unknown@example.com')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Account not found')
    })

    it('returns success immediately if user is already verified', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'usr_1',
        emailVerified: new Date(),
      } as never)

      const res = await createEmailVerificationToken('verified@example.com')
      expect(res.success).toBe(true)
      expect(prisma.verificationToken.create).not.toHaveBeenCalled()
    })

    it('creates token and returns preview url for unverified user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'usr_2',
        emailVerified: null,
      } as never)

      const res = await createEmailVerificationToken(
        'unverified@example.com',
        'https://careercraft.ai',
        'en',
      )
      expect(res.success).toBe(true)
      expect(res.previewUrl).toContain('https://careercraft.ai/en/verify-email?token=')
      expect(prisma.verificationToken.create).toHaveBeenCalled()
    })
  })

  describe('verifyEmailToken', () => {
    it('returns error when token record is missing', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce(null)

      const res = await verifyEmailToken('user@example.com', 'invalid_token')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Invalid or expired')
    })

    it('returns error and deletes expired token', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
        identifier: 'user@example.com',
        token: 'exp_token',
        expires: new Date(Date.now() - 10000),
      } as never)

      const res = await verifyEmailToken('user@example.com', 'exp_token')
      expect(res.success).toBe(false)
      expect(res.error).toContain('expired')
      expect(prisma.verificationToken.delete).toHaveBeenCalled()
    })

    it('marks user verified and cleans up token when valid', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValueOnce({
        identifier: 'user@example.com',
        token: 'good_token',
        expires: new Date(Date.now() + 100000),
      } as never)

      const res = await verifyEmailToken('user@example.com', 'good_token')
      expect(res.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
