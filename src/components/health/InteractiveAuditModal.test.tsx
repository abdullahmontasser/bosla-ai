// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InteractiveAuditModal } from './InteractiveAuditModal'
import type { HealthAuditView } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/resume-health', () => ({
  acceptHealthSuggestionAction: vi.fn(),
  dismissHealthSuggestionAction: vi.fn(),
  generateHealthRewriteAction: vi.fn(),
  forceRecalculateHealthAction: vi.fn(),
}))

vi.mock('@/app/actions/profile-ai', () => ({
  enhanceExperienceBulletAction: vi.fn(),
  enhanceProfileSummaryAction: vi.fn(),
}))

const dict = {
  health: {
    categoryImpact: 'Impact & metrics',
    categoryActionVerbs: 'Action verbs',
    categoryCompleteness: 'ATS completeness',
    categoryDepth: 'Content depth',
  },
} as unknown as Partial<Dictionary>

const view: HealthAuditView = {
  profileId: 'prof_1',
  language: 'EN',
  overallScore: 64,
  breakdown: {
    overallScore: 64,
    categories: {
      impactMetrics: { score: 66, weight: 30, quantified: 2, total: 3, dismissed: 0 },
      actionVerbs: { score: 33, weight: 20, strongStarts: 1, total: 3, dismissed: 0 },
      atsCompleteness: {
        score: 50,
        weight: 25,
        checks: [{ key: 'summary_present', satisfied: true, dismissed: false }],
      },
      contentDepth: {
        score: 60,
        weight: 25,
        checks: [{ key: 'avg_bullet_length', satisfied: true, dismissed: false }],
      },
    },
    excludedCount: 0,
    evaluatedAt: '2026-10-28T00:00:00.000Z',
    ruleSetVersion: '1',
  },
  suggestions: [],
  excludedCount: 0,
  openCount: 0,
  recalculated: false,
}

describe('InteractiveAuditModal', () => {
  it('shows the category breakdown in the score gauge', () => {
    render(
      <InteractiveAuditModal
        open
        onOpenChange={vi.fn()}
        profileId="prof_1"
        initialView={view}
        lang="en"
        dict={dict}
      />,
    )

    expect(screen.getByText('Impact & metrics')).toBeDefined()
    expect(screen.getByText('66%')).toBeDefined()
    expect(screen.getByText('Action verbs')).toBeDefined()
    expect(screen.getByText('33%')).toBeDefined()
  })
})
