import { describe, it, expect } from 'vitest'
import {
  CandidateExperienceInputSchema,
  SaveCandidateProfileSchema,
  TailorPayloadSchema,
} from './tailor'

describe('CandidateExperienceInputSchema', () => {
  it('validates a correct experience input (covers: AC-3)', () => {
    const valid = {
      companyName: 'Acme Corp',
      jobTitle: 'Senior Software Engineer',
      bullets: ['Led migration of legacy systems to microservices.'],
    }
    const result = CandidateExperienceInputSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty company name or job title', () => {
    const invalid = {
      companyName: '   ',
      jobTitle: '',
      bullets: ['Valid bullet point.'],
    }
    const result = CandidateExperienceInputSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects an empty bullets array', () => {
    const invalid = {
      companyName: 'Acme Corp',
      jobTitle: 'Engineer',
      bullets: [],
    }
    const result = CandidateExperienceInputSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('SaveCandidateProfileSchema', () => {
  it('validates a complete candidate profile (covers: AC-3, AC-10)', () => {
    const valid = {
      headline: 'Full Stack Architect',
      summary: 'Experienced engineer with expertise in React, Next.js, and distributed databases.',
      language: 'EN',
      experiences: [
        {
          companyName: 'TechVanguard Systems',
          jobTitle: 'Lead Architect',
          bullets: ['Engineered scalable AI streaming endpoints.'],
        },
      ],
    }
    const result = SaveCandidateProfileSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults language to EN when omitted', () => {
    const valid = {
      headline: 'Full Stack Architect',
      summary: 'Experienced engineer with expertise in React, Next.js, and distributed databases.',
      experiences: [
        {
          companyName: 'TechVanguard Systems',
          jobTitle: 'Lead Architect',
          bullets: ['Engineered scalable AI streaming endpoints.'],
        },
      ],
    }
    const result = SaveCandidateProfileSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe('EN')
    }
  })

  it('rejects summary shorter than 10 characters', () => {
    const invalid = {
      headline: 'Engineer',
      summary: 'Short',
      experiences: [
        {
          companyName: 'Acme Corp',
          jobTitle: 'Engineer',
          bullets: ['Bullet'],
        },
      ],
    }
    const result = SaveCandidateProfileSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects profile with no work experiences', () => {
    const invalid = {
      headline: 'Engineer',
      summary: 'Long enough summary to pass validation.',
      experiences: [],
    }
    const result = SaveCandidateProfileSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('TailorPayloadSchema', () => {
  it('validates valid tailoring payload (covers: AC-4)', () => {
    const valid = {
      profileId: 'prof_12345',
      jobTitle: 'Senior Full Stack Engineer',
      companyName: 'Global Cloud Systems',
      rawJobDescription:
        'We are seeking a senior full stack engineer with deep knowledge of React, Next.js App Router, and TypeScript.',
      language: 'EN',
    }
    const result = TailorPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects job description with fewer than 50 characters (covers: AC-4)', () => {
    const invalid = {
      profileId: 'prof_12345',
      jobTitle: 'Engineer',
      companyName: 'Acme Corp',
      rawJobDescription: 'Too short job description.',
      language: 'EN',
    }
    const result = TailorPayloadSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 50 characters/)
    }
  })

  it('trims leading and trailing whitespace before checking length', () => {
    const invalid = {
      profileId: 'prof_12345',
      jobTitle: 'Engineer',
      companyName: 'Acme Corp',
      rawJobDescription: '       Short description padded with spaces       ',
      language: 'EN',
    }
    const result = TailorPayloadSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts AR language setting (covers: AC-10)', () => {
    const valid = {
      profileId: 'prof_12345',
      jobTitle: 'مهندس برمجيات أول',
      companyName: 'شركة التقنية المتقدمة',
      rawJobDescription:
        'نبحث عن مهندس برمجيات متكامل يمتلك خبرة واسعة في بناء تطبيقات الويب الحديثة وإدارة قواعد البيانات بكفاءة عالية.',
      language: 'AR',
    }
    const result = TailorPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe('AR')
    }
  })
})
