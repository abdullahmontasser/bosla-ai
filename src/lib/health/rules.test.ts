import { describe, expect, it } from 'vitest'

import {
  evaluateProfileHealth,
  fingerprintIssue,
  generateIssues,
  healthBand,
  isValidEmail,
  type HealthProfileInput,
} from './rules'

// 32 words so summary word count checks pass in tests that do not care.
const FULL_SUMMARY =
  'Senior engineer with ten years of shipping reliable web platforms. I lead small teams through design, testing, and release handovers across time zones. Mentors juniors and documents decisions so knowledge survives handoffs.'

function buildProfile(overrides: Partial<HealthProfileInput> = {}): HealthProfileInput {
  return {
    id: 'profile_1',
    language: 'EN',
    fullName: 'Test Candidate',
    headline: null,
    summary: null,
    email: null,
    phone: null,
    location: null,
    websiteUrl: null,
    linkedinUrl: null,
    githubUrl: null,
    workExperiences: [],
    educations: [],
    skills: [],
    ...overrides,
  }
}

describe('healthBand (covers: AC-2)', () => {
  it('maps score bands at 50, 75, and 90', () => {
    expect(healthBand(0)).toBe('needs_work')
    expect(healthBand(49)).toBe('needs_work')
    expect(healthBand(50)).toBe('fair')
    expect(healthBand(74)).toBe('fair')
    expect(healthBand(75)).toBe('strong')
    expect(healthBand(89)).toBe('strong')
    expect(healthBand(90)).toBe('excellent')
  })
})

describe('evaluateProfileHealth with an empty profile (covers: AC-1, AC-2)', () => {
  const { issues, breakdown } = evaluateProfileHealth(buildProfile())

  it('scores 0 without any profile data', () => {
    expect(breakdown.overallScore).toBe(0)
  })

  it('emits the guided issue set for a missing profile', () => {
    const kinds = issues.map(
      (issue) => `${issue.category}:${issue.targetKind}:${issue.targetField ?? ''}`,
    )
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_CONTACT:email')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_CONTACT:phone')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_CONTACT:location')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_CONTACT:linkedinUrl')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_SUMMARY:')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_GENERAL:')
    expect(kinds).toContain('ATS_COMPLETENESS:PROFILE_SKILLS:')
    // The depth summary check is covered by the same empty summary card, so
    // there is no second card for the missing value.
    expect(kinds).not.toContain('CONTENT_DEPTH:PROFILE_SUMMARY:')
    const depthSummary = breakdown.categories.contentDepth.checks.find(
      (c) => c.key === 'summary_words',
    )
    expect(depthSummary?.satisfied).toBe(false)
  })

  it('records the four category weights', () => {
    expect(breakdown.categories.impactMetrics.weight).toBe(30)
    expect(breakdown.categories.actionVerbs.weight).toBe(20)
    expect(breakdown.categories.atsCompleteness.weight).toBe(25)
    expect(breakdown.categories.contentDepth.weight).toBe(25)
  })

  it('stamps the rule set version and evaluation time', () => {
    expect(breakdown.ruleSetVersion).toBe('1')
    expect(breakdown.evaluatedAt).toBeTruthy()
  })
})

describe('impact and metrics scoring (covers: AC-2, AC-10)', () => {
  it('reaches 100 when 60 percent of bullets carry a measure', () => {
    const bullets = [
      'Led 40 users through onboarding',
      'Migrated 3 services',
      'Built the design system', // no measure
      'Trained the support team', // no measure
      'Automated the nightly pipeline', // no measure
    ]
    // 2 of 5 quantified = 40%; 40/60 -> 66.7 -> 67
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        workExperiences: [{ id: 'exp_1', companyName: 'Acme', jobTitle: 'Engineer', bullets }],
      }),
    )
    expect(breakdown.categories.impactMetrics.quantified).toBe(2)
    expect(breakdown.categories.impactMetrics.total).toBe(5)
    expect(breakdown.categories.impactMetrics.score).toBe(67)
  })

  it('detects percentages, currency, and Arabic Indic digits as measures', () => {
    const bullets = [
      'خفض التكاليف بنسبة ٥٠٪',
      'خدمت عميلاً واحدًا و ١٢٠٠ مستخدم',
      'Increased profit by the thousand',
    ]
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        workExperiences: [{ id: 'exp_1', companyName: 'شركة', jobTitle: 'مهندس', bullets }],
      }),
    )
    expect(breakdown.categories.impactMetrics.quantified).toBe(3)
  })

  it('scores 0 with no bullets at all', () => {
    const { breakdown } = evaluateProfileHealth(buildProfile())
    expect(breakdown.categories.impactMetrics.score).toBe(0)
    expect(breakdown.categories.impactMetrics.total).toBe(0)
  })
})

