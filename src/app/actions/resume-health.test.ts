import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  acceptHealthSuggestionAction,
  dismissHealthSuggestionAction,
  generateHealthRewriteAction,
  restoreHealthSuggestionAction,
  undoHealthSuggestionAction,
} from './resume-health'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getResumeHealthForProfile } from '@/lib/health/queries'
import { recordAnalyticsEvent } from '@/lib/db/analytics'
import { generateObject } from 'ai'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { _resetRateLimitStore } from '@/lib/telemetry/rate-limiter'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    profile: { findUnique: vi.fn() },
  },
}))
vi.mock('ai', () => ({ generateObject: vi.fn() }))
vi.mock('@/lib/ai/provider-client', () => ({ getProviderModel: vi.fn(() => ({})) }))
vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
  getProviderSetting: vi.fn(),
  deleteProviderSetting: vi.fn(),
}))
vi.mock('@/lib/db/analytics', () => ({ recordAnalyticsEvent: vi.fn().mockResolvedValue({}) }))
vi.mock('@/lib/health/queries', () => ({
  getResumeHealthForProfile: vi.fn(),
}))

interface FakeSuggestion {
  id: string
  profileId: string
  category: string
  targetKind: string
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
  proposedText: string | null
  status: string
  isAiGenerated: boolean
  isAiStale: boolean
  fingerprint: string
  decidedAt: Date | null
  auditId: string | null
}

interface FakeExperience {
  id: string
  profileId: string
  companyName: string
  jobTitle: string
  bullets: string[]
}

interface FakeState {
  suggestions: FakeSuggestion[]
  experiences: FakeExperience[]
  audit: { id: string; profileId: string; overallScore: number } | null
  profile: {
    id: string
    userId: string
    language: 'EN' | 'AR'
    headline: string | null
    summary: string | null
  }
}

function makeDatabase(): FakeState {
  return {
    suggestions: [],
    experiences: [
      {
        id: 'exp_1',
        profileId: 'prof_1',
        companyName: 'Acme',
        jobTitle: 'Engineer',
        bullets: ['Led the migration project', 'Trained the support team'],
      },
    ],
    audit: { id: 'audit_1', profileId: 'prof_1', overallScore: 42 },
    profile: {
      id: 'prof_1',
      userId: 'usr_owner',
      language: 'EN',
      headline: 'Platform engineer',
      summary: 'Software engineer who builds systems.',
    },
  }
}

function makeSuggestion(overrides: Partial<FakeSuggestion> = {}): FakeSuggestion {
  return {
    id: 'sugg_1',
    profileId: 'prof_1',
    category: 'IMPACT_METRICS',
    targetKind: 'WORK_EXPERIENCE_BULLET',
    targetId: 'exp_1',
    targetIndex: 0,
    targetField: null,
    originalText: 'Led the migration project',
    proposedText: 'Led the migration project for 40 services',
    status: 'PENDING',
    isAiGenerated: false,
    isAiStale: false,
    fingerprint: 'fp_text',
    decidedAt: null,
    auditId: 'audit_1',
    ...overrides,
  }
}

