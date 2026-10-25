import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseResumeAction, retryParsingAction, commitParsedResumeAction } from './resume-actions'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as providerSettingsModule from '@/lib/db/provider-settings'
import * as extractModule from '@/lib/parsing/extract'
import * as resumeParserModule from '@/lib/ai/prompts/resume-parser'
import { ParsedResumePayloadSchema } from '@/lib/validations/parsed-resume'
import type { ParsedResume } from '@prisma/client'
import type { DecryptedProviderSetting } from '@/lib/db/provider-settings'
import type { ParsedResumePayload } from '@/lib/validations/parsed-resume'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    parsedResume: {
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    userProviderSetting: {
      findMany: vi.fn(),
    },
    profile: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    workExperience: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
    },
    education: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
    },
    skill: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
}))

vi.mock('@/lib/parsing/extract', () => ({
  detectDocumentFormat: vi.fn(),
  extractDocumentText: vi.fn(),
  ExtractionError: class ExtractionError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
}))

vi.mock('@/lib/ai/prompts/resume-parser', () => ({
  parseResumeWithAi: vi.fn(),
  AiParsingError: class AiParsingError extends Error {
    code = 'AI_PROVIDER_ERROR'
  },
}))

const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('Resume Actions Server Actions (AC-1, AC-3, AC-5, AC-6, AC-7)', () => {
  const mockUserId = 'user-test-123'
  const mockSession = { user: { id: mockUserId } }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseResumeAction (AC-1, AC-2, AC-3, AC-6, AC-7)', () => {
    it('rejects unauthenticated request with 401 UNAUTHORIZED (AC-7)', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const formData = new FormData()
      formData.append('file', new File(['dummy'], 'resume.pdf', { type: 'application/pdf' }))

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('UNAUTHORIZED')
    })

    it('rejects request with missing file payload (AC-1)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      const formData = new FormData()

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('INVALID_FORMAT')
    })

    it('rejects file exceeding 10MB limit (AC-1)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      const hugeBuffer = new Uint8Array(10 * 1024 * 1024 + 100)
      const formData = new FormData()
      formData.append(
        'file',
        new File([hugeBuffer], 'huge-resume.pdf', { type: 'application/pdf' }),
      )

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('FILE_TOO_LARGE')
    })

    it('handles text extraction failure and records EXTRACTION_FAILED (AC-2, AC-6)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(extractModule.detectDocumentFormat).mockReturnValueOnce('PDF')
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'record-err-1',
        userId: mockUserId,
      } as unknown as ParsedResume)
      vi.mocked(extractModule.extractDocumentText).mockRejectedValueOnce(
        new extractModule.ExtractionError(
          'EXTRACTION_FAILED',
          'Document is a scanned image with no readable text.',
        ),
      )

      const formData = new FormData()
      formData.append(
        'file',
        new File(['%PDF-1.4 dummy'], 'scanned.pdf', { type: 'application/pdf' }),
      )

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('EXTRACTION_FAILED')
      expect(result.error).toContain('scanned image')
      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'record-err-1', userId: mockUserId },
          data: expect.objectContaining({ status: 'FAILED', errorCode: 'EXTRACTION_FAILED' }),
        }),
      )
    })

    it('handles AI provider failure, preserves rawText, and records AI_PROVIDER_ERROR (AC-3, AC-6)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(extractModule.detectDocumentFormat).mockReturnValueOnce('PDF')
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'record-ai-err',
        userId: mockUserId,
      } as unknown as ParsedResume)
      vi.mocked(extractModule.extractDocumentText).mockResolvedValueOnce({
        text: 'Extracted raw resume text with experiences and skills.',
        format: 'PDF',
        characterCount: 60,
      })
      vi.mocked(providerSettingsModule.getActiveProviderSettings).mockResolvedValueOnce([
        {
          id: 'prov-1',
          provider: 'OPENAI',
          defaultModel: 'gpt-4o',
        } as unknown as DecryptedProviderSetting,
      ])
      vi.mocked(resumeParserModule.parseResumeWithAi).mockRejectedValueOnce(
        new Error('AI provider connection timeout after 60 seconds.'),
      )

      const formData = new FormData()
      formData.append('file', new File(['%PDF content'], 'cv.pdf', { type: 'application/pdf' }))

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('AI_PROVIDER_ERROR')
      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'record-ai-err', userId: mockUserId },
          data: expect.objectContaining({
            status: 'FAILED',
            errorCode: 'AI_PROVIDER_ERROR',
            rawText: 'Extracted raw resume text with experiences and skills.',
          }),
        }),
      )
    })

    it('completes end-to-end parsing successfully into REVIEWING status (AC-1, AC-3)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(extractModule.detectDocumentFormat).mockReturnValueOnce('PDF')
      vi.mocked(prisma.parsedResume.create).mockResolvedValueOnce({
        id: 'record-success-1',
        userId: mockUserId,
      } as unknown as ParsedResume)
      vi.mocked(extractModule.extractDocumentText).mockResolvedValueOnce({
        text: 'Raw candidate background text.',
        format: 'PDF',
        characterCount: 30,
      })
      vi.mocked(providerSettingsModule.getActiveProviderSettings).mockResolvedValueOnce([
        {
          id: 'prov-1',
          provider: 'OPENAI',
          defaultModel: 'gpt-4o',
        } as unknown as DecryptedProviderSetting,
      ])
      const mockPayload = {
        language: 'EN' as const,
        fullName: 'Alex Morgan',
        headline: 'Staff Software Architect',
        skills: ['TypeScript', 'Next.js'],
        experiences: [],
        educations: [],
        projects: [],
      }
      vi.mocked(resumeParserModule.parseResumeWithAi).mockResolvedValueOnce(
        mockPayload as unknown as ParsedResumePayload,
      )

      const formData = new FormData()
      formData.append('file', new File(['%PDF-1.5'], 'alex-cv.pdf', { type: 'application/pdf' }))

      const result = await parseResumeAction(formData)
      expect(result.success).toBe(true)
      expect(result.parsedResumeId).toBe('record-success-1')
      expect(result.data?.fullName).toBe('Alex Morgan')
      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'record-success-1', userId: mockUserId },
          data: expect.objectContaining({
            status: 'REVIEWING',
            rawText: 'Raw candidate background text.',
          }),
        }),
      )
    })
  })

  describe('retryParsingAction (AC-6, AC-7)', () => {
    it('rejects unauthenticated retry request (AC-7)', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const result = await retryParsingAction('record-1')
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('UNAUTHORIZED')
    })

    it('rejects retry when parsedResume record does not exist or user mismatch (AC-7)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce(null)

      const result = await retryParsingAction('non-existent-id')
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('NOT_FOUND')
    })

    it('successfully re-runs AI extraction using preserved rawText without re-upload (AC-6)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce({
        id: 'record-retry-1',
        userId: mockUserId,
        rawText: 'Preserved resume text from prior attempt.',
      } as unknown as ParsedResume)
      vi.mocked(providerSettingsModule.getActiveProviderSettings).mockResolvedValueOnce([
        {
          id: 'prov-1',
          provider: 'OPENAI',
          defaultModel: 'gpt-4o',
        } as unknown as DecryptedProviderSetting,
      ])
      vi.mocked(resumeParserModule.parseResumeWithAi).mockResolvedValueOnce({
        language: 'EN' as const,
        fullName: 'Retried Candidate',
        skills: ['PostgreSQL'],
        experiences: [],
        educations: [],
        projects: [],
      } as unknown as ParsedResumePayload)

      const result = await retryParsingAction('record-retry-1')
      expect(result.success).toBe(true)
      expect(result.data?.fullName).toBe('Retried Candidate')
      expect(prisma.parsedResume.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'record-retry-1', userId: mockUserId },
          data: expect.objectContaining({ status: 'REVIEWING' }),
        }),
      )
    })
  })

  describe('commitParsedResumeAction (AC-4, AC-5, AC-7)', () => {
    it('rejects unauthenticated commit request (AC-7)', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const result = await commitParsedResumeAction({
        parsedResumeId: 'rec-1',
        mergeConfig: {
          personalInfo: 'replace',
          experiences: 'replace',
          educations: 'replace',
          skills: 'append',
          projects: 'replace',
        },
        editedData: {
          language: 'EN',
          fullName: 'Test Candidate',
          email: '',
          phone: '',
          location: '',
          headline: '',
          summary: '',
          websiteUrl: '',
          linkedinUrl: '',
          githubUrl: '',
          experiences: [],
          educations: [],
          skills: [],
          projects: [],
          languages: [],
        },
      })
      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('UNAUTHORIZED')
    })

    it('creates new default Profile for first-time user and commits records atomically (AC-4, AC-5)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce({
        id: 'rec-commit-1',
        userId: mockUserId,
      } as unknown as ParsedResume)

      // Mock transaction execution
      const mockTx = {
        profile: {
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ id: 'new-profile-1' }),
          update: vi.fn(),
        },
        workExperience: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        education: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        skill: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findMany: vi.fn().mockResolvedValue([{ name: 'React', sortOrder: 0 }]),
        },
        project: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        parsedResume: {
          update: vi.fn().mockResolvedValue({ id: 'rec-commit-1', status: 'APPLIED' }),
        },
      }
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx)
      })

      const result = await commitParsedResumeAction({
        parsedResumeId: 'rec-commit-1',
        mergeConfig: {
          personalInfo: 'replace',
          experiences: 'replace',
          educations: 'replace',
          skills: 'append',
          projects: 'replace',
        },
        editedData: ParsedResumePayloadSchema.parse({
          language: 'EN',
          fullName: 'First Time User',
          headline: 'Full Stack Dev',
          experiences: [
            {
              companyName: 'Acme',
              jobTitle: 'Developer',
              startDate: '2022-01',
              endDate: '',
              isCurrent: true,
              bullets: ['Built APIs.'],
            },
          ],
          educations: [],
          skills: ['React', 'Next.js', 'react'], // 'React' and 'react' duplicate case-insensitive
          projects: [],
        }),
      })

      expect(result.success).toBe(true)
      expect(result.profileId).toBe('new-profile-1')
      expect(mockTx.profile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            isDefault: true,
            fullName: 'First Time User',
          }),
        }),
      )
      // Verify skill deduplication on append (only 'Next.js' should be inserted since 'React' exists)
      expect(mockTx.skill.createMany).toHaveBeenCalledWith({
        data: [{ profileId: 'new-profile-1', name: 'Next.js', sortOrder: 1 }],
      })
      // Verify parsedResume marked as APPLIED
      expect(mockTx.parsedResume.update).toHaveBeenCalledWith({
        where: { id: 'rec-commit-1' },
        data: { status: 'APPLIED', profileId: 'new-profile-1' },
      })
    })

    it('commits to existing profile with replace mode on experiences and skip on skills (AC-4, AC-5)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce({
        id: 'rec-commit-2',
        userId: mockUserId,
      } as unknown as ParsedResume)

      const mockTx = {
        profile: {
          findFirst: vi.fn().mockResolvedValue({ id: 'existing-profile-2', userId: mockUserId }),
          count: vi.fn().mockResolvedValue(1),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({ id: 'existing-profile-2' }),
        },
        workExperience: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        education: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        skill: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findMany: vi.fn(),
        },
        project: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        parsedResume: {
          update: vi.fn().mockResolvedValue({ id: 'rec-commit-2', status: 'APPLIED' }),
        },
      }
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx)
      })

      const result = await commitParsedResumeAction({
        parsedResumeId: 'rec-commit-2',
        targetProfileId: 'existing-profile-2',
        mergeConfig: {
          personalInfo: 'replace',
          experiences: 'replace',
          educations: 'replace',
          skills: 'skip',
          projects: 'skip',
        },
        editedData: ParsedResumePayloadSchema.parse({
          language: 'EN',
          fullName: 'Updated Name',
          headline: 'Senior Cloud Lead',
          experiences: [
            {
              companyName: 'CloudCorp',
              jobTitle: 'Lead',
              bullets: ['Replaced older experiences.'],
            },
          ],
          educations: [],
          skills: ['AWS'],
          projects: [],
        }),
      })

      expect(result.success).toBe(true)
      expect(result.profileId).toBe('existing-profile-2')
      expect(mockTx.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-profile-2' },
          data: expect.objectContaining({ fullName: 'Updated Name' }),
        }),
      )
      // Replaces experiences: deletes old, creates new
      expect(mockTx.workExperience.deleteMany).toHaveBeenCalledWith({
        where: { profileId: 'existing-profile-2' },
      })
      expect(mockTx.workExperience.createMany).toHaveBeenCalled()
      // Skills skipped: neither delete nor create
      expect(mockTx.skill.deleteMany).not.toHaveBeenCalled()
      expect(mockTx.skill.createMany).not.toHaveBeenCalled()
    })

    it('handles append mode on experiences by offsetting sortOrder (AC-4, AC-5)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce({
        id: 'rec-commit-3',
        userId: mockUserId,
      } as unknown as ParsedResume)

      const mockTx = {
        profile: {
          findFirst: vi.fn().mockResolvedValue({ id: 'existing-profile-3', userId: mockUserId }),
          count: vi.fn().mockResolvedValue(1),
          create: vi.fn(),
          update: vi.fn(),
        },
        workExperience: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn().mockResolvedValue({ sortOrder: 3 }),
        },
        education: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        skill: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        project: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
          findFirst: vi.fn(),
        },
        parsedResume: {
          update: vi.fn().mockResolvedValue({ id: 'rec-commit-3', status: 'APPLIED' }),
        },
      }
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: unknown) => {
        return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx)
      })

      const result = await commitParsedResumeAction({
        parsedResumeId: 'rec-commit-3',
        targetProfileId: 'existing-profile-3',
        mergeConfig: {
          personalInfo: 'skip',
          experiences: 'append',
          educations: 'skip',
          skills: 'skip',
          projects: 'skip',
        },
        editedData: ParsedResumePayloadSchema.parse({
          language: 'EN',
          fullName: 'Candidate',
          experiences: [
            {
              companyName: 'New Job',
              jobTitle: 'Developer',
              bullets: ['Appended bullet.'],
            },
          ],
          educations: [],
          skills: [],
          projects: [],
        }),
      })

      expect(result.success).toBe(true)
      // In append mode, deleteMany is NOT called
      expect(mockTx.workExperience.deleteMany).not.toHaveBeenCalled()
      // SortOrder offset by 4 (existing highest was 3)
      expect(mockTx.workExperience.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            profileId: 'existing-profile-3',
            companyName: 'New Job',
            sortOrder: 4,
          }),
        ],
      })
    })

    it('rejects commit when parsedResume record is not found or unauthorized (AC-7)', async () => {
      mockAuth.mockResolvedValueOnce(mockSession)
      vi.mocked(prisma.parsedResume.findFirst).mockResolvedValueOnce(null)

      const result = await commitParsedResumeAction({
        parsedResumeId: 'unauthorized-or-missing-id',
        mergeConfig: {
          personalInfo: 'replace',
          experiences: 'replace',
          educations: 'replace',
          skills: 'append',
          projects: 'replace',
        },
        editedData: ParsedResumePayloadSchema.parse({
          language: 'EN',
          fullName: 'Unknown',
        }),
      })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('NOT_FOUND')
    })
  })
})
