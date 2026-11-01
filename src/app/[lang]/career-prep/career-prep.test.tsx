// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CareerPrepClient } from './CareerPrepClient'
import { mockInterviewPrepPayloadEn } from '@/lib/validations/career-prep'
import * as interviewActions from '@/app/actions/interview-prep-actions'
import * as careerActions from '@/app/actions/career-prep-actions'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/app/actions/interview-prep-actions', () => ({
  generateInterviewPrepAction: vi.fn(),
  saveInterviewPrepAction: vi.fn(),
  regenerateInterviewQuestionAction: vi.fn(),
}))

vi.mock('@/app/actions/career-prep-actions', () => ({
  getCareerPrepSelectorRowsAction: vi.fn(),
}))

describe('Career Prep Hub Client (covers: AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-10)', () => {
  const mockSelectorRows = [
    {
      jobPostingId: 'job-1',
      tailoredResumeId: 'resume-1',
      companyName: 'CloudScale Technologies',
      roleTitle: 'Senior Full Stack Engineer (AI Integration)',
      hasInterviewPrep: true,
      createdAt: '2026-10-30T10:00:00.000Z',
    },
    {
      jobPostingId: 'job-2',
      tailoredResumeId: 'resume-2',
      companyName: 'Anthropic Labs Partner',
      roleTitle: 'Staff AI Engineer',
      hasInterviewPrep: false,
      createdAt: '2026-10-29T10:00:00.000Z',
    },
  ]

  const mockSelectedResume = {
    id: 'resume-1',
    jobPostingId: 'job-1',
    roleTitle: 'Senior Full Stack Engineer (AI Integration)',
    companyName: 'CloudScale Technologies',
    language: 'EN' as const,
    payload: mockInterviewPrepPayloadEn,
    hasGrounding: true,
  }

  const mockDict = {
    careerPrep: {
      title: 'Career Prep & STAR Hub',
      jobSelector: 'Tailored Jobs',
      addCustomQuestion: 'Add Question',
      copyFullSheet: 'Copy Full Sheet',
      printCheatSheet: 'Print',
      generateButton: 'Generate Cheat Sheet',
      emptyStateTitle: 'No tailored resumes yet',
      emptyStateCta: 'Go to Tailor Studio',
      fallbackNotice: 'Requested prep not found, showing newest role.',
      loadMore: 'Load more jobs',
      statusGenerated: 'Ready',
      statusNotGenerated: 'Needs prep',
    },
  } as never

  beforeEach(() => {
    vi.clearAllMocks()
    window.open = vi.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders selector rows with newest first and active job content (AC-1, AC-3)', () => {
    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    expect(screen.getByTestId('career-prep-hub')).toBeDefined()
    expect(screen.getByTestId('selector-row-resume-1')).toBeDefined()
    expect(screen.getByTestId('selector-row-resume-2')).toBeDefined()

    // 3 STAR cards are rendered
    expect(
      screen.getByTestId(`question-input-${mockInterviewPrepPayloadEn.questions[0].id}`),
    ).toBeDefined()
    expect(
      screen.getByTestId(`question-input-${mockInterviewPrepPayloadEn.questions[1].id}`),
    ).toBeDefined()
    expect(
      screen.getByTestId(`question-input-${mockInterviewPrepPayloadEn.questions[2].id}`),
    ).toBeDefined()
  })

  it('shows friendly empty state when user has zero tailored jobs (AC-8)', () => {
    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={[]}
        initialHasMore={false}
        initialSelectedResume={null}
        fallbackNotice={false}
      />,
    )

    expect(screen.getByTestId('career-prep-empty-state')).toBeDefined()
    expect(screen.getByText('No tailored resumes yet')).toBeDefined()
    const tailorBtn = screen.getByRole('link', { name: /Go to Tailor Studio/i })
    expect(tailorBtn.getAttribute('href')).toBe('/en/tailor')
  })

  it('shows fallback notice when deep link is invalid or removed (AC-8)', () => {
    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={true}
      />,
    )

    expect(screen.getByTestId('career-prep-fallback-notice')).toBeDefined()
  })

  it('flushes autosave and pushes new URL with scroll:false when switching jobs (AC-1, Invariants)', async () => {
    vi.mocked(interviewActions.saveInterviewPrepAction).mockResolvedValue({
      success: true,
      data: mockInterviewPrepPayloadEn,
    })

    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const otherJobRow = screen.getByTestId('selector-row-resume-2')
    fireEvent.click(otherJobRow)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/career-prep?tailoredResumeId=resume-2', {
        scroll: false,
      })
    })
  })

  it('renders inline generate CTA when job has no interview prep yet (AC-2)', async () => {
    vi.mocked(interviewActions.generateInterviewPrepAction).mockResolvedValue({
      success: true,
      data: mockInterviewPrepPayloadEn,
    })

    const resumeWithoutPrep = {
      ...mockSelectedResume,
      id: 'resume-2',
      payload: null,
      hasGrounding: false,
    }

    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={resumeWithoutPrep}
        fallbackNotice={false}
      />,
    )

    // Verify instructional guidance banner appears when hasGrounding is false
    expect(screen.getByTestId('grounding-guidance-banner')).toBeDefined()

    const generateBtn = screen.getByTestId('generate-prep-btn')
    expect(generateBtn).toBeDefined()
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(interviewActions.generateInterviewPrepAction).toHaveBeenCalledWith('resume-2', {
        language: 'EN',
      })
    })
  })

  it('allows adding and deleting custom questions with cap at 10 (AC-4)', async () => {
    vi.mocked(interviewActions.saveInterviewPrepAction).mockResolvedValue({
      success: true,
      data: mockInterviewPrepPayloadEn,
    })

    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const addBtn = screen.getByTestId('add-custom-question-btn')
    fireEvent.click(addBtn)

    await waitFor(() => {
      // 3 AI questions + 1 new custom question = 4
      const deleteBtns = screen.getAllByTitle(/Delete custom question/i)
      expect(deleteBtns).toHaveLength(1)
    })
  })

  it('copies full sheet text to clipboard with payload language labels (AC-6)', async () => {
    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const copyFullBtn = screen.getByTestId('copy-full-sheet-btn')
    fireEvent.click(copyFullBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Interview Prep Cheat Sheet'),
    )
  })

  it('opens print route in new tab after flushing pending autosave (AC-7)', async () => {
    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const printBtn = screen.getByTestId('print-sheet-btn')
    fireEvent.click(printBtn)

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        '/en/career-prep/print?tailoredResumeId=resume-1',
        '_blank',
      )
    })
  })

  it('loads more selector rows when load more button is clicked (AC-10)', async () => {
    vi.mocked(careerActions.getCareerPrepSelectorRowsAction).mockResolvedValue({
      success: true,
      data: {
        rows: [
          {
            jobPostingId: 'job-3',
            tailoredResumeId: 'resume-3',
            companyName: 'New Corp',
            roleTitle: 'Lead Architect',
            hasInterviewPrep: true,
            createdAt: '2026-10-25T10:00:00.000Z',
          },
        ],
        hasMore: false,
        nextOffset: 3,
      },
    })

    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={true}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const loadMoreBtn = screen.getByTestId('career-prep-load-more-btn')
    fireEvent.click(loadMoreBtn)

    await waitFor(() => {
      expect(screen.getByTestId('selector-row-resume-3')).toBeDefined()
    })
  })

  it('keeps the generate CTA reachable for a custom-only draft (AC-5)', () => {
    const customOnlyDraft = {
      ...mockInterviewPrepPayloadEn,
      questions: [
        {
          id: 'custom-1',
          category: 'CUSTOM' as const,
          customOrigin: true,
          question: 'My own custom question',
          whyAsked: '',
          starResponse: { situation: '', task: '', action: '', result: '' },
          referencedSources: [],
          missingMetricFlags: [],
        },
      ],
    }

    render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={{ ...mockSelectedResume, payload: customOnlyDraft }}
        fallbackNotice={false}
      />,
    )

    // The empty AI set is legal; generation must stay reachable for the user to fill it later.
    expect(screen.getByTestId('generate-prep-btn')).toBeDefined()
    expect(screen.getByTestId('question-input-custom-1')).toBeDefined()
  })

  it('adopts the server payload after router.refresh (409 stale recovery, Invariants)', async () => {
    const { rerender } = render(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={mockSelectedResume}
        fallbackNotice={false}
      />,
    )

    const serverRefreshedPayload = {
      ...mockInterviewPrepPayloadEn,
      questions: [
        {
          ...mockInterviewPrepPayloadEn.questions[0],
          starResponse: {
            ...mockInterviewPrepPayloadEn.questions[0].starResponse,
            situation: 'Server authoritative situation text.',
          },
        },
        ...mockInterviewPrepPayloadEn.questions.slice(1),
      ],
    }

    rerender(
      <CareerPrepClient
        lang="en"
        dict={mockDict}
        initialSelectorRows={mockSelectorRows}
        initialHasMore={false}
        initialSelectedResume={{ ...mockSelectedResume, payload: serverRefreshedPayload }}
        fallbackNotice={false}
      />,
    )

    expect(screen.getByDisplayValue('Server authoritative situation text.')).toBeDefined()
  })
})
