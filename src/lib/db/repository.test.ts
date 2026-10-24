import { describe, it, expect, beforeEach } from 'vitest'
import {
  UpsertProviderSettingSchema,
  CreateProfileInputSchema,
  CreateJobPostingSchema,
  CreateTailoredResumeSnapshotSchema,
  CreateApplicationSchema,
} from '@/lib/validations'
import { generateEncryptionKey } from '@/lib/crypto'

describe('Domain Validations & Business Invariants', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = generateEncryptionKey()
  })

  describe('AI Provider Settings Validation (AC-2)', () => {
    it('requires an API key for commercial providers like OPENAI', () => {
      const invalid = {
        provider: 'OPENAI',
        defaultModel: 'gpt-4o',
      }
      const result = UpsertProviderSettingSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/API key is required/)
      }
    })

    it('allows keyless configuration for local OLLAMA provider', () => {
      const validOllama = {
        provider: 'OLLAMA',
        defaultModel: 'llama3:8b',
        endpointUrl: 'http://localhost:11434',
      }
      const result = UpsertProviderSettingSchema.safeParse(validOllama)
      expect(result.success).toBe(true)
    })
  })

  describe('Bilingual Master Profile Validation (AC-3)', () => {
    it('accepts valid English profile with work experiences and skills', () => {
      const input = {
        language: 'EN',
        fullName: 'Tarek Mansour',
        headline: 'Senior Engineer',
        email: 'tarek@example.com',
        workExperiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Senior Software Engineer',
            startDate: new Date('2022-01-01'),
            isCurrent: true,
            bullets: ['Led development of bilingual career agent.'],
          },
        ],
        skills: [{ name: 'TypeScript', proficiency: 'Expert' }],
      }
      const result = CreateProfileInputSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('accepts Arabic profile with RTL text', () => {
      const input = {
        language: 'AR',
        fullName: 'طارق منصور',
        headline: 'مهندس برمجيات أول',
        workExperiences: [
          {
            companyName: 'حلول التقنية المتطورة',
            jobTitle: 'مهندس برمجيات',
            startDate: new Date('2022-01-01'),
            bullets: ['تطوير بنية معالجة السير الذاتية ثنائية اللغة.'],
          },
        ],
      }
      const result = CreateProfileInputSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Job Posting Validation (AC-5)', () => {
    it('requires company name, title, and raw description', () => {
      const invalid = {
        companyName: 'Acme Corp',
        title: '',
        rawDescription: '',
      }
      const result = CreateJobPostingSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('validates correct job posting with parsed skills array', () => {
      const valid = {
        title: 'Full Stack Engineer',
        companyName: 'Acme Corp',
        rawDescription:
          'Looking for a senior full stack engineer with Next.js and Prisma experience.',
        parsedSkills: ['Next.js', 'Prisma', 'PostgreSQL'],
      }
      const result = CreateJobPostingSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })

  describe('Tailored Resume Snapshot Validation (AC-6)', () => {
    it('validates Google XYZ bullet points and ATS score', () => {
      const input = {
        profileId: 'clx_profile_123',
        jobPostingId: 'clx_job_123',
        language: 'EN',
        atsScore: 92.5,
        missingSkills: ['Kubernetes'],
        tailoredContent: {
          targetRole: 'Senior Full Stack Engineer',
          tailoredSummary: 'Experienced engineer tailored for Acme Corp.',
          tailoredExperiences: [
            {
              companyName: 'Tech Corp',
              jobTitle: 'Staff Engineer',
              bullets: [
                {
                  rewritten:
                    'Accomplished 40% reduction in latency by implementing Next.js App Router streaming.',
                  matchedKeywords: ['Next.js', 'Latency'],
                },
              ],
            },
          ],
        },
      }
      const result = CreateTailoredResumeSnapshotSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Application Kanban Card Validation (AC-7)', () => {
    it('validates application creation input', () => {
      const input = {
        jobPostingId: 'clx_job_456',
        notes: 'Applied via company portal',
      }
      const result = CreateApplicationSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })
})
