import { describe, it, expect } from 'vitest'
import {
  AtsCategorySubscoresSchema,
  AtsBreakdownSchema,
  CreateTailoredResumeSnapshotSchema,
  TailoredBulletSchema,
} from './tailored-resume'

describe('Tailored Resume Validation Schemas (covers: AC-1, AC-4, AC-5)', () => {
  describe('TailoredBulletSchema', () => {
    it('accepts valid rewritten bullet in Google XYZ format', () => {
      const valid = {
        original: 'Worked on database queries.',
        rewritten: 'Accomplished 40% reduction in query latency by optimizing PostgreSQL indexing.',
        matchedKeywords: ['PostgreSQL', 'indexing'],
      }
      const parsed = TailoredBulletSchema.parse(valid)
      expect(parsed.rewritten).toBe(valid.rewritten)
      expect(parsed.matchedKeywords).toEqual(['PostgreSQL', 'indexing'])
    })

    it('rejects empty rewritten bullet string', () => {
      expect(() => {
        TailoredBulletSchema.parse({
          rewritten: '',
        })
      }).toThrow()
    })

    it('provides default empty array for matchedKeywords when omitted', () => {
      const parsed = TailoredBulletSchema.parse({
        rewritten: 'Accomplished milestone delivery by leading sprint planning.',
      })
      expect(parsed.matchedKeywords).toEqual([])
    })
  })

  describe('AtsCategorySubscoresSchema', () => {
    it('validates scores within the 0 to 100 range', () => {
      const valid = {
        keywordMatch: 85,
        experienceRelevance: 90,
        formattingCompliance: 95,
      }
      expect(AtsCategorySubscoresSchema.parse(valid)).toEqual(valid)
    })

    it('rejects scores exceeding 100', () => {
      expect(() => {
        AtsCategorySubscoresSchema.parse({
          keywordMatch: 105,
          experienceRelevance: 90,
          formattingCompliance: 95,
        })
      }).toThrow()
    })

    it('rejects negative scores', () => {
      expect(() => {
        AtsCategorySubscoresSchema.parse({
          keywordMatch: -5,
          experienceRelevance: 90,
          formattingCompliance: 95,
        })
      }).toThrow()
    })
  })

  describe('AtsBreakdownSchema', () => {
    const validBreakdown = {
      overallScore: 84.5,
      categorySubscores: {
        keywordMatch: 80,
        experienceRelevance: 85,
        formattingCompliance: 90,
      },
      matchedSkills: ['React', 'TypeScript', 'Next.js'],
      missingSkills: ['Docker', 'AWS'],
      dismissedSkills: ['Kubernetes'],
      actionableFeedback: ['Add cloud deployment metrics to your recent role.'],
      isStale: false,
      evaluatedAt: '2026-10-25T15:00:00.000Z',
    }

    it('parses valid ATS breakdown structure', () => {
      const parsed = AtsBreakdownSchema.parse(validBreakdown)
      expect(parsed.overallScore).toBe(84.5)
      expect(parsed.matchedSkills).toHaveLength(3)
      expect(parsed.missingSkills).toHaveLength(2)
      expect(parsed.dismissedSkills).toEqual(['Kubernetes'])
      expect(parsed.isStale).toBe(false)
    })

    it('applies defaults for omitted optional arrays and isStale', () => {
      const minimal = {
        overallScore: 70,
        categorySubscores: {
          keywordMatch: 70,
          experienceRelevance: 70,
          formattingCompliance: 70,
        },
        evaluatedAt: '2026-10-25T15:00:00.000Z',
      }
      const parsed = AtsBreakdownSchema.parse(minimal)
      expect(parsed.matchedSkills).toEqual([])
      expect(parsed.missingSkills).toEqual([])
      expect(parsed.dismissedSkills).toEqual([])
      expect(parsed.actionableFeedback).toEqual([])
      expect(parsed.isStale).toBe(false)
    })

    it('rejects invalid overallScore', () => {
      expect(() => {
        AtsBreakdownSchema.parse({
          ...validBreakdown,
          overallScore: 110,
        })
      }).toThrow()
    })
  })

  describe('CreateTailoredResumeSnapshotSchema', () => {
    it('validates complete snapshot payload including atsBreakdown and lastExportedAt', () => {
      const payload = {
        profileId: 'prof_123',
        jobPostingId: 'job_456',
        language: 'EN' as const,
        title: 'Senior Frontend Engineer Resume',
        atsScore: 88,
        missingSkills: ['AWS'],
        atsBreakdown: {
          overallScore: 88,
          categorySubscores: {
            keywordMatch: 85,
            experienceRelevance: 90,
            formattingCompliance: 92,
          },
          matchedSkills: ['React', 'TypeScript'],
          missingSkills: ['AWS'],
          dismissedSkills: [],
          actionableFeedback: [],
          isStale: false,
          evaluatedAt: '2026-10-25T15:00:00.000Z',
        },
        tailoredContent: {
          tailoredExperiences: [],
          educations: [],
          skills: [],
          recommendedSkills: [],
          keyStrengths: [],
        },
        lastExportedAt: '2026-10-25T16:00:00.000Z',
      }

      const parsed = CreateTailoredResumeSnapshotSchema.parse(payload)
      expect(parsed.profileId).toBe('prof_123')
      expect(parsed.lastExportedAt).toBeInstanceOf(Date)
      expect(parsed.atsScore).toBe(88)
      expect(parsed.atsBreakdown?.categorySubscores.keywordMatch).toBe(85)
    })

    it('rejects payload when profileId or jobPostingId is missing', () => {
      expect(() => {
        CreateTailoredResumeSnapshotSchema.parse({
          profileId: '',
          jobPostingId: 'job_456',
          tailoredContent: {},
        })
      }).toThrow('Profile ID is required')

      expect(() => {
        CreateTailoredResumeSnapshotSchema.parse({
          profileId: 'prof_123',
          jobPostingId: '',
          tailoredContent: {},
        })
      }).toThrow('Job posting ID is required')
    })
  })
})
