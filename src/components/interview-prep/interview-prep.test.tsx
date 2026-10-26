// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StarQuestionCard } from './StarQuestionCard'
import { InterviewerQuestionsList } from './InterviewerQuestionsList'
import { InterviewPrepWorkbench } from './InterviewPrepWorkbench'
import { mockInterviewPrepPayloadEn } from '@/lib/validations/career-prep'
import * as interviewActions from '@/app/actions/interview-prep-actions'

vi.mock('@/app/actions/interview-prep-actions', () => ({
  generateInterviewPrepAction: vi.fn(),
  saveInterviewPrepAction: vi.fn(),
  regenerateInterviewQuestionAction: vi.fn(),
}))

describe('Interview Prep Studio Components (covers: AC-2, AC-4, AC-IP-3, AC-IP-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  describe('StarQuestionCard', () => {
    it('renders category badge, question, whyAsked, and STAR components', () => {
      const q = mockInterviewPrepPayloadEn.questions[0]
      const handleChange = vi.fn()
      const handleRegenerate = vi.fn().mockResolvedValue(undefined)

      render(
        <StarQuestionCard
          question={q}
          index={0}
          onChange={handleChange}
          onRegenerate={handleRegenerate}
          lang="en"
        />,
      )

      expect(screen.getByText('Behavioral Question')).toBeDefined()
      expect(screen.getByText(q.question)).toBeDefined()
      expect(screen.getByText(q.whyAsked)).toBeDefined()
      expect(screen.getByDisplayValue(q.starResponse.situation)).toBeDefined()
      expect(screen.getByDisplayValue(q.starResponse.task)).toBeDefined()
      expect(screen.getByDisplayValue(q.starResponse.action)).toBeDefined()
      expect(screen.getByDisplayValue(q.starResponse.result)).toBeDefined()
    })

    it('copies complete STAR model response to clipboard', () => {
      const q = mockInterviewPrepPayloadEn.questions[0]

      render(
        <StarQuestionCard
          question={q}
          index={0}
          onChange={vi.fn()}
          onRegenerate={vi.fn().mockResolvedValue(undefined)}
          lang="en"
        />,
      )

      const copyBtn = screen.getByRole('button', { name: /Copy STAR Answer/i })
      fireEvent.click(copyBtn)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(q.starResponse.situation),
      )
    })
  })

  describe('InterviewerQuestionsList', () => {
    it('renders strategic questions and allows in-place editing', () => {
      const questions = mockInterviewPrepPayloadEn.questionsToAskInterviewer
      const handleChange = vi.fn()

      render(<InterviewerQuestionsList questions={questions} onChange={handleChange} lang="en" />)

      expect(screen.getByText(/Strategic Questions to Ask the Interviewer/i)).toBeDefined()
      expect(screen.getByDisplayValue(questions[0].question)).toBeDefined()

      const firstInput = screen.getByDisplayValue(questions[0].question)
      fireEvent.change(firstInput, { target: { value: 'Edited question prompt' } })

      expect(handleChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ question: 'Edited question prompt' })]),
      )
    })
  })

  describe('InterviewPrepWorkbench', () => {
    it('renders zero-experience guidance banner when hasRecordedExperiences is false', () => {
      render(
        <InterviewPrepWorkbench
          tailoredResumeId="res_1"
          initialInterviewPrep={null}
          hasRecordedExperiences={false}
          lang="en"
        />,
      )

      expect(screen.getByText(/Guidance for Candidates with No Recorded Projects/i)).toBeDefined()
    })

    it('renders questions and performs debounced autosave on edits', async () => {
      vi.mocked(interviewActions.saveInterviewPrepAction).mockResolvedValue({
        success: true,
        data: mockInterviewPrepPayloadEn,
      })

      render(
        <InterviewPrepWorkbench
          tailoredResumeId="res_1"
          initialInterviewPrep={mockInterviewPrepPayloadEn}
          lang="en"
        />,
      )

      expect(screen.getByText(mockInterviewPrepPayloadEn.questions[0].question)).toBeDefined()

      const situationArea = screen.getByDisplayValue(
        mockInterviewPrepPayloadEn.questions[0].starResponse.situation,
      )
      fireEvent.change(situationArea, { target: { value: 'Updated situation narrative.' } })

      await waitFor(
        () => {
          expect(interviewActions.saveInterviewPrepAction).toHaveBeenCalledWith(
            'res_1',
            expect.objectContaining({
              questions: expect.arrayContaining([
                expect.objectContaining({
                  starResponse: expect.objectContaining({
                    situation: 'Updated situation narrative.',
                  }),
                }),
              ]),
            }),
          )
        },
        { timeout: 2000 },
      )
    })
  })
})
