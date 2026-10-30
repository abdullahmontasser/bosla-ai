// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudioContainer } from './StudioContainer'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/tailor', () => ({
  saveCandidateProfile: vi.fn(),
  loadSampleCandidateProfile: vi.fn(),
  getOutreachMessageAction: vi.fn().mockResolvedValue({ success: true, data: undefined }),
}))

vi.mock('@/app/actions/application-actions', () => ({
  createApplication: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/app/actions/ats-engine', () => ({
  calculateAtsScoreAction: vi.fn().mockResolvedValue({
    success: true,
    atsScore: 88,
    breakdown: {
      overallScore: 88,
      keywordMatchScore: 85,
      experienceRelevanceScore: 90,
      formattingScore: 88,
      matchedSkills: ['Next.js', 'PostgreSQL'],
      missingSkills: [],
      dismissedSkills: [],
      feedback: [],
    },
  }),
  addMissingSkillAction: vi.fn().mockResolvedValue({ success: true }),
  dismissMissingSkillAction: vi.fn().mockResolvedValue({ success: true }),
  rewriteBulletWithXyzAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/provider-settings/ProviderSwitcher', () => ({
  ProviderSwitcher: ({ onProviderChange }: { onProviderChange: (p: string | null) => void }) => (
    <div data-testid="provider-switcher">
      <button type="button" onClick={() => onProviderChange('OPENAI')}>
        Select OpenAI
      </button>
      <button type="button" onClick={() => onProviderChange(null)}>
        Clear Provider
      </button>
    </div>
  ),
}))

