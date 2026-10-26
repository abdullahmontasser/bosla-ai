import { describe, it, expect } from 'vitest'
import {
  OutreachMessagePayloadSchema,
  ConnectionNoteSchema,
  InterviewPrepPayloadSchema,
  GenerateOutreachInputSchema,
  RegenerateOutreachVariantInputSchema,
  GenerateInterviewPrepInputSchema,
  RegenerateInterviewQuestionInputSchema,
  mockOutreachPayloadEn,
  mockOutreachPayloadAr,
  mockInterviewPrepPayloadEn,
  mockInterviewPrepPayloadAr,
} from './career-prep'

describe('Career Prep Validation Schemas (covers: AC-1, AC-2, AC-CO-1, AC-IP-1)', () => {
  describe('OutreachMessagePayloadSchema', () => {
    it('validates mock English outreach message payload', () => {
      const parsed = OutreachMessagePayloadSchema.safeParse(mockOutreachPayloadEn)
      expect(parsed.success).toBe(true)
    })

    it('validates mock Arabic outreach message payload', () => {
      const parsed = OutreachMessagePayloadSchema.safeParse(mockOutreachPayloadAr)
      expect(parsed.success).toBe(true)
    })

    it('rejects connection notes exceeding 300 characters', () => {
      const longNote = 'a'.repeat(301)
      const invalidPayload = {
        ...mockOutreachPayloadEn,
        connectionNote: {
          text: longNote,
          charCount: 301,
        },
      }
      const parsed = OutreachMessagePayloadSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })

    it('rejects connection note if charCount exceeds 300 even if text is within limit', () => {
      const invalidNote = {
        text: 'Valid text',
        charCount: 305,
      }
      const parsed = ConnectionNoteSchema.safeParse(invalidNote)
      expect(parsed.success).toBe(false)
    })

    it('rejects invalid tone options', () => {
      const invalidPayload = {
        ...mockOutreachPayloadEn,
        tone: 'AGGRESSIVE',
      }
      const parsed = OutreachMessagePayloadSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })

    it('rejects invalid recipient type options', () => {
      const invalidPayload = {
        ...mockOutreachPayloadEn,
        recipientType: 'UNKNOWN',
      }
      const parsed = OutreachMessagePayloadSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('InterviewPrepPayloadSchema', () => {
    it('validates mock English interview prep payload', () => {
      const parsed = InterviewPrepPayloadSchema.safeParse(mockInterviewPrepPayloadEn)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.questions).toHaveLength(3)
        expect(parsed.data.questionsToAskInterviewer).toHaveLength(3)
      }
    })

    it('validates mock Arabic interview prep payload', () => {
      const parsed = InterviewPrepPayloadSchema.safeParse(mockInterviewPrepPayloadAr)
      expect(parsed.success).toBe(true)
    })

    it('rejects invalid question category', () => {
      const invalidPayload = {
        ...mockInterviewPrepPayloadEn,
        questions: [
          {
            ...mockInterviewPrepPayloadEn.questions[0],
            category: 'PERSONAL',
          },
        ],
      }
      const parsed = InterviewPrepPayloadSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })

    it('rejects incomplete STAR response structures', () => {
      const invalidPayload = {
        ...mockInterviewPrepPayloadEn,
        questions: [
          {
            ...mockInterviewPrepPayloadEn.questions[0],
            starResponse: {
              situation: 'Situation only',
            },
          },
        ],
      }
      const parsed = InterviewPrepPayloadSchema.safeParse(invalidPayload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('Input Schemas', () => {
    it('validates GenerateOutreachInputSchema with default values', () => {
      const parsed = GenerateOutreachInputSchema.safeParse({
        tailoredResumeId: 'resume-123',
      })
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.tone).toBe('PROFESSIONAL')
        expect(parsed.data.recipientType).toBe('RECRUITER')
      }
    })

    it('validates RegenerateOutreachVariantInputSchema for each variant', () => {
      const variants = ['connectionNote', 'inMail', 'email'] as const
      for (const variant of variants) {
        const parsed = RegenerateOutreachVariantInputSchema.safeParse({
          tailoredResumeId: 'resume-123',
          variant,
        })
        expect(parsed.success).toBe(true)
      }
    })

    it('validates GenerateInterviewPrepInputSchema', () => {
      const parsed = GenerateInterviewPrepInputSchema.safeParse({
        tailoredResumeId: 'resume-123',
        language: 'AR',
      })
      expect(parsed.success).toBe(true)
    })

    it('validates RegenerateInterviewQuestionInputSchema', () => {
      const parsed = RegenerateInterviewQuestionInputSchema.safeParse({
        tailoredResumeId: 'resume-123',
        questionId: 'q-1',
      })
      expect(parsed.success).toBe(true)
    })
  })
})
