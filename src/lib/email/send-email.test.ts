import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isEmailConfigured,
  sendTransactionalEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './send-email'

describe('Email Delivery Client (covers: Production Reset & Verification)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('detects if email is configured based on RESEND_API_KEY', () => {
    expect(isEmailConfigured({} as NodeJS.ProcessEnv)).toBe(false)
    expect(
      isEmailConfigured({ RESEND_API_KEY: 're_test_123' } as unknown as NodeJS.ProcessEnv),
    ).toBe(true)
  })

  it('falls back to simulation mode when API key is missing in development', async () => {
    const res = await sendTransactionalEmail(
      {
        to: 'candidate@example.com',
        subject: 'Reset Password',
        html: '<p>Click here</p>',
        text: 'Click here',
      },
      { NODE_ENV: 'development' } as unknown as NodeJS.ProcessEnv,
    )

    expect(res.success).toBe(true)
    expect(res.id).toBe('preview-simulated-id')
  })

  it('posts to Resend API when RESEND_API_KEY is present', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_msg_123' }),
    })
    globalThis.fetch = mockFetch

    const res = await sendTransactionalEmail(
      {
        to: 'candidate@example.com',
        subject: 'Reset password',
        html: '<p>Link</p>',
        text: 'Link',
      },
      {
        RESEND_API_KEY: 're_valid_key',
        EMAIL_FROM: 'Bosla <noreply@careercraft.ai>',
      } as unknown as NodeJS.ProcessEnv,
    )

    expect(res.success).toBe(true)
    expect(res.id).toBe('email_msg_123')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_valid_key',
        }),
      }),
    )
  })

  it('generates and sends bilingual password reset email', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_msg_reset' }),
    })
    globalThis.fetch = mockFetch

    const resEn = await sendPasswordResetEmail(
      {
        to: 'person@example.com',
        resetUrl: 'https://careercraft.ai/en/reset-password?token=abc',
        lang: 'en',
      },
      { RESEND_API_KEY: 're_key' } as unknown as NodeJS.ProcessEnv,
    )

    expect(resEn.success).toBe(true)

    const resAr = await sendPasswordResetEmail(
      {
        to: 'person@example.com',
        resetUrl: 'https://careercraft.ai/ar/reset-password?token=abc',
        lang: 'ar',
      },
      { RESEND_API_KEY: 're_key' } as unknown as NodeJS.ProcessEnv,
    )

    expect(resAr.success).toBe(true)
  })

  it('generates and sends bilingual email verification email', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_msg_verify' }),
    })
    globalThis.fetch = mockFetch

    const res = await sendVerificationEmail(
      {
        to: 'verify@example.com',
        verifyUrl: 'https://careercraft.ai/en/verify-email?token=xyz',
        lang: 'en',
      },
      { RESEND_API_KEY: 're_key' } as unknown as NodeJS.ProcessEnv,
    )

    expect(res.success).toBe(true)
  })
})
