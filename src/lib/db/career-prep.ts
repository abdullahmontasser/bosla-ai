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
}

export interface CareerPrepDataResult {
  selectorRows: CareerPrepSelectorRow[]
  hasMore: boolean
  selectedResume: CareerPrepSelectedResume | null
  fallbackNotice: boolean
}

/**
 * Retrieves selector rows capped at limit (default 50) newest postings first.
 * Each row points to the newest tailored resume for that posting.
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

  const seenJobPostingIds = new Set<string>()
  const uniqueRows: CareerPrepSelectorRow[] = []

  for (const r of resumes) {
    if (!seenJobPostingIds.has(r.jobPostingId) && r.jobPosting) {
      seenJobPostingIds.add(r.jobPostingId)
      const prep = normalizeInterviewPrepPayload(r.interviewPrep)
      // Prep exists when the AI question set is present; a custom-only draft is not yet "Ready".
      const hasInterviewPrep = Boolean(prep && prep.questions.some((q) => !q.customOrigin))

      uniqueRows.push({
        jobPostingId: r.jobPostingId,
        tailoredResumeId: r.id,
        companyName: r.jobPosting.companyName,
        roleTitle: r.jobPosting.title,
        hasInterviewPrep,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      })
    }
  }

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