function fakeTx(state: FakeState) {
  const matchesId = (where: { id?: string }) => Boolean(where.id)
  return {
    resumeHealthSuggestion: {
      findFirst: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = state.suggestions.find((item) => item.id === where.id)
        if (!row) return null
        // The action reads row.profile.userId after the ownership include.
        const owner = row.profileId === state.profile.id ? state.profile.userId : 'usr_other'
        return { ...row, profile: { id: row.profileId, userId: owner } }
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return state.suggestions.find((row) => row.id === where.id) ?? null
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; status?: string; isAiStale?: boolean }
          data: Record<string, unknown>
        }) => {
          const row = state.suggestions.find((item) => item.id === where.id)
          if (!row) return { count: 0 }
          if (where.status && row.status !== where.status) return { count: 0 }
          if (where.isAiStale !== undefined && row.isAiStale !== where.isAiStale) {
            return { count: 0 }
          }
          Object.assign(row, data)
          return { count: 1 }
        },
      ),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<FakeSuggestion> }) => {
          const row = state.suggestions.find((item) => item.id === where.id)
          if (!row) throw new Error('ROW_NOT_FOUND')
          Object.assign(row, data)
          return row
        },
      ),
    },
    resumeHealthAudit: {
      findUnique: vi.fn(async ({ where }: { where: { profileId: string } }) => {
        if (!state.audit || state.audit.profileId !== where.profileId) return null
        return state.audit
      }),
    },
    profile: {
      findUnique: vi.fn(async ({ where }: { where?: { id?: string } }) => {
        if (matchesId(where ?? {}) && (where as { id?: string }).id !== state.profile.id) {
          return null
        }
        return {
          ...state.profile,
          workExperiences: state.experiences,
          educations: [],
          skills: [],
          projects: [],
        }
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: { summary?: string } }) => {
          if (where.id !== state.profile.id) throw new Error('ROW_NOT_FOUND')
          if (data.summary !== undefined) state.profile.summary = data.summary
          return state.profile
        },
      ),
    },
    workExperience: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return state.experiences.find((row) => row.id === where.id) ?? null
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string }
          data: { bullets: { set: string[] } }
        }) => {
          const row = state.experiences.find((item) => item.id === where.id)
          if (!row) throw new Error('ROW_NOT_FOUND')
          row.bullets = data.bullets.set
          return row
        },
      ),
    },
  }
}

const viewStub = {
  profileId: 'prof_1',
  language: 'EN',
  overallScore: 40,
  breakdown: {},
  suggestions: [],
  excludedCount: 0,
  openCount: 0,
  recalculated: true,
} as unknown as Awaited<ReturnType<typeof getResumeHealthForProfile>>

function bindPrisma(state: FakeState) {
  const tx = fakeTx(state)
  vi.mocked(prisma.$transaction).mockImplementation(
    // The real client passes its interactive tx; our state object fakes it.
    ((callback: (txClient: unknown) => Promise<unknown>) => callback(tx)) as never,
  )
  vi.mocked(prisma.profile.findUnique).mockResolvedValue({
    ...state.profile,
    workExperiences: state.experiences.map((experience) => ({
      ...experience,
      startDate: new Date('2024-01-01'),
      endDate: null,
      isCurrent: true,
      sortOrder: 0,
    })),
    educations: [],
    skills: [{ id: 'skill_1', name: 'TypeScript', profileId: state.profile.id }],
    projects: [],
  } as never)
  return tx
}

