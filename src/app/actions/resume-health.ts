'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { recordAnalyticsEvent } from '@/lib/db/analytics'
import { getResumeHealthForProfile, type HealthAuditView } from '@/lib/health/queries'
import type { HealthTargetKindValue } from '@/lib/health/rules'
import {
  AI_REWRITE_LIMIT,
  AI_REWRITE_TIMEOUT_MS,
  AI_REWRITE_WINDOW_MS,
} from '@/lib/health/constants'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'
import { checkRateLimit, hashClientIdentifier } from '@/lib/telemetry/rate-limiter'
import { normalizeArabicDigits } from '@/lib/text/normalize-digits'
import { generateObject } from 'ai'
import { z } from 'zod'

/**
 * Server actions for the base resume health audit cards (spec 0014). Every
 * action re-checks the session and card ownership, claims the card with a
 * conditional status update so the first decision wins when two tabs race,
 * and returns a recalculated view. Error codes are machine readable and log
 * lines never contain resume text.
 */

export type HealthActionErrorCode =
  'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'STALE' | 'NO_PROPOSED_TEXT'

export type HealthActionResult =
  | { ok: true; view: HealthAuditView; previousScore: number }
  | { ok: false; error: HealthActionErrorCode }

/** What a decision transaction reports before the view reload. */
type HealthActionFailure = { ok: false; error: HealthActionErrorCode }

type HealthActionTxOutcome =
  | {
      ok: true
      profileId: string
      previousScore: number
      metadata?: Record<string, unknown>
    }
  | HealthActionFailure

type DecisionTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

interface SuggestionRow {
  id: string
  profileId: string
  category: string
  targetKind: HealthTargetKindValue
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
  proposedText: string | null
  status: string
  isAiStale: boolean
  fingerprint: string
  profileUserId: string
}

async function loadSuggestion(
  tx: DecisionTx,
  suggestionId: string,
  userId: string,
): Promise<SuggestionRow | null> {
  const row = await tx.resumeHealthSuggestion.findFirst({
    where: { id: suggestionId },
    include: { profile: { select: { id: true, userId: true } } },
  })
  if (!row || row.profile.userId !== userId) return null
  return {
    id: row.id,
    profileId: row.profileId,
    category: row.category,
    targetKind: row.targetKind as HealthTargetKindValue,
    targetId: row.targetId,
    targetIndex: row.targetIndex,
    targetField: row.targetField,
    originalText: row.originalText,
    proposedText: row.proposedText,
    status: row.status,
    isAiStale: row.isAiStale,
    fingerprint: row.fingerprint,
    profileUserId: userId,
  }
}