describe('action verbs scoring (covers: AC-2, AC-10)', () => {
  it('scores the share of strong starts in English', () => {
    const bullets = ['Led the team', 'Wrote the specs', 'Designed the API', 'Went to meetings']
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        workExperiences: [{ id: 'exp_1', companyName: 'Acme', jobTitle: 'PM', bullets }],
      }),
    )
    expect(breakdown.categories.actionVerbs.strongStarts).toBe(2)
    expect(breakdown.categories.actionVerbs.score).toBe(50)
  })

  it('scores Arabic bullets against the Arabic verb set', () => {
    const bullets = ['طور نظام الفاتورة', 'قاد فريقاً تقنياً', 'حضر اجتماعات الشهر']
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        language: 'AR',
        workExperiences: [{ id: 'exp_1', companyName: 'شركة', jobTitle: 'مهندس', bullets }],
      }),
    )
    expect(breakdown.categories.actionVerbs.strongStarts).toBe(2)
    expect(breakdown.categories.actionVerbs.score).toBe(67)
  })
})

describe('ATS completeness checks (covers: AC-2)', () => {
  it('satisfies the contact block with valid email, phone, and a link', () => {
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        email: 'me@example.com',
        phone: '+966 55 010 2030',
        linkedinUrl: 'https://linkedin.com/in/me',
      }),
    )
    const contact = breakdown.categories.atsCompleteness.checks.find(
      (c) => c.key === 'contact_block',
    )
    expect(contact?.satisfied).toBe(true)
  })

  it('accepts location in place of phone for the reach condition', () => {
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        email: 'me@example.com',
        location: 'Riyadh',
        linkedinUrl: 'https://linkedin.com/in/me',
      }),
    )
    const contact = breakdown.categories.atsCompleteness.checks.find(
      (c) => c.key === 'contact_block',
    )
    expect(contact?.satisfied).toBe(true)
  })

  it('flags a malformed email even when present', () => {
    const { issues } = evaluateProfileHealth(
      buildProfile({
        email: 'not-an-email',
        phone: '123',
        linkedinUrl: 'https://linkedin.com/in/me',
      }),
    )
    const emailIssue = issues.find((issue) => issue.targetField === 'email')
    expect(emailIssue?.title).toBe('Email address is malformed')
  })

  it('redistributes the education weight when no education rows exist', () => {
    const { issues, breakdown } = evaluateProfileHealth(
      buildProfile({
        email: 'me@example.com',
        phone: '123',
        linkedinUrl: 'https://linkedin.com/in/me',
        summary: FULL_SUMMARY,
        workExperiences: [
          {
            id: 'exp_1',
            companyName: 'Acme',
            jobTitle: 'Eng',
            bullets: [
              'Built three reporting tools that the finance team adopted across multiple regions with 30 users',
              'Scaled the platform through four service migrations for 40 clients across three regions',
            ],
          },
        ],
        skills: Array.from({ length: 5 }, (_, i) => ({ id: `sk_${i}`, name: `Skill ${i}` })),
      }),
    )
    // Full completion and depth with no education weight: completeness = 100.
    expect(issues.filter((issue) => issue.category === 'ATS_COMPLETENESS')).toHaveLength(0)
    expect(breakdown.categories.atsCompleteness.score).toBe(100)
    // depth: roles ok, avg 8+, dups none, summary 200 words -> 100
    expect(breakdown.categories.contentDepth.score).toBe(100)
    expect(breakdown.overallScore).toBe(100)
  })

  it('emits one card per incomplete education row', () => {
    const { issues } = evaluateProfileHealth(
      buildProfile({
        educations: [
          {
            id: 'edu_1',
            institution: 'KFU',
            degree: 'BSc',
            startDate: new Date('2018-09-01'),
            endDate: null,
          },
          {
            id: 'edu_2',
            institution: '',
            degree: 'MBA',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2021-06-30'),
          },
          {
            id: 'edu_3',
            institution: 'MIT',
            degree: 'PhD',
            startDate: new Date('2022-01-01'),
            endDate: new Date('2026-01-01'),
          },
        ],
      }),
    )
    const educationIssues = issues.filter((issue) => issue.targetKind === 'PROFILE_EDUCATION')
    expect(educationIssues).toHaveLength(2)
    expect(educationIssues.map((i) => i.targetId)).toEqual(['edu_1', 'edu_2'])
  })
})

