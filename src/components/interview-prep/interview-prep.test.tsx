// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarQuestionCard } from './StarQuestionCard'
import { InterviewerQuestionsList } from './InterviewerQuestionsList'
import { mockInterviewPrepPayloadEn } from '@/lib/validations/career-prep'

describe('Interview Prep Components (covers: AC-2, AC-4, AC-IP-3, AC-IP-5)', () => {
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

    it('renders delete button for custom questions and hides regenerate (AC-4)', () => {
      const customQ = {
        id: 'cust-1',
        category: 'CUSTOM' as const,
        customOrigin: true,
        question: 'Custom Question Text',
        whyAsked: 'Custom Intent',
        starResponse: { situation: '', task: '', action: '', result: '' },
        referencedSources: [],
        missingMetricFlags: [],
      }
      const handleDelete = vi.fn()
      const handleRegenerate = vi.fn()

      render(
        <StarQuestionCard
          question={customQ}
          index={0}
          onChange={vi.fn()}
          onRegenerate={handleRegenerate}
          onDelete={handleDelete}
          lang="en"
        />,
      )

      expect(screen.getByText('Custom Question')).toBeDefined()
      const deleteBtn = screen.getByTestId('delete-custom-question-cust-1')
      expect(deleteBtn).toBeDefined()
      fireEvent.click(deleteBtn)
      expect(handleDelete).toHaveBeenCalled()

      // Regenerate button must NOT be present
      expect(screen.queryByTestId('regenerate-question-cust-1')).toBeNull()
    })

    it('renders regenerate button for AI questions and hides delete (AC-4)', () => {
      const aiQ = mockInterviewPrepPayloadEn.questions[0]
      const handleRegenerate = vi.fn().mockResolvedValue(undefined)

      render(
        <StarQuestionCard
          question={aiQ}
          index={0}
          onChange={vi.fn()}
          onRegenerate={handleRegenerate}
          lang="en"
        />,
      )

      const regenBtn = screen.getByTestId(`regenerate-question-${aiQ.id}`)
      expect(regenBtn).toBeDefined()
      expect(screen.queryByTestId(`delete-custom-question-${aiQ.id}`)).toBeNull()
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

  describe('RehearsalStudio', () => {
    it('renders verbal rehearsal spotlight, timer, hint toggle, and confidence buttons', async () => {
      const { RehearsalStudio } = await import('./RehearsalStudio')
      const questions = mockInterviewPrepPayloadEn.questions
      const handleExit = vi.fn()

      render(<RehearsalStudio questions={questions} lang="en" onExit={handleExit} />)

      expect(screen.getByTestId('rehearsal-studio')).toBeDefined()
      expect(screen.getByText('Verbal Rehearsal Studio')).toBeDefined()
      expect(screen.getByText(questions[0].question)).toBeDefined()
      expect(screen.getByText('Speaking Timer (2-min target)')).toBeDefined()

      // Active recall: hints initially concealed
      expect(screen.queryByText(questions[0].starResponse.situation)).toBeNull()

      // Toggle hint visibility
      const toggleHintBtn = screen.getByTestId('toggle-hints-btn')
      fireEvent.click(toggleHintBtn)
      expect(screen.getByText(questions[0].starResponse.situation)).toBeDefined()

      // Rate confidence
      const nailedItBtn = screen.getByRole('button', { name: /Nailed It/i })
      fireEvent.click(nailedItBtn)

      // Exit
      const exitBtn = screen.getByTestId('exit-rehearsal-btn')
      fireEvent.click(exitBtn)
      expect(handleExit).toHaveBeenCalled()
    })
  })

  describe('TargetJobDrawer', () => {
    it('renders target job details, parsed skills, and grounding sources', async () => {
      const { TargetJobDrawer } = await import('./TargetJobDrawer')
      const handleClose = vi.fn()

      render(
        <TargetJobDrawer
          isOpen={true}
          onClose={handleClose}
          roleTitle="Senior Full Stack Engineer"
          companyName="Acme AI"
          parsedSkills={['TypeScript', 'Next.js', 'PostgreSQL']}
          jobDescription="Seeking experienced engineer to lead AI integrations."
          groundingSources={{
            workExperiences: ['Lead Engineer at CloudCorp'],
            projects: ['AI Search Engine'],
          }}
          lang="en"
        />,
      )

      expect(screen.getByTestId('target-job-drawer')).toBeDefined()
      expect(screen.getByText('Senior Full Stack Engineer')).toBeDefined()
      expect(screen.getByText('Acme AI')).toBeDefined()
      expect(screen.getByText('TypeScript')).toBeDefined()
      expect(screen.getByText('Lead Engineer at CloudCorp')).toBeDefined()
      expect(screen.getByText('AI Search Engine')).toBeDefined()
    })
  })
})