/** The current text of the line the card anchors to, from the live profile. */
async function resolveTargetText(tx: DecisionTx, row: SuggestionRow): Promise<string | null> {
  const profile = await tx.profile.findUnique({
    where: { id: row.profileId },
    include: {
      workExperiences: { orderBy: { sortOrder: 'asc' } },
      educations: { orderBy: { sortOrder: 'asc' } },
      skills: { orderBy: { sortOrder: 'asc' } },
      projects: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!profile) return null

  const experience = row.targetId
    ? profile.workExperiences.find((item) => item.id === row.targetId)
    : undefined

  switch (row.targetKind) {
    case 'WORK_EXPERIENCE_BULLET': {
      if (!experience || row.targetIndex === null) return null
      const bullet = (experience.bullets ?? [])[row.targetIndex]
      return bullet?.trim() ? bullet.trim() : null
    }
    case 'WORK_EXPERIENCE':
      if (!experience) return null

      return `${experience.companyName.trim() || '—'} · ${experience.jobTitle.trim() || '—'}`
    case 'PROFILE_SUMMARY':
      return profile.summary?.trim() ?? ''
    case 'PROFILE_CONTACT': {
      if (row.targetField === 'email') return profile.email?.trim() ?? ''
      if (row.targetField === 'phone') return profile.phone?.trim() ?? ''
      if (row.targetField === 'location') return profile.location?.trim() ?? ''
      if (row.targetField === 'linkedinUrl') return profile.linkedinUrl?.trim() ?? ''
      if (row.targetField === 'websiteUrl') return profile.websiteUrl?.trim() ?? ''
      return ''
    }
    case 'PROFILE_SKILLS':
      return String(profile.skills.length)
    case 'PROFILE_EDUCATION': {
      if (!row.targetId) return ''
      const education = profile.educations.find((item) => item.id === row.targetId)
      if (!education) return null
      return `${education.institution.trim() || '—'} · ${education.degree.trim() || '—'}`
    }
    case 'PROFILE_GENERAL':
      return ''
  }
}

/**
 * Writes a text value into the anchored profile field. In `apply` mode the
 * target must still hold the card's original text (accept). In `revert` mode
 * the undo flow has already validated the target equals the accepted text.
 */
async function writeTargetText(
  tx: DecisionTx,
  row: SuggestionRow,
  text: string,
  mode: 'apply' | 'revert',
): Promise<'OK' | 'STALE'> {
  switch (row.targetKind) {
    case 'WORK_EXPERIENCE_BULLET': {
      if (!row.targetId || row.targetIndex === null) return 'STALE'
      const experience = await tx.workExperience.findUnique({
        where: { id: row.targetId },
      })
      if (!experience || experience.profileId !== row.profileId) return 'STALE'
      const bullets = [...(experience.bullets ?? [])]
      if (row.targetIndex < 0 || row.targetIndex >= bullets.length) return 'STALE'
      if (mode === 'apply' && bullets[row.targetIndex].trim() !== row.originalText.trim()) {
        return 'STALE'
      }
      bullets[row.targetIndex] = text
      await tx.workExperience.update({
        where: { id: experience.id },
        data: { bullets: { set: bullets } },
      })
      return 'OK'
    }
    case 'PROFILE_SUMMARY': {
      const profile = await tx.profile.findUnique({
        where: { id: row.profileId },
        select: { id: true, summary: true },
      })
      if (!profile) return 'STALE'
      if (mode === 'apply' && (profile.summary?.trim() ?? '') !== row.originalText.trim()) {
        return 'STALE'
      }
      await tx.profile.update({
        where: { id: row.profileId },
        data: { summary: text },
      })
      return 'OK'
    }
    default:
      return 'STALE'
  }
}

function errorResult(error: HealthActionErrorCode): HealthActionFailure {
  return { ok: false, error }
}

async function logDecision(
  name: string,
  locale: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await recordAnalyticsEvent({ name, locale, path: '/resume', metadata })
  } catch {
    // Telemetry must never break a card decision.
  }
}

export async function acceptHealthSuggestionAction(
  suggestionId: string,
): Promise<HealthActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return errorResult('UNAUTHORIZED')

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<HealthActionTxOutcome> => {
      const row = await loadSuggestion(tx, suggestionId, userId)
      if (!row) return errorResult('NOT_FOUND')

      const previousAudit = await tx.resumeHealthAudit.findUnique({
        where: { profileId: row.profileId },
      })
      const previousScore = previousAudit?.overallScore ?? 0

      const claim = await tx.resumeHealthSuggestion.updateMany({
        where: { id: row.id, status: 'PENDING', isAiStale: false },
        data: { status: 'ACCEPTED', decidedAt: new Date() },
      })

      if (claim.count === 0) {
        const fresh = await tx.resumeHealthSuggestion.findUnique({ where: { id: row.id } })
        if (!fresh) return errorResult('NOT_FOUND')
        if (fresh.isAiStale) return errorResult('STALE')
        if (fresh.status !== 'PENDING') return errorResult('CONFLICT')
        return errorResult('NO_PROPOSED_TEXT')
      }

      if (!row.proposedText || row.proposedText.trim().length === 0) {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'PENDING', decidedAt: null },
        })
        return errorResult('NO_PROPOSED_TEXT')
      }

      // The feature only offers proposed rewrites for bullets and the summary.
      const writable =
        row.targetKind === 'WORK_EXPERIENCE_BULLET' || row.targetKind === 'PROFILE_SUMMARY'
      if (!writable) {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'PENDING', decidedAt: null },
        })
        return errorResult('NO_PROPOSED_TEXT')
      }

      const current = await resolveTargetText(tx, row)
      if (current === null || current !== row.originalText.trim()) {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'PENDING', decidedAt: null },
        })
        return errorResult('STALE')
      }

      const writeState = await writeTargetText(tx, row, row.proposedText!, 'apply')
      if (writeState === 'STALE') {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'PENDING', decidedAt: null },
        })
        return errorResult('STALE')
      }

      return {
        ok: true,
        profileId: row.profileId,
        previousScore,
        metadata: {
          category: row.category,
          targetKind: row.targetKind,
          hasAi: row.proposedText !== null,
        },
      }
    })

    if (!outcome.ok) return outcome

    const view = await getResumeHealthForProfile(userId, outcome.profileId)
    if (!view) return errorResult('NOT_FOUND')

    await logDecision('health_suggestion_accepted', toLocale(view.language), outcome.metadata ?? {})

    return { ok: true, view, previousScore: outcome.previousScore }
  } catch (err) {
    console.error('[resume-health] accept failed', {
      code: err instanceof Error ? err.name : 'UNKNOWN',
    })
    return errorResult('CONFLICT')
  }
}

