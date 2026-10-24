import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCandidateProfile, saveCandidateProfile, loadSampleCandidateProfile } from './tailor'
import { auth } from '@/auth'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/profiles', () => ({
  getDefaultProfile: vi.fn(),
  upsertTailoringCandidateProfile: vi.fn(),
}))

const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('Tailor Server Actions (covers: AC-3, AC-10)', () => {
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
})