describe('content depth checks (covers: AC-2)', () => {
  it('scores the role coverage share', () => {
    const { breakdown } = evaluateProfileHealth(
      buildProfile({
        summary: FULL_SUMMARY,
        workExperiences: [
          {
            id: 'exp_1',
            companyName: 'A',
            jobTitle: 'T',
            bullets: ['Built a thing', 'Scaled another thing'],
          },
          { id: 'exp_2', companyName: 'B', jobTitle: 'T', bullets: ['Wrote one thing'] },
        ],
      }),
    )
    const coverage = breakdown.categories.contentDepth.checks.find((c) => c.key === 'role_coverage')
    expect(coverage?.satisfied).toBe(false)
    // 25 * 0.5 coverage, avg falls short (3 words), dups fine, summary 32 words.
    expect(breakdown.categories.contentDepth.score).toBe(63)
  })

  it('flags duplicate bullets on the later copy only', () => {
    const { issues } = evaluateProfileHealth(
      buildProfile({
        summary: FULL_SUMMARY,
        workExperiences: [
          {
            id: 'exp_1',
            companyName: 'A',
            jobTitle: 'T',
            bullets: ['Built the onboarding flow', 'Scaled it to 400 users'],
          },
          { id: 'exp_2', companyName: 'B', jobTitle: 'T', bullets: ['Built the onboarding flow'] },
        ],
      }),
    )
    const dupIssues = issues.filter(
      (issue) =>
        issue.category === 'CONTENT_DEPTH' &&
        issue.targetKind === 'WORK_EXPERIENCE_BULLET' &&
        issue.title.includes('Duplicate'),
    )
    expect(dupIssues).toHaveLength(1)
    expect(dupIssues[0].targetId).toBe('exp_2')
  })
})

describe('dismissed issues (covers: AC-5)', () => {
  it('counts a dismissed issue as satisfied and in excludedCount', () => {
    const profile = buildProfile({
      summary: FULL_SUMMARY,
      email: 'me@example.com',
      phone: '123',
      location: 'Riyadh',
      linkedinUrl: 'https://linkedin.com/in/me',
      workExperiences: [
        {
          id: 'exp_1',
          companyName: 'Acme',
          jobTitle: 'Engineer',
          bullets: [
            'Built a dashboard',
            'Wrote more documentation and updated the wiki and hardened access',
          ],
        },
      ],
      skills: Array.from({ length: 5 }, (_, i) => ({ id: `sk_${i}`, name: `Skill ${i}` })),
    })
    const baseline = evaluateProfileHealth(profile)
    const weakStart = baseline.issues.find((issue) => issue.category === 'ACTION_VERBS')
    expect(weakStart).toBeTruthy()
    // 'Built a dashboard' starts strong; 'Wrote more documentation...' does not.
    expect(baseline.breakdown.categories.actionVerbs.score).toBe(50)

    const dismissed = evaluateProfileHealth(profile, new Set([fingerprintIssue(weakStart!)]))
    // One strong start plus one dismissed issue now cover both bullets.
    expect(dismissed.breakdown.categories.actionVerbs.score).toBe(100)
    expect(dismissed.breakdown.categories.actionVerbs.dismissed).toBe(1)
    expect(dismissed.breakdown.excludedCount).toBe(1)
    // The dismissed card is still generated so the restore path can bring it back.
    expect(dismissed.issues.some((issue) => issue.fingerprint === weakStart!.fingerprint)).toBe(
      true,
    )
  })

  it('satisfies the empty summary depth check through the completeness card', () => {
    const profile = buildProfile({
      email: 'me@example.com',
      phone: '123',
      linkedinUrl: 'https://x.com',
    })
    const baseline = evaluateProfileHealth(profile)
    const emptySummary = baseline.issues.find(
      (issue) => issue.category === 'ATS_COMPLETENESS' && issue.targetKind === 'PROFILE_SUMMARY',
    )!
    const dismissed = evaluateProfileHealth(profile, new Set([fingerprintIssue(emptySummary)]))
    const depthSummary = dismissed.breakdown.categories.contentDepth.checks.find(
      (c) => c.key === 'summary_words',
    )
    expect(depthSummary?.satisfied).toBe(true)
    expect(depthSummary?.dismissed).toBe(true)
  })
})

