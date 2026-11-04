import { prisma } from '@/lib/prisma'
import {
  normalizeInterviewPrepPayload,
  type InterviewPrepPayload,
} from '@/lib/validations/career-prep'

export interface CareerPrepSelectorRow {
  jobPostingId: string
  tailoredResumeId: string
  companyName: string
  roleTitle: string
  hasInterviewPrep: boolean
  createdAt: string
}

export interface CareerPrepSelectorResult {
  rows: CareerPrepSelectorRow[]
  hasMore: boolean
  nextOffset: number
}

export interface CareerPrepSelectedResume {
  id: string
  jobPostingId: string
  roleTitle: string
  companyName: string
  language: 'EN' | 'AR'
  payload: InterviewPrepPayload | null
  hasGrounding: boolean
  jobDescription?: string
  parsedSkills?: string[]
  groundingSources?: {
    workExperiences: string[]
    projects: string[]
  }
}

export interface CareerPrepDataResult {
  selectorRows: CareerPrepSelectorRow[]
  hasMore: boolean
  selectedResume: CareerPrepSelectedResume | null
  fallbackNotice: boolean
}

function normalizeRoleKey(title: string, company: string): string {
  const t = title.toLowerCase().replace(/\s+/g, ' ').trim()
  const c = company.toLowerCase().replace(/\s+/g, ' ').trim()
  return `${t}:::${c}`
}

/**
 * Retrieves selector rows capped at limit (default 50) newest postings first.
 * Strictly deduplicates roles by title and company name so identical jobs never appear twice.
 * When multiple tailored resumes exist for the same role, prefers the one with interview prep.
 */
export async function getCareerPrepSelectorRows(
  userId: string,
  options?: { offset?: number; limit?: number },
): Promise<CareerPrepSelectorResult> {
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 50

  const resumes = await prisma.tailoredResume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      jobPostingId: true,
      interviewPrep: true,
      createdAt: true,
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
        },
      },
    },
  })

  // Group resumes by normalized (title + company) to guarantee zero duplicate roles in selector
  type ResumeRow = (typeof resumes)[number]
  const groupedByRole = new Map<
    string,
    {
      newest: ResumeRow
      withPrep: ResumeRow | null
    }
  >()

  for (const r of resumes) {
    if (!r.jobPosting) continue

    const roleKey = normalizeRoleKey(r.jobPosting.title, r.jobPosting.companyName)
    const prep = normalizeInterviewPrepPayload(r.interviewPrep)
    const hasInterviewPrep = Boolean(prep && prep.questions.some((q) => !q.customOrigin))

    const existing = groupedByRole.get(roleKey)
    if (!existing) {
      groupedByRole.set(roleKey, {
        newest: r,
        withPrep: hasInterviewPrep ? r : null,
      })
    } else {
      // If an existing group lacks prep but this older copy has prep, keep the prep copy
      if (hasInterviewPrep && !existing.withPrep) {
        existing.withPrep = r
      }
    }
  }

  const uniqueRows: CareerPrepSelectorRow[] = []

  for (const [, group] of groupedByRole) {
    // Prefer the resume with prep if available; otherwise newest
    const chosen = group.withPrep || group.newest
    const prep = normalizeInterviewPrepPayload(chosen.interviewPrep)
    const hasInterviewPrep = Boolean(prep && prep.questions.some((q) => !q.customOrigin))

    uniqueRows.push({
      jobPostingId: chosen.jobPostingId,
      tailoredResumeId: chosen.id,
      companyName: chosen.jobPosting.companyName,
      roleTitle: chosen.jobPosting.title,
      hasInterviewPrep,
      createdAt:
        chosen.createdAt instanceof Date
          ? chosen.createdAt.toISOString()
          : String(chosen.createdAt),
    })
  }

  // Sort newest first
  uniqueRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const pagedRows = uniqueRows.slice(offset, offset + limit)
  const hasMore = offset + limit < uniqueRows.length

  return {
    rows: pagedRows,
    hasMore,
    nextOffset: offset + pagedRows.length,
  }
}

/**
 * Resolves career prep hub data for a user.
 * Supports URL param selection with graceful fallback on missing, unknown, or unowned ID.
 * Computes the grounding flag from the candidate profile experiences and projects.
 */
export async function getCareerPrepData(
  userId: string,
  tailoredResumeId?: string | null,
): Promise<CareerPrepDataResult> {
  const selectorResult = await getCareerPrepSelectorRows(userId, { offset: 0, limit: 50 })

  if (selectorResult.rows.length === 0) {
    return {
      selectorRows: [],
      hasMore: false,
      selectedResume: null,
      fallbackNotice: false,
    }
  }

  let fallbackNotice = false
  let targetResume = null

  if (tailoredResumeId) {
    targetResume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            workExperiences: true,
            projects: true,
          },
        },
      },
    })

    if (!targetResume) {
      fallbackNotice = true
    }
  }

  if (!targetResume) {
    const fallbackId = selectorResult.rows[0].tailoredResumeId
    targetResume = await prisma.tailoredResume.findFirst({
      where: {
        id: fallbackId,
        userId,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            workExperiences: true,
            projects: true,
          },
        },
      },
    })
  }

  if (!targetResume) {
    return {
      selectorRows: selectorResult.rows,
      hasMore: selectorResult.hasMore,
      selectedResume: null,
      fallbackNotice,
    }
  }

  const hasGrounding =
    (targetResume.profile?.workExperiences?.length ?? 0) +
      (targetResume.profile?.projects?.length ?? 0) >
    0

  const payload = normalizeInterviewPrepPayload(targetResume.interviewPrep)

  const workExpTitles =
    targetResume.profile?.workExperiences?.map((w) => `${w.jobTitle} at ${w.companyName}`) ?? []
  const projectTitles = targetResume.profile?.projects?.map((p) => p.name) ?? []

  return {
    selectorRows: selectorResult.rows,
    hasMore: selectorResult.hasMore,
    selectedResume: {
      id: targetResume.id,
      jobPostingId: targetResume.jobPostingId,
      roleTitle: targetResume.jobPosting.title,
      companyName: targetResume.jobPosting.companyName,
      language: (targetResume.language === 'AR' ? 'AR' : 'EN') as 'EN' | 'AR',
      payload,
      hasGrounding,
      jobDescription: targetResume.jobPosting.rawDescription ?? '',
      parsedSkills: targetResume.jobPosting.parsedSkills ?? [],
      groundingSources: {
        workExperiences: workExpTitles,
        projects: projectTitles,
      },
    },
    fallbackNotice,
  }
}

/**
 * Resolves owned tailored resume payload for the print route.
 */
export async function getCareerPrepPrintData(userId: string, tailoredResumeId: string) {
  const resume = await prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
    include: {
      jobPosting: true,
    },
  })

  if (!resume) {
    return null
  }

  const payload = normalizeInterviewPrepPayload(resume.interviewPrep)
  return {
    id: resume.id,
    jobPostingId: resume.jobPostingId,
    roleTitle: resume.jobPosting.title,
    companyName: resume.jobPosting.companyName,
    language: (resume.language === 'AR' ? 'AR' : 'EN') as 'EN' | 'AR',
    payload,
    generatedAt: payload?.generatedAt || null,
    updatedAt: payload?.updatedAt || resume.updatedAt.toISOString(),
  }
}
