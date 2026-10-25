// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { XyzBulletList, type ExperienceItem } from './XyzBulletList'
import type { Dictionary } from '@/lib/i18n/types'

describe('XyzBulletList Component (covers: AC-2, AC-3)', () => {
  const sampleExperiences: ExperienceItem[] = [
    {
      companyName: 'CloudScale Inc',
      jobTitle: 'Principal Engineer',
      bullets: [
        {
          original: 'Built microservices.',
          rewritten:
            'Accomplished 35% throughput increase by architecting event-driven microservices.',
          matchedKeywords: ['microservices'],
        },
        {
          original: 'Worked on database queries.',
        },
      ],
    },
  ]

  const sampleDict = {
    ats: {
      optimizeBulletXyz: 'Google XYZ',
      optimizingBullet: 'Rewriting...',
      optimizedBadge: 'Google XYZ',
    },
  } as unknown as Dictionary

  it('returns null when experiences is empty', () => {
    const { container } = render(
      <XyzBulletList experiences={[]} dict={sampleDict} lang="en" onRewriteBullet={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders company, job title, and bullets', () => {
    render(
      <XyzBulletList
        experiences={sampleExperiences}
        dict={sampleDict}
        lang="en"
        onRewriteBullet={vi.fn()}
      />,
    )

    expect(screen.getByText('Principal Engineer')).toBeDefined()
    expect(screen.getByText('CloudScale Inc')).toBeDefined()
    expect(screen.getByText(/Accomplished 35% throughput increase/i)).toBeDefined()
    expect(screen.getByText('Worked on database queries.')).toBeDefined()
  })

  it('triggers onRewriteBullet with correct experience and bullet indices', () => {
    const handleRewrite = vi.fn()

    render(
      <XyzBulletList
        experiences={sampleExperiences}
        dict={sampleDict}
        lang="en"
        onRewriteBullet={handleRewrite}
      />,
    )

    const buttons = screen.getAllByRole('button', { name: /Google XYZ/i })
    fireEvent.click(buttons[1])

    expect(handleRewrite).toHaveBeenCalledWith(0, 1)
  })

  it('reflects optimizing state when key matches', () => {
    render(
      <XyzBulletList
        experiences={sampleExperiences}
        dict={sampleDict}
        lang="en"
        optimizingKey="0-1"
        onRewriteBullet={vi.fn()}
      />,
    )

    expect(screen.getByText(/Rewriting.../i)).toBeDefined()
  })

  it('displays original text snippet and badge when bullet is rewritten', () => {
    render(
      <XyzBulletList
        experiences={sampleExperiences}
        dict={sampleDict}
        lang="en"
        onRewriteBullet={vi.fn()}
      />,
    )

    expect(screen.getByText(/Original:/i)).toBeDefined()
    expect(screen.getByText(/Built microservices\./i)).toBeDefined()
  })
})
