import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createParsedResume,
  updateParsedResumeSuccess,
  updateParsedResumeFailure,
  saveParsedResume,
  getParsedResumeById,
  getParsedResumesByUser,
} from './parsed-resumes'
import { prisma } from '@/lib/prisma'
import {
  ParsedResumePayloadSchema,
  SectionMergeConfigSchema,
} from '@/lib/validations/parsed-resume'
import { ZodError } from 'zod'
import type { ParsedResume } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    parsedResume: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('ParsedResumes Database Repository and Validations (AC-5, AC-6, AC-7)', () => {
  const mockUserId = 'user-rep-456'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createParsedResume (AC-5, AC-7)', () => {
    it('creates initial record in PROCESSING state with default nulls', async () => {
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'rec-1',
        userId: mockUserId,
        status: 'PROCESSING',
      } as unknown as ParsedResume)

      const result = await createParsedResume(mockUserId, {
        originalFileName: 'cv.pdf',
        fileFormat: 'PDF',
      })

      expect(prisma.parsedResume.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          profileId: null,
          originalFileName: 'cv.pdf',
          fileFormat: 'PDF',
          status: 'PROCESSING',
          rawText: null,
        },
      })
      expect(result.id).toBe('rec-1')
    })

    it('creates record with custom status, rawText and profileId', async () => {
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'rec-2',
        userId: mockUserId,
      } as unknown as ParsedResume)

      await createParsedResume(mockUserId, {
        originalFileName: 'profile.docx',
        fileFormat: 'DOCX',
        profileId: 'profile-100',
        status: 'REVIEWING',
        rawText: 'Extracted text content',
      })

      expect(prisma.parsedResume.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          profileId: 'profile-100',
          originalFileName: 'profile.docx',
          fileFormat: 'DOCX',
          status: 'REVIEWING',
          rawText: 'Extracted text content',
        },
      })
    })
  })

  describe('updateParsedResumeSuccess (AC-5, AC-7)', () => {
    it('updates record to REVIEWING status with parsedPayload and rawText', async () => {
      vi.mocked(prisma.parsedResume.updateMany).mockResolvedValueOnce({ count: 1 })

      const payload = ParsedResumePayloadSchema.parse({
        language: 'EN',
        fullName: 'Jane Doe',
        skills: ['TypeScript', 'Next.js'],
      })

      const result = await updateParsedResumeSuccess(mockUserId, 'rec-123', {
        rawText: 'Full extracted text',
        parsedPayload: payload,
      })

      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'rec-123',
          userId: mockUserId,
        },
        data: {
          status: 'REVIEWING',
          rawText: 'Full extracted text',
          parsedPayload: payload,
          errorCode: null,
          errorMessage: null,
        },
      })
      expect(result.count).toBe(1)
    })
  })

  describe('updateParsedResumeFailure (AC-6, AC-7)', () => {
    it('updates record to FAILED with error code and preserves rawText when given', async () => {
      vi.mocked(prisma.parsedResume.updateMany).mockResolvedValueOnce({ count: 1 })

      await updateParsedResumeFailure(mockUserId, 'rec-fail-1', {
        errorCode: 'AI_PROVIDER_ERROR',
        errorMessage: 'Quota exceeded',
        rawText: 'Preserved text from extraction',
      })

      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'rec-fail-1',
          userId: mockUserId,
        },
        data: {
          status: 'FAILED',
          errorCode: 'AI_PROVIDER_ERROR',
          errorMessage: 'Quota exceeded',
          rawText: 'Preserved text from extraction',
        },
      })
    })

    it('updates record to FAILED without altering rawText when rawText is undefined', async () => {
      vi.mocked(prisma.parsedResume.updateMany).mockResolvedValueOnce({ count: 1 })

      await updateParsedResumeFailure(mockUserId, 'rec-fail-2', {
        errorCode: 'EXTRACTION_FAILED',
        errorMessage: 'Corrupt archive',
      })

      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'rec-fail-2',
          userId: mockUserId,
        },
        data: {
          status: 'FAILED',
          errorCode: 'EXTRACTION_FAILED',
          errorMessage: 'Corrupt archive',
        },
      })
    })
  })

  describe('saveParsedResume (AC-5, AC-7)', () => {
    it('validates schema and creates record', async () => {
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'rec-save-1',
      } as unknown as ParsedResume)

      await saveParsedResume(mockUserId, {
        originalFileName: 'saved.pdf',
        fileFormat: 'PDF',
        status: 'PROCESSING',
        rawText: 'Raw text sample',
        parsedPayload: ParsedResumePayloadSchema.parse({}),
      })

      expect(prisma.parsedResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            originalFileName: 'saved.pdf',
            fileFormat: 'PDF',
            status: 'PROCESSING',
          }),
        }),
      )
    })

    it('throws validation error when originalFileName is empty', async () => {
      await expect(
        saveParsedResume(mockUserId, {
          originalFileName: '',
          fileFormat: 'PDF',
          status: 'PROCESSING',
          parsedPayload: ParsedResumePayloadSchema.parse({}),
        }),
      ).rejects.toThrowError(ZodError)
    })
  })

  describe('getParsedResumeById & getParsedResumesByUser (AC-7)', () => {
    it('queries single parsed resume scoped to user ID', async () => {
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce({
        id: 'rec-mine',
        userId: mockUserId,
      } as unknown as ParsedResume)

      const record = await getParsedResumeById(mockUserId, 'rec-mine')
      expect(prisma.parsedResume.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'rec-mine',
          userId: mockUserId,
        },
      })
      expect(record?.id).toBe('rec-mine')
    })

    it('queries all resumes for a user sorted by createdAt desc', async () => {
      vi.mocked(prisma.parsedResume.findMany).mockResolvedValueOnce([
        { id: 'rec-b' } as ParsedResume,
        { id: 'rec-a' } as ParsedResume,
      ])

      const records = await getParsedResumesByUser(mockUserId)
      expect(prisma.parsedResume.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      })
      expect(records.length).toBe(2)
    })
  })

  describe('Parsed Resume Zod Schemas Validation (AC-4, AC-5)', () => {
    it('validates SectionMergeConfig defaults', () => {
      const config = SectionMergeConfigSchema.parse({})
      expect(config.personalInfo).toBe('replace')
      expect(config.experiences).toBe('replace')
      expect(config.educations).toBe('replace')
      expect(config.skills).toBe('append')
      expect(config.projects).toBe('replace')
    })

    it('rejects invalid merge actions for personalInfo', () => {
      expect(() =>
        SectionMergeConfigSchema.parse({
          personalInfo: 'append', // only 'replace' or 'skip' allowed for personalInfo
        }),
      ).toThrowError(ZodError)
    })

    it('parses valid payload with empty section fallbacks', () => {
      const parsed = ParsedResumePayloadSchema.parse({
        fullName: 'Omar Khaled',
      })
      expect(parsed.language).toBe('EN')
      expect(parsed.experiences).toEqual([])
      expect(parsed.educations).toEqual([])
      expect(parsed.skills).toEqual([])
      expect(parsed.projects).toEqual([])
      expect(parsed.languages).toEqual([])
    })
  })
})
