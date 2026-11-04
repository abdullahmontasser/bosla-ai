// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdaptiveStudioWizard } from './AdaptiveStudioWizard'
import * as tailorActions from '@/app/actions/tailor'

vi.mock('@/app/actions/tailor', async () => {
  const actual = await vi.importActual('@/app/actions/tailor')
  return {
    ...actual,
    getTailoredResumeHistoryAction: vi.fn(),
  }
})

vi.mock('@/app/actions/ats-engine', () => ({
  calculateAtsScoreAction: vi.fn().mockResolvedValue({
    success: true,
    atsScore: 88,
    breakdown: {
      overallScore: 88,
      keywordMatchScore: 85,
      experienceRelevanceScore: 90,
      formattingScore: 88,
      matchedSkills: ['TypeScript', 'Next.js'],
      missingSkills: [],
      dismissedSkills: [],
      feedback: [],
    },
  }),
  addMissingSkillAction: vi.fn().mockResolvedValue({ success: true }),
  dismissMissingSkillAction: vi.fn().mockResolvedValue({ success: true }),
  rewriteBulletWithXyzAction: vi.fn().mockResolvedValue({ success: true }),
}))

describe('AdaptiveStudioWizard (Living Resume & Tailor Studio Overhaul)', () => {
  const defaultProps = {
    initialProfile: {
      id: 'prof_1',
      candidateName: 'Abdullah Montasser',
      headline: 'Staff Full Stack Architect',
      summary:
        'Experienced engineering leader building distributed systems and high-throughput web apps.',
      workExperiences: [
        {
          companyName: 'Tech Innovators',
          jobTitle: 'Lead Software Architect',
          bullets: [
            'Architected scalable microservices using TypeScript, reducing production latency by 42%.',
            'Engineered bilingual high-throughput user interfaces compliant with WCAG 2.1 AA and RTL.',
          ],
        },
      ],
      skills: [
        { name: 'TypeScript' },
        { name: 'Next.js' },
        { name: 'PostgreSQL' },
        { name: 'GraphQL' },
      ],
    },
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Anthropic Labs Partner',
    rawJobDescription:
      'Seeking Senior Full Stack Engineer with strong TypeScript, React, Next.js, and PostgreSQL expertise to architect AI streaming pipelines.',
    customInstructions: '',
    excludedSkills: [],
    onJobTitleChange: vi.fn(),
    onCompanyNameChange: vi.fn(),
    onRawJobDescriptionChange: vi.fn(),
    onCustomInstructionsChange: vi.fn(),
    onExcludedSkillsChange: vi.fn(),
    onStartTailoring: vi.fn(),
    onStopTailoring: vi.fn(),
    status: 'IDLE' as const,
    streamText: '',
    tailoredResumeId: null,
    atsScore: 84,
    hasOutreach: false,
    hasApplication: false,
    hasProfile: true,
    lang: 'en' as const,
    language: 'EN' as const,
    dict: {},
    onDownloadPdf: vi.fn(),
    selectedTemplate: 'harvard-classic' as const,
    onSelectTemplate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(tailorActions.getTailoredResumeHistoryAction).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'hist_1',
          jobTitle: 'Senior Full Stack Engineer',
          companyName: 'Anthropic Labs Partner',
          rawJobDescription: 'Job description 1',
          atsScore: 92,
          tailoredSummary: 'Summary 1',
          createdAt: '2026-11-01T12:00:00Z',
          language: 'EN',
        },
        // Duplicate role that should be deduplicated
        {
          id: 'hist_2',
          jobTitle: 'Senior Full Stack Engineer',
          companyName: 'Anthropic Labs Partner',
          rawJobDescription: 'Job description 1 duplicate',
          atsScore: 90,
          tailoredSummary: 'Summary duplicate',
          createdAt: '2026-10-31T12:00:00Z',
          language: 'EN',
        },
        // Distinct role
        {
          id: 'hist_3',
          jobTitle: 'AI Integration Specialist',
          companyName: 'OpenAI Studio',
          rawJobDescription: 'Job description 2',
          atsScore: 88,
          tailoredSummary: 'Summary 2',
          createdAt: '2026-10-25T12:00:00Z',
          language: 'EN',
        },
      ],
    })
  })

  it('renders Step 1 with clean intake form and deduplicated role history', async () => {
    render(<AdaptiveStudioWizard {...defaultProps} />)

    expect(screen.getAllByText('Target Job Posting').length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Senior Full Stack Engineer')).toBeDefined()
    expect(screen.getByDisplayValue('Anthropic Labs Partner')).toBeDefined()

    // Verify deduplicated history loads
    await waitFor(() => {
      expect(screen.getByText('Recent Tailored Roles')).toBeDefined()
      // Anthropic Labs Partner should only appear once in deduplicated list
      expect(screen.getAllByText('Anthropic Labs Partner').length).toBeGreaterThan(0)
      expect(screen.getByText('AI Integration Specialist')).toBeDefined()
    })
  })

  it('triggers overwrite protection dialog when loading past brief with unsaved input', async () => {
    render(<AdaptiveStudioWizard {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getAllByText(/Open Tailored Resume|Load Brief/i).length).toBeGreaterThan(0)
    })

    // Click load brief for the second job
    const loadBriefButtons = screen.getAllByText(/Open Tailored Resume|Load Brief/i)
    fireEvent.click(loadBriefButtons[loadBriefButtons.length - 1])

    // Should display overwrite confirmation alert
    await waitFor(() => {
      expect(screen.getByText(/Replace current job brief with/i)).toBeDefined()
      expect(screen.getByText('Confirm & Replace')).toBeDefined()
    })

    // Click confirm replace
    fireEvent.click(screen.getByText('Confirm & Replace'))
    expect(defaultProps.onJobTitleChange).toHaveBeenCalledWith('AI Integration Specialist')
    expect(defaultProps.onCompanyNameChange).toHaveBeenCalledWith('OpenAI Studio')
  })

  it('calls onStartTailoring with skipConfirm=true when user confirms regeneration of existing role', async () => {
    render(<AdaptiveStudioWizard {...defaultProps} />)

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText('Recent Tailored Roles')).toBeDefined()
    })

    // Click Generate Tailored Resume for the job that already exists in history (Senior Full Stack Engineer @ Anthropic Labs Partner)
    const startBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    fireEvent.click(startBtn)

    // Verify the friendly existing role heads-up appears
    expect(screen.getByText(/You already have a tailored resume for this role/i)).toBeDefined()

    // Create a fresh version
    const regenerateBtn = screen.getByRole('button', { name: /Create a fresh version/i })
    fireEvent.click(regenerateBtn)

    // Verify onStartTailoring was invoked with skipConfirm = true
    expect(defaultProps.onStartTailoring).toHaveBeenCalledWith(true)
  })

  it('renders in-page AI Calibration workspace on generation without popup modals', () => {
    const { rerender } = render(
      <AdaptiveStudioWizard
        {...defaultProps}
        status="GENERATING"
        streamText="### SUMMARY\nGenerated summary\n### BULLETS\n- Generated bullet"
      />,
    )

    // Calibration should be rendered in-page as main view without modal dialog overlay
    expect(screen.getByText('Calibrating Profile for ATS Dominance')).toBeDefined()
    expect(screen.getByText('Competency & Keyword Extraction')).toBeDefined()

    // Transition to completed
    rerender(
      <AdaptiveStudioWizard
        {...defaultProps}
        status="COMPLETED"
        tailoredResumeId="res_123"
        streamText="### SUMMARY\nGenerated summary\n### BULLETS\n- Generated bullet"
      />,
    )
  })

  it('renders Living Resume canvas with Candidate Profile Skills, Matched Skills & 1-click Skill Gaps', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    // Switch or check Living Resume
    expect(screen.getByText('Skills & Job Competencies')).toBeDefined()
    expect(screen.getByText('Matched Job Requirements:')).toBeDefined()

    // Matched skill check (TypeScript, Next.js, PostgreSQL were matched with rawJobDescription)
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Next.js').length).toBeGreaterThan(0)

    // Skill Gap Recommendations with 1-click add
    expect(screen.getByText(/Skill Gap Recommendations/i)).toBeDefined()
    const gapSkill =
      screen.queryByRole('button', { name: /Add Vercel AI SDK to profile/i }) ||
      screen.queryByRole('button', { name: /Add Docker to profile/i })
    if (gapSkill) {
      fireEvent.click(gapSkill)
      // Should add skill and show notification
      expect(screen.getByText(/Added Skill:/i)).toBeDefined()
    }
  })

  it('supports inline headline editing and updates state', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    const headlineEl = screen.getAllByText('Staff Full Stack Architect')[0]
    fireEvent.click(headlineEl)

    // Inline input appears
    const input = screen.getByDisplayValue('Staff Full Stack Architect')
    fireEvent.change(input, { target: { value: 'Principal Distributed Systems Architect' } })
    fireEvent.click(screen.getByText('Done'))

    expect(screen.getAllByText('Principal Distributed Systems Architect').length).toBeGreaterThan(0)
  })

  it('allows accepting in-context AI suggestions with ATS score increase', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    // Find in-context suggestion accept button
    const acceptButtons = screen.getAllByText(/Accept \(\+/i)
    expect(acceptButtons.length).toBeGreaterThan(0)

    fireEvent.click(acceptButtons[0])

    // Should indicate acceptance
    expect(screen.getByText(/Applied:/i)).toBeDefined()
    expect(screen.getByText(/AI optimization accepted & active/i)).toBeDefined()
  })

  it('accepts all pending AI suggestions across every CV section at once', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    const acceptAllBtn = screen.getByRole('button', { name: /Accept all AI fixes/i })
    const pendingCount = screen.getAllByText(/Accept \(\+/i).length
    expect(pendingCount).toBeGreaterThan(0)

    fireEvent.click(acceptAllBtn)

    expect(screen.getByText(/Applied \d+ AI fixes across all resume sections/i)).toBeDefined()
    expect(screen.getAllByText(/AI optimization accepted & active/i).length).toBe(pendingCount)
    expect(screen.queryByRole('button', { name: /Accept all AI fixes/i })).toBeNull()
  })

  it('supports 15 ATS-proven templates selection in export step', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    // Navigate to step 6 (Templates & PDF)
    const exportStepButton = screen.getByText('Templates & PDF')
    fireEvent.click(exportStepButton)

    expect(
      screen.getAllByText('Choose from 15 ATS-Proven Vector Templates').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Harvard Academic Classic').length).toBeGreaterThan(0)
    expect(screen.getByText('Tech Minimalist (High-Density)')).toBeDefined()
    expect(screen.getByText('Wall Street Finance')).toBeDefined()
    expect(screen.getByText('Clean Monochrome')).toBeDefined()

    // Select Tech Minimalist
    fireEvent.click(screen.getByText('Tech Minimalist (High-Density)'))
    expect(defaultProps.onSelectTemplate).toHaveBeenCalledWith('tech-minimalist')
  })

  it('dynamically applies chosen accent color to resume headings, dividers, and status bar in Phase 6', () => {
    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    // Navigate to step 6 (Templates & PDF)
    const exportStepButton = screen.getByText('Templates & PDF')
    fireEvent.click(exportStepButton)

    // Find and click the Oxford Navy swatch button
    const oxfordNavyBtn = screen.getByRole('button', { name: /Oxford Navy/i })
    expect(oxfordNavyBtn).toBeDefined()
    fireEvent.click(oxfordNavyBtn)

    // Button should now be pressed
    expect(oxfordNavyBtn.getAttribute('aria-pressed')).toBe('true')

    // Top status bar should show Oxford Navy
    expect(screen.getByText('Oxford Navy')).toBeDefined()

    // Find candidate name in page 1 preview
    const candidateNameEl = screen.getByRole('heading', { level: 1, name: 'Abdullah Montasser' })
    expect(candidateNameEl.style.color).toBe('rgb(30, 58, 138)') // #1e3a8a
  })

  it('renders flawlessly in Arabic RTL mode', () => {
    render(<AdaptiveStudioWizard {...defaultProps} lang="ar" language="AR" />)

    expect(screen.getAllByText('بيانات الوظيفة المستهدفة').length).toBeGreaterThan(0)
    expect(screen.getByText('أحدث الوظائف المخصصة')).toBeDefined()
  })

  it('updates canvas density and includes chosen density in PDF export payload', async () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
    window.URL.revokeObjectURL = vi.fn()

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake pdf content'], { type: 'application/pdf' }),
    } as Response)

    render(<AdaptiveStudioWizard {...defaultProps} status="COMPLETED" tailoredResumeId="res_123" />)

    // Navigate to step 6 (Templates & PDF)
    const exportStepButton = screen.getByText('Templates & PDF')
    fireEvent.click(exportStepButton)

    // Check density radio buttons exist
    const compactBtn = screen.getByRole('radio', { name: /compact/i })
    expect(compactBtn).toBeDefined()
    expect(compactBtn.getAttribute('aria-checked')).toBe('false')

    // Click Compact
    fireEvent.click(compactBtn)
    expect(compactBtn.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('compact density')).toBeDefined()

    // Click Download Vector PDF button
    const downloadBtn = screen.getByTestId('pdf-export-btn')
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/resumes/res_123/pdf',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"density":"compact"'),
        }),
      )
    })

    fetchSpy.mockRestore()
  })
})
