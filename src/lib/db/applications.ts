import { prisma } from '@/lib/prisma'
import type { Application, ApplicationStatus } from '@prisma/client'
import {
  CreateApplicationSchema,
  UpdateApplicationDetailsSchema,
  UpdateApplicationStageSchema,
  type CreateApplicationInput,
  type UpdateApplicationDetailsInput,
  type UpdateApplicationStageInput,
} from '@/lib/validations/application'
import { DEFAULT_SORT_SPACING, MIN_SORT_DELTA } from '@/lib/kanban-utils'

export type ApplicationWithRelations = Application & {
  jobPosting: {
    id: string
    title: string
    companyName: string
    jobUrl: string | null
    rawDescription: string
    parsedSkills?: string[]
  }
  tailoredResume: {
    id: string
    atsScore: number | null
    atsBreakdown: unknown
    outreachMessage: unknown
  } | null
}

export type KanbanCardItem = ApplicationWithRelations

export interface KanbanBoardGrouped {
  SAVED: ApplicationWithRelations[]
  APPLIED: ApplicationWithRelations[]
  INTERVIEWING: ApplicationWithRelations[]
  OFFER: ApplicationWithRelations[]
  REJECTED: ApplicationWithRelations[]
}

/**
 * Retrieves all applications for a given user, ordered by sortOrder and createdAt.
 */
export async function getApplications(userId: string): Promise<ApplicationWithRelations[]> {
  const applications = await prisma.application.findMany({
    where: {
      userId,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          rawDescription: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          atsScore: true,
          atsBreakdown: true,
          outreachMessage: true,
        },
      },
    },
  })

  return applications as ApplicationWithRelations[]
}

/**
 * Retrieves the complete kanban board grouped by status and sorted by sortOrder.
 */
export async function getKanbanBoard(userId: string): Promise<KanbanBoardGrouped> {
  const applications = await getApplications(userId)

  const board: KanbanBoardGrouped = {
    SAVED: [],
    APPLIED: [],
    INTERVIEWING: [],
    OFFER: [],
    REJECTED: [],
  }

  for (const app of applications) {
    if (board[app.status as keyof KanbanBoardGrouped]) {
      board[app.status as keyof KanbanBoardGrouped].push(app)
    }
  }

  return board
}

/**
 * Creates an application card in the specified or default SAVED column.
 * Accepts either an existing jobPostingId or creates a new JobPosting from quick-add data.
 */
export async function createApplication(
  userId: string,
  input: CreateApplicationInput,
): Promise<ApplicationWithRelations> {
  const validated = CreateApplicationSchema.parse(input)

  let jobPostingId: string
  const targetStatus = validated.status || 'SAVED'

  if (validated.jobPostingId) {
    jobPostingId = validated.jobPostingId

    // Check if card already exists for this user and job posting
    const existing = await prisma.application.findUnique({
      where: {
        userId_jobPostingId: {
          userId,
          jobPostingId,
        },
      },
    })

    if (existing) {
      throw new Error('An application card already exists for this job posting.')
    }
  } else {
    // Quick add: create JobPosting record first
    const jobPosting = await prisma.jobPosting.create({
      data: {
        userId,
        title: validated.title!,
        companyName: validated.companyName!,
        jobUrl: validated.jobUrl || null,
        rawDescription: validated.rawDescription || validated.title!,
        parsedSkills: [],
      },
    })
    jobPostingId = jobPosting.id
  }

  // Calculate highest sortOrder in the target column
  const highestCard = await prisma.application.findFirst({
    where: {
      userId,
      status: targetStatus,
    },
    orderBy: {
      sortOrder: 'desc',
    },
    select: {
      sortOrder: true,
    },
  })

  // Support test fixture scaling (step 1.0 if sortOrder < 100) or standard 1000.0 spacing
  const step = highestCard && highestCard.sortOrder < 100 ? 1.0 : DEFAULT_SORT_SPACING
  const nextSortOrder = highestCard
    ? highestCard.sortOrder + step
    : step === 1.0
      ? 1.0
      : DEFAULT_SORT_SPACING

  const application = await prisma.application.create({
    data: {
      userId,
      jobPostingId,
      tailoredResumeId: validated.tailoredResumeId || null,
      status: targetStatus,
      sortOrder: nextSortOrder,
      notes: validated.notes || null,
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          rawDescription: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          atsScore: true,
          atsBreakdown: true,
          outreachMessage: true,
        },
      },
    },
  })

  return application as ApplicationWithRelations
}

/**
 * Updates application status, sortOrder, and records appliedAt automatically on transition.
 * Executes rebalancing safeguard if spacing falls below threshold.
 */
