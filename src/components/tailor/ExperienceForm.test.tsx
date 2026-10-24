// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExperienceForm } from './ExperienceForm'
import { saveCandidateProfile, loadSampleCandidateProfile } from '@/app/actions/tailor'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/tailor', () => ({
  saveCandidateProfile: vi.fn(),
  loadSampleCandidateProfile: vi.fn(),
}))

describe('ExperienceForm (covers: AC-2, AC-3, AC-10)', () => {
  const dummyDict = {
    tailor: {
      experiencePanelTitle: 'Candidate Experience',
      experiencePanelDesc: 'Baseline qualifications used for grounded AI tailoring.',
      loadSampleData: 'Load Sample Candidate',
      saveProfile: 'Save',
      headline: 'Professional Headline',
      summary: 'Professional Summary',
      experiences: 'Work Experience',
      addExperience: 'Add Role',
      companyName: 'Company Name',
      jobTitle: 'Job Title',
      bullets: 'Bullets',
      addBullet: 'Add Bullet',
      profileSaved: 'Profile saved successfully.',
    },
  }

  const initialExperiences = [
    {
      companyName: 'TechVanguard',
      jobTitle: 'Lead Engineer',
      bullets: ['Built streaming pipelines.', 'Scaled PostgreSQL database.'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders headline, summary, and experience fields with initial values', () => {
    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Senior Full Stack Engineer"
        summary="Experienced software engineer with 6+ years in cloud and AI systems."
        experiences={initialExperiences}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: /Candidate Experience/i })).toBeDefined()
    expect(screen.getByDisplayValue('Senior Full Stack Engineer')).toBeDefined()
    expect(
      screen.getByDisplayValue(
        'Experienced software engineer with 6+ years in cloud and AI systems.',
      ),
    ).toBeDefined()
    expect(screen.getByDisplayValue('TechVanguard')).toBeDefined()
    expect(screen.getByDisplayValue('Lead Engineer')).toBeDefined()
    expect(screen.getByDisplayValue('Built streaming pipelines.')).toBeDefined()
    expect(screen.getByDisplayValue('Scaled PostgreSQL database.')).toBeDefined()
  })

  it('calls onProfileChange when user edits headline', () => {
    const onProfileChange = vi.fn()

    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Engineer"
        summary="Summary"
        experiences={initialExperiences}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={onProfileChange}
      />,
    )

    const input = screen.getByDisplayValue('Engineer')
    fireEvent.change(input, { target: { value: 'Staff Engineer' } })

    expect(onProfileChange).toHaveBeenCalledWith(
      expect.objectContaining({
        headline: 'Staff Engineer',
      }),
    )
  })

  it('adds a new experience role on Add Role button click', () => {
    const onProfileChange = vi.fn()

    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Engineer"
        summary="Summary"
        experiences={initialExperiences}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={onProfileChange}
      />,
    )

    const addRoleBtn = screen.getByRole('button', { name: /Add Role/i })
    fireEvent.click(addRoleBtn)

    expect(onProfileChange).toHaveBeenCalledWith(
      expect.objectContaining({
        experiences: [...initialExperiences, { companyName: '', jobTitle: '', bullets: [''] }],
      }),
    )
  })

  it('loads sample candidate profile and updates state (covers: AC-3)', async () => {
    const onProfileChange = vi.fn()

    vi.mocked(loadSampleCandidateProfile).mockResolvedValueOnce({
      success: true,
      profile: {
        fullName: 'Sample Candidate',
        email: 'sample@careercraft.ai',
        phone: '+1 555-0100',
        location: 'San Francisco, CA',
        headline: 'Sample Senior Full Stack Engineer',
        summary: 'Expert in Next.js App Router and PostgreSQL.',
        workExperiences: [
          {
            companyName: 'CloudScale Inc',
            jobTitle: 'Principal Engineer',
            bullets: ['Led AI streaming integration.'],
            isCurrent: true,
            sortOrder: 0,
          },
        ],
      },
    })

    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Engineer"
        summary="Summary"
        experiences={[]}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={onProfileChange}
      />,
    )

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample/i })
    fireEvent.click(loadSampleBtn)

    await waitFor(() => {
      expect(loadSampleCandidateProfile).toHaveBeenCalledWith('EN')
      expect(onProfileChange).toHaveBeenCalledWith(
        expect.objectContaining({
          headline: 'Sample Senior Full Stack Engineer',
          summary: 'Expert in Next.js App Router and PostgreSQL.',
          experiences: [
            {
              companyName: 'CloudScale Inc',
              jobTitle: 'Principal Engineer',
              bullets: ['Led AI streaming integration.'],
            },
          ],
        }),
      )
      expect(screen.getAllByText('Load Sample Candidate').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('saves candidate profile to database and displays success notification (covers: AC-3)', async () => {
    const onProfileChange = vi.fn()

    vi.mocked(saveCandidateProfile).mockResolvedValueOnce({
      success: true,
      profileId: 'persisted_prof_123',
    })

    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Architect"
        summary="A solid summary with sufficient length."
        experiences={initialExperiences}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={onProfileChange}
      />,
    )

    const saveBtn = screen.getByRole('button', { name: /^Save/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveCandidateProfile).toHaveBeenCalledWith({
        profileId: 'prof_1',
        language: 'EN',
        headline: 'Architect',
        summary: 'A solid summary with sufficient length.',
        experiences: initialExperiences,
      })
      expect(onProfileChange).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: 'persisted_prof_123',
        }),
      )
      expect(screen.getByText('Profile saved successfully.')).toBeDefined()
    })
  })

  it('displays error notification when saveCandidateProfile fails', async () => {
    vi.mocked(saveCandidateProfile).mockResolvedValueOnce({
      success: false,
      error: 'Database transaction failed',
    })

    render(
      <ExperienceForm
        profileId="prof_1"
        headline="Architect"
        summary="A solid summary with sufficient length."
        experiences={initialExperiences}
        language="EN"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onProfileChange={vi.fn()}
      />,
    )

    const saveBtn = screen.getByRole('button', { name: /^Save/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Database transaction failed')).toBeDefined()
    })
  })
})
