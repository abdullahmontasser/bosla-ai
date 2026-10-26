import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateOutreachAction,
  saveOutreachAction,
  regenerateOutreachVariantAction,
} from './outreach-actions'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateObject } from 'ai'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { mockOutreachPayloadEn } from '@/lib/validations/career-prep'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
}))

vi.mock('@/lib/ai/provider-client', () => ({
  getProviderModel: vi.fn().mockReturnValue({}),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

describe('Outreach Server Actions (covers: AC-1, AC-4, AC-5, AC-CO-1, AC-CO-4, AC-CO-5)', () => {
  const mockUser = { id: 'user_123', email: 'test@example.com' }

  const mockResume = {
    id: 'res_1',
    userId: 'user_123',
    language: 'EN',
    jobPosting: {
      title: 'Senior Full Stack Engineer',
      companyName: 'CloudScale',
      rawDescription: 'Seeking senior engineer with Next.js and TypeScript expertise.',
      parsedSkills: ['Next.js', 'TypeScript', 'PostgreSQL'],
    },
    profile: {
      fullName: 'Alex Chen',
      workExperiences: [
        {
          companyName: 'TechVanguard',
          jobTitle: 'Senior Engineer',
          bullets: ['Engineered AI streaming pipelines with 60% latency reduction.'],
        },
      ],
      projects: [
        {
          name: 'CareerCraft',
          description: 'Career intelligence system',
          technologies: ['Next.js', 'PostgreSQL'],
        },
      ],
    },
    outreachMessage: mockOutreachPayloadEn,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOutreachAction', () => {
    it('returns error when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)

      const result = await generateOutreachAction('res_1')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when resume is not found or owned by another user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

      const result = await generateOutreachAction('non_existent')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found or access denied')
    })

    it('returns error when no active AI provider is configured', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([])

      const result = await generateOutreachAction('res_1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('No active AI provider configured')
    })

    it('generates 3 outreach variants, trims connection note if needed, and persists payload', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
        { provider: 'OPENAI', apiKey: 'sk-test', defaultModel: 'gpt-4o' } as unknown as never,
      ])

      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          connectionNoteText:
            'Hi Sarah, loved your work on AI streaming at CloudScale. I recently cut latency by 60% with Next.js. Would love to connect and follow along.',
          inMail: {
            subject: 'Senior Full Stack Engineer interested in CloudScale',
            body: 'Hi Sarah, I noticed CloudScale is expanding. I have 6 years experience in Next.js.',
          },
          email: {
            subject: 'Alex Chen for Senior Full Stack Engineer at CloudScale',
            body: 'Dear Sarah, I would love to explore opportunities at CloudScale.',
          },
        },
      } as unknown as never)

      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const result = await generateOutreachAction('res_1', {
        tone: 'PROFESSIONAL',
        recipientType: 'RECRUITER',
      })

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.connectionNote.charCount).toBeLessThanOrEqual(300)
        expect(result.data.connectionNote.text).toContain('CloudScale')
        expect(result.data.inMail.subject).toContain('CloudScale')
        expect(result.data.email.body).toContain('Dear Sarah')
      }

      expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res_1' },
          data: expect.objectContaining({
            outreachMessage: expect.any(Object),
          }),
        }),
      )
    })
  })

  describe('saveOutreachAction', () => {
    it('saves edited outreach message when charCount <= 300', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const updatedPayload = {
        ...mockOutreachPayloadEn,
        connectionNote: {
          text: 'Updated connection note within limits.',
          charCount: 39,
        },
      }

      const result = await saveOutreachAction('res_1', updatedPayload)
      expect(result.success).toBe(true)
      expect(prisma.tailoredResume.update).toHaveBeenCalled()
    })

    it('rejects save when connection note exceeds 300 characters', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      const longNote = 'a'.repeat(305)
      const invalidPayload = {
        ...mockOutreachPayloadEn,
        connectionNote: {
          text: longNote,
          charCount: 305,
        },
      }

      const result = await saveOutreachAction('res_1', invalidPayload)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('regenerateOutreachVariantAction', () => {
    it('regenerates single InMail variant while keeping existing connection note and email intact', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
        { provider: 'OPENAI', apiKey: 'sk-test', defaultModel: 'gpt-4o' } as unknown as never,
      ])

      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          subject: 'New Fresh InMail Subject',
          body: 'New InMail Pitch Body with more detail.',
        },
      } as unknown as never)

      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const result = await regenerateOutreachVariantAction('res_1', 'inMail')
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.inMail.subject).toBe('New Fresh InMail Subject')
        expect(result.data.connectionNote.text).toBe(mockOutreachPayloadEn.connectionNote.text)
        expect(result.data.email.subject).toBe(mockOutreachPayloadEn.email.subject)
      }
    })
  })
})
