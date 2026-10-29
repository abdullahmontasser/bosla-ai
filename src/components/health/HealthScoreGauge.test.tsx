// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HealthScoreGauge } from './HealthScoreGauge'
import type { HealthBreakdown } from '@/lib/health/rules'
import type { Dictionary } from '@/lib/i18n/types'

const dict = {
  health: {
    scoreLabel: 'Health score',
    scoreOutOf: 'out of 100',
    updating: 'Updating…',
    lastKnown: 'Last known score',
    needsWork: 'Needs work',
    fair: 'Fair',
    strong: 'Strong',
    excellent: 'Excellent',
    excludedSuffix: 'dismissed issues are excluded from this score',
    categoryImpact: 'Impact & metrics',
    categoryActionVerbs: 'Action verbs',
    categoryCompleteness: 'ATS completeness',
    categoryDepth: 'Content depth',
  },
} as unknown as Partial<Dictionary>

const breakdown: HealthBreakdown = {
  overallScore: 72,
  categories: {
    impactMetrics: { score: 60, weight: 30, quantified: 3, total: 5, dismissed: 0 },
    actionVerbs: { score: 75, weight: 20, strongStarts: 4, total: 5, dismissed: 1 },
    atsCompleteness: {
      score: 80,
      weight: 25,
      checks: [
        { key: 'contact_block', satisfied: true, dismissed: false },
        { key: 'summary_present', satisfied: true, dismissed: false },
      ],
    },
    contentDepth: {
      score: 40,
      weight: 25,
      checks: [
        { key: 'role_coverage', satisfied: false, dismissed: false },
        { key: 'summary_words', satisfied: true, dismissed: false },
      ],
    },
  },
  excludedCount: 1,
  evaluatedAt: '2026-10-28T00:00:00.000Z',
  ruleSetVersion: '1',
}

describe('HealthScoreGauge', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }),
    )
  })

  it('renders the animated score, band label, and four category bars', () => {
    render(<HealthScoreGauge score={72} breakdown={breakdown} dict={dict} lang="en" />)

    expect(screen.getByText('Fair')).toBeDefined()
    expect(screen.getByText('Impact & metrics')).toBeDefined()
    expect(screen.getByText('Action verbs')).toBeDefined()
    expect(screen.getByText('ATS completeness')).toBeDefined()
    expect(screen.getByText('Content depth')).toBeDefined()
    // Category scores are visible next to the labels.
    expect(screen.getByText(/60%/)).toBeDefined()
    expect(screen.getByText(/75%/)).toBeDefined()
    expect(screen.getByText(/80%/)).toBeDefined()
    expect(screen.getByText(/40%/)).toBeDefined()
  })

  it('formats digits with Arabic Indic numerals for the ar language (AC-10)', async () => {
    render(<HealthScoreGauge score={72} breakdown={breakdown} dict={{}} lang="ar" />)

    // The settled score arrives through a deferred callback, so wait for it.
    await waitFor(() => {
      expect(screen.getAllByText('٧٢').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText(/٨٠%/)).not.toBeNull()
  })

  it('shows the excluded count so dismissals stay honest (AC-5)', () => {
    render(<HealthScoreGauge score={90} breakdown={breakdown} dict={dict} lang="en" />)

    expect(screen.getByText(/1 dismissed issues are excluded/)).toBeDefined()
  })

  it('renders the updating badge with the last known score label (AC-12)', () => {
    render(<HealthScoreGauge score={85} breakdown={breakdown} dict={dict} lang="en" updating />)

    expect(screen.getByText('Updating…')).toBeDefined()
    expect(screen.getByText('Last known score')).toBeDefined()
  })

  it('renders zero without a breakdown for the guided empty state', () => {
    render(<HealthScoreGauge score={0} dict={dict} lang="en" />)

    expect(screen.getByText('Needs work')).toBeDefined()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })

  it('announces the settled score through a live region (AC-10)', () => {
    render(<HealthScoreGauge score={72} breakdown={breakdown} dict={dict} lang="en" />)

    const live = screen.getByRole('status')
    expect(live.textContent).toContain('72 out of 100')
  })
})
