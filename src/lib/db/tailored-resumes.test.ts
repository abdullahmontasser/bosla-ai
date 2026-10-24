import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTailoredResumeSnapshot,
  getTailoredResumeById,
  getTailoredResumesByUser,
} from './tailored-resumes'
import { prisma } from '@/lib/prisma'
import type { Profile, JobPosting, TailoredResume } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findFirst: vi.fn(),
    },
    jobPosting: {
      findFirst: vi.fn(),
    },
    tailoredResume: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Tailored Resumes Repository (covers: AC-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects creating snapshot when profile does not belong to user (covers: AC-6)', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValueOnce(null)

    await expect(
      createTailoredResumeSnapshot('user_1', {
        profileId: 'profile_foreign',
        jobPostingId: 'job_1',
        language: 'EN',
        missingSkills: [],
        tailoredContent: {
          tailoredExperiences: [],
          recommendedSkills: [],
          keyStrengths: [],
        },
      }),
    ).rejects.toThrow(/Candidate profile not found or access denied/)
  })

  it('rejects creating snapshot when job posting does not belong to user (covers: AC-6)', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValueOnce({
      id: 'profile_1',
      userId: 'user_1',
    } as unknown as Profile)
    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValueOnce(null)

    await expect(
      createTailoredResumeSnapshot('user_1', {
        profileId: 'profile_1',
        jobPostingId: 'job_foreign',
        language: 'EN',
        missingSkills: [],
        tailoredContent: {
          tailoredExperiences: [],
          recommendedSkills: [],
          keyStrengths: [],
        },
      }),
    ).rejects.toThrow(/Target job posting not found or access denied/)
  })

  it('falls back to company and job title when title is omitted (covers: AC-6)', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValueOnce({
      id: 'profile_1',
      userId: 'user_1',
    } as unknown as Profile)
    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValueOnce({
      id: 'job_1',
      userId: 'user_1',
      companyName: 'Anthropic Partner',
      title: 'Senior AI Engineer',
    } as unknown as JobPosting)
    vi.mocked(prisma.tailoredResume.create).mockResolvedValueOnce({
      id: 'snapshot_1',
      title: 'Anthropic Partner - Senior AI Engineer',
    } as unknown as TailoredResume)

    const result = await createTailoredResumeSnapshot('user_1', {
      profileId: 'profile_1',
      jobPostingId: 'job_1',
      language: 'EN',
      missingSkills: [],
      tailoredContent: {
        tailoredExperiences: [],
        recommendedSkills: [],
        keyStrengths: [],
      },
    })

    expect(prisma.tailoredResume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Anthropic Partner - Senior AI Engineer',
        }),
      }),
    )
    expect(result.id).toBe('snapshot_1')
  })

  it('retrieves single tailored resume snapshot scoped to userId (covers: AC-6)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

    const result = await getTailoredResumeById('user_1', 'snap_123')
    expect(prisma.tailoredResume.findFirst).toHaveBeenCalledWith({
      where: { id: 'snap_123', userId: 'user_1' },
      include: expect.any(Object),
    })
    expect(result).toBeNull()
  })

  it('retrieves all tailored resumes for user (covers: AC-6)', async () => {
    vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce([])

    const result = await getTailoredResumesByUser('user_1', 'job_1')
    expect(prisma.tailoredResume.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', jobPostingId: 'job_1' },
      include: expect.any(Object),
      orderBy: expect.any(Object),
    })
    expect(result).toEqual([])
  })
})
