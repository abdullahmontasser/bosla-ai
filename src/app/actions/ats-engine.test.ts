import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateAtsScoreAction,
  rewriteBulletWithXyzAction,
  addMissingSkillAction,
  dismissMissingSkillAction,
} from './ats-engine'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import {
  getActiveProviderSettings,
  type DecryptedProviderSetting,
} from '@/lib/db/provider-settings'
import type { TailoredResume, Skill } from '@prisma/client'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    profile: {
      findFirst: vi.fn(),
    },
    skill: {
      findFirst: vi.fn(),
      create: vi.fn(),
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
  generateText: vi.fn(),
}))

describe('ATS Engine Server Actions (covers: AC-3, AC-4, AC-8)', () => {
  const mockUser = { id: 'user_123', email: 'test@example.com' }

  const mockResume = {
    id: 'res_1',
    userId: 'user_123',
    profileId: 'prof_1',
    jobPostingId: 'job_1',
    language: 'EN',
    title: 'Senior Engineer',
    atsScore: 70,
    missingSkills: ['Docker', 'Kubernetes'],
    atsBreakdown: {
      overallScore: 70,
      categorySubscores: {
        keywordMatch: 60,
        experienceRelevance: 70,
        formattingCompliance: 90,
      },
      matchedSkills: ['React', 'TypeScript'],
      missingSkills: ['Docker', 'Kubernetes'],
      dismissedSkills: [],
      actionableFeedback: ['Add Docker experience'],
      isStale: false,
      evaluatedAt: '2026-10-25T12:00:00Z',
    },
    tailoredSummary: 'Experienced software engineer.',
    tailoredContent: {
      targetRole: 'Senior Engineer',
      tailoredSummary: 'Experienced software engineer.',
      candidateHeader: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      },
      tailoredExperiences: [
        {
          companyName: 'Tech Co',
          jobTitle: 'Developer',
          bullets: [
            {
              rewritten: 'Built web applications with React.',
              matchedKeywords: ['React'],
            },
          ],
        },
      ],
      educations: [],
      skills: [{ name: 'React' }, { name: 'TypeScript' }],
    },
    jobPosting: {
      id: 'job_1',
      title: 'Senior Engineer',
      companyName: 'Tech Co',
      rawDescription:
        'Looking for a Senior Engineer with React, TypeScript, Docker, and Kubernetes.',
      parsedSkills: ['React', 'TypeScript', 'Docker', 'Kubernetes'],
    },
    profile: {
      id: 'prof_1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      skills: [{ name: 'React' }, { name: 'TypeScript' }],
      workExperiences: [
        {
          companyName: 'Tech Co',
          jobTitle: 'Developer',
          bullets: ['Built web applications with React.'],
        },
      ],
      educations: [],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      expires: '2099-01-01',
    })
  })

  it('rejects calculateAtsScoreAction when session is missing (covers: AC-8)', async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await calculateAtsScoreAction('res_1')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Unauthorized')
  })

  it('calculates deterministic score and persists to database (covers: AC-4)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({
      ...mockResume,
      atsScore: 75,
    } as unknown as TailoredResume)

    const res = await calculateAtsScoreAction('res_1', false)

    expect(res.success).toBe(true)
    expect(res.atsScore).toBeGreaterThanOrEqual(0)
    expect(res.breakdown).toBeDefined()
    expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'res_1' },
      }),
    )
  })

  it('falls back to deterministic score if AI deep scan provider fails (covers: AC-8)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({
      ...mockResume,
      atsScore: 75,
    } as unknown as TailoredResume)
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
      {
        id: 'set_1',
        provider: 'OPENAI',
        encryptedKey: 'key',
        defaultModel: 'gpt-4o',
        apiKey: 'sk-test',
      } as unknown as DecryptedProviderSetting,
    ])
    vi.mocked(generateText).mockRejectedValueOnce(new Error('AI rate limit exceeded'))

    const res = await calculateAtsScoreAction('res_1', true)

    expect(res.success).toBe(true)
    expect(res.atsScore).toBeDefined()
    expect(res.breakdown).toBeDefined()
  })

  it('rewrites single bullet into Google XYZ format without hallucination (covers: AC-2, AC-4)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
      {
        id: 'set_1',
        provider: 'OPENAI',
        encryptedKey: 'key',
        defaultModel: 'gpt-4o',
        apiKey: 'sk-test',
      } as unknown as DecryptedProviderSetting,
    ])
    vi.mocked(generateText).mockResolvedValueOnce({
      text: 'Architected scalable web applications using React, boosting system responsiveness.',
    } as unknown as Awaited<ReturnType<typeof generateText>>)

    const res = await rewriteBulletWithXyzAction('res_1', 0, 0)

    expect(res.success).toBe(true)
    expect(res.rewrittenBullet).toContain('Architected scalable web applications')
    expect(prisma.tailoredResume.update).toHaveBeenCalled()
  })

  it('adds missing skill to profile and recalculates ATS score instantly (covers: AC-3, AC-4)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.skill.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.skill.create).mockResolvedValueOnce({
      id: 'sk_new',
      name: 'Docker',
    } as unknown as Skill)

    const res = await addMissingSkillAction('res_1', 'Docker')

    expect(res.success).toBe(true)
    expect(prisma.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Docker',
          profileId: 'prof_1',
        }),
      }),
    )
    expect(res.breakdown?.matchedSkills).toContain('Docker')
  })

  it('dismisses missing skill and moves it to dismissedSkills array (covers: AC-3, AC-4)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )

    const res = await dismissMissingSkillAction('res_1', 'Kubernetes')

    expect(res.success).toBe(true)
    expect(res.breakdown?.dismissedSkills).toContain('Kubernetes')
    expect(res.breakdown?.missingSkills).not.toContain('Kubernetes')
  })
})
