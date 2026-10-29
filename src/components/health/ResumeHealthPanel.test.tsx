// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ResumeHealthPanel } from './ResumeHealthPanel'
import { getResumeHealthForLanguage } from '@/lib/health/queries'
import type { HealthAuditView } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/health/queries', () => ({
  getResumeHealthForLanguage: vi.fn(),
}))

const dict = {
  health: {
    panelTitle: 'Base Resume Health Audit',
    panelSubtitle: 'An instant, deterministic score.',
    auditLanguageLabel: 'Card language',
    scoreLabel: 'Health score',
    scoreOutOf: 'out of 100',
    needsWork: 'Needs work',
    fair: 'Fair',
    strong: 'Strong',
    excellent: 'Excellent',
    categoryImpact: 'Impact & metrics',
    categoryActionVerbs: 'Action verbs',
    categoryCompleteness: 'ATS completeness',
    categoryDepth: 'Content depth',
    emptyTitle: 'Start with your master profile',
    emptyBody: 'Create or complete your profile.',
    emptyProfile: 'Open your profile',
    emptyUpload: 'Upload a resume',
    originalLabel: 'Original',
    notSet: 'not set yet',
  },
} as unknown as Dictionary

const view: HealthAuditView = {
  profileId: 'prof_1',
  language: 'EN',
  overallScore: 55,
  breakdown: {
    overallScore: 55,
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
    excludedCount: 1,
    evaluatedAt: '2026-10-28T00:00:00.000Z',
    ruleSetVersion: '1',
  },
  suggestions: [
    {
      id: 'sugg_1',
      category: 'IMPACT_METRICS',
      title: 'Add a measurable result to this bullet',
      rationale: 'This bullet has no concrete measure.',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 0,
      targetField: null,
      originalText: 'Led the migration project.',
      proposedText: null,
      status: 'PENDING',
      isAiGenerated: false,
      isAiStale: false,
      fingerprint: 'fp_a',
      decidedAt: null,
    },
    {
      id: 'sugg_2',
      category: 'IMPACT_METRICS',
      title: 'Add a measurable result to this bullet',
      rationale: 'This bullet has no concrete measure.',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 1,
      targetField: null,
      originalText: 'Trained the support team.',
      proposedText: null,
      status: 'PENDING',
      isAiGenerated: false,
      isAiStale: false,
      fingerprint: 'fp_b',
      decidedAt: null,
    },
    {
      id: 'sugg_3',
      category: 'ACTION_VERBS',
      title: 'Start this bullet with a strong action verb',
      rationale: 'Wiquired does not start with a strong verb.',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 2,
      targetField: null,
      originalText: 'Wiquired by daily standups.',
      proposedText: null,
      status: 'PENDING',
      isAiGenerated: false,
      isAiStale: false,
      fingerprint: 'fp_c',
      decidedAt: null,
    },
    {
      id: 'sugg_4',
      category: 'CONTENT_DEPTH',
      title: 'Bullet is shorter than 8 words',
      rationale: 'Too short.',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: 'exp_1',
      targetIndex: 3,
      targetField: null,
      originalText: 'Owntcn tasks.',
      proposedText: null,
      status: 'DISMISSED',
      isAiGenerated: false,
      isAiStale: false,
      fingerprint: 'fp_d',
      decidedAt: new Date('2026-10-27T00:00:00.000Z'),
    },
  ],
  excludedCount: 1,
  openCount: 3,
  recalculated: false,
}

describe('ResumeHealthPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reduced motion stub: the gauge settles instantly and stays deterministic.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }),
    )
  })

  it('renders the gauge, grouped sections with counts, and pending cards only', async () => {
    vi.mocked(getResumeHealthForLanguage).mockResolvedValue(view)
    const jsx = await ResumeHealthPanel({ userId: 'usr_1', pageLang: 'en', auditLang: 'en', dict })
    render(jsx)

    expect(screen.getByText('Base Resume Health Audit')).toBeDefined()
    expect(screen.getAllByText('Impact & metrics').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Action verbs').length).toBeGreaterThanOrEqual(1)
    // Two impact cards group together with a count of 2, the dismissed card is out.
    expect(screen.getByText('Led the migration project.')).toBeDefined()
    expect(screen.getByText('Trained the support team.')).toBeDefined()
    expect(screen.queryByText('Owntcn tasks.')).toBeNull()
  })

  it('opens the first category section by default', async () => {
    vi.mocked(getResumeHealthForLanguage).mockResolvedValue(view)
    const jsx = await ResumeHealthPanel({ userId: 'usr_1', pageLang: 'en', auditLang: 'en', dict })
    const { container } = render(jsx)

    const details = container.querySelectorAll('details')
    expect(details.length).toBeGreaterThanOrEqual(2)
    // Only the first group starts expanded.
    expect(details[0].open).toBe(true)
    expect(details[1].open).toBe(false)
  })

  it('renders the guided empty state with a 0 gauge and Calm links', async () => {
    vi.mocked(getResumeHealthForLanguage).mockResolvedValue(null)
    const jsx = await ResumeHealthPanel({ userId: 'usr_1', pageLang: 'en', auditLang: 'en', dict })
    render(jsx)

    expect(screen.getByText('Start with your master profile')).toBeDefined()
    expect(screen.getByText('Create or complete your profile.')).toBeDefined()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Open your profile')).toBeDefined()
    expect(screen.getByText('Upload a resume')).toBeDefined()
  })

  it('passes the audit language to the gauge digit formatting', async () => {
    vi.mocked(getResumeHealthForLanguage).mockResolvedValue({
      ...view,
      language: 'AR',
    })
    const jsx = await ResumeHealthPanel({ userId: 'usr_1', pageLang: 'en', auditLang: 'en', dict })
    render(jsx)

    // Card language is the profile (audit) language, so numbers render as ٥٥.
    await waitFor(() => {
      expect(screen.getAllByText('٥٥').length).toBeGreaterThanOrEqual(1)
    })
  })
})
