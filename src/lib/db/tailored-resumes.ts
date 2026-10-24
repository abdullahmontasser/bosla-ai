import { prisma } from '@/lib/prisma'
import { Prisma, type Language } from '@prisma/client'
import {
  CreateTailoredResumeSnapshotSchema,
  type CreateTailoredResumeSnapshotInput,
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
      tailoredSummary: validated.tailoredSummary || null,
      tailoredContent: validated.tailoredContent as unknown as Prisma.InputJsonValue,
      outreachMessage: validated.outreachMessage
        ? (validated.outreachMessage as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      interviewPrep: validated.interviewPrep
        ? (validated.interviewPrep as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      pdfExportPath: validated.pdfExportPath || null,
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
      profile: true,
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