export async function undoHealthSuggestionAction(
  suggestionId: string,
): Promise<HealthActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return errorResult('UNAUTHORIZED')

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<HealthActionTxOutcome> => {
      const row = await loadSuggestion(tx, suggestionId, userId)
      if (!row) return errorResult('NOT_FOUND')

      const previousAudit = await tx.resumeHealthAudit.findUnique({
        where: { profileId: row.profileId },
      })
      const previousScore = previousAudit?.overallScore ?? 0

      const claim = await tx.resumeHealthSuggestion.updateMany({
        where: { id: row.id, status: 'ACCEPTED' },
        data: { status: 'PENDING', decidedAt: null },
      })
      if (claim.count === 0) {
        return errorResult('CONFLICT')
      }

      // The accepted text must still be live, otherwise the profile moved on.
      const current = await resolveTargetText(tx, row)
      if (current === null || row.proposedText === null || current !== row.proposedText.trim()) {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'ACCEPTED', decidedAt: new Date() },
        })
        return errorResult('CONFLICT')
      }

      const writeState = await writeTargetText(tx, row, row.originalText, 'revert')
      if (writeState === 'STALE') {
        await tx.resumeHealthSuggestion.update({
          where: { id: row.id },
          data: { status: 'PENDING', decidedAt: null },
        })
        return errorResult('CONFLICT')
      }

      return { ok: true, profileId: row.profileId, previousScore }
    })

    if (!outcome.ok) return outcome

    const view = await getResumeHealthForProfile(userId, outcome.profileId)
    if (!view) return errorResult('NOT_FOUND')

    await logDecision('health_suggestion_undone', toLocale(view.language), {})

    return { ok: true, view, previousScore: outcome.previousScore }
  } catch (err) {
    console.error('[resume-health] undo failed', {
      code: err instanceof Error ? err.name : 'UNKNOWN',
    })
    return errorResult('CONFLICT')
  }
}

export async function dismissHealthSuggestionAction(
  suggestionId: string,
): Promise<HealthActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return errorResult('UNAUTHORIZED')

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<HealthActionTxOutcome> => {
      const row = await loadSuggestion(tx, suggestionId, userId)
      if (!row) return errorResult('NOT_FOUND')

      const previousAudit = await tx.resumeHealthAudit.findUnique({
        where: { profileId: row.profileId },
      })
      const previousScore = previousAudit?.overallScore ?? 0

      const claim = await tx.resumeHealthSuggestion.updateMany({
        where: { id: row.id, status: 'PENDING' },
        data: { status: 'DISMISSED', decidedAt: new Date() },
      })
      if (claim.count === 0) {
        return errorResult('CONFLICT')
      }

      // Clear any AI proposal so a restored card starts fresh.
      await tx.resumeHealthSuggestion.update({
        where: { id: row.id },
        data: { proposedText: null, isAiGenerated: false, isAiStale: false },
      })

      return { ok: true, profileId: row.profileId, previousScore }
    })

    if (!outcome.ok) return outcome

    const view = await getResumeHealthForProfile(userId, outcome.profileId)
    if (!view) return errorResult('NOT_FOUND')

    await logDecision('health_suggestion_dismissed', toLocale(view.language), {})

    return { ok: true, view, previousScore: outcome.previousScore }
  } catch (err) {
    console.error('[resume-health] dismiss failed', {
      code: err instanceof Error ? err.name : 'UNKNOWN',
    })
    return errorResult('CONFLICT')
  }
}

