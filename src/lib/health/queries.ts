import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

import { HEALTH_RULE_SET_VERSION } from './constants'
import {
  evaluateProfileHealth,
  fingerprintIssue,
  type HealthBreakdown,
  type HealthCategoryValue,
  type HealthLanguage,
  type HealthProfileInput,
  type HealthTargetKindValue,
} from './rules'

/**
 * Read helpers for the base resume health audit. Reads load the profile
 * with every scored child in one query, recalculate when the profile or a
 * related row is newer than the stored audit or the rule set moved, and
 * merge issue cards by fingerprint. Accepted and dismissed cards survive
 * every recalculation; only pending cards that no longer match an issue
 * disappear (spec 0014, AC-8, AC-12).
 */

export type HealthSuggestionStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED'

export interface HealthSuggestionDTO {
  id: string
  category: HealthCategoryValue
  title: string
  rationale: string
  targetKind: HealthTargetKindValue
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
  proposedText: string | null
  status: HealthSuggestionStatus
  isAiGenerated: boolean
  isAiStale: boolean
  fingerprint: string
  decidedAt: Date | null
}

export interface HealthAuditView {
  profileId: string
  language: HealthLanguage
  overallScore: number
  breakdown: HealthBreakdown
  suggestions: HealthSuggestionDTO[]
  excludedCount: number
  openCount: number
  recalculated: boolean
}

const PROFILE_HEALTH_INCLUDE = {
  workExperiences: { orderBy: { sortOrder: 'asc' as const } },
  educations: { orderBy: { sortOrder: 'asc' as const } },
  skills: { orderBy: { sortOrder: 'asc' as const } },
  projects: { orderBy: { sortOrder: 'asc' as const } },
  healthAudit: true,
} satisfies Prisma.ProfileInclude

type ProfileHealthRow = Prisma.ProfileGetPayload<{ include: typeof PROFILE_HEALTH_INCLUDE }>

const CATEGORY_ORDER: Record<string, number> = {
  IMPACT_METRICS: 0,
  ACTION_VERBS: 1,
  ATS_COMPLETENESS: 2,
  CONTENT_DEPTH: 3,
}

function sortSuggestions(a: HealthSuggestionDTO, b: HealthSuggestionDTO): number {
  const categoryDiff = (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9)
  if (categoryDiff !== 0) return categoryDiff
  if (a.targetId !== b.targetId) return (a.targetId ?? '').localeCompare(b.targetId ?? '')
  return (a.targetIndex ?? -1) - (b.targetIndex ?? -1)
}

function toProfileInput(profile: ProfileHealthRow): HealthProfileInput {
  return {
    id: profile.id,
    language: profile.language === 'AR' ? 'AR' : 'EN',
    fullName: profile.fullName ?? '',
    headline: profile.headline,
    summary: profile.summary,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    websiteUrl: profile.websiteUrl,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    workExperiences: profile.workExperiences.map((experience) => ({
      id: experience.id,
      companyName: experience.companyName,
      jobTitle: experience.jobTitle,
      bullets: experience.bullets ?? [],
    })),
    educations: profile.educations.map((education) => ({
      id: education.id,
      institution: education.institution,
      degree: education.degree,
      startDate: education.startDate,
      endDate: education.endDate,
    })),
    skills: profile.skills.map((skill) => ({ id: skill.id, name: skill.name })),
  }
}

function toSuggestionDTO(row: {
  id: string
  category: string
  title: string
  rationale: string
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
}): HealthSuggestionDTO {
  return {
    id: row.id,
    category: row.category as HealthCategoryValue,
    title: row.title,
    rationale: row.rationale,
    targetKind: row.targetKind as HealthTargetKindValue,
    targetId: row.targetId,
    targetIndex: row.targetIndex,
    targetField: row.targetField,
    originalText: row.originalText,
    proposedText: row.proposedText,
    status: row.status as HealthSuggestionStatus,
    isAiGenerated: row.isAiGenerated,
    isAiStale: row.isAiStale,
    fingerprint: row.fingerprint,
    decidedAt: row.decidedAt,
  }
}

