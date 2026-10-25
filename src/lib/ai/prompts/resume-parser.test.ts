import { describe, it, expect, vi } from 'vitest'
import { parseResumeWithAi, ResumeExtractionSchema, AiParsingError } from './resume-parser'
import * as aiModule from 'ai'
import type { DecryptedProviderSetting } from '@/lib/db/provider-settings'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

const mockSetting: DecryptedProviderSetting = {
  id: 'setting-1',
  provider: 'OPENAI',
  apiKey: 'sk-mock-key',
  defaultModel: 'gpt-4o',
  endpointUrl: null,
  isActive: true,
  updatedAt: new Date(),
}

describe('AI Resume Parser (AC-3, AC-6)', () => {
  it('validates English and Arabic resume extraction schemas', () => {
    const validEnglish = ResumeExtractionSchema.parse({
      language: 'EN',
      fullName: 'John Doe',
      email: 'john@example.com',
      headline: 'Senior Cloud Engineer',
      skills: ['AWS', 'TypeScript', 'Kubernetes'],
      experiences: [
        {
          companyName: 'Cloud Inc',
          jobTitle: 'Cloud Architect',
          bullets: ['Reduced costs by 30% through containerization.'],
          isCurrent: true,
        },
      ],
      educations: [
        {
          institution: 'MIT',
          degree: 'BSc Computer Science',
        },
      ],
      projects: [],
    })
    expect(validEnglish.language).toBe('EN')
    expect(validEnglish.skills).toContain('AWS')

    const validArabic = ResumeExtractionSchema.parse({
      language: 'AR',
      fullName: 'أحمد محمود',
      headline: 'مهندس حلول سحابية',
      skills: ['بايثون', 'دوكر'],
    })
    expect(validArabic.language).toBe('AR')
    expect(validArabic.fullName).toBe('أحمد محمود')
  })

  it('successfully extracts structured profile from raw text via generateObject (AC-3)', async () => {
    vi.mocked(aiModule.generateObject).mockResolvedValueOnce({
      object: {
        language: 'EN',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1 555-0199',
        location: 'San Francisco, CA',
        headline: 'Staff Full Stack Engineer',
        summary: 'Experienced web architect.',
        websiteUrl: 'https://janesmith.dev',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        githubUrl: 'https://github.com/janesmith',
        experiences: [
          {
            companyName: 'ScaleTech',
            jobTitle: 'Staff Engineer',
            location: 'Remote',
            startDate: '2022-01',
            endDate: '',
            isCurrent: true,
            bullets: ['Architected Next.js micro-frontends with high availability.'],
          },
        ],
        educations: [
          {
            institution: 'Stanford',
            degree: 'MSc Computer Science',
            fieldOfStudy: 'Distributed Systems',
            startDate: '2018',
            endDate: '2020',
            grade: '3.9',
          },
        ],
        skills: ['Next.js', 'React', 'TypeScript', 'PostgreSQL'],
        languages: ['English', 'French'],
        projects: [
          {
            name: 'OpenAI Agent',
            description: 'AI assistant bot',
            role: 'Creator',
            technologies: ['TypeScript', 'AI SDK'],
            url: 'https://github.com/janesmith/agent',
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof aiModule.generateObject>>)

    const result = await parseResumeWithAi('Raw resume text here', mockSetting)

    expect(result.fullName).toBe('Jane Smith')
    expect(result.language).toBe('EN')
    expect(result.skills).toContain('Next.js')
    expect(result.experiences[0].companyName).toBe('ScaleTech')
    expect(result.experiences[0].isCurrent).toBe(true)
  })

  it('catches AI provider failures and wraps them in AiParsingError with AI_PROVIDER_ERROR code (AC-6)', async () => {
    vi.mocked(aiModule.generateObject).mockRejectedValueOnce(
      new Error('API quota exceeded or rate limit reached'),
    )

    await expect(parseResumeWithAi('Raw text', mockSetting)).rejects.toThrowError(AiParsingError)

    try {
      await parseResumeWithAi('Raw text', mockSetting)
    } catch (err) {
      expect(err).toBeInstanceOf(AiParsingError)
      expect((err as AiParsingError).code).toBe('AI_PROVIDER_ERROR')
      expect((err as AiParsingError).message).toContain('AI extraction failed')
    }
  })
})