export async function restoreHealthSuggestionAction(
  suggestionId: string,
): Promise<HealthActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return errorResult('UNAUTHORIZED')

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<HealthActionTxOutcome> => {
      const row = await loadSuggestion(tx, suggestionId, userId)
      if (!row) return errorResult('NOT_FOUND')

      const previousAudit = await tx.resumeHealthAudit.findUnique({
        where: { profileId: row.profileId },
      })
      const previousScore = previousAudit?.overallScore ?? 0

      const claim = await tx.resumeHealthSuggestion.updateMany({
        where: { id: row.id, status: 'DISMISSED' },
        data: { status: 'PENDING', decidedAt: null },
      })
      if (claim.count === 0) {
        return errorResult('CONFLICT')
      }

      return { ok: true, profileId: row.profileId, previousScore }
    })

    if (!outcome.ok) return outcome

    const view = await getResumeHealthForProfile(userId, outcome.profileId)
    if (!view) return errorResult('NOT_FOUND')

    await logDecision('health_suggestion_restored', toLocale(view.language), {})

    return { ok: true, view, previousScore: outcome.previousScore }
  } catch (err) {
    console.error('[resume-health] restore failed', {
      code: err instanceof Error ? err.name : 'UNKNOWN',
    })
    return errorResult('CONFLICT')
  }
}

function toLocale(language: HealthLanguageLike): 'en' | 'ar' {
  return language === 'AR' ? 'ar' : 'en'
}

type HealthLanguageLike = 'EN' | 'AR'

/* ------------------------------------------------------------------ */
/* AI rewrite (spec 0014 task 6)                                       */
/* ------------------------------------------------------------------ */

export type HealthRewriteErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'STALE'
  | 'RATE_LIMITED'
  | 'NO_PROVIDER'
  | 'AI_FAILED'
  | 'UNGROUNDED_REWRITE'

export type HealthRewriteResult =
  | { ok: true; proposedText: string; rationale: string; view: HealthAuditView }
  | { ok: false; error: HealthRewriteErrorCode }

/** What the rewrite transaction resolves before the AI call and view reload. */
type HealthRewriteTxOutcome =
  | {
      ok: true
      profileId: string
      issueTitle: string
      targetLine: string
      kind: 'bullet' | 'summary'
      language: 'EN' | 'AR'
    }
  | { ok: false; error: HealthRewriteErrorCode }

const HealthRewriteSchema = z.object({
  proposedText: z.string().min(1).max(600),
  rationale: z.string().min(1).max(300),
})

/** Every number early in a grounded rewrite check, digits normalized. */
function numbersIn(text: string): Set<string> {
  return new Set(normalizeArabicDigits(text).match(/\d+(?:\.\d+)?/g) ?? [])
}

/** A rewrite may keep or remove numbers, but never invent one. */
function isGroundedRewrite(proposed: string, sources: string[]): boolean {
  const proposedNumbers = numbersIn(proposed)
  if (proposedNumbers.size === 0) return true
  const allowed = new Set(sources.flatMap((source) => Array.from(numbersIn(source))))
  for (const number of proposedNumbers) {
    if (!allowed.has(number)) return false
  }
  return true
}

const REWRITABLE_TARGET_KINDS: HealthTargetKindValue[] = [
  'WORK_EXPERIENCE_BULLET',
  'PROFILE_SUMMARY',
]

/**
 * Builds the professional profile prompt. Contact fields, URLs, and the
 * email are never included, per the spec's security model.
 */