describe('health card decision actions (AC-4, AC-5, AC-8, AC-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getResumeHealthForProfile).mockResolvedValue(viewStub)
  })

  it('rejects a signed out visitor (AC-9)', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)
    const result = await acceptHealthSuggestionAction('sugg_1')
    expect(result).toEqual({ ok: false, error: 'UNAUTHORIZED' })
  })

  describe('acceptHealthSuggestionAction', () => {
    it('writes the proposed text into the exact bullet and marks the card accepted (AC-4)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      const tx = bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.previousScore).toBe(42)
      expect(state.experiences[0].bullets[0]).toBe('Led the migration project for 40 services')
      expect(state.suggestions[0].status).toBe('ACCEPTED')
      expect(state.suggestions[0].decidedAt).not.toBeNull()
      expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled()
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'health_suggestion_accepted' }),
      )
      expect(viewStub).not.toBeUndefined()
      void tx
    })

    it('keeps score, text, and status untouched for another user card (AC-9)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_other' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'NOT_FOUND' })
      expect(state.experiences[0].bullets[0]).toBe('Led the migration project')
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(recordAnalyticsEvent).not.toHaveBeenCalled()
    })

    it('returns CONFLICT and writes nothing when another tab decided first (AC-8)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ status: 'DISMISSED' })]
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
      expect(state.experiences[0].bullets[0]).toBe('Led the migration project')
      expect(state.suggestions[0].status).toBe('DISMISSED')
    })

    it('returns STALE for a pending AI rewrite whose source line moved (AC-7, AC-8)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ isAiGenerated: true })]
      state.experiences[0].bullets[0] = 'Led the NEW migration project'
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'STALE' })
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(state.experiences[0].bullets[0]).toBe('Led the NEW migration project')
    })

    it('returns STALE for an already marked stale AI rewrite', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [
        makeSuggestion({
          isAiGenerated: true,
          isAiStale: true,
          originalText: 'Led the NEW migration project',
        }),
      ]
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'STALE' })
      expect(state.suggestions[0].status).toBe('PENDING')
    })

    it('returns NO_PROPOSED_TEXT and restores the pending claim when no rewrite exists', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ proposedText: null })]
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'NO_PROPOSED_TEXT' })
      expect(state.suggestions[0].status).toBe('PENDING')
    })

    it('writes an accepted summary rewrite into Profile.summary (AC-4)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [
        makeSuggestion({
          targetKind: 'PROFILE_SUMMARY',
          targetId: null,
          targetIndex: null,
          originalText: 'Software engineer who builds systems.',
          proposedText: 'Software engineer who builds resilient systems',
        }),
      ]
      bindPrisma(state)

      const result = await acceptHealthSuggestionAction('sugg_1')

      expect(result.ok).toBe(true)
      expect(state.profile.summary).toBe('Software engineer who builds resilient systems')
    })
  })

  describe('undoHealthSuggestionAction', () => {
    it('restores the original text and reopens the card as pending (AC-4)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.experiences[0].bullets[0] = 'Led the migration project for 40 services'
      state.suggestions = [
        makeSuggestion({
          status: 'ACCEPTED',
          decidedAt: new Date(),
        }),
      ]
      bindPrisma(state)

      const result = await undoHealthSuggestionAction('sugg_1')

      expect(result.ok).toBe(true)
      expect(state.experiences[0].bullets[0]).toBe('Led the migration project')
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(state.suggestions[0].decidedAt).toBeNull()
      expect(state.suggestions[0].proposedText).toBe('Led the migration project for 40 services')
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'health_suggestion_undone' }),
      )
    })

    it('keeps the card accepted with CONFLICT when the accepted text moved', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.experiences[0].bullets[0] = 'Edited by the candidate after accepting'
      state.suggestions = [makeSuggestion({ status: 'ACCEPTED', decidedAt: new Date() })]
      bindPrisma(state)

      const result = await undoHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
      expect(state.suggestions[0].status).toBe('ACCEPTED')
      expect(state.experiences[0].bullets[0]).toBe('Edited by the candidate after accepting')
    })

    it('returns CONFLICT for a pending card (undo requires ACCEPTED)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)

      const result = await undoHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
    })
  })

  describe('dismissHealthSuggestionAction and restore', () => {
    it('dismisses a pending card, clears its rewrite, and keeps the card (AC-5)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ isAiGenerated: true })]
      bindPrisma(state)

      const result = await dismissHealthSuggestionAction('sugg_1')

      expect(result.ok).toBe(true)
      expect(state.suggestions[0].status).toBe('DISMISSED')
      expect(state.suggestions[0].proposedText).toBeNull()
      expect(state.suggestions[0].isAiGenerated).toBe(false)
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'health_suggestion_dismissed' }),
      )
    })

    it('returns CONFLICT when dismissing a card another tab dismissed (AC-8)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ status: 'DISMISSED', decidedAt: new Date() })]
      bindPrisma(state)

      const result = await dismissHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
    })

    it('restores a dismissed card back to pending (AC-5)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ status: 'DISMISSED', decidedAt: new Date() })]
      bindPrisma(state)

      const result = await restoreHealthSuggestionAction('sugg_1')

      expect(result.ok).toBe(true)
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(state.suggestions[0].decidedAt).toBeNull()
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'health_suggestion_restored' }),
      )
    })

    it('returns CONFLICT for a pending card (restore requires DISMISSED)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_owner' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)

      const result = await restoreHealthSuggestionAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
    })
  })

  describe('generateHealthRewriteAction (AC-6, AC-7, AC-9)', () => {
    beforeEach(() => {
      _resetRateLimitStore()
      vi.mocked(auth).mockResolvedValue({ user: { id: 'usr_owner' } } as unknown as never)
      vi.mocked(getActiveProviderSettings).mockResolvedValue([
        {
          id: 'prov_1',
          provider: 'openai',
          apiKey: 'sk_test',
          defaultModel: 'gpt-test',
          endpointUrl: null,
          isActive: true,
        },
      ] as never)
    })

    it('rejects a signed out visitor', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)
      const result = await generateHealthRewriteAction('sugg_1')
      expect(result).toEqual({ ok: false, error: 'UNAUTHORIZED' })
    })

    it('stops after the tenth call in the rolling window (AC-9)', async () => {
      const state = makeDatabase()
      state.experiences[0].bullets[1] = 'Trained 12 engineers on the platform'
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          proposedText: 'Led the migration of 12 services',
          rationale: 'Reused the team count.',
        },
      } as never)

      for (let index = 0; index < 10; index += 1) {
        const allowed = await generateHealthRewriteAction('sugg_1')
        expect(allowed.ok).toBe(true)
      }
      const blocked = await generateHealthRewriteAction('sugg_1')
      expect(blocked).toEqual({ ok: false, error: 'RATE_LIMITED' })
    })

    it('returns NO_PROVIDER when no active provider settings exist (AC-7)', async () => {
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([] as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)

      const result = await generateHealthRewriteAction('sugg_1')
      expect(result).toEqual({ ok: false, error: 'NO_PROVIDER' })
      expect(generateObject).not.toHaveBeenCalled()
    })

    it('returns NOT_FOUND for another user card (AC-9)', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_other' } } as unknown as never)
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      bindPrisma(state)

      const result = await generateHealthRewriteAction('sugg_1')
      expect(result).toEqual({ ok: false, error: 'NOT_FOUND' })
    })

    it('returns CONFLICT for non rewritable targets like contact cards', async () => {
      const state = makeDatabase()
      state.suggestions = [
        makeSuggestion({
          targetKind: 'PROFILE_CONTACT',
          targetId: null,
          targetIndex: null,
          targetField: 'email',
        }),
      ]
      bindPrisma(state)

      const result = await generateHealthRewriteAction('sugg_1')
      expect(result).toEqual({ ok: false, error: 'CONFLICT' })
    })

    it('returns STALE when the source line moved since the card was framed', async () => {
      const state = makeDatabase()
      state.suggestions = [makeSuggestion()]
      state.experiences[0].bullets[0] = 'Led the NEW migration project'
      bindPrisma(state)

      const result = await generateHealthRewriteAction('sugg_1')
      expect(result).toEqual({ ok: false, error: 'STALE' })
    })

    it('saves the validated proposal on the pending card without touching the score (AC-6)', async () => {
      const state = makeDatabase()
      state.experiences[0].bullets[1] = 'Trained 12 engineers on the platform'
      state.suggestions = [makeSuggestion()]
      const tx = bindPrisma(state)
      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          proposedText: 'Led the migration project across 12 teams',
          rationale: 'Bolted on the existing team count from the profile.',
        },
      } as never)

      const result = await generateHealthRewriteAction('sugg_1')

      void tx

      if (!result.ok) throw new Error(JSON.stringify(result))
      expect(result.proposedText).toBe('Led the migration project across 12 teams')
      expect(result.view).toBe(viewStub)
      expect(state.suggestions[0].proposedText).toBe('Led the migration project across 12 teams')
      expect(state.suggestions[0].isAiGenerated).toBe(true)
      expect(state.suggestions[0].isAiStale).toBe(false)
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'health_rewrite_requested',
          metadata: { kind: 'bullet' },
        }),
      )
    })

    it('rejects an ungrounded rewrite that invents a number (AC-9, grounding)', async () => {
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ proposedText: null, isAiGenerated: false })]
      bindPrisma(state)
      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          proposedText: 'Cut deploy time by 96% for 7 services',
          rationale: 'Numbers the model imagined.',
        },
      } as never)

      const result = await generateHealthRewriteAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'UNGROUNDED_REWRITE' })
      expect(state.suggestions[0].proposedText).toBeNull()
    })

    it('keeps the deterministic card on an AI failure with the failed path reachable (AC-7)', async () => {
      const state = makeDatabase()
      state.suggestions = [makeSuggestion({ proposedText: null, isAiGenerated: false })]
      bindPrisma(state)
      vi.mocked(generateObject).mockRejectedValueOnce(new Error('timeout'))

      const result = await generateHealthRewriteAction('sugg_1')

      expect(result).toEqual({ ok: false, error: 'AI_FAILED' })
      expect(state.suggestions[0].status).toBe('PENDING')
      expect(state.suggestions[0].proposedText).toBeNull()
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'health_rewrite_failed' }),
      )
    })
  })
})
