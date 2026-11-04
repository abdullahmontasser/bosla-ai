/**
 * @vitest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileHub, type ProfileData } from './ProfileHub'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock resume health server actions
vi.mock('@/app/actions/resume-health', () => ({
  getProfileHealthAction: vi.fn().mockResolvedValue(null),
  acceptHealthSuggestionAction: vi.fn().mockResolvedValue({ ok: true }),
  dismissHealthSuggestionAction: vi.fn().mockResolvedValue({ ok: true }),
  generateHealthRewriteAction: vi.fn().mockResolvedValue({ ok: true }),
}))

const mockInitialData: ProfileData = {
  user: {
    id: 'user_1',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    image: null,
  },
  profile: {
    id: 'prof_1',
    language: 'EN',
    fullName: 'Sarah Connor',
    headline: 'Defense Systems Architect',
    summary: 'Building secure and resilient architectures.',
    email: 'sarah@example.com',
    phone: '+1 555-0199',
    location: 'Los Angeles, CA',
    websiteUrl: 'https://sarah.io',
    linkedinUrl: null,
    githubUrl: null,
    isDefault: true,
  },
  experiences: [],
  educations: [],
  skills: [],
  projects: [],
}

describe('ProfileHub - AI Import and Global Language Switching Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Import with AI" action button and opens popup modal on click', () => {
    const mockDict = {
      resume: {
        dropzoneTitle: 'Drop your resume file here',
        title: 'Resume Ingestion',
      },
    }

    render(<ProfileHub initialData={mockInitialData} lang="en" dict={mockDict} />)

    const importBtn = screen.getByRole('button', { name: /import resume with ai/i })
    expect(importBtn).toBeDefined()

    // Modal popup should initially not be open
    expect(screen.queryByTestId('import-resume-modal-content')).toBeNull()

    // Click import button to open popup modal
    fireEvent.click(importBtn)

    // Popup modal should open with full ingestion workbench & dropzone
    expect(screen.getByTestId('import-resume-modal-content')).toBeDefined()
    expect(screen.getByText(/Import & Review Resume with AI/i)).toBeDefined()
    expect(screen.getByText(/Drop your resume here, or browse files/i)).toBeDefined()

    // Click close on modal
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)

    // Modal should close without affecting profile UI
    expect(screen.queryByTestId('import-resume-modal-content')).toBeNull()
  })

  it('switches language directly on global event when no changes are unsaved', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockInitialData,
        profile: { ...mockInitialData.profile, id: 'prof_ar_1', language: 'AR' },
      }),
    })

    render(<ProfileHub initialData={mockInitialData} lang="en" />)

    // Dispatch global resume-language-changed event
    act(() => {
      window.dispatchEvent(
        new CustomEvent('resume-language-changed', {
          detail: { language: 'AR' },
        }),
      )
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile?language=AR')
    })

    global.fetch = originalFetch
  })

  it('prompts confirmation dialog when switching language via event with dirty state', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockInitialData,
        profile: { ...mockInitialData.profile, id: 'prof_ar_1', language: 'AR' },
      }),
    })

    render(<ProfileHub initialData={mockInitialData} lang="en" />)

    // Make an edit to IdentityCard
    const nameInput = screen.getByDisplayValue('Sarah Connor')
    fireEvent.change(nameInput, { target: { value: 'Sarah P. Connor' } })

    // Dispatch global resume-language-changed event
    act(() => {
      window.dispatchEvent(
        new CustomEvent('resume-language-changed', {
          detail: { language: 'AR' },
        }),
      )
    })

    // Dialog should appear
    expect(screen.getByText('Unsaved Changes')).toBeDefined()
    expect(
      screen.getByText(
        /You have unsaved changes in your profile. Switching language will discard/i,
      ),
    ).toBeDefined()
    expect(global.fetch).not.toHaveBeenCalled()

    // Click "Keep Editing"
    const keepEditingBtn = screen.getByRole('button', { name: 'Keep Editing' })
    fireEvent.click(keepEditingBtn)

    await waitFor(() => {
      expect(screen.queryByText('Unsaved Changes')).toBeNull()
    })
    expect(global.fetch).not.toHaveBeenCalled()

    global.fetch = originalFetch
  })

  it('discards changes and switches language when Discard & Switch is clicked', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockInitialData,
        profile: { ...mockInitialData.profile, id: 'prof_ar_1', language: 'AR' },
      }),
    })

    render(<ProfileHub initialData={mockInitialData} lang="en" />)

    // Make an edit
    const nameInput = screen.getByDisplayValue('Sarah Connor')
    fireEvent.change(nameInput, { target: { value: 'Sarah P. Connor' } })

    // Dispatch global resume-language-changed event
    act(() => {
      window.dispatchEvent(
        new CustomEvent('resume-language-changed', {
          detail: { language: 'AR' },
        }),
      )
    })

    // Confirm discard
    const discardBtn = screen.getByRole('button', { name: 'Discard & Switch' })
    fireEvent.click(discardBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile?language=AR')
    })

    global.fetch = originalFetch
  })

  it('renders section recommendations when pending suggestions are passed', () => {
    const mockHealthView = {
      profileId: 'prof_1',
      language: 'EN' as const,
      overallScore: 65,
      breakdown: {} as unknown as import('@/lib/health/queries').HealthAuditView['breakdown'],
      suggestions: [
        {
          id: 'sug_identity_1',
          category: 'ATS_COMPLETENESS' as const,
          title: 'Add a professional headline',
          rationale: 'A punchy headline increases recruiter interest.',
          targetKind: 'PROFILE_SUMMARY' as const,
          targetId: null,
          targetIndex: null,
          targetField: 'headline',
          originalText: '',
          proposedText: 'Senior Full Stack Engineer | React & Node.js',
          status: 'PENDING' as const,
          isAiGenerated: true,
          isAiStale: false,
          fingerprint: 'fp_id_1',
          decidedAt: null,
        },
      ],
      excludedCount: 0,
      openCount: 1,
      recalculated: false,
    }

    render(
      <ProfileHub initialData={mockInitialData} initialHealthView={mockHealthView} lang="en" />,
    )

    // Initially shows the minimal indicator pill
    const indicatorBtn = screen.getByRole('button', { name: /View AI suggestions/i })
    expect(indicatorBtn).toBeDefined()
    expect(screen.getByText(/1 AI Suggestion/i)).toBeDefined()

    // Clicking indicator expands recommendations drawer
    fireEvent.click(indicatorBtn)

    expect(screen.getByText('Add a professional headline')).toBeDefined()
    expect(screen.getByText('A punchy headline increases recruiter interest.')).toBeDefined()
  })
})