describe('StudioContainer (covers: AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10)', () => {
  const dummyDict = {
    tailor: {
      title: 'Resume Tailoring Studio',
      subtitle: 'Align your experience with target job descriptions in real-time.',
      missingProviderWarning:
        'No active AI provider configured. Generation is disabled until you configure a provider in settings.',
      goToSettings: 'Configure Provider',
      tailorButton: 'Generate Tailored Resume',
      stopGenerating: 'Stop Generation',
      previewPanelTitle: 'Live Tailoring Output',
      jobPostingPanelTitle: 'Target Job Posting',
      missingProfileAlertTitle: 'Master Candidate Profile Required',
      missingProfileAlertDesc:
        'To generate tailored resumes grounded in your real career facts, please create your master profile first.',
      createProfileButton: 'Create Master Profile',
      profileMissingWarning: 'Please create your master profile to enable resume tailoring.',
      verified: 'Verified',
      unverified: 'Unverified',
      editProfile: 'Edit Profile',
      readyBadge: 'Ready',
      pendingBadge: 'Pending',
      practiceStarQuestions: 'Practice STAR Interview Questions',
      outreachAccordionTitle: 'Outreach Messaging & Networking',
    },
    ats: {
      title: 'ATS Optimization Workbench',
      subtitle: 'Real-time keyword scoring and vector PDF export.',
    },
    tracker: {
      addToTracker: 'Add to Tracker',
      viewInTracker: 'View in Tracker',
      saving: 'Adding...',
    },
  } as unknown as Partial<Dictionary>

  const validProfile = {
    id: 'prof_test_1',
    headline: 'Senior Full Stack Engineer & Cloud Architect',
    candidateName: 'Alex Morgan',
    emailVerified: true,
    summary: 'Full stack engineer with 6+ years experience.',
    workExperiences: [
      {
        companyName: 'TechVanguard Systems',
        jobTitle: 'Senior Full Stack Engineer',
        bullets: ['Architected bilingual career agent handling automated resume ingestion.'],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders friendly missing profile banner and disables generate button when profile is missing (covers: AC-2)', () => {
    render(
      <StudioContainer
        initialProfile={null}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict}
      />,
    )

    // Verify alert banner presence
    expect(screen.getByTestId('missing-profile-banner')).toBeDefined()
    expect(screen.getByText('Master Candidate Profile Required')).toBeDefined()
    expect(screen.getByTestId('create-profile-btn')).toBeDefined()

    // Verify generate button disabled
    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    expect(generateBtn.getAttribute('disabled')).not.toBeNull()

    // Verify inline experience form is NOT rendered
    expect(screen.queryByText('Candidate Experience')).toBeNull()
  })

  it('renders compact candidate header badge with verified email status and no inline experience form when profile exists (covers: AC-3)', () => {
    render(
      <StudioContainer
        initialProfile={validProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict}
      />,
    )

    // Verify candidate badge rendered
    expect(screen.getByTestId('candidate-badge')).toBeDefined()
    expect(screen.getByText('Senior Full Stack Engineer & Cloud Architect')).toBeDefined()
    expect(screen.getByText('Alex Morgan')).toBeDefined()
    expect(screen.getByTestId('email-verified-badge')).toBeDefined()

    // Verify missing profile banner is NOT rendered
    expect(screen.queryByTestId('missing-profile-banner')).toBeNull()

    // Verify inline experience form is NOT rendered
    expect(screen.queryByText('Candidate Experience')).toBeNull()
    expect(screen.queryByLabelText(/Achievements & Responsibilities/i)).toBeNull()
  })

  it('handles live streaming lifecycle smoothly and isolates preview island (covers: AC-4)', async () => {
    const chunks = [
      new TextEncoder().encode('### SUMMARY\nTailored summary here.\n'),
      new TextEncoder().encode('### BULLETS\n- Streamed bullet point one.\n'),
    ]

    let chunkIndex = 0
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIndex < chunks.length) {
          const value = chunks[chunkIndex++]
          return Promise.resolve({ done: false, value })
        }
        return Promise.resolve({ done: true, value: undefined })
      }),
    }

    const mockResponse = {
      ok: true,
      headers: {
        get: (h: string) => (h === 'x-tailored-resume-id' ? 'res_streamed_123' : null),
      },
      body: {
        getReader: () => mockReader,
      },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    render(
      <StudioContainer
        initialProfile={validProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict}
      />,
    )

    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText('Tailored summary here.')).toBeDefined()
    })

    await waitFor(() => {
      expect(screen.getByText('Streamed bullet point one.')).toBeDefined()
      expect(screen.getByText('Completed & Saved')).toBeDefined()
    })

    vi.unstubAllGlobals()
  })

  it('handles user abort with Stop Generation button (covers: AC-4)', async () => {
    const mockReader = {
      read: vi.fn().mockImplementation(() => new Promise(() => {})),
    }

    const mockResponse = {
      ok: true,
      body: { getReader: () => mockReader },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    render(
      <StudioContainer
        initialProfile={validProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict}
      />,
    )

    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    fireEvent.click(generateBtn)

    const stopBtn = await screen.findByRole('button', { name: /Stop Generation/i })
    fireEvent.click(stopBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeDefined()
      expect(screen.getByText('Generation stopped by user.')).toBeDefined()
    })

    vi.unstubAllGlobals()
  })

  it('renders AtsWorkbench with PdfExportButton docked at top of results upon completion (covers: AC-5, AC-6)', () => {
    const mockInitialResume = {
      id: 'res_completed_123',
      atsScore: 91,
      atsBreakdown: {
        overallScore: 91,
        keywordMatchScore: 90,
        experienceRelevanceScore: 92,
        formattingScore: 90,
        matchedSkills: ['Next.js', 'PostgreSQL'],
        missingSkills: [],
        dismissedSkills: [],
        feedback: [],
      },
      hasOutreach: true,
      hasApplication: false,
      tailoredSummary: 'Proven full-stack engineer.',
      jobPosting: {
        title: 'Lead Architect',
        companyName: 'OpenAI Partner',
        rawDescription: 'Building high throughput AI systems with TypeScript and Next.js.',
      },
    }

    render(
      <StudioContainer
        initialProfile={validProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        initialLatestTailoredResume={mockInitialResume}
        lang="en"
        dict={dummyDict}
      />,
    )

    // Results container visible
    expect(screen.getByTestId('studio-workbenches')).toBeDefined()

    // ATS Workbench and PDF Export button rendered
    expect(screen.getByTestId('ats-workbench')).toBeDefined()
    expect(screen.getByTestId('pdf-export-btn')).toBeDefined()
  })

  it('renders collapsible OutreachAccordion beneath ATS workbench and unified action bar (covers: AC-7, AC-8, AC-9)', () => {
    const mockInitialResume = {
      id: 'res_completed_123',
      atsScore: 91,
      atsBreakdown: null,
      hasOutreach: true,
      hasApplication: true,
      tailoredSummary: 'Proven full-stack engineer.',
      jobPosting: {
        title: 'Lead Architect',
        companyName: 'OpenAI Partner',
        rawDescription: 'Building high throughput AI systems.',
      },
    }

    render(
      <StudioContainer
        initialProfile={validProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        initialLatestTailoredResume={mockInitialResume}
        lang="en"
        dict={dummyDict}
      />,
    )

    // Outreach accordion rendered and collapsed by default
    expect(screen.getByTestId('outreach-accordion')).toBeDefined()
    expect(screen.getByTestId('outreach-status-badge')).toBeDefined()
    expect(screen.queryByTestId('outreach-accordion-content')).toBeNull()

    // Unified bottom action bar rendered with tracker and STAR questions handoff
    expect(screen.getByTestId('tailor-action-bar')).toBeDefined()
    expect(screen.getByTestId('view-in-tracker-btn')).toBeDefined()
    expect(screen.getByTestId('practice-star-btn')).toBeDefined()
  })
})
