import { describe, it, expect } from 'vitest'
import {
  AvatarUpdateInputSchema,
  IdentityUpdateInputSchema,
  WorkExperienceCreateSchema,
  EducationCreateSchema,
  SkillCreateSchema,
  ProjectCreateSchema,
  ReorderInputSchema,
} from './profile'

describe('Profile Validation Schemas (covers: AC-2, AC-4, AC-5)', () => {
  describe('AvatarUpdateInputSchema (AC-2)', () => {
    it('accepts null to remove photo', () => {
      const res = AvatarUpdateInputSchema.safeParse({ image: null })
      expect(res.success).toBe(true)
    })

    it('accepts valid small base64 WebP image data URI', () => {
      const smallDataUri =
        'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2wAA'
      const res = AvatarUpdateInputSchema.safeParse({ image: smallDataUri })
      expect(res.success).toBe(true)
    })

    it('rejects non-image data URIs', () => {
      const invalidUri = 'data:text/plain;base64,SGVsbG8gV29ybGQ='
      const res = AvatarUpdateInputSchema.safeParse({ image: invalidUri })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain('Avatar must be a valid image')
      }
    })

    it('rejects image payloads exceeding 50 KB cap', () => {
      // 51201 bytes = approx 68268 base64 chars
      const bigBase64 = 'A'.repeat(70000)
      const bigDataUri = `data:image/webp;base64,${bigBase64}`
      const res = AvatarUpdateInputSchema.safeParse({ image: bigDataUri })
      expect(res.success).toBe(false)
    })
  })

  describe('IdentityUpdateInputSchema (AC-4)', () => {
    it('validates required profileId and fullName', () => {
      const valid = {
        profileId: 'prof_123',
        fullName: 'Sara Al-Mansoor',
        headline: 'Staff Platform Engineer',
        summary: 'Experienced builder...',
        email: 'sara@example.com',
        phone: '+966500000000',
        location: 'Riyadh, KSA',
        websiteUrl: 'https://sara.dev',
        linkedinUrl: 'https://linkedin.com/in/sara',
        githubUrl: 'https://github.com/sara',
      }
      const res = IdentityUpdateInputSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('fails if fullName is blank', () => {
      const invalid = {
        profileId: 'prof_123',
        fullName: '   ',
      }
      const res = IdentityUpdateInputSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it('fails if invalid email format is provided', () => {
      const invalid = {
        profileId: 'prof_123',
        fullName: 'Sara Al-Mansoor',
        email: 'not-an-email',
      }
      const res = IdentityUpdateInputSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it('fails if invalid URL is provided', () => {
      const invalid = {
        profileId: 'prof_123',
        fullName: 'Sara Al-Mansoor',
        websiteUrl: 'htt//invalid-url',
      }
      const res = IdentityUpdateInputSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('Section Item Schemas (AC-5)', () => {
    it('validates WorkExperienceCreateSchema', () => {
      const res = WorkExperienceCreateSchema.safeParse({
        profileId: 'prof_1',
        companyName: 'Acme Technologies',
        jobTitle: 'Senior Backend Engineer',
        startDate: '2023-01-01',
        isCurrent: true,
        bullets: ['Designed microservices architecture', 'Led team of 5'],
      })
      expect(res.success).toBe(true)
    })

    it('validates EducationCreateSchema', () => {
      const res = EducationCreateSchema.safeParse({
        profileId: 'prof_1',
        institution: 'King Saud University',
        degree: 'B.S. in Computer Science',
        startDate: '2018-09-01',
        endDate: '2022-06-01',
        grade: '3.9/4.0',
      })
      expect(res.success).toBe(true)
    })

    it('validates SkillCreateSchema', () => {
      const res = SkillCreateSchema.safeParse({
        profileId: 'prof_1',
        name: 'TypeScript',
        category: 'Languages',
      })
      expect(res.success).toBe(true)
    })

    it('validates ProjectCreateSchema', () => {
      const res = ProjectCreateSchema.safeParse({
        profileId: 'prof_1',
        name: 'Open ATS Engine',
        description: 'Semantic vector-based ATS matching engine',
        technologies: ['Next.js', 'PostgreSQL', 'Prisma'],
        url: 'https://github.com/example/ats',
      })
      expect(res.success).toBe(true)
    })

    it('validates ReorderInputSchema', () => {
      const res = ReorderInputSchema.safeParse({
        section: 'experiences',
        itemIds: ['exp_3', 'exp_1', 'exp_2'],
      })
      expect(res.success).toBe(true)
    })

    it('rejects invalid section in ReorderInputSchema', () => {
      const res = ReorderInputSchema.safeParse({
        section: 'unknown_section',
        itemIds: ['item_1'],
      })
      expect(res.success).toBe(false)
    })
  })
})
