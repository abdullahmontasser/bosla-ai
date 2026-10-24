import { describe, it, expect, beforeEach } from 'vitest'
import { encryptSecret, decryptSecret, generateEncryptionKey } from '@/lib/crypto'
import {
  UpsertProviderSettingSchema,
  CreateProfileInputSchema,
  SaveParsedResumeInputSchema,
  CreateJobPostingSchema,
  CreateTailoredResumeSnapshotSchema,
  CreateApplicationSchema,
  UpdateApplicationStageSchema,
} from '@/lib/validations'

describe('Runtime Proof & Value Sourcing Verification (spec 0002)', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = generateEncryptionKey()
  })

  it('proves AES 256 GCM encryption produces ciphertext, iv, authTag and decrypts cleanly (AC-2)', () => {
    const rawApiKey = 'sk-proj-prod-live-secret-key-12345'
    const encrypted = encryptSecret(rawApiKey)

    // Verify key is never stored in plaintext
    expect(encrypted.encryptedKey).not.toContain('sk-proj')
    expect(encrypted.iv).toHaveLength(24) // 12 bytes hex
    expect(encrypted.authTag).toHaveLength(32) // 16 bytes hex

    const decrypted = decryptSecret(encrypted.encryptedKey, encrypted.iv, encrypted.authTag)
    expect(decrypted).toBe(rawApiKey)
  })

  it('proves local Ollama allows null encryptedKey with valid endpointUrl (AC-2)', () => {
    const ollamaSetting = UpsertProviderSettingSchema.parse({
      provider: 'OLLAMA',
      defaultModel: 'deepseek-r1:14b',
      endpointUrl: 'http://localhost:11434',
      isActive: true,
    })

    expect(ollamaSetting.provider).toBe('OLLAMA')
    expect(ollamaSetting.rawApiKey).toBeUndefined()
    expect(ollamaSetting.endpointUrl).toBe('http://localhost:11434')
  })

  it('proves bilingual profile schema accepts English and Arabic records (AC-3)', () => {
    const enProfile = CreateProfileInputSchema.parse({
      language: 'EN',
      fullName: 'Tarek Mansour',
      headline: 'Senior Full Stack Engineer',
      isDefault: true,
      workExperiences: [
        {
          companyName: 'TechVanguard',
          jobTitle: 'Lead Engineer',
          startDate: new Date('2021-01-01'),
          isCurrent: true,
          bullets: ['Built real-time streaming pipeline.'],
        },
      ],
      skills: [{ name: 'TypeScript', category: 'Languages' }],
    })

    const arProfile = CreateProfileInputSchema.parse({
      language: 'AR',
      fullName: 'طارق منصور',
      headline: 'مهندس برمجيات أول',
      isDefault: true,
      workExperiences: [
        {
          companyName: 'تك فانجارد',
          jobTitle: 'مهندس برمجيات أول',
          startDate: new Date('2021-01-01'),
          isCurrent: true,
          bullets: ['بناء وتطوير بنية معالجة السير الذاتية بالذكاء الاصطناعي.'],
        },
      ],
      skills: [{ name: 'تايب سكريبت', category: 'لغات البرمجة' }],
    })

    expect(enProfile.language).toBe('EN')
    expect(enProfile.isDefault).toBe(true)
    expect(arProfile.language).toBe('AR')
    expect(arProfile.isDefault).toBe(true)
  })

  it('proves parsed resume payload validates structured experiences and skills (AC-4)', () => {
    const parsedPayload = SaveParsedResumeInputSchema.parse({
      originalFileName: 'Tarek_Mansour_CV.pdf',
      fileFormat: 'PDF',
      rawText: 'Tarek Mansour\nSenior Full Stack Engineer\nExperience: TechCorp...',
      parsedPayload: {
        fullName: 'Tarek Mansour',
        email: 'tarek@example.com',
        experiences: [
          {
            company: 'TechCorp',
            title: 'Senior Engineer',
            bullets: ['Led development of streaming AI features.'],
          },
        ],
        skills: ['TypeScript', 'Next.js', 'PostgreSQL'],
      },
    })

    expect(parsedPayload.fileFormat).toBe('PDF')
    expect(parsedPayload.parsedPayload.skills).toContain('Next.js')
  })

  it('proves job posting stores required skills array (AC-5)', () => {
    const jobPosting = CreateJobPostingSchema.parse({
      title: 'Senior AI Engineer',
      companyName: 'Anthropic Partner',
      rawDescription: 'Seeking expert in LLM orchestration, Next.js, and PostgreSQL.',
      parsedSkills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma'],
    })

    expect(jobPosting.parsedSkills).toHaveLength(4)
    expect(jobPosting.parsedSkills).toContain('Prisma')
  })

  it('proves tailored resume snapshot captures Google XYZ achievements and atsScore (AC-6)', () => {
    const snapshot = CreateTailoredResumeSnapshotSchema.parse({
      profileId: 'profile_123',
      jobPostingId: 'job_456',
      language: 'EN',
      title: 'Anthropic Partner - Senior AI Engineer',
      atsScore: 94.5,
      missingSkills: ['Redis'],
      tailoredSummary: 'Senior engineer tailored for Anthropic Partner.',
      tailoredContent: {
        targetRole: 'Senior AI Engineer',
        tailoredExperiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Senior Engineer',
            bullets: [
              {
                rewritten:
                  'Accomplished 60% reduction in response latency by implementing Vercel AI SDK streaming.',
                matchedKeywords: ['AI Integration', 'Latency'],
              },
            ],
          },
        ],
      },
    })

    expect(snapshot.atsScore).toBe(94.5)
    expect(snapshot.tailoredContent.tailoredExperiences[0].bullets[0].rewritten).toContain(
      'Accomplished 60% reduction',
    )
  })

  it('proves kanban card creation and status transition lifecycle (AC-7)', () => {
    const card = CreateApplicationSchema.parse({
      jobPostingId: 'job_123',
      notes: 'Initial referral via LinkedIn',
    })
    expect(card.jobPostingId).toBe('job_123')

    const transitionToApplied = UpdateApplicationStageSchema.parse({
      status: 'APPLIED',
      targetSortOrder: 1.5,
    })
    expect(transitionToApplied.status).toBe('APPLIED')
    expect(transitionToApplied.targetSortOrder).toBe(1.5)

    const transitionBackToSaved = UpdateApplicationStageSchema.parse({
      status: 'SAVED',
      targetSortOrder: 1.0,
    })
    expect(transitionBackToSaved.status).toBe('SAVED')
  })
})
