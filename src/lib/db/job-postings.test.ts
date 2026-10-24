import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createJobPosting,
  getJobPostingsByUser,
  getJobPostingById,
  deleteJobPosting,
} from './job-postings'
import { prisma } from '@/lib/prisma'
import type { JobPosting, Application } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobPosting: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    application: {
      findFirst: vi.fn(),
    },
  },
}))

describe('Job Postings Repository (covers: AC-5, AC-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates job posting with parsed skills list (covers: AC-5)', async () => {
    vi.mocked(prisma.jobPosting.create).mockResolvedValueOnce({
      id: 'job_1',
      userId: 'user_1',
      title: 'Senior Engineer',
      companyName: 'Acme',
      jobUrl: 'https://example.com/job',
      rawDescription: 'Job description text',
      parsedSkills: ['TypeScript', 'Next.js'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as JobPosting)

    const result = await createJobPosting('user_1', {
      title: 'Senior Engineer',
      companyName: 'Acme',
      jobUrl: 'https://example.com/job',
      rawDescription: 'Job description text',
      parsedSkills: ['TypeScript', 'Next.js'],
    })

    expect(prisma.jobPosting.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        title: 'Senior Engineer',
        companyName: 'Acme',
        jobUrl: 'https://example.com/job',
        rawDescription: 'Job description text',
        parsedSkills: ['TypeScript', 'Next.js'],
      },
    })
    expect(result.id).toBe('job_1')
  })

  it('retrieves user job postings (covers: AC-5)', async () => {
    vi.mocked(prisma.jobPosting.findMany).mockResolvedValueOnce([])

    const result = await getJobPostingsByUser('user_1')
    expect(prisma.jobPosting.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      include: expect.any(Object),
      orderBy: expect.any(Object),
    })
    expect(result).toEqual([])
  })

  it('retrieves single job posting scoped to userId (covers: AC-5)', async () => {
    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValueOnce(null)

    const result = await getJobPostingById('user_1', 'job_nonexistent')
    expect(prisma.jobPosting.findFirst).toHaveBeenCalledWith({
      where: { id: 'job_nonexistent', userId: 'user_1' },
      include: expect.any(Object),
    })
    expect(result).toBeNull()
  })

  it('rejects deleting job posting when active application is attached (covers: AC-8)', async () => {
    vi.mocked(prisma.application.findFirst).mockResolvedValueOnce({
      id: 'app_1',
      userId: 'user_1',
      jobPostingId: 'job_1',
    } as unknown as Application)

    await expect(deleteJobPosting('user_1', 'job_1')).rejects.toThrow(
      /Cannot delete job posting because it is linked to an active job application card/,
    )
    expect(prisma.jobPosting.deleteMany).not.toHaveBeenCalled()
  })

  it('allows deleting job posting when no applications reference it (covers: AC-8)', async () => {
    vi.mocked(prisma.application.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.jobPosting.deleteMany).mockResolvedValueOnce({ count: 1 })

    const deleted = await deleteJobPosting('user_1', 'job_1')
    expect(prisma.jobPosting.deleteMany).toHaveBeenCalledWith({
      where: { id: 'job_1', userId: 'user_1' },
    })
    expect(deleted).toBe(true)
  })
})
