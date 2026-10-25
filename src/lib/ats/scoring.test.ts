import { describe, it, expect } from 'vitest'
import {
  calculateDeterministicAtsScore,
  extractKeywords,
  checkFormattingCompliance,
  type AtsScoringInput,
} from './scoring'

describe('Deterministic ATS Scoring Engine (covers: AC-1, AC-4)', () => {
  const sampleInput: AtsScoringInput = {
    jobTitle: 'Senior Full Stack Engineer',
    jobDescription:
      'Looking for a Senior Full Stack Engineer proficient in TypeScript, React, Next.js, PostgreSQL, Node.js, and Docker. Experience with Tailwind CSS and cloud architectures required.',
    parsedJobSkills: [
      'TypeScript',
      'React',
      'Next.js',
      'PostgreSQL',
      'Node.js',
      'Docker',
      'Tailwind CSS',
    ],
    candidateHeader: {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+1 555-0199',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/alexmorgan',
    },
    candidateSummary:
      'Accomplished Full Stack Engineer with 6+ years building scalable web applications with React, TypeScript, and Node.js.',
    candidateSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    experiences: [
      {
        companyName: 'TechCorp',
        jobTitle: 'Senior Engineer',
        bullets: [
          'Architected high-throughput microservices using TypeScript and Node.js serving 2M daily users.',
          'Developed responsive user interfaces with React and Tailwind CSS improving accessibility scores by 35%.',
          'Optimized PostgreSQL queries and indexing schemes reducing p99 latency by 45%.',
        ],
      },
    ],
    dismissedSkills: [],
  }

  it('calculates deterministic ATS score with 50/30/20 category weights (covers: AC-1)', () => {
    const result = calculateDeterministicAtsScore(sampleInput)

    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
    expect(result.categorySubscores.keywordMatch).toBeGreaterThan(0)
    expect(result.categorySubscores.experienceRelevance).toBeGreaterThan(0)
    expect(result.categorySubscores.formattingCompliance).toBeGreaterThan(0)

    // Formula check: (0.50 * keyword) + (0.30 * experience) + (0.20 * formatting)
    const expectedOverall = Math.round(
      0.5 * result.categorySubscores.keywordMatch +
        0.3 * result.categorySubscores.experienceRelevance +
        0.2 * result.categorySubscores.formattingCompliance,
    )
    expect(result.overallScore).toBe(expectedOverall)
  })

  it('correctly categorizes matched and missing skills (covers: AC-1, AC-3)', () => {
    const result = calculateDeterministicAtsScore(sampleInput)

    expect(result.matchedSkills).toContain('TypeScript')
    expect(result.matchedSkills).toContain('React')
    expect(result.matchedSkills).toContain('Node.js')
    expect(result.matchedSkills).toContain('PostgreSQL')
    expect(result.matchedSkills).toContain('Tailwind CSS') // found in bullets

    // Docker was not in skills or bullets
    expect(result.missingSkills).toContain('Docker')
  })

  it('excludes dismissed skills from missingSkills array (covers: AC-4)', () => {
    const inputWithDismissed = {
      ...sampleInput,
      dismissedSkills: ['Docker'],
    }

    const result = calculateDeterministicAtsScore(inputWithDismissed)
    expect(result.missingSkills).not.toContain('Docker')
    expect(result.dismissedSkills).toContain('Docker')
  })

  it('evaluates formatting compliance for complete contact and summary (covers: AC-1)', () => {
    const compliance = checkFormattingCompliance(
      sampleInput.candidateSummary,
      sampleInput.candidateHeader,
      sampleInput.experiences![0].bullets,
      'EN',
    )

    // Full contact info, summary present, strong action verbs ("Architected", "Developed", "Optimized")
    expect(compliance.formattingScore).toBe(100)
  })

  it('penalizes missing summary and contact info in formatting score (covers: AC-1)', () => {
    const compliance = checkFormattingCompliance(
      '',
      { fullName: 'Jane Doe', email: '' },
      ['Did some tasks and coding.'],
      'EN',
    )

    expect(compliance.formattingScore).toBeLessThan(50)
  })

  it('handles Arabic language inputs and action verbs correctly (covers: AC-1, AC-6)', () => {
    const arabicInput: AtsScoringInput = {
      jobTitle: 'مهندس برمجيات واجهات أمامية',
      jobDescription:
        'مطلوب مهندس واجهات أمامية يتقن React و TypeScript وتصميم واجهات المستخدم الحديثة.',
      parsedJobSkills: ['React', 'TypeScript', 'CSS'],
      language: 'AR',
      candidateHeader: {
        fullName: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '+966 50 123 4567',
        location: 'الرياض، المملكة العربية السعودية',
      },
      candidateSummary:
        'مهندس برمجيات متخصص في بناء تطبيقات الويب التفاعلية وتصميم الواجهات العصرية.',
      candidateSkills: ['React', 'TypeScript', 'JavaScript'],
      experiences: [
        {
          companyName: 'شركة الابتكار الرقمي',
          jobTitle: 'مطور واجهات',
          bullets: [
            'طور واجهات مستخدم متجاوبة باستخدام React و TypeScript مما زاد سرعة التفاعل بنسبة 40%.',
            'قاد فريقاً تقنياً لتحديث معايير إمكانية الوصول والتصميم ثنائي اللغة.',
          ],
        },
      ],
      dismissedSkills: [],
    }

    const result = calculateDeterministicAtsScore(arabicInput)
    expect(result.overallScore).toBeGreaterThanOrEqual(60)
    expect(result.categorySubscores.formattingCompliance).toBeGreaterThanOrEqual(80)
    expect(result.matchedSkills).toContain('React')
    expect(result.matchedSkills).toContain('TypeScript')
  })

  it('extracts fallback skills from job description when parsedSkills is empty (covers: AC-1)', () => {
    const fallback = extractKeywords(
      'We require Python, FastApi, PostgreSQL and Redis for cloud native backends.',
      [],
    )
    expect(fallback.length).toBeGreaterThan(0)
    expect(fallback.map((s) => s.toLowerCase())).toContain('python')
  })
})
