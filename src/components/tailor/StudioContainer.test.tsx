// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudioContainer } from './StudioContainer'
import { saveCandidateProfile } from '@/app/actions/tailor'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/tailor', () => ({
  saveCandidateProfile: vi.fn(),
  loadSampleCandidateProfile: vi.fn(),
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

describe('StudioContainer (covers: AC-2, AC-5, AC-8, AC-9, AC-10)', () => {
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
      experiencePanelTitle: 'Candidate Experience',
      jobPostingPanelTitle: 'Target Job Posting',
    },
  }

  const initialProfile = {
    id: 'prof_test_1',
    headline: 'Senior Full Stack Engineer',
    summary: 'Full stack engineer with 6+ years experience architecting cloud applications.',
    workExperiences: [
      {
        companyName: 'TechVanguard Systems',
        jobTitle: 'Senior Full Stack Engineer',
        bullets: ['Architected bilingual career agent.'],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders studio workbench with experience, job posting, and live preview panels (covers: AC-2)', () => {
    render(
      <StudioContainer
        initialProfile={initialProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByRole('heading', { name: /Resume Tailoring Studio/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Candidate Experience/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Target Job Posting/i })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Live Tailoring Output/i })).toBeDefined()
    expect(screen.queryByText(/No active AI provider configured/i)).toBeNull()
  })

  it('displays warning banner and disables generation when no active provider exists (covers: AC-9)', () => {
    render(
      <StudioContainer
        initialProfile={initialProfile}
        initialActiveProvider={null}
        configuredProviders={[]}
        lang="en"
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByText(/No active AI provider configured/)).toBeDefined()

    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    expect(generateBtn.getAttribute('disabled')).not.toBeNull()
  })

  it('handles full streaming lifecycle from click to completion (covers: AC-5, AC-7)', async () => {
    const chunks = [
      new TextEncoder().encode('### SUMMARY\nTailored summary here.\n'),
      new TextEncoder().encode('### BULLETS\n- Tailored bullet point one.\n'),
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
      body: {
        getReader: () => mockReader,
      },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    render(
      <StudioContainer
        initialProfile={initialProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText('Tailored summary here.')).toBeDefined()
    })

    await waitFor(() => {
      expect(screen.getByText('Tailored bullet point one.')).toBeDefined()
      expect(screen.getByText('Completed & Saved')).toBeDefined()
    })

    vi.unstubAllGlobals()
  })

  it('handles user abort with Stop Generation button (covers: AC-8)', async () => {
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        return new Promise(() => {
          // Never resolves to simulate ongoing stream
        })
      }),
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    render(
      <StudioContainer
        initialProfile={initialProfile}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict as unknown as Partial<Dictionary>}
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

  it('saves unsaved profile before initiating stream if profileId is missing (covers: AC-3)', async () => {
    vi.mocked(saveCandidateProfile).mockResolvedValueOnce({
      success: true,
      profileId: 'new_persisted_profile_id',
    })

    const mockReader = {
      read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    })

    vi.stubGlobal('fetch', mockFetch)

    render(
      <StudioContainer
        initialProfile={null}
        initialActiveProvider="OPENAI"
        configuredProviders={['OPENAI']}
        lang="en"
        dict={dummyDict as unknown as Partial<Dictionary>}
      />,
    )

    const generateBtn = screen.getByRole('button', { name: /Generate Tailored Resume/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(saveCandidateProfile).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tailor',
        expect.objectContaining({
          body: expect.stringContaining('"profileId":"new_persisted_profile_id"'),
        }),
      )
    })

    vi.unstubAllGlobals()
  })
})