function buildRewritePrompts(input: {
  language: 'EN' | 'AR'
  headline: string | null
  summary: string | null
  roles: Array<{ companyName: string; jobTitle: string; dates: string; bullets: string[] }>
  projects: Array<{
    name: string
    description: string | null
    role: string | null
    technologies: string[]
  }>
  education: Array<{ institution: string; degree: string; dates: string }>
  skills: string[]
  issueTitle: string
  targetLine: string
  kind: 'bullet' | 'summary'
}): { system: string; prompt: string } {
  const langInstruction =
    input.language === 'AR'
      ? 'اكتب الإجابة بالعربية الفصحى الواضحة المستخدمة في السير الذاتية المهنية.'
      : 'Write the answer in clear professional English used in resumes.'

  const rolesText = input.roles
    .map(
      (role) =>
        `- ${role.jobTitle || 'Role'} at ${role.companyName || 'Company'} (${role.dates})\n${role.bullets
          .map((bullet) => `  • ${bullet}`)
          .join('\n')}`,
    )
    .join('\n')

  const projectsText = input.projects
    .map(
      (project) =>
        `- ${project.name}${project.role ? ` (${project.role})` : ''}: ${project.description ?? ''}${
          project.technologies.length > 0 ? ` [${project.technologies.join(', ')}]` : ''
        }`,
    )
    .join('\n')

  const educationText = input.education
    .map((education) => `- ${education.degree} — ${education.institution} (${education.dates})`)
    .join('\n')

  const skillsText = input.skills.join(', ')

  const summaryText = input.summary?.trim() ? input.summary.trim() : '(empty)'

  const subjectText =
    input.kind === 'bullet'
      ? 'Rewrite this single experience bullet so it starts with a strong action verb and includes the concrete result it produced.'
      : 'Rewrite this professional summary so it clearly states the candidate profile with relevant strengths.'

  const system = [
    'You are an expert bilingual resume writer. You rewrite one line of a candidate profile so it lands better with employers and applicant tracking systems.',
    'Rules you must follow:',
    '1. Use only facts already present in the profile context. Never invent employers, dates, tools, metrics, or results.',
    '2. You may keep or drop numbers that appear in the source line or the profile context, but you must never introduce a number that appears nowhere.',
    "3. Keep the candidate's voice. Do not add new claims of responsibility beyond what is implied by the source line.",
    `4. ${langInstruction}`,
    '5. Return only JSON matching the requested schema.',
  ].join('\n')

  const prompt = [
    'Professional profile context (contact details intentionally excluded):',
    input.headline ? `Headline: ${input.headline}` : null,
    `Summary: ${summaryText}`,
    'Roles:',
    rolesText || '(none recorded)',
    'Projects:',
    projectsText || '(none recorded)',
    'Education:',
    educationText || '(none recorded)',
    `Skills: ${skillsText || '(none recorded)'}`,
    '',
    `Issue to fix: ${input.issueTitle}`,
    subjectText,
    `Source line to rewrite:\n"${input.targetLine}"`,
    '',
    'Rewrite it as a single line of at most 600 characters, then give a short rationale of at most 300 characters explaining what you changed and why, grounded in the profile.',
  ]
    .filter((line) => line !== null)
    .join('\n')

  return { system, prompt }
}

