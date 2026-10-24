// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JobPostingForm } from './JobPostingForm'
import type { Dictionary } from '@/lib/i18n/types'

describe('JobPostingForm (covers: AC-2, AC-4)', () => {
  const dummyDict = {
    tailor: {
      jobPostingPanelTitle: 'Target Job Posting',
      jobPostingPanelDesc: 'Role requirements you want the AI to tailor against.',
      jobTitleLabel: 'Target Role Title',
      companyNameLabel: 'Company Name',
      jobDescriptionLabel: 'Target Job Description',
      jobDescriptionPlaceholder: 'Paste job requirements...',
    },
  }

  it('renders inputs with initial values and shows character counter', () => {
    const onChange = vi.fn()
    render(
      <JobPostingForm
        jobTitle="Staff Engineer"
        companyName="Tech Corp"
        rawJobDescription="Short description"
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('heading', { name: /Target Job Posting/i })).toBeDefined()
    expect(screen.getByDisplayValue('Staff Engineer')).toBeDefined()
    expect(screen.getByDisplayValue('Tech Corp')).toBeDefined()
    expect(screen.getByDisplayValue('Short description')).toBeDefined()
    expect(screen.getByText(/17 \/ 50 min chars/)).toBeDefined()
  })

  it('displays warning when job description is non-empty and under 50 characters (covers: AC-4)', () => {
    render(
      <JobPostingForm
        jobTitle="Engineer"
        companyName="Tech Corp"
        rawJobDescription="Too short."
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/Job description must have at least 50 characters/)).toBeDefined()
  })

  it('calls onChange with updated values when user types in fields', () => {
    const onChange = vi.fn()
    render(
      <JobPostingForm
        jobTitle="Engineer"
        companyName="Tech Corp"
        rawJobDescription="A long enough description that exceeds 50 characters to test typing."
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={onChange}
      />,
    )

    const titleInput = screen.getByDisplayValue('Engineer')
    fireEvent.change(titleInput, { target: { value: 'Staff Engineer' } })

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Staff Engineer',
        companyName: 'Tech Corp',
      }),
    )
  })

  it('provides accessible labels for all inputs (a11y)', () => {
    render(
      <JobPostingForm
        jobTitle=""
        companyName=""
        rawJobDescription=""
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Target Role Title')).toBeDefined()
    expect(screen.getByText('Company Name')).toBeDefined()
    expect(screen.getByText('Target Job Description')).toBeDefined()
  })
})
