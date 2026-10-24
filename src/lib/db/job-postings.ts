import { prisma } from '@/lib/prisma'
import { CreateJobPostingSchema, type CreateJobPostingInput } from '@/lib/validations/job-posting'

/**
 * Creates a job posting record with raw description and parsed skill keywords.
 */
export async function createJobPosting(userId: string, input: CreateJobPostingInput) {
  const validated = CreateJobPostingSchema.parse(input)

  return prisma.jobPosting.create({
    data: {
      userId,
      title: validated.title,
      companyName: validated.companyName,
      jobUrl: validated.jobUrl || null,
      rawDescription: validated.rawDescription,
      parsedSkills: validated.parsedSkills,
    },
  })
}

/**
 * Retrieves all job postings for a given user.
 */
export async function getJobPostingsByUser(userId: string) {
  return prisma.jobPosting.findMany({
    where: {
      userId,
    },
    include: {
      _count: {
        select: {
          applications: true,
          tailoredResumes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Retrieves a single job posting by ID, strictly scoped to userId.
 */
export async function getJobPostingById(userId: string, jobPostingId: string) {
  return prisma.jobPosting.findFirst({
    where: {
      id: jobPostingId,
      userId,
    },
    include: {
      applications: true,
      tailoredResumes: {
        select: {
          id: true,
          title: true,
          atsScore: true,
          createdAt: true,
        },
      },
    },
  })
}

/**
 * Deletes a job posting, strictly scoped to userId.
 * Rejects deletion if active applications link to this job posting (AC-8).
 */
export async function deleteJobPosting(userId: string, jobPostingId: string) {
  const existingApp = await prisma.application.findFirst({
    where: {
      userId,
      jobPostingId,
    },
  })

  if (existingApp) {
    throw new Error(
      'Cannot delete job posting because it is linked to an active job application card. Remove the application card first.',
    )
  }

  const result = await prisma.jobPosting.deleteMany({
    where: {
      id: jobPostingId,
      userId,
    },
  })

  return result.count > 0
}