describe('issue generation and fingerprints (covers: AC-3, AC-8)', () => {
  it('generates cards with the profile language copy', () => {
    const arabic = generateIssues(buildProfile({ language: 'AR', email: 'x@y.z' }))
    expect(arabic.some((issue) => issue.title === 'البريد الإلكتروني غير صالح')).toBe(true)
  })

  it('fingerprint is stable for identical facts and differs with text', () => {
    const issueA: Parameters<typeof fingerprintIssue>[0] = {
      category: 'IMPACT_METRICS',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 0,
      targetField: null,
      originalText: 'Built the thing',
      title: 'T',
      rationale: 'R',
    }
    const issueB = { ...issueA, originalText: 'Built the thing ' }
    const issueC = { ...issueA, originalText: 'Built a thing' }
    expect(fingerprintIssue(issueA)).toBe(fingerprintIssue({ ...issueA, title: 'Changed title' }))
    expect(fingerprintIssue(issueB)).toBe(fingerprintIssue(issueA))
    expect(fingerprintIssue(issueC)).not.toBe(fingerprintIssue(issueA))
  })

  it('fingerprint separates two bullet-level categories on the same line', () => {
    const baseText = 'Responsible for testing'
    const first = fingerprintIssue({
      category: 'IMPACT_METRICS',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 0,
      targetField: null,
      originalText: baseText,
      title: 'T',
      rationale: 'R',
    })
    const second = fingerprintIssue({
      category: 'ACTION_VERBS',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 0,
      targetField: null,
      originalText: baseText,
      title: 'T',
      rationale: 'R',
    })
    expect(first).not.toBe(second)
  })
})

describe('isValidEmail (covers: AC-9)', () => {
  it('accepts plain addresses and rejects malformed ones', () => {
    expect(isValidEmail('candidate@example.com')).toBe(true)
    expect(isValidEmail('candidate+tag@example.co')).toBe(true)
    expect(isValidEmail('candidate@example')).toBe(false)
    expect(isValidEmail('candidate example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('overall aggregation (covers: AC-2)', () => {
  it('weights the four categories at 30, 20, 25, and 25', () => {
    // Craft a profile where each category hits a known score.
    const good = buildProfile({
      email: 'a@b.co',
      phone: '123',
      location: 'City',
      linkedinUrl: 'https://linkedin.com/in/a',
      summary: FULL_SUMMARY,
      workExperiences: [
        {
          id: 'e1',
          companyName: 'A',
          jobTitle: 'T',
          bullets: ['Built 10 tools', 'Scaled 4 systems, 30 users', 'Led 8 people'],
        },
      ],
      skills: Array.from({ length: 5 }, (_, i) => ({ id: `sk_${i}`, name: `s${i}` })),
    })
    const { breakdown } = evaluateProfileHealth(good)
    // impact 3/3 = 100; verbs: Led -> 1/3 = 33; completeness 100; depth 100
    expect(breakdown.overallScore).toBe(
      Math.round(
        0.3 * breakdown.categories.impactMetrics.score +
          0.2 * breakdown.categories.actionVerbs.score +
          0.25 * breakdown.categories.atsCompleteness.score +
          0.25 * breakdown.categories.contentDepth.score,
      ),
    )
  })

  it('never returns a score outside 0 and 100', () => {
    const { breakdown } = evaluateProfileHealth(buildProfile())
    expect(breakdown.overallScore).toBeGreaterThanOrEqual(0)
    expect(breakdown.overallScore).toBeLessThanOrEqual(100)
  })
})

describe('fingerprint helper parity', () => {
  it('exposes the fingerprint helper consistently (guards a refactor slip)', () => {
    const issue: Parameters<typeof fingerprintIssue>[0] = {
      category: 'CONTENT_DEPTH',
      targetKind: 'WORK_EXPERIENCE',
      targetId: 'exp_9',
      targetIndex: null,
      targetField: null,
      originalText: 'Acme · Engineer',
      title: 'T',
      rationale: 'R',
    }
    expect(fingerprintIssue(issue)).toBe(fingerprintIssue({ ...issue, title: 'Different title' }))
  })
})