function normalizeBreakdown(value: unknown): HealthBreakdown {
  return value as HealthBreakdown
}

/**
 * Resolves the profile whose language matches the audit target, falling back
 * to the other language row when the requested one does not exist. Returns
 * null when the user has no profile at all: the read never creates one.
 */
export async function loadProfileForHealth(
  userId: string,
  language: HealthLanguage,
): Promise<ProfileHealthRow | null> {
  const requested = await prisma.profile.findFirst({
    where: { userId, language },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    include: PROFILE_HEALTH_INCLUDE,
  })
  if (requested) return requested

  const fallback = await prisma.profile.findFirst({
    where: { userId, language: language === 'AR' ? 'EN' : 'AR' },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    include: PROFILE_HEALTH_INCLUDE,
  })
  return fallback
}

function profileFreshnessUpdatedAt(profile: ProfileHealthRow): number {
  let latest = profile.updatedAt.getTime()
  for (const experience of profile.workExperiences) {
    latest = Math.max(latest, experience.updatedAt.getTime())
  }
  for (const education of profile.educations) {
    latest = Math.max(latest, education.updatedAt.getTime())
  }
  for (const skill of profile.skills) {
    latest = Math.max(latest, skill.updatedAt.getTime())
  }
  for (const project of profile.projects) {
    latest = Math.max(latest, project.updatedAt.getTime())
  }
  return latest
}

/** Resolves the text a card currently points at, or null when it is gone. */
export function resolveCurrentTargetText(
  profile: HealthProfileInput,
  targetKind: HealthTargetKindValue,
  targetId: string | null,
  targetIndex: number | null,
  targetField: string | null,
): string | null {
  const experience = targetId
    ? profile.workExperiences.find((item) => item.id === targetId)
    : undefined

  switch (targetKind) {
    case 'WORK_EXPERIENCE_BULLET': {
      if (!experience || targetIndex === null) return null
      const bullet = experience.bullets[targetIndex]
      return bullet?.trim() ? bullet.trim() : null
    }
    case 'WORK_EXPERIENCE':
      if (!experience) return null
      return `${experience.companyName.trim() || '—'} · ${experience.jobTitle.trim() || '—'}`
    case 'PROFILE_SUMMARY':
      return profile.summary?.trim() ?? ''
    case 'PROFILE_CONTACT': {
      if (targetField === 'email') return profile.email?.trim() ?? ''
      if (targetField === 'phone') return profile.phone?.trim() ?? ''
      if (targetField === 'location') return profile.location?.trim() ?? ''
      if (targetField === 'linkedinUrl') return profile.linkedinUrl?.trim() ?? ''
      if (targetField === 'websiteUrl') return profile.websiteUrl?.trim() ?? ''
      return ''
    }
    case 'PROFILE_SKILLS':
      return String(profile.skills.length)
    case 'PROFILE_EDUCATION': {
      if (!targetId) return ''
      const education = profile.educations.find((item) => item.id === targetId)
      if (!education) return null
      return `${education.institution.trim() || '—'} · ${education.degree.trim() || '—'}`
    }
    case 'PROFILE_GENERAL':
      return ''
  }
}

