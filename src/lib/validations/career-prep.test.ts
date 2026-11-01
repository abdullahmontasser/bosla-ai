import { describe, it, expect } from 'vitest'
import {
  OutreachMessagePayloadSchema,
  ConnectionNoteSchema,
  InterviewPrepPayloadSchema,
  GenerateOutreachInputSchema,
  RegenerateOutreachVariantInputSchema,
  GenerateInterviewPrepInputSchema,
  RegenerateInterviewQuestionInputSchema,
  normalizeInterviewPrepPayload,
  assembleFullSheetText,
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
        expect(parsed.data.version).toBe(2)
        expect(parsed.data.questions).toHaveLength(3)
        expect(parsed.data.questionsToAskInterviewer).toHaveLength(3)
      }
    })

    it('validates mock Arabic interview prep payload', () => {
      const parsed = InterviewPrepPayloadSchema.safeParse(mockInterviewPrepPayloadAr)
      expect(parsed.success).toBe(true)
    })

    it('accepts empty questions array before first generation (AC-5)', () => {
      const emptyPayload = {
        version: 2,
        generatedAt: null,
        updatedAt: '2026-10-30T00:00:00.000Z',
        language: 'EN',
        roleTitle: 'Software Engineer',
        companyName: 'TechCorp',
        questions: [],
        questionsToAskInterviewer: [],
      }
      const parsed = InterviewPrepPayloadSchema.safeParse(emptyPayload)
      expect(parsed.success).toBe(true)
    })

    it('allows custom questions with empty STAR fields and whyAsked (AC-4, AC-5)', () => {
      const customPayload = {
        version: 2,
        generatedAt: null,
        updatedAt: '2026-10-30T00:00:00.000Z',
        language: 'EN',
        roleTitle: 'Software Engineer',
        companyName: 'TechCorp',
        questions: [
          {
            id: 'custom-1',
            category: 'CUSTOM',
            customOrigin: true,
            question: 'What is your greatest achievement?',
            whyAsked: '',
            starResponse: {
              situation: '',
              task: '',
              action: '',
              result: '',
            },
            referencedSources: [],
            missingMetricFlags: [],
          },
        ],
        questionsToAskInterviewer: [],
      }
      const parsed = InterviewPrepPayloadSchema.safeParse(customPayload)
      expect(parsed.success).toBe(true)
    })

    it('rejects payload with more than 10 custom questions (AC-4)', () => {
      const customQuestions = Array.from({ length: 11 }, (_, i) => ({
        id: `custom-${i}`,
        category: 'CUSTOM' as const,
        customOrigin: true,
        question: `Custom Question ${i}`,
        whyAsked: '',
        starResponse: { situation: '', task: '', action: '', result: '' },
        referencedSources: [],
        missingMetricFlags: [],
      }))

      const overCapPayload = {
        version: 2,
        generatedAt: null,
        updatedAt: '2026-10-30T00:00:00.000Z',
        language: 'EN' as const,
        roleTitle: 'Engineer',
        companyName: 'Corp',
        questions: customQuestions,
        questionsToAskInterviewer: [],
      }

      const parsed = InterviewPrepPayloadSchema.safeParse(overCapPayload)
      expect(parsed.success).toBe(false)
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

  describe('normalizeInterviewPrepPayload (AC-5)', () => {
    it('normalizes version 1 payload by backfilling version 2 and customOrigin false', () => {
      const v1Payload = {
        version: 1,
        generatedAt: '2026-10-25T10:00:00.000Z',
        updatedAt: '2026-10-25T10:00:00.000Z',
        language: 'EN',
        roleTitle: 'Frontend Engineer',
        companyName: 'Acme Inc',
        questions: [
          {
            id: 'q-v1',
            category: 'TECHNICAL',
            question: 'How do you optimize bundle size?',
            whyAsked: 'Evaluates frontend knowledge',
            starResponse: {
              situation: 'App was slow',
              task: 'Optimize bundle',
              action: 'Implemented code splitting',
              result: 'Reduced bundle by 40%',
            },
            referencedSources: ['Acme App'],
            missingMetricFlags: [],
          },
        ],
        questionsToAskInterviewer: [
          {
            id: 'qi-v1',
            question: 'What is the release cadence?',
            strategicGoal: 'Assess deployment agility',
          },
        ],
      }

      const normalized = normalizeInterviewPrepPayload(v1Payload)
      expect(normalized).not.toBeNull()
      expect(normalized?.version).toBe(2)
      expect(normalized?.questions[0].customOrigin).toBe(false)
      expect(normalized?.questions[0].category).toBe('TECHNICAL')
    })

    it('normalizes version 1 payload that already holds CUSTOM values (AC-5, Task 7)', () => {
      const v1WithCustom = {
        version: 1,
        generatedAt: '2026-10-25T10:00:00.000Z',
        updatedAt: '2026-10-25T10:00:00.000Z',
        language: 'EN',
        roleTitle: 'Frontend Engineer',
        companyName: 'Acme Inc',
        questions: [
          {
            id: 'custom-in-v1',
            category: 'CUSTOM',
            question: 'Tell me about your leadership style',
            whyAsked: '',
            starResponse: {
              situation: 'Led a squad',
              task: 'Deliver on time',
              action: 'Facilitated standups',
              result: 'Success',
            },
          },
        ],
        questionsToAskInterviewer: [],
      }

      const normalized = normalizeInterviewPrepPayload(v1WithCustom)
      expect(normalized).not.toBeNull()
      expect(normalized?.version).toBe(2)
      expect(normalized?.questions[0].category).toBe('CUSTOM')
      expect(normalized?.questions[0].customOrigin).toBe(true)
    })

    it('returns null for null, undefined, or non-object input', () => {
      expect(normalizeInterviewPrepPayload(null)).toBeNull()
      expect(normalizeInterviewPrepPayload(undefined)).toBeNull()
      expect(normalizeInterviewPrepPayload('invalid string')).toBeNull()
    })
  })

  describe('assembleFullSheetText (AC-6, AC-9)', () => {
    it('assembles English sheet text with English labels and no Arabic mixed script', () => {
      const text = assembleFullSheetText(mockInterviewPrepPayloadEn)
      expect(text).toContain(
        'Interview Prep Cheat Sheet: Senior Full Stack Engineer (AI Integration) - CloudScale Technologies',
      )
      expect(text).toContain('--- Interview Questions & STAR Responses ---')
      expect(text).toContain('Situation:')
      expect(text).toContain('Task:')
      expect(text).toContain('Action:')
      expect(text).toContain('Result:')
      expect(text).toContain('--- Questions to Ask the Interviewer ---')
      expect(text).toContain('Strategic Goal:')
      // Does not contain Arabic text
      expect(text).not.toContain('الموقف')
    })

    it('assembles Arabic sheet text with Arabic labels and no English labels', () => {
      const text = assembleFullSheetText(mockInterviewPrepPayloadAr)
      expect(text).toContain(
        'ورقة التحضير للمقابلة: مهندس برمجيات متكامل أول (تكامل الذكاء الاصطناعي) - تقنيات كلاود سكيل',
      )
      expect(text).toContain('--- أسئلة المقابلة ونموذج STAR ---')
      expect(text).toContain('الموقف:')
      expect(text).toContain('المهمة:')
      expect(text).toContain('الإجراء:')
      expect(text).toContain('النتيجة:')
      expect(text).toContain('--- أسئلة تطرحها على المقابِل ---')
      expect(text).toContain('الهدف الاستراتيجي:')
      // Does not contain English section header
      expect(text).not.toContain('--- Interview Questions & STAR Responses ---')
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
