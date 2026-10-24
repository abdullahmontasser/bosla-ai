import { describe, it, expect } from 'vitest'
import {
  buildTailoringSystemPrompt,
  buildTailoringUserPrompt,
  parseTailoredStream,
  createTailoredSnapshot,
} from './tailor-prompt'

describe('Tailor Prompt Engine (covers: AC-6, AC-10)', () => {
  it('builds English system prompt with anti-hallucination policy and delimiters', () => {
    const prompt = buildTailoringSystemPrompt('EN')
    expect(prompt).toContain('ZERO HALLUCINATION POLICY')
    expect(prompt).toContain('### SUMMARY')
    expect(prompt).toContain('### BULLETS')
  })

  it('builds Arabic system prompt with anti-hallucination rules and delimiters', () => {
    const prompt = buildTailoringSystemPrompt('AR')
    expect(prompt).toContain('منع التلفيق والاختلاق')
    expect(prompt).toContain('### SUMMARY')
    expect(prompt).toContain('### BULLETS')
  })

  it('builds user prompt with target job and candidate experiences', () => {
    const prompt = buildTailoringUserPrompt({
      jobTitle: 'Senior Full Stack Engineer',
      companyName: 'Anthropic Labs Partner',
      rawJobDescription: 'Seeking expert in Next.js App Router and PostgreSQL.',
      candidateHeadline: 'Lead Engineer',
      candidateSummary: '6 years of experience',
      candidateExperiences: [
        {
          companyName: 'TechVanguard',
          jobTitle: 'Staff Dev',
          bullets: ['Built real-time streaming pipeline'],
        },
      ],
      language: 'EN',
    })

    expect(prompt).toContain('Role: Senior Full Stack Engineer')
    expect(prompt).toContain('Company: Anthropic Labs Partner')
    expect(prompt).toContain('TechVanguard')
    expect(prompt).toContain('Built real-time streaming pipeline')
  })

  it('correctly parses stream output into summary and bullet points', () => {
    const streamOutput = `### SUMMARY
Senior Full Stack Engineer with extensive experience in Next.js and distributed databases.
### BULLETS
- Architected high throughput AI streaming pipeline using Vercel AI SDK.
- Optimized PostgreSQL queries with composite indexes.
`
    const parsed = parseTailoredStream(streamOutput)
    expect(parsed.summary).toBe(
      'Senior Full Stack Engineer with extensive experience in Next.js and distributed databases.',
    )
    expect(parsed.bullets).toHaveLength(2)
    expect(parsed.bullets[0]).toBe(
      'Architected high throughput AI streaming pipeline using Vercel AI SDK.',
    )
    expect(parsed.bullets[1]).toBe('Optimized PostgreSQL queries with composite indexes.')
  })

  it('creates structured snapshot mapped to candidate experiences', () => {
    const streamOutput = `### SUMMARY
Tailored summary
### BULLETS
- Tailored bullet 1
- Tailored bullet 2
`
    const snapshot = createTailoredSnapshot(
      'Senior Full Stack Engineer',
      [
        {
          companyName: 'TechVanguard',
          jobTitle: 'Senior Dev',
          bullets: ['Original bullet 1', 'Original bullet 2'],
        },
      ],
      streamOutput,
    )

    expect(snapshot.targetRole).toBe('Senior Full Stack Engineer')
    expect(snapshot.tailoredSummary).toBe('Tailored summary')
    expect(snapshot.tailoredExperiences[0].bullets[0].tailored).toBe('Tailored bullet 1')
    expect(snapshot.tailoredExperiences[0].bullets[1].tailored).toBe('Tailored bullet 2')
  })
})