interface StoredSuggestion {
  id: string
  category: string
  title: string
  rationale: string
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

/**
 * The transactional core of the audit: regenerates issues, resolves stale
 * AI text, deletes unmatched pending cards, restores reverted accepted
 * cards, and upserts the audit row in place. Runs fully inside an
 * interactive transaction.
 */
export async function recalculateAudit(profileId: string): Promise<{
  audit: { id: string; overallScore: number; breakdown: HealthBreakdown }
  suggestions: HealthSuggestionDTO[]
  recalculated: boolean
}> {
  return prisma.$transaction(async (tx) => {
    const profileRow = await tx.profile.findFirst({
      where: { id: profileId },
      include: PROFILE_HEALTH_INCLUDE,
    })
    if (!profileRow) throw new Error('PROFILE_NOT_FOUND')

    const existingAudit = await tx.resumeHealthAudit.findUnique({ where: { profileId } })
    const allSuggestions = (await tx.resumeHealthSuggestion.findMany({
      where: { profileId },
    })) as unknown as StoredSuggestion[]

    const freshness = profileFreshnessUpdatedAt(profileRow)
    const needsRecalc =
      !existingAudit ||
      existingAudit.ruleSetVersion !== HEALTH_RULE_SET_VERSION ||
      existingAudit.updatedAt.getTime() < freshness

    if (!needsRecalc) {
      const rows = allSuggestions
        .filter((row) => row.auditId === existingAudit!.id)
        .map(toSuggestionDTO)
        .sort(sortSuggestions)
      return {
        audit: {
          id: existingAudit!.id,
          overallScore: existingAudit!.overallScore,
          breakdown: normalizeBreakdown(existingAudit!.breakdown as unknown),
        },
        suggestions: rows,
        recalculated: false,
      }
    }

    const profileInput = toProfileInput(profileRow)
    const generated = evaluateProfileHealth(profileInput)
    const generatedByFingerprint = new Map(
      generated.issues.map((issue) => [issue.fingerprint, issue]),
    )
    const breakdown = evaluateProfileHealth(
      profileInput,
      new Set(
        allSuggestions
          .filter(
            (row) => row.status === 'DISMISSED' && generatedByFingerprint.has(row.fingerprint),
          )
          .map((row) => row.fingerprint),
      ),
    ).breakdown

    const auditId = existingAudit ? existingAudit.id : null
    const resolveText = (row: StoredSuggestion): string | null =>
      resolveCurrentTargetText(
        profileInput,
        row.targetKind as HealthTargetKindValue,
        row.targetId,
        row.targetIndex,
        row.targetField,
      )

    for (const row of allSuggestions) {
      if (row.status !== 'PENDING' && row.status !== 'ACCEPTED') continue

      if (row.status === 'PENDING') {
        if (row.proposedText) {
          const current = resolveText(row)
          if (current === null || current.length === 0) {
            await tx.resumeHealthSuggestion.delete({ where: { id: row.id } })
            continue
          }
          if (current !== row.originalText) {
            const refreshedFingerprint = fingerprintIssue({
              category: row.category as HealthCategoryValue,
              title: row.title,
              rationale: row.rationale,
              targetKind: row.targetKind as HealthTargetKindValue,
              targetId: row.targetId,
              targetIndex: row.targetIndex,
              targetField: row.targetField,
              originalText: current,
            })
            const generatedIssue = generatedByFingerprint.get(refreshedFingerprint)
            if (!generatedIssue) {
              await tx.resumeHealthSuggestion.delete({ where: { id: row.id } })
              continue
            }
            await tx.resumeHealthSuggestion.update({
              where: { id: row.id },
              data: {
                originalText: current,
                fingerprint: refreshedFingerprint,
                title: generatedIssue.title,
                rationale: generatedIssue.rationale,
                targetId: generatedIssue.targetId,
                targetIndex: generatedIssue.targetIndex,
                targetField: generatedIssue.targetField,
                isAiStale: true,
                auditId,
              },
            })
            continue
          }
        } else if (!generatedByFingerprint.has(row.fingerprint)) {
          await tx.resumeHealthSuggestion.delete({ where: { id: row.id } })
          continue
        }
        if (row.auditId !== auditId) {
          await tx.resumeHealthSuggestion.update({ where: { id: row.id }, data: { auditId } })
        }
        continue
      }

      // ACCEPTED card whose fingerprint matches a live issue: the candidate
      // reverted the text after accepting, so the card goes back to pending
      // while keeping its proposed rewrite.
      if (generatedByFingerprint.has(row.fingerprint)) {
        const current = resolveText(row)
        if (current !== null && current !== row.proposedText) {
          await tx.resumeHealthSuggestion.update({
            where: { id: row.id },
            data: { status: 'PENDING', decidedAt: null, auditId },
          })
        }
      }
    }

    const keptRows = (await tx.resumeHealthSuggestion.findMany({
      where: { profileId },
    })) as unknown as StoredSuggestion[]
    const keptFingerprints = new Set(keptRows.map((row) => row.fingerprint))
    for (const issue of generated.issues) {
      if (keptFingerprints.has(issue.fingerprint)) continue
      await tx.resumeHealthSuggestion.create({
        data: {
          profileId,
          auditId,
          category: issue.category as Prisma.ResumeHealthSuggestionUncheckedCreateInput['category'],
          title: issue.title,
          rationale: issue.rationale,
          targetKind:
            issue.targetKind as Prisma.ResumeHealthSuggestionUncheckedCreateInput['targetKind'],
          targetId: issue.targetId,
          targetIndex: issue.targetIndex,
          targetField: issue.targetField,
          originalText: issue.originalText,
          fingerprint: issue.fingerprint,
          status: 'PENDING',
        },
      })
    }

    const auditData: Prisma.ResumeHealthAuditUncheckedCreateInput = {
      profileId,
      overallScore: breakdown.overallScore,
      breakdown: breakdown as unknown as Prisma.InputJsonValue,
      ruleSetVersion: HEALTH_RULE_SET_VERSION,
    }
    const upsertedAudit = await tx.resumeHealthAudit.upsert({
      where: { profileId },
      create: auditData,
      update: {
        overallScore: auditData.overallScore,
        breakdown: auditData.breakdown,
        ruleSetVersion: auditData.ruleSetVersion,
      },
    })

    const finalRows = (await tx.resumeHealthSuggestion.findMany({
      where: { profileId, auditId: upsertedAudit.id },
    })) as unknown as StoredSuggestion[]

    return {
      audit: {
        id: upsertedAudit.id,
        overallScore: upsertedAudit.overallScore,
        breakdown,
      },
      suggestions: finalRows.map(toSuggestionDTO).sort(sortSuggestions),
      recalculated: true,
    }
  })
}

function buildView(
  profile: ProfileHealthRow,
  result: Awaited<ReturnType<typeof recalculateAudit>>,
): HealthAuditView {
  return {
    profileId: profile.id,
    language: profile.language === 'AR' ? 'AR' : 'EN',
    overallScore: result.audit.overallScore,
    breakdown: result.audit.breakdown,
    suggestions: result.suggestions,
    excludedCount: result.audit.breakdown.excludedCount,
    openCount: result.suggestions.filter((card) => card.status === 'PENDING').length,
    recalculated: result.recalculated,
  }
}

/**
 * The audit for the language of the page (or of the in panel switch,
 * `auditLang`). Returns null when the user has no profile, so the caller
 * can render the guided empty state (AC-1).
 */
export async function getResumeHealthForLanguage(
  userId: string,
  language: HealthLanguage,
): Promise<HealthAuditView | null> {
  const profile = await loadProfileForHealth(userId, language)
  if (!profile) return null
  const result = await recalculateAudit(profile.id)
  return buildView(profile, result)
}

/**
 * The audit for a specific profile. `/profile` passes the profile it
 * already loaded; the helper re-loads scoring inputs in one query.
 */
export async function getResumeHealthForProfile(
  userId: string,
  profileId: string,
): Promise<HealthAuditView | null> {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
    include: PROFILE_HEALTH_INCLUDE,
  })
  if (!profile) return null
  const result = await recalculateAudit(profile.id)
  return buildView(profile, result)
}
