// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AtsScoreCard } from './AtsScoreCard'
import type { AtsBreakdown } from '@/lib/validations/tailored-resume'
import type { Dictionary } from '@/lib/i18n/types'

describe('AtsScoreCard Component (covers: AC-1, AC-3, AC-4)', () => {
  const sampleBreakdown: AtsBreakdown = {
    overallScore: 85,
    categorySubscores: {
      keywordMatch: 80,
      experienceRelevance: 90,
      formattingCompliance: 85,
    },
    matchedSkills: ['React', 'TypeScript'],
    missingSkills: ['AWS'],
    dismissedSkills: [],
    actionableFeedback: ['Incorporate quantified cloud scaling metrics into your latest role.'],
    isStale: false,
    evaluatedAt: '2026-10-25T14:00:00.000Z',
  }

  const sampleDict = {
    ats: {
      overallMatch: 'ATS Match Score',
      keywordMatch: 'Keyword Match (50%)',
      experienceRelevance: 'Experience Relevance (30%)',
      formattingCompliance: 'Formatting Compliance (20%)',
      deepScanWithAi: 'AI Deep Scan',
      recalculate: 'Recalculate',
      highMatch: 'Strong Match',
      mediumMatch: 'Moderate Match',
      lowMatch: 'Needs Optimization',
    },
  } as unknown as Dictionary

  it('renders overall score, category subscores, and high match badge', () => {
    render(<AtsScoreCard score={85} breakdown={sampleBreakdown} dict={sampleDict} lang="en" />)

    expect(screen.getByText('85')).toBeDefined()
    expect(screen.getByText(/Strong Match/i)).toBeDefined()
    expect(screen.getByText(/Keyword Match \(50%\)/i)).toBeDefined()
    expect(screen.getByText('80%')).toBeDefined()
    expect(screen.getByText(/Experience Relevance \(30%\)/i)).toBeDefined()
    expect(screen.getByText('90%')).toBeDefined()
  })

  it('renders moderate and low match labels for respective score tiers', () => {
    const { rerender } = render(
      <AtsScoreCard
        score={68}
        breakdown={{ ...sampleBreakdown, overallScore: 68 }}
        dict={sampleDict}
        lang="en"
      />,
    )
    expect(screen.getByText(/Moderate Match/i)).toBeDefined()

    rerender(
      <AtsScoreCard
        score={45}
        breakdown={{ ...sampleBreakdown, overallScore: 45 }}
        dict={sampleDict}
        lang="en"
      />,
    )
    expect(screen.getByText(/Needs Optimization/i)).toBeDefined()
  })

  it('shows stale update badge and triggers recalculate callback', () => {
    const handleRecalculate = vi.fn()

    render(
      <AtsScoreCard
        score={75}
        breakdown={{ ...sampleBreakdown, isStale: true }}
        dict={sampleDict}
        lang="en"
        onRecalculate={handleRecalculate}
      />,
    )

    expect(screen.getByText(/Update Needed/i)).toBeDefined()
    const recalcButton = screen.getByRole('button', { name: /Recalculate/i })
    fireEvent.click(recalcButton)

    expect(handleRecalculate).toHaveBeenCalledTimes(1)
  })

  it('triggers onDeepScan callback and reflects scanning state', () => {
    const handleDeepScan = vi.fn()

    const { rerender } = render(
      <AtsScoreCard
        score={85}
        breakdown={sampleBreakdown}
        dict={sampleDict}
        lang="en"
        isScanning={false}
        onDeepScan={handleDeepScan}
      />,
    )

    const scanButton = screen.getByRole('button', { name: /AI Deep Scan/i })
    fireEvent.click(scanButton)
    expect(handleDeepScan).toHaveBeenCalledTimes(1)

    rerender(
      <AtsScoreCard
        score={85}
        breakdown={sampleBreakdown}
        dict={sampleDict}
        lang="en"
        isScanning={true}
        onDeepScan={handleDeepScan}
      />,
    )

    const disabledScanButton = screen.getByRole('button', { name: /Scanning.../i })
    expect(disabledScanButton.getAttribute('disabled')).toBeDefined()
  })

  it('renders actionable improvement recommendations when available', () => {
    render(<AtsScoreCard score={85} breakdown={sampleBreakdown} dict={sampleDict} lang="en" />)

    expect(
      screen.getByText(/Incorporate quantified cloud scaling metrics into your latest role./i),
    ).toBeDefined()
  })
})
