// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { HealthProfileCard } from './HealthProfileCard'
import { getResumeHealthForProfile } from '@/lib/health/queries'
import type { HealthAuditView } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/lib/health/queries', () => ({
  getResumeHealthForProfile: vi.fn(),
}))

vi.mock('@/app/actions/resume-health', () => ({
  getProfileHealthAction: vi.fn(),
}))

const dict = {
  health: {
    profileCardTitle: 'Base resume health',
    profileCardSubtitle: 'Recalculated from your master profile on every visit.',
    scoreOutOf: 'out of 100',
    needsWork: 'Needs work',
    fair: 'Fair',
    strong: 'Strong',
    excellent: 'Excellent',
    openIssuesSuffix: 'open issues',
    viewAudit: 'Open the full audit',
  },
} as unknown as Dictionary

function view(overrides: Partial<HealthAuditView> = {}): HealthAuditView {
  return {
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
    suggestions: [],
    excludedCount: 1,
    openCount: 3,
    recalculated: false,
    ...overrides,
  }
}

describe('HealthProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the score, band, open issue count, and audit link', async () => {
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(view())
    const jsx = await HealthProfileCard({
      userId: 'usr_1',
      profileId: 'prof_1',
      lang: 'en',
      dict,
    })
    render(jsx)

    expect(screen.getByText('Base resume health')).toBeDefined()
    // 55 lands in the fair band.
    expect(screen.getByText('Fair')).toBeDefined()
    expect(screen.getByText('3 open issues')).toBeDefined()
    expect(screen.getByRole('img', { name: '55 out of 100' })).toBeDefined()

    const link = screen.getByRole('link', { name: 'Open the full audit' })
    expect(link.getAttribute('href')).toBe('/en/resume?auditLang=en')
  })

  it('follows the audit profile language for digits and the link target', async () => {
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(view({ language: 'AR' }))
    const jsx = await HealthProfileCard({
      userId: 'usr_1',
      profileId: 'prof_1',
      lang: 'en',
      dict,
    })
    render(jsx)

    // Card language is the profile language, so digits are Arabic Indic.
    expect(screen.getByText('٥٥')).toBeDefined()
    const link = screen.getByRole('link', { name: 'Open the full audit' })
    expect(link.getAttribute('href')).toBe('/en/resume?auditLang=ar')
  })

  it('maps 90 and above to the excellent band', async () => {
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(
      view({ overallScore: 92, breakdown: undefined, openCount: 0 }),
    )
    const jsx = await HealthProfileCard({
      userId: 'usr_1',
      profileId: 'prof_1',
      lang: 'en',
      dict,
    })
    render(jsx)

    expect(screen.getByText('Excellent')).toBeDefined()
    expect(screen.getByText('0 open issues')).toBeDefined()
  })

  it('renders nothing when the profile has no resolvable audit', async () => {
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(null)
    const jsx = await HealthProfileCard({
      userId: 'usr_1',
      profileId: 'prof_1',
      lang: 'en',
      dict,
    })
    const { container } = render(jsx)

    expect(container.firstElementChild).toBeNull()
  })

  it('re-renders when profile-language-changed event is fired', async () => {
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(
      view({ overallScore: 55, language: 'EN' }),
    )
    const arabicView = view({
      profileId: 'prof_ar',
      overallScore: 92,
      language: 'AR',
      openCount: 0,
    })
    const { getProfileHealthAction } = await import('@/app/actions/resume-health')
    vi.mocked(getProfileHealthAction).mockResolvedValue(arabicView)

    const jsx = await HealthProfileCard({
      userId: 'usr_1',
      profileId: 'prof_1',
      lang: 'en',
      dict,
    })
    render(jsx)

    expect(screen.getByText('Fair')).toBeDefined()

    // Trigger profile language change event
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('profile-language-changed', {
          detail: { profileId: 'prof_ar', language: 'AR' },
        }),
      )
    })

    expect(screen.getByText('Excellent')).toBeDefined()
    expect(screen.getByText('٩٢')).toBeDefined()
    const link = screen.getByRole('link', { name: 'Open the full audit' })
    expect(link.getAttribute('href')).toBe('/en/resume?auditLang=ar')
  })
})
