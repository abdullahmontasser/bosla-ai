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

  it('renders "Load sample brief" button when description is empty and loads preset on click', () => {
    const onChange = vi.fn()
    render(
      <JobPostingForm
        jobTitle=""
        companyName=""
        rawJobDescription=""
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={onChange}
      />,
    )

    const loadSampleBtn = screen.getByRole('button', { name: /Load sample brief/i })
    expect(loadSampleBtn).toBeDefined()

    fireEvent.click(loadSampleBtn)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Senior Full Stack Engineer (AI Integration)',
        companyName: 'Anthropic Labs Partner',
      }),
    )
  })

  it('triggers onSubmit on Cmd+Enter shortcut when description is valid', () => {
    const onSubmit = vi.fn()
    render(
      <JobPostingForm
        jobTitle="Staff Engineer"
        companyName="Tech Corp"
        rawJobDescription="A description that is comfortably longer than 50 characters to satisfy the minimum length requirement."
        dict={dummyDict as unknown as Partial<Dictionary>}
        onChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const textarea = screen.getByDisplayValue(/longer than 50 characters/)
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
