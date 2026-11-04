// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExperienceCard, hasQuantifiedMetric } from './ExperienceCard'

describe('ExperienceCard - Google XYZ Scaffolding & Bullets', () => {
  const experiences = [
    {
      id: 'exp_1',
      companyName: 'Stripe',
      jobTitle: 'Senior Infrastructure Engineer',
      location: 'Remote',
      startDate: '2022-01-01',
      endDate: null,
      isCurrent: true,
      bullets: [
        'Architected distributed caching layer, reducing p99 latency by 45%, by implementing Redis clusters',
      ],
      sortOrder: 0,
    },
  ]

  it('detects quantified metrics correctly', () => {
    expect(hasQuantifiedMetric('Reduced latency by 40%')).toBe(true)
    expect(hasQuantifiedMetric('Saved $50k annually')).toBe(true)
    expect(hasQuantifiedMetric('Scaled system to 2 million requests')).toBe(true)
    expect(hasQuantifiedMetric('حقق وفراً قدره 30 ألف ريال')).toBe(true)
    expect(hasQuantifiedMetric('Managed daily standup meetings')).toBe(false)
  })

  it('renders clean typographic bullets on the card view without side-tab slop', () => {
    const { container } = render(
      <ExperienceCard
        profileId="prof_1"
        experiences={experiences}
        lang="en"
        onExperiencesChange={vi.fn()}
      />,
    )

    // Should not contain the AI slop side-tab class border-s-2
    expect(container.querySelector('.border-s-2')).toBeNull()

    // Bullet text is rendered with typographic disc
    expect(
      screen.getByText(/Architected distributed caching layer, reducing p99 latency by 45%/i),
    ).toBeDefined()
  })

  it('opens Google XYZ assistant drawer and applies assembled formula to bullet', () => {
    render(
      <ExperienceCard
        profileId="prof_1"
        experiences={experiences}
        lang="en"
        onExperiencesChange={vi.fn()}
      />,
    )

    // Open Edit modal
    const editBtn = screen.getByRole('button', { name: 'Edit experience' })
    fireEvent.click(editBtn)

    // Verify Google XYZ Assistant toggle exists
    const assistantToggle = screen.getByRole('button', { name: /Google XYZ Assistant/i })
    expect(assistantToggle).toBeDefined()

    // Open XYZ Assistant drawer
    fireEvent.click(assistantToggle)

    // Inputs for X, Y, Z are present
    const xInput = screen.getByPlaceholderText(/Accelerated API query response time/i)
    const yInput = screen.getByPlaceholderText(/by 45% and reduced cloud costs/i)
    const zInput = screen.getByPlaceholderText(/by refactoring database indexes/i)

    fireEvent.change(xInput, { target: { value: 'Optimized build pipeline' } })
    fireEvent.change(yInput, { target: { value: 'by 60%' } })
    fireEvent.change(zInput, { target: { value: 'by configuring Turbopack remote cache' } })

    // Click Apply
    const applyBtn = screen.getByRole('button', { name: 'Apply to Bullet' })
    fireEvent.click(applyBtn)

    // The main bullet input should now reflect the assembled formula
    const mainInput = screen.getByDisplayValue(
      'Optimized build pipeline, as measured by by 60%, by by configuring Turbopack remote cache',
    )
    expect(mainInput).toBeDefined()
  })
})
