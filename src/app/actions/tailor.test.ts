import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCandidateProfile,
  saveCandidateProfile,
  loadSampleCandidateProfile,
  getTailorStudioInitialData,
  getOutreachMessageAction,
} from './tailor'
import { auth } from '@/auth'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'
import { prisma } from '@/lib/prisma'
import { getProviderConfigurations } from '@/app/actions/provider-settings'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    tailoredResume: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/profiles', () => ({
  getDefaultProfile: vi.fn(),
  upsertTailoringCandidateProfile: vi.fn(),
}))

vi.mock('@/app/actions/provider-settings', () => ({
  getProviderConfigurations: vi.fn(),
}))

const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('Tailor Server Actions (covers: AC-1, AC-3, AC-7, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCandidateProfile', () => {
    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const res = await getCandidateProfile('EN')
      expect(res).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns profile when authenticated', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_1' },
        expires: '2099-01-01',
      })
      const mockProfile = {
        id: 'prof_1',
        userId: 'user_1',
        language: 'EN',
        headline: 'Lead Developer',
        summary: 'Expert in full-stack architecture',
        workExperiences: [],
      }
      vi.mocked(getDefaultProfile).mockResolvedValueOnce(mockProfile as never)

      const res = await getCandidateProfile('EN')
      expect(res).toEqual({ success: true, profile: mockProfile })
      expect(getDefaultProfile).toHaveBeenCalledWith('user_1', 'EN')
    })
  })

  describe('saveCandidateProfile', () => {
    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const res = await saveCandidateProfile({
        headline: 'Engineer',
        summary: 'Valid summary with enough text',
        experiences: [{ companyName: 'Corp', jobTitle: 'Dev', bullets: ['Built stuff'] }],
      })
      expect(res).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns validation error on invalid input', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_1' },
        expires: '2099-01-01',
      })
      const res = await saveCandidateProfile({
        headline: '',
        summary: 'too short',
        experiences: [],
      })
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('saves candidate profile and returns profileId on valid input', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_1' },
        expires: '2099-01-01',
      })
      vi.mocked(upsertTailoringCandidateProfile).mockResolvedValueOnce({
        profileId: 'prof_saved_123',
      })

      const res = await saveCandidateProfile({
        language: 'EN',
        headline: 'Senior Engineer',
        summary: 'Over 6 years of experience building modern cloud web applications.',
        experiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Senior Full Stack Engineer',
            bullets: ['Led AI integration pipeline'],
          },
        ],
      })

      expect(res).toEqual({ success: true, profileId: 'prof_saved_123' })
      expect(upsertTailoringCandidateProfile).toHaveBeenCalledWith('user_1', {
        profileId: undefined,
        language: 'EN',
        headline: 'Senior Engineer',
        summary: 'Over 6 years of experience building modern cloud web applications.',
        experiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Senior Full Stack Engineer',
            bullets: ['Led AI integration pipeline'],
          },
        ],
      })
    })
  })

  describe('loadSampleCandidateProfile', () => {
    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const res = await loadSampleCandidateProfile('EN')
      expect(res).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns English sample candidate when requested', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_1' },
        expires: '2099-01-01',
      })
      const res = await loadSampleCandidateProfile('EN')
      expect(res.success).toBe(true)
      expect(res.profile?.headline).toContain('Senior Full Stack Engineer')
      expect(res.profile?.workExperiences.length).toBeGreaterThan(0)
    })

    it('returns Arabic sample candidate when requested', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_1' },
        expires: '2099-01-01',
      })
      const res = await loadSampleCandidateProfile('AR')
      expect(res.success).toBe(true)
      expect(res.profile?.headline).toContain('مهندس برمجيات')
      expect(res.profile?.workExperiences.length).toBeGreaterThan(0)
    })
  })

  describe('getTailorStudioInitialData (covers: AC-1, AC-3, AC-8)', () => {
    it('returns empty null session when unauthenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const res = await getTailorStudioInitialData('EN')
      expect(res.session).toBeNull()
      expect(res.profile).toBeNull()
      expect(res.latestTailoredResume).toBeNull()
    })

    it('returns enriched initial data with prefilled job posting, hasOutreach, hasApplication, and verified email status', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
        expires: '2099-01-01',
      })

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        name: 'Jane Doe',
        emailVerified: new Date('2026-01-01'),
      } as never)

      vi.mocked(getDefaultProfile).mockResolvedValueOnce({
        id: 'prof_123',
        headline: 'Staff Infrastructure Architect',
        summary: 'Cloud scaling expert',
        workExperiences: [
          {
            companyName: 'CloudCorp',
            jobTitle: 'Architect',
            bullets: ['Built multi-region setup'],
          },
        ],
      } as never)

      vi.mocked(getProviderConfigurations).mockResolvedValueOnce([
        { provider: 'OPENAI', isActive: true, isConfigured: true, defaultModel: 'gpt-4o' },
      ] as never)

      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce({
        id: 'resume_123',
        atsScore: 92,
        atsBreakdown: { overallScore: 92 },
        tailoredSummary: 'Proven infrastructure engineer with multi-cloud mastery.',
        outreachMessage: { connectionNote: { text: 'Hello' } },
        jobPosting: {
          title: 'Senior DevOps Lead',
          companyName: 'Acme Systems',
          rawDescription: 'Looking for a Senior DevOps Lead to guide multi-cloud scaling.',
        },
        applications: [{ id: 'app_saved_1' }],
      } as never)

      const res = await getTailorStudioInitialData('EN')

      expect(res.session?.user.id).toBe('user_123')
      expect(res.session?.user.emailVerified).toBe(true)
      expect(res.profile?.candidateName).toBe('Jane Doe')
      expect(res.profile?.emailVerified).toBe(true)
      expect(res.profile?.headline).toBe('Staff Infrastructure Architect')
      expect(res.activeProvider).toBe('OPENAI')
      expect(res.defaultModel).toBe('gpt-4o')

      // Verify dead payload elimination (interviewPrep eliminated)
      expect(res.latestTailoredResume?.id).toBe('resume_123')
      expect(res.latestTailoredResume?.hasOutreach).toBe(true)
      expect(res.latestTailoredResume?.hasApplication).toBe(true)
      expect(res.latestTailoredResume?.jobPosting?.companyName).toBe('Acme Systems')
      expect((res.latestTailoredResume as Record<string, unknown>).interviewPrep).toBeUndefined()
    })
  })

  describe('getOutreachMessageAction (covers: AC-7)', () => {
    it('returns unauthorized error when unauthenticated', async () => {
      mockAuth.mockResolvedValueOnce(null)
      const res = await getOutreachMessageAction('res_123')
      expect(res).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns error when tailoredResumeId is missing', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user_1' } })
      const res = await getOutreachMessageAction('')
      expect(res).toEqual({ success: false, error: 'Tailored resume ID is required' })
    })

    it('returns error when resume is not found', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user_1' } })
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

      const res = await getOutreachMessageAction('res_nonexistent')
      expect(res).toEqual({ success: false, error: 'Tailored resume not found' })
    })

    it('returns data undefined when outreachMessage is null', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user_1' } })
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce({
        outreachMessage: null,
      } as never)

      const res = await getOutreachMessageAction('res_no_outreach')
      expect(res).toEqual({ success: true, data: undefined })
    })

    it('returns parsed outreach payload on valid record', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user_1' } })
      const validPayload = {
        version: 1,
        generatedAt: '2026-10-29T00:00:00.000Z',
        updatedAt: '2026-10-29T00:00:00.000Z',
        language: 'EN',
        tone: 'PROFESSIONAL',
        recipientType: 'RECRUITER',
        connectionNote: { text: 'Hi recruiter', charCount: 12 },
        inMail: { subject: 'InMail Subject', body: 'InMail Body' },
        email: { subject: 'Email Subject', body: 'Email Body' },
      }
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce({
        outreachMessage: validPayload,
      } as never)

      const res = await getOutreachMessageAction('res_valid')
      expect(res.success).toBe(true)
      expect(res.data?.connectionNote.text).toBe('Hi recruiter')
    })
  })
})