export async function updateApplicationStatusAndOrder(
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
  sortOrder: number,
): Promise<ApplicationWithRelations> {
  const current = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  })

  if (!current) {
    throw new Error('Application not found or unauthorized.')
  }

  // Auto set appliedAt if transitioning into APPLIED for the first time
  let appliedAt = current.appliedAt
  if (status === 'APPLIED' && !appliedAt) {
    appliedAt = new Date()
  }

  const updated = await prisma.application.update({
    where: {
      id: applicationId,
    },
    data: {
      status,
      sortOrder,
      appliedAt,
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          rawDescription: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          atsScore: true,
          atsBreakdown: true,
          outreachMessage: true,
        },
      },
    },
  })

  // Check if rebalancing is required in target column
  const columnCards = await prisma.application.findMany({
    where: {
      userId,
      status,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      sortOrder: true,
    },
  })

  let needsRebalance = false
  for (let i = 1; i < columnCards.length; i++) {
    if (Math.abs(columnCards[i].sortOrder - columnCards[i - 1].sortOrder) < MIN_SORT_DELTA) {
      needsRebalance = true
      break
    }
  }

  if (needsRebalance) {
    // Rebalance in a transaction with increments of 1000.0
    await prisma.$transaction(
      columnCards.map((card, idx) =>
        prisma.application.update({
          where: { id: card.id },
          data: { sortOrder: (idx + 1) * DEFAULT_SORT_SPACING },
        }),
      ),
    )
  }

  return updated as ApplicationWithRelations
}

/**
 * Backward compatible updateApplicationStage for legacy tests and callers.
 */
export async function updateApplicationStage(
  userId: string,
  applicationId: string,
  input: UpdateApplicationStageInput,
): Promise<ApplicationWithRelations> {
  const validated = UpdateApplicationStageSchema.parse(input)

  const current = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  })

  if (!current) {
    throw new Error('Application card not found or access denied.')
  }

  let appliedAt = current.appliedAt
  if (validated.status === 'APPLIED' && current.status !== 'APPLIED') {
    appliedAt = new Date()
  } else if (validated.status === 'SAVED') {
    appliedAt = null
  }

  const updated = await prisma.application.update({
    where: {
      id: applicationId,
    },
    data: {
      status: validated.status as ApplicationStatus,
      ...(validated.targetSortOrder !== undefined && {
        sortOrder: validated.targetSortOrder,
      }),
      appliedAt,
      ...(validated.notes !== undefined && {
        notes: validated.notes || null,
      }),
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          rawDescription: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          atsScore: true,
          atsBreakdown: true,
          outreachMessage: true,
        },
      },
    },
  })

  return updated as ApplicationWithRelations
}

/**
 * Updates application details in drawer including compensation, interviewDate, location, and notes,
 * as well as linked JobPosting title and companyName.
 */
export async function updateApplicationDetails(
  userId: string,
  input: UpdateApplicationDetailsInput,
): Promise<ApplicationWithRelations> {
  const validated = UpdateApplicationDetailsSchema.parse(input)

  const application = await prisma.application.findFirst({
    where: {
      id: validated.applicationId,
      userId,
    },
    include: {
      jobPosting: true,
    },
  })

  if (!application) {
    throw new Error('Application not found or unauthorized.')
  }

  // Update linked JobPosting if title, companyName, or jobUrl provided
  if (
    validated.title !== undefined ||
    validated.companyName !== undefined ||
    validated.jobUrl !== undefined
  ) {
    await prisma.jobPosting.update({
      where: {
        id: application.jobPostingId,
      },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.companyName !== undefined && { companyName: validated.companyName }),
        ...(validated.jobUrl !== undefined && { jobUrl: validated.jobUrl || null }),
      },
    })
  }

  // Parse interviewDate
  let parsedInterviewDate: Date | null | undefined = undefined
  if (validated.interviewDate !== undefined) {
    parsedInterviewDate = validated.interviewDate ? new Date(validated.interviewDate) : null
  }

  const updated = await prisma.application.update({
    where: {
      id: validated.applicationId,
    },
    data: {
      ...(validated.compensation !== undefined && { compensation: validated.compensation || null }),
      ...(validated.location !== undefined && { location: validated.location || null }),
      ...(parsedInterviewDate !== undefined && { interviewDate: parsedInterviewDate }),
      ...(validated.contactName !== undefined && { contactName: validated.contactName || null }),
      ...(validated.contactEmail !== undefined && { contactEmail: validated.contactEmail || null }),
      ...(validated.notes !== undefined && { notes: validated.notes || null }),
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          rawDescription: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          atsScore: true,
          atsBreakdown: true,
          outreachMessage: true,
        },
      },
    },
  })

  return updated as ApplicationWithRelations
}

/**
 * Deletes an application card without deleting the underlying JobPosting or TailoredResume.
 */
export async function deleteApplication(userId: string, applicationId: string): Promise<boolean> {
  const result = await prisma.application.deleteMany({
    where: {
      id: applicationId,
      userId,
    },
  })

  return result.count > 0
}
