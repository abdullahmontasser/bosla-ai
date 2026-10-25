import { prisma } from '@/lib/prisma'
import { Prisma, type Language } from '@prisma/client'
import {
  CreateTailoredResumeSnapshotSchema,
  type CreateTailoredResumeSnapshotInput,
  type AtsBreakdown,
} from '@/lib/validations/tailored-resume'

/**
 * Creates an immutable tailored resume snapshot linked to a job posting and candidate profile.
 */
export async function createTailoredResumeSnapshot(
  userId: string,
  input: CreateTailoredResumeSnapshotInput,
) {
  const validated = CreateTailoredResumeSnapshotSchema.parse(input)

  // Verify profile belongs to user
  const profile = await prisma.profile.findFirst({
    where: {
      id: validated.profileId,
      userId,
    },
  })

  if (!profile) {
    throw new Error('Candidate profile not found or access denied.')
  }

  // Verify job posting belongs to user
  const jobPosting = await prisma.jobPosting.findFirst({
    where: {
      id: validated.jobPostingId,
      userId,
    },
  })

  if (!jobPosting) {
    throw new Error('Target job posting not found or access denied.')
  }

  const title = validated.title || `${jobPosting.companyName} - ${jobPosting.title}`

  return prisma.tailoredResume.create({
    data: {
      userId,
      profileId: validated.profileId,
      jobPostingId: validated.jobPostingId,
      language: validated.language as Language,
      title,
      atsScore: validated.atsScore ?? null,
      missingSkills: validated.missingSkills,
      atsBreakdown: validated.atsBreakdown
        ? (validated.atsBreakdown as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      tailoredSummary: validated.tailoredSummary || null,
      tailoredContent: validated.tailoredContent as unknown as Prisma.InputJsonValue,
      outreachMessage: validated.outreachMessage
        ? (validated.outreachMessage as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      interviewPrep: validated.interviewPrep
        ? (validated.interviewPrep as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      lastExportedAt: validated.lastExportedAt || null,
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
        },
      },
      profile: {
        select: {
          id: true,
          fullName: true,
          language: true,
        },
      },
    },
  })
}

/**
 * Retrieves a single tailored resume snapshot by ID, strictly scoped to userId.
 */
export async function getTailoredResumeById(userId: string, tailoredResumeId: string) {
  return prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
    include: {
      jobPosting: true,
      profile: {
        include: {
          skills: true,
          workExperiences: true,
          educations: true,
        },
      },
    },
  })
}

/**
 * Retrieves all tailored resumes for a user, optionally filtered by job posting.
 */
export async function getTailoredResumesByUser(userId: string, jobPostingId?: string) {
  return prisma.tailoredResume.findMany({
    where: {
      userId,
      ...(jobPostingId && { jobPostingId }),
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Updates the ATS score and breakdown on a tailored resume.
 */
export async function updateTailoredResumeAtsScore(
  userId: string,
  tailoredResumeId: string,
  atsScore: number,
  atsBreakdown: AtsBreakdown,
  missingSkills?: string[],
) {
  const existing = await prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
  })

  if (!existing) {
    throw new Error('Tailored resume not found or access denied.')
  }

  return prisma.tailoredResume.update({
    where: {
      id: tailoredResumeId,
    },
    data: {
      atsScore,
      atsBreakdown: atsBreakdown as unknown as Prisma.InputJsonValue,
      ...(missingSkills && { missingSkills }),
    },
  })
}

/**
 * Updates the tailored content snapshot for a resume.
 */
export async function updateTailoredResumeContent(
  userId: string,
  tailoredResumeId: string,
  tailoredContent: Record<string, unknown>,
  markStale: boolean = true,
) {
  const existing = await prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
  })

  if (!existing) {
    throw new Error('Tailored resume not found or access denied.')
  }

  let updatedBreakdown: Prisma.InputJsonValue | undefined = existing.atsBreakdown ?? undefined
  if (markStale && existing.atsBreakdown && typeof existing.atsBreakdown === 'object') {
    updatedBreakdown = {
      ...(existing.atsBreakdown as Record<string, unknown>),
      isStale: true,
    } as unknown as Prisma.InputJsonValue
  }

  return prisma.tailoredResume.update({
    where: {
      id: tailoredResumeId,
    },
    data: {
      tailoredContent: tailoredContent as unknown as Prisma.InputJsonValue,
      ...(updatedBreakdown ? { atsBreakdown: updatedBreakdown } : {}),
    },
  })
}

/**
 * Updates the missing skills array on a tailored resume.
 */
export async function updateTailoredResumeMissingSkills(
  userId: string,
  tailoredResumeId: string,
  missingSkills: string[],
) {
  const existing = await prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
  })

  if (!existing) {
    throw new Error('Tailored resume not found or access denied.')
  }

  return prisma.tailoredResume.update({
    where: {
      id: tailoredResumeId,
    },
    data: {
      missingSkills,
    },
  })
}

/**
 * Records the last exported timestamp when a user downloads the PDF resume.
 */
export async function recordResumeExportTimestamp(userId: string, tailoredResumeId: string) {
  const existing = await prisma.tailoredResume.findFirst({
    where: {
      id: tailoredResumeId,
      userId,
    },
  })

  if (!existing) {
    throw new Error('Tailored resume not found or access denied.')
  }

  return prisma.tailoredResume.update({
    where: {
      id: tailoredResumeId,
    },
    data: {
      lastExportedAt: new Date(),
    },
  })
}