export async function generateHealthRewriteAction(
  suggestionId: string,
): Promise<HealthRewriteResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  try {
    const rateKey = hashClientIdentifier(`health_rewrite:${userId}`)
    const rateResult = checkRateLimit(rateKey, AI_REWRITE_LIMIT, AI_REWRITE_WINDOW_MS)
    if (!rateResult.allowed) {
      return { ok: false, error: 'RATE_LIMITED' }
    }

    const outcome = await prisma.$transaction(async (tx): Promise<HealthRewriteTxOutcome> => {
      const row = await tx.resumeHealthSuggestion.findFirst({
        where: { id: suggestionId },
        include: { profile: { select: { id: true, userId: true, language: true } } },
      })
      if (!row || row.profile.userId !== userId) {
        return { ok: false, error: 'NOT_FOUND' }
      }

      if (row.status !== 'PENDING') {
        return { ok: false, error: 'CONFLICT' }
      }

      const targetKind = row.targetKind as HealthTargetKindValue
      if (!REWRITABLE_TARGET_KINDS.includes(targetKind)) {
        return { ok: false, error: 'CONFLICT' }
      }

      const profile = await tx.profile.findUnique({
        where: { id: row.profileId },
        select: {
          id: true,
          language: true,
          headline: true,
          summary: true,
        },
      })
      if (!profile) return { ok: false, error: 'NOT_FOUND' }

      let targetLine = row.originalText
      if (targetKind === 'WORK_EXPERIENCE_BULLET') {
        if (!row.targetId || row.targetIndex === null) {
          return { ok: false, error: 'CONFLICT' }
        }
        const experience = await tx.workExperience.findUnique({
          where: { id: row.targetId },
        })
        if (!experience || experience.profileId !== row.profileId) {
          return { ok: false, error: 'CONFLICT' }
        }
        const current = (experience.bullets ?? [])[row.targetIndex]
        if (current === undefined || current.trim().length === 0) {
          return { ok: false, error: 'CONFLICT' }
        }
        // A stale card was already refreshed by the read path, so its
        // originalText is the current line; anything else is a race.
        if (current.trim() !== row.originalText.trim()) {
          return { ok: false, error: 'STALE' }
        }
        targetLine = current
      } else {
        const current = profile.summary?.trim() ?? ''
        if (current !== row.originalText.trim()) {
          return { ok: false, error: 'STALE' }
        }
        targetLine = current
      }

      const language = (profile.language === 'AR' ? 'AR' : 'EN') as 'EN' | 'AR'
      return {
        ok: true,
        profileId: row.profileId,
        issueTitle: row.title,
        targetLine,
        kind: targetKind === 'WORK_EXPERIENCE_BULLET' ? 'bullet' : 'summary',
        language,
      }
    })

    if (!outcome.ok) {
      return outcome
    }

    // The full professional profile per AC-9, with contact details excluded.
    const contextProfile = await prisma.profile.findUnique({
      where: { id: outcome.profileId },
      include: {
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!contextProfile) {
      return { ok: false, error: 'NOT_FOUND' }
    }

    const activeSettings = await getActiveProviderSettings(userId)
    const settings = activeSettings[0]
    if (!settings || !settings.apiKey) {
      return { ok: false, error: 'NO_PROVIDER' }
    }

    await logDecision('health_rewrite_requested', toLocale(outcome.language), {
      kind: outcome.kind,
    })

    const prompts = buildRewritePrompts({
      language: outcome.language,
      headline: contextProfile.headline,
      summary: contextProfile.summary,
      roles: contextProfile.workExperiences.map((experience) => ({
        companyName: experience.companyName,
        jobTitle: experience.jobTitle,
        dates: `${experience.startDate.toISOString().slice(0, 7)} – ${
          experience.isCurrent ? 'present' : (experience.endDate?.toISOString().slice(0, 7) ?? '?')
        }`,
        bullets: experience.bullets ?? [],
      })),
      projects: contextProfile.projects.map((project) => ({
        name: project.name,
        description: project.description,
        role: project.role,
        technologies: project.technologies ?? [],
      })),
      education: contextProfile.educations.map((education) => ({
        institution: education.institution,
        degree: education.degree,
        dates: `${education.startDate?.toISOString().slice(0, 7) ?? '?'} – ${
          education.endDate?.toISOString().slice(0, 7) ?? 'present'
        }`,
      })),
      skills: contextProfile.skills.map((skill) => skill.name),
      issueTitle: outcome.issueTitle,
      targetLine: outcome.targetLine,
      kind: outcome.kind,
    })

    const model = getProviderModel(settings)
    const groundingSources = [outcome.targetLine, prompts.prompt]

    let generated: { proposedText: string; rationale: string }
    try {
      const { object } = await generateObject({
        model,
        schema: HealthRewriteSchema,
        system: prompts.system,
        prompt: prompts.prompt,
        temperature: 0.4,
        abortSignal: AbortSignal.timeout(AI_REWRITE_TIMEOUT_MS),
      })
      generated = object
    } catch (err) {
      await logDecision('health_rewrite_failed', toLocale(outcome.language), {
        reason: 'AI_FAILED',
      })
      console.error('[resume-health] generateObject failed', {
        name: err instanceof Error ? err.name : 'UNKNOWN',
      })
      return { ok: false, error: 'AI_FAILED' }
    }

    if (!isGroundedRewrite(generated.proposedText, groundingSources)) {
      await logDecision('health_rewrite_failed', toLocale(outcome.language), {
        reason: 'UNGROUNDED_REWRITE',
      })
      return { ok: false, error: 'UNGROUNDED_REWRITE' }
    }

    const saveOutcome: { ok: true } | { ok: false; error: HealthRewriteErrorCode } =
      await prisma.$transaction(
        async (tx): Promise<{ ok: true } | { ok: false; error: HealthRewriteErrorCode }> => {
          const proposedText = generated.proposedText.trim()

          // Only still-pending cards may receive a proposal.
          const claim = await tx.resumeHealthSuggestion.updateMany({
            where: { id: suggestionId, status: 'PENDING' },
            data: {
              proposedText,
              rationale: generated.rationale.trim(),
              isAiGenerated: true,
              isAiStale: false,
            },
          })
          if (claim.count === 0) return { ok: false, error: 'CONFLICT' }

          return { ok: true }
        },
      )
    if (!saveOutcome.ok) return saveOutcome

    const view = await getResumeHealthForProfile(userId, outcome.profileId)
    if (!view) return { ok: false, error: 'NOT_FOUND' }

    return {
      ok: true,
      proposedText: generated.proposedText.trim(),
      rationale: generated.rationale.trim(),
      view,
    }
  } catch (err) {
    console.error('[resume-health] rewrite failed', {
      name: err instanceof Error ? err.name : 'UNKNOWN',
    })
    return { ok: false, error: 'AI_FAILED' }
  }
}

/**
 * Fetches the resume health view for a specific profile id.
 * Strictly scoped to the authenticated session user.
 */
export async function getProfileHealthAction(profileId: string): Promise<HealthAuditView | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null
  return getResumeHealthForProfile(userId, profileId)
}
