import { describe, it, expect } from 'vitest'
import {
  buildXyzBulletRewritePrompt,
  buildAiDeepScanPrompt,
  validateAndSanitizeXyzBullet,
  parseAiDeepScanOutput,
} from './ats-prompt'
import type { AtsBreakdown } from '@/lib/validations/tailored-resume'

describe('ATS Prompt Engine & Zero Hallucination Guard (covers: AC-1, AC-2)', () => {
  it('builds Google XYZ rewrite prompt with zero hallucination constraints in English (covers: AC-2)', () => {
    const { system, prompt } = buildXyzBulletRewritePrompt({
      originalBullet: 'Worked on React frontend components and fixed bugs.',
      companyName: 'Acme Corp',
      jobTitle: 'Frontend Developer',
      targetJobTitle: 'Senior React Engineer',
      targetJobSkills: ['React', 'TypeScript', 'Next.js'],
      language: 'EN',
    })

    expect(system).toContain('ZERO HALLUCINATION')
    expect(system).toContain('Google XYZ')
    expect(system).toContain('NEVER invent numbers')
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('Frontend Developer')
    expect(prompt).toContain('Worked on React frontend components and fixed bugs.')
  })

  it('builds Google XYZ rewrite prompt in Arabic with zero hallucination rules (covers: AC-2, AC-6)', () => {
    const { system, prompt } = buildXyzBulletRewritePrompt({
      originalBullet: 'قمت بتطوير واجهات المستخدم وحل المشاكل التقنية.',
      companyName: 'شركة التقنية',
      jobTitle: 'مطور واجهات',
      targetJobTitle: 'مهندس واجهات أمامية أول',
      targetJobSkills: ['React', 'TypeScript'],
      language: 'AR',
    })

    expect(system).toContain('منع التلفيق')
    expect(system).toContain('Google XYZ')
    expect(prompt).toContain('شركة التقنية')
    expect(prompt).toContain('قمت بتطوير واجهات المستخدم وحل المشاكل التقنية.')
  })

  it('detects and strips fabricated metrics when original had no numbers (covers: AC-2)', () => {
    const original = 'Implemented continuous integration pipelines using GitHub Actions.'
    // AI invented "45% reduction" and "$50,000"
    const hallucinated =
      'Architected continuous integration pipelines using GitHub Actions, cutting build duration by 45% and saving $50,000 annually.'

    const result = validateAndSanitizeXyzBullet(original, hallucinated)

    expect(result.hadFabricatedNumbers).toBe(true)
    expect(result.sanitized).not.toContain('45%')
    expect(result.sanitized).not.toContain('$50,000')
    expect(result.sanitized.length).toBeGreaterThan(20)
  })

  it('preserves authentic metrics when original already contained numbers (covers: AC-2)', () => {
    const original =
      'Optimized database queries, reducing query latency by 40% and serving 10,000 requests per second.'
    const rewritten =
      'Engineered database query optimizations by restructuring indexes, cutting latency by 40% while handling 10,000 requests per second.'

    const result = validateAndSanitizeXyzBullet(original, rewritten)

    expect(result.hadFabricatedNumbers).toBe(false)
    expect(result.sanitized).toContain('40%')
    expect(result.sanitized).toContain('10,000')
  })

  it('builds AI deep scan prompt with structured section tags (covers: AC-1)', () => {
    const { system, prompt } = buildAiDeepScanPrompt({
      targetJobTitle: 'Full Stack Engineer',
      targetJobDescription: 'Build modern Next.js and PostgreSQL applications.',
      candidateSkills: ['TypeScript', 'React'],
      experiences: [
        {
          companyName: 'StartUp Inc',
          jobTitle: 'Software Engineer',
          bullets: ['Built full stack features.'],
        },
      ],
      language: 'EN',
    })

    expect(system).toContain('### MATCHED_SKILLS')
    expect(system).toContain('### MISSING_SKILLS')
    expect(system).toContain('### ACTIONABLE_FEEDBACK')
    expect(prompt).toContain('StartUp Inc')
  })

  it('parses structured AI deep scan output and merges with current breakdown (covers: AC-1)', () => {
    const mockOutput = `
### MATCHED_SKILLS
- TypeScript
- React
- Next.js

### MISSING_SKILLS
- PostgreSQL
- Docker

### ACTIONABLE_FEEDBACK
- Add metrics demonstrating PostgreSQL database scaling in your StartUp Inc experience.
- Highlight Next.js server actions and caching strategies.
`
    const initialBreakdown: AtsBreakdown = {
      overallScore: 65,
      categorySubscores: {
        keywordMatch: 60,
        experienceRelevance: 65,
        formattingCompliance: 75,
      },
      matchedSkills: ['TypeScript'],
      missingSkills: ['PostgreSQL', 'Docker', 'Next.js'],
      dismissedSkills: [],
      actionableFeedback: ['Initial feedback'],
      isStale: true,
      evaluatedAt: '2026-10-25T12:00:00.000Z',
    }

    const updated = parseAiDeepScanOutput(mockOutput, initialBreakdown)

    expect(updated.matchedSkills).toContain('Next.js')
    expect(updated.matchedSkills).toContain('React')
    expect(updated.missingSkills).toContain('PostgreSQL')
    expect(updated.missingSkills).not.toContain('Next.js')
    expect(updated.actionableFeedback.length).toBeGreaterThanOrEqual(2)
    expect(updated.isStale).toBe(false)
  })
})
