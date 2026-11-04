/**
 * @vitest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportResumeModal } from './ImportResumeModal'
import * as resumeActions from '@/app/actions/resume-actions'

vi.mock('@/app/actions/resume-actions', () => ({
  parseResumeAction: vi.fn(),
  commitParsedResumeAction: vi.fn(),
}))

const mockParsedData = {
  language: 'EN' as const,
  fullName: 'Ada Lovelace',
  headline: 'First Computer Programmer',
  summary: 'Pioneered computational algorithms and analytical engine designs.',
  email: 'ada@computing.org',
  phone: '+44 20 7946 0919',
  location: 'London, UK',
  websiteUrl: 'https://ada.org',
  linkedinUrl: 'https://linkedin.com/in/ada',
  githubUrl: 'https://github.com/ada',
  experiences: [
    {
      jobTitle: 'Chief Mathematician',
      companyName: 'Analytical Engine Lab',
      location: 'London, UK',
      startDate: '1842-01',
      endDate: '1852-11',
      isCurrent: false,
      bullets: [
        'Authored the first algorithm intended to be executed by a machine.',
        'Anticipated general-purpose computer software 100 years ahead of time.',
      ],
    },
  ],
  educations: [
    {
      institution: 'University of London',
      degree: 'Honorary Fellowship in Mathematics',
      fieldOfStudy: 'Mathematical Sciences',
      startDate: '1832-01',
      endDate: '1836-06',
      grade: 'First Class Honours',
    },
  ],
  skills: ['Algorithm Design', 'Analytical Engines', 'Mathematical Logic'],
  projects: [
    {
      name: 'Bernoulli Numbers Algorithm',
      description: 'First algorithm formulated for an automated calculating machine.',
      role: 'Lead Theorist',
      technologies: ['Mathematics', 'Punchcards'],
      url: 'https://github.com/ada/bernoulli',
    },
  ],
  languages: ['English', 'French'],
}

describe('ImportResumeModal - Interactive Guided Stepper Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload dropzone initially when open', () => {
    render(
      <ImportResumeModal
        isOpen={true}
        onClose={vi.fn()}
        profileId="prof_123"
        lang="en"
        onImportSuccess={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText(/Import & Review Resume with AI/i)).toBeDefined()
    expect(screen.getByText(/Drop your resume here, or browse files/i)).toBeDefined()
  })

  it('transitions to guided section-by-section review upon successful parse', async () => {
    vi.mocked(resumeActions.parseResumeAction).mockResolvedValueOnce({
      success: true,
      parsedResumeId: 'parsed_rec_1',
      data: mockParsedData,
    })

    render(
      <ImportResumeModal
        isOpen={true}
        onClose={vi.fn()}
        profileId="prof_123"
        lang="en"
        onImportSuccess={vi.fn()}
      />,
    )

    // Simulate file drop
    const file = new File(['%PDF-1.4 dummy content'], 'resume.pdf', {
      type: 'application/pdf',
    })
    const dropzone = screen.getByText(/Drop your resume here, or browse files/i)
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })

    // Wait for parse action to complete and review stage to mount
    await waitFor(() => {
      expect(screen.getByText(/STEP 01 \/ 05 — PERSONAL IDENTITY/i)).toBeDefined()
    })

    // Section 1 (Identity) inputs should be visible with extracted data
    expect(screen.getByDisplayValue('Ada Lovelace')).toBeDefined()
    expect(screen.getByDisplayValue('First Computer Programmer')).toBeDefined()
    expect(screen.getByDisplayValue('ada@computing.org')).toBeDefined()

    // Step navigation buttons should be present
    const nextBtn = screen.getByRole('button', { name: /next: experience/i })
    expect(nextBtn).toBeDefined()

    // Step 2: Navigate to Experience
    fireEvent.click(nextBtn)
    expect(screen.getByText(/STEP 02 \/ 05 — WORK EXPERIENCE/i)).toBeDefined()
    expect(screen.getByDisplayValue('Chief Mathematician')).toBeDefined()
    expect(screen.getByDisplayValue('Analytical Engine Lab')).toBeDefined()

    // Step 3: Navigate to Education
    const nextEduBtn = screen.getByRole('button', { name: /next: education/i })
    fireEvent.click(nextEduBtn)
    expect(screen.getByText(/STEP 03 \/ 05 — EDUCATION & DEGREES/i)).toBeDefined()
    expect(screen.getByDisplayValue('Honorary Fellowship in Mathematics')).toBeDefined()

    // Step 4: Navigate to Skills
    const nextSkillsBtn = screen.getByRole('button', { name: /next: skills/i })
    fireEvent.click(nextSkillsBtn)
    expect(screen.getByText(/STEP 04 \/ 05 — SKILLS & COMPETENCIES/i)).toBeDefined()
    expect(screen.getByText('Algorithm Design')).toBeDefined()
    expect(screen.getByRole('button', { name: /categorize with ai/i })).toBeDefined()

    // Step 5: Navigate to Projects
    const nextProjBtn = screen.getByRole('button', { name: /next: projects/i })
    fireEvent.click(nextProjBtn)
    expect(screen.getByText(/STEP 05 \/ 05 — FEATURED PROJECTS/i)).toBeDefined()
    expect(screen.getByDisplayValue('Bernoulli Numbers Algorithm')).toBeDefined()

    // Final finish button should be visible
    expect(screen.getByRole('button', { name: /finish & sync to profile/i })).toBeDefined()
  })

  it('allows changing merge strategy and committing updates to profile', async () => {
    vi.mocked(resumeActions.parseResumeAction).mockResolvedValueOnce({
      success: true,
      parsedResumeId: 'parsed_rec_1',
      data: mockParsedData,
    })

    vi.mocked(resumeActions.commitParsedResumeAction).mockResolvedValueOnce({
      success: true,
      profileId: 'prof_123',
    })

    const onImportSuccess = vi.fn()

    render(
      <ImportResumeModal
        isOpen={true}
        onClose={vi.fn()}
        profileId="prof_123"
        lang="en"
        onImportSuccess={onImportSuccess}
      />,
    )

    // Drop file
    const file = new File(['%PDF-1.4 dummy'], 'cv.pdf', { type: 'application/pdf' })
    fireEvent.drop(screen.getByText(/Drop your resume here/i), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(screen.getByText(/STEP 01 \/ 05 — PERSONAL IDENTITY/i)).toBeDefined()
    })

    // Click "Apply All Now" to commit directly
    const applyAllBtn = screen.getByRole('button', { name: /apply all now/i })
    fireEvent.click(applyAllBtn)

    await waitFor(() => {
      expect(resumeActions.commitParsedResumeAction).toHaveBeenCalledWith({
        parsedResumeId: 'parsed_rec_1',
        targetProfileId: 'prof_123',
        mergeConfig: expect.any(Object),
        editedData: expect.objectContaining({
          fullName: 'Ada Lovelace',
        }),
      })
    })
  })

  it('provides explicit Arabic resume context when profileLanguage is AR', () => {
    render(
      <ImportResumeModal
        isOpen={true}
        onClose={vi.fn()}
        profileId="prof_ar_1"
        profileLanguage="AR"
        lang="ar"
        onImportSuccess={vi.fn()}
      />,
    )

    expect(screen.getByText(/السيرة المستهدفة: العربية/i)).toBeDefined()
    expect(screen.getByText(/الاستيراد مخصص للسيرة الذاتية العربية/i)).toBeDefined()
    expect(screen.getByText(/النسخة العربية \(AR\)/i)).toBeDefined()
  })
})
