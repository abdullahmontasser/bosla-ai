import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateInterviewPrepAction,
  saveInterviewPrepAction,
  regenerateInterviewQuestionAction,
} from './interview-prep-actions'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateObject } from 'ai'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { mockInterviewPrepPayloadEn } from '@/lib/validations/career-prep'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
}))

vi.mock('@/lib/ai/provider-client', () => ({
  getProviderModel: vi.fn().mockReturnValue({}),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

describe('Interview Prep Server Actions (covers: AC-2, AC-4, AC-5, AC-IP-1, AC-IP-4, AC-IP-5)', () => {
  const mockUser = { id: 'user_123', email: 'test@example.com' }

  const mockResume = {
    id: 'res_1',
    userId: 'user_123',
    language: 'EN',
    jobPosting: {
      title: 'Senior Full Stack Engineer (AI Integration)',
      companyName: 'CloudScale Technologies',
      rawDescription: 'Seeking senior engineer for streaming AI systems.',
      parsedSkills: ['Next.js', 'PostgreSQL', 'TypeScript'],
    },
    profile: {
      fullName: 'Alex Chen',
      workExperiences: [
        {
          companyName: 'TechVanguard',
          jobTitle: 'Senior Engineer',
          bullets: ['Engineered AI streaming pipeline reducing latency by 60%'],
        },
      ],
      projects: [
        {
          name: 'CareerCraft',
          description: 'Autonomous career agent',
          technologies: ['Next.js', 'PostgreSQL'],
        },
      ],
    },
    interviewPrep: mockInterviewPrepPayloadEn,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateInterviewPrepAction', () => {
    it('returns error when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)

      const result = await generateInterviewPrepAction('res_1')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error when resume not found or access denied', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

      const result = await generateInterviewPrepAction('non_existent')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found or access denied')
    })

    it('returns error when no active AI provider is configured', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([])

      const result = await generateInterviewPrepAction('res_1')
      expect(result.success).toBe(false)
      expect(result.error).toContain('No active AI provider configured')
    })

    it('generates exactly 3 categorized questions and 3 interviewer questions, persisting to DB', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
        {
          provider: 'ANTHROPIC',
          apiKey: 'sk-ant-test',
          defaultModel: 'claude-3-5-sonnet',
        } as unknown as never,
      ])

      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          questions: [
            {
              category: 'BEHAVIORAL',
              question: 'Describe handling high-pressure deadlines with conflicting priorities.',
              whyAsked: 'Assesses resilience and stakeholder management.',
              starResponse: {
                situation: 'At TechVanguard, we faced an urgent release.',
                task: 'Deliver streaming without downtime.',
                action: 'Implemented tracer bullet slice and feature flags.',
                result: 'Shipped on schedule with [insert latency reduction %] improvement.',
              },
              referencedSources: ['TechVanguard'],
              missingMetricFlags: ['[insert latency reduction %]'],
            },
            {
              category: 'TECHNICAL',
              question: 'How do you design streaming architectures in Next.js App Router?',
              whyAsked: 'Assesses server component streaming and chunked encoding.',
              starResponse: {
                situation: 'Processing resume prompts took over 5 seconds.',
                task: 'Stream response tokens smoothly.',
                action: 'Implemented Vercel AI SDK route handlers.',
                result: 'Reduced time-to-first-token to under 800ms.',
              },
              referencedSources: ['Streaming AI Engine'],
              missingMetricFlags: [],
            },
            {
              category: 'SITUATIONAL',
              question: 'What do you do when an AI provider has an unexpected outage?',
              whyAsked: 'Evaluates fallback strategies and graceful error UX.',
              starResponse: {
                situation: 'Commercial provider limits reached.',
                task: 'Ensure candidate continuity.',
                action: 'Built BYOK multi-provider switcher.',
                result: 'Users switched providers in 2 clicks with zero data loss.',
              },
              referencedSources: ['BYOK Switcher'],
              missingMetricFlags: [],
            },
          ],
          questionsToAskInterviewer: [
            {
              question: 'How do you balance rapid feature shipping with system reliability?',
              strategicGoal: 'Demonstrates senior focus on operational health.',
            },
            {
              question: 'What are the main architectural bottlenecks in your data pipeline?',
              strategicGoal: 'Shows interest in high-impact problem solving.',
            },
            {
              question: 'How does your engineering team approach prompt evaluations?',
              strategicGoal: 'Highlights commitment to AI quality.',
            },
          ],
        },
      } as unknown as never)

      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const result = await generateInterviewPrepAction('res_1')
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.questions).toHaveLength(3)
        expect(result.data.questionsToAskInterviewer).toHaveLength(3)
        expect(result.data.questions[0].id).toBeDefined()
        expect(result.data.questionsToAskInterviewer[0].id).toBeDefined()
      }

      expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res_1' },
          data: expect.objectContaining({
            interviewPrep: expect.any(Object),
          }),
        }),
      )
    })
  })

  describe('saveInterviewPrepAction', () => {
    it('saves updated interview prep payload and refreshes updatedAt', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const updated = {
        ...mockInterviewPrepPayloadEn,
        questions: [
          {
            ...mockInterviewPrepPayloadEn.questions[0],
            question: 'Edited question prompt here',
          },
          mockInterviewPrepPayloadEn.questions[1],
          mockInterviewPrepPayloadEn.questions[2],
        ],
      }

      const result = await saveInterviewPrepAction('res_1', updated)
      expect(result.success).toBe(true)
      expect(prisma.tailoredResume.update).toHaveBeenCalled()
    })
  })

  describe('regenerateInterviewQuestionAction', () => {
    it('regenerates single question and merges it into questions array preserving the other 2', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: mockUser } as unknown as never)
      vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
        mockResume as unknown as never,
      )
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
        {
          provider: 'ANTHROPIC',
          apiKey: 'sk-ant-test',
          defaultModel: 'claude-3-5-sonnet',
        } as unknown as never,
      ])

      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          category: 'TECHNICAL',
          question: 'Brand new technical question about database index optimization',
          whyAsked: 'Tests deep knowledge of query planning.',
          starResponse: {
            situation: 'Postgres query was taking 2 seconds.',
            task: 'Optimize query execution plan.',
            action: 'Added composite partial index on userId and status.',
            result: 'Reduced query latency to 12ms.',
          },
          referencedSources: ['PostgreSQL Database Layer'],
          missingMetricFlags: [],
        },
      } as unknown as never)

      vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({} as unknown as never)

      const targetId = mockInterviewPrepPayloadEn.questions[1].id
      const result = await regenerateInterviewQuestionAction('res_1', targetId)

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.questions).toHaveLength(3)
        // Question 0 should remain unchanged
        expect(result.data.questions[0].question).toBe(
          mockInterviewPrepPayloadEn.questions[0].question,
        )
        // Question 1 should be the new question
        expect(result.data.questions[1].question).toBe(
          'Brand new technical question about database index optimization',
        )
        // Question 2 should remain unchanged
        expect(result.data.questions[2].question).toBe(
          mockInterviewPrepPayloadEn.questions[2].question,
        )
      }
    })
  })
})
