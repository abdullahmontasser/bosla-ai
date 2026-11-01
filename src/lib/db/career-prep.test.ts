import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCareerPrepSelectorRows, getCareerPrepData, getCareerPrepPrintData } from './career-prep'
import { prisma } from '@/lib/prisma'
import {
  mockInterviewPrepPayloadEn,
  type InterviewPrepPayload,
} from '@/lib/validations/career-prep'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tailoredResume: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('Career Prep Database Read Helpers (covers: AC-1, AC-8, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCareerPrepSelectorRows', () => {
    it('returns deduplicated rows newest first, computing prep status (AC-1, AC-10)', async () => {
      const mockResumes = [
        {
          id: 'resume-newest-job1',
          jobPostingId: 'job-1',
          interviewPrep: mockInterviewPrepPayloadEn,
          createdAt: new Date('2026-10-30T10:00:00.000Z'),
          jobPosting: {
            id: 'job-1',
            title: 'Senior Engineer',
            companyName: 'CloudScale',
          },
        },
        {
          id: 'resume-older-job1',
          jobPostingId: 'job-1',
          interviewPrep: null,
          createdAt: new Date('2026-10-29T10:00:00.000Z'),
          jobPosting: {
            id: 'job-1',
            title: 'Senior Engineer',
            companyName: 'CloudScale',
          },
        },
        {
          id: 'resume-job2',
          jobPostingId: 'job-2',
          interviewPrep: null,
          createdAt: new Date('2026-10-28T10:00:00.000Z'),
          jobPosting: {
            id: 'job-2',
            title: 'Staff Architect',
            companyName: 'Anthropic Partner',
          },
        },
      ]

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce(mockResumes as never)

      const result = await getCareerPrepSelectorRows('user-1', { offset: 0, limit: 50 })

      expect(result.rows).toHaveLength(2)
      // First row is the newest version of job-1
      expect(result.rows[0].tailoredResumeId).toBe('resume-newest-job1')
      expect(result.rows[0].companyName).toBe('CloudScale')
      expect(result.rows[0].hasInterviewPrep).toBe(true)

      // Second row is job-2
      expect(result.rows[1].tailoredResumeId).toBe('resume-job2')
      expect(result.rows[1].companyName).toBe('Anthropic Partner')
      expect(result.rows[1].hasInterviewPrep).toBe(false)
      expect(result.hasMore).toBe(false)
    })

    it('marks a custom-only draft job as Needs prep, not Ready (AC-1, Invariants)', async () => {
      const customOnlyDraft: InterviewPrepPayload = {
        ...mockInterviewPrepPayloadEn,
        questions: [
          {
            id: 'custom-1',
            category: 'CUSTOM',
            customOrigin: true,
            question: 'My own custom question',
            whyAsked: '',
            starResponse: { situation: '', task: '', action: '', result: '' },
            referencedSources: [],
            missingMetricFlags: [],
          },
        ],
      }

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce([
        {
          id: 'resume-custom-draft',
          jobPostingId: 'job-1',
          interviewPrep: customOnlyDraft,
          createdAt: new Date('2026-10-30T10:00:00.000Z'),
          jobPosting: { id: 'job-1', title: 'Senior Engineer', companyName: 'CloudScale' },
        },
      ] as never)

      const result = await getCareerPrepSelectorRows('user-1', { offset: 0, limit: 50 })

      expect(result.rows[0].hasInterviewPrep).toBe(false)
    })

    it('handles pagination with offset and limit (AC-10)', async () => {
      const mockResumes = Array.from({ length: 60 }, (_, i) => ({
        id: `resume-${i}`,
        jobPostingId: `job-${i}`,
        interviewPrep: null,
        createdAt: new Date(Date.now() - i * 1000),
        jobPosting: {
          id: `job-${i}`,
          title: `Role ${i}`,
          companyName: `Company ${i}`,
        },
      }))

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce(mockResumes as never)

      const chunk1 = await getCareerPrepSelectorRows('user-1', { offset: 0, limit: 50 })
      expect(chunk1.rows).toHaveLength(50)
      expect(chunk1.hasMore).toBe(true)
      expect(chunk1.nextOffset).toBe(50)

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce(mockResumes as never)
      const chunk2 = await getCareerPrepSelectorRows('user-1', { offset: 50, limit: 50 })
      expect(chunk2.rows).toHaveLength(10)
      expect(chunk2.hasMore).toBe(false)
      expect(chunk2.nextOffset).toBe(60)
    })
  })

  describe('getCareerPrepData', () => {
    it('returns empty state when user has zero tailored resumes (AC-8)', async () => {
      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce([])

      const result = await getCareerPrepData('user-1', null)
      expect(result.selectorRows).toEqual([])
      expect(result.selectedResume).toBeNull()
      expect(result.fallbackNotice).toBe(false)
    })

    it('resolves valid requested tailoredResumeId and computes grounding flag (AC-1, AC-2)', async () => {
      const mockSelectorRow = {
        id: 'resume-1',
        jobPostingId: 'job-1',
        interviewPrep: mockInterviewPrepPayloadEn,
        createdAt: new Date('2026-10-30T10:00:00.000Z'),
        jobPosting: {
          id: 'job-1',
          title: 'Senior Engineer',
          companyName: 'CloudScale',
        },
      }

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce([mockSelectorRow] as never)

      const mockDetail = {
        id: 'resume-1',
        jobPostingId: 'job-1',
        language: 'EN',
        interviewPrep: mockInterviewPrepPayloadEn,
        jobPosting: {
          id: 'job-1',
          title: 'Senior Engineer',
          companyName: 'CloudScale',
        },
        profile: {
          workExperiences: [{ id: 'exp-1' }],
          projects: [],
        },
      }

      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(mockDetail as never)

      const result = await getCareerPrepData('user-1', 'resume-1')
      expect(result.fallbackNotice).toBe(false)
      expect(result.selectedResume).not.toBeNull()
      expect(result.selectedResume?.id).toBe('resume-1')
      expect(result.selectedResume?.hasGrounding).toBe(true)
    })

    it('falls back to newest job with notice when requested param is unknown or unowned (AC-8)', async () => {
      const mockSelectorRow = {
        id: 'resume-newest',
        jobPostingId: 'job-1',
        interviewPrep: mockInterviewPrepPayloadEn,
        createdAt: new Date('2026-10-30T10:00:00.000Z'),
        jobPosting: {
          id: 'job-1',
          title: 'Senior Engineer',
          companyName: 'CloudScale',
        },
      }

      vi.mocked(prisma.tailoredResume.findMany).mockResolvedValueOnce([mockSelectorRow] as never)

      // First query for bad-id returns null
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

      // Second query for fallbackId returns the newest
      const mockFallbackResume = {
        id: 'resume-newest',
        jobPostingId: 'job-1',
        language: 'EN',
        interviewPrep: mockInterviewPrepPayloadEn,
        jobPosting: {
          id: 'job-1',
          title: 'Senior Engineer',
          companyName: 'CloudScale',
        },
        profile: {
          workExperiences: [],
          projects: [],
        },
      }
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(mockFallbackResume as never)

      const result = await getCareerPrepData('user-1', 'foreign-or-deleted-id')
      expect(result.fallbackNotice).toBe(true)
      expect(result.selectedResume?.id).toBe('resume-newest')
      expect(result.selectedResume?.hasGrounding).toBe(false)
    })
  })

  describe('getCareerPrepPrintData', () => {
    it('returns normalized payload for owned resume (AC-7)', async () => {
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce({
        id: 'resume-1',
        jobPostingId: 'job-1',
        language: 'EN',
        interviewPrep: mockInterviewPrepPayloadEn,
        updatedAt: new Date('2026-10-30T00:00:00.000Z'),
        jobPosting: {
          title: 'Senior Engineer',
          companyName: 'CloudScale',
        },
      } as never)

      const result = await getCareerPrepPrintData('user-1', 'resume-1')
      expect(result).not.toBeNull()
      expect(result?.roleTitle).toBe('Senior Engineer')
      expect(result?.payload?.version).toBe(2)
    })

    it('returns null when resume is not found or access denied (AC-7, AC-8)', async () => {
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

      const result = await getCareerPrepPrintData('user-1', 'unowned-id')
      expect(result).toBeNull()
    })
  })
})
