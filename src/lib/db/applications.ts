import { prisma } from '@/lib/prisma'
import type { ApplicationStatus } from '@prisma/client'
import {
  CreateApplicationSchema,
  UpdateApplicationStageSchema,
  type CreateApplicationInput,
  type UpdateApplicationStageInput,
} from '@/lib/validations/application'

export interface KanbanCardItem {
  id: string
  userId: string
  jobPostingId: string
  tailoredResumeId: string | null
  status: ApplicationStatus
  sortOrder: number
  appliedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  jobPosting: {
    id: string
    title: string
    companyName: string
    jobUrl: string | null
    parsedSkills: string[]
  }
  tailoredResume: {
    id: string
    title: string
    atsScore: number | null
    missingSkills: string[]
    pdfExportPath: string | null
  } | null
}

export interface KanbanBoardGrouped {
  SAVED: KanbanCardItem[]
  APPLIED: KanbanCardItem[]
  INTERVIEWING: KanbanCardItem[]
  OFFER: KanbanCardItem[]
  REJECTED: KanbanCardItem[]
}

/**
 * Creates an application card in the SAVED column with an automatic sortOrder.
 * Guarantees only one active card per user and job posting.
 */
export async function createApplication(userId: string, input: CreateApplicationInput) {
  const validated = CreateApplicationSchema.parse(input)

  // Verify unique card per job posting
  const existing = await prisma.application.findUnique({
    where: {
      userId_jobPostingId: {
        userId,
        jobPostingId: validated.jobPostingId,
      },
    },
  })

  if (existing) {
    throw new Error('An application card already exists for this job posting.')
  }

  // Calculate highest sortOrder in the SAVED column
  const highestCard = await prisma.application.findFirst({
    where: {
      userId,
      status: 'SAVED',
    },
    orderBy: {
      sortOrder: 'desc',
    },
    select: {
      sortOrder: true,
    },
  })

  const nextSortOrder = highestCard ? highestCard.sortOrder + 1.0 : 1.0

  return prisma.application.create({
    data: {
      userId,
      jobPostingId: validated.jobPostingId,
      tailoredResumeId: validated.tailoredResumeId || null,
      status: 'SAVED',
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
        },
      },
      tailoredResume: {
        select: {
          id: true,
          title: true,
          atsScore: true,
        },
      },
    },
  })
}

/**
 * Updates application stage, timestamps, and column sort order.
 */
export async function updateApplicationStage(
  userId: string,
  applicationId: string,
  input: UpdateApplicationStageInput,
) {
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

  // Determine appliedAt timestamp transition
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
        },
      },
      tailoredResume: {
        select: {
          id: true,
          title: true,
          atsScore: true,
        },
      },
    },
  })

  return updated
}

/**
 * Retrieves the complete kanban board grouped by status and sorted by sortOrder.
 */
export async function getKanbanBoard(userId: string): Promise<KanbanBoardGrouped> {
  const applications = await prisma.application.findMany({
    where: {
      userId,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          companyName: true,
          jobUrl: true,
          parsedSkills: true,
        },
      },
      tailoredResume: {
        select: {
          id: true,
          title: true,
          atsScore: true,
          missingSkills: true,
          pdfExportPath: true,
        },
      },
    },
  })

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
 * Deletes an application card without deleting the underlying job posting or tailored resume.
 */
export async function deleteApplication(userId: string, applicationId: string) {
  const result = await prisma.application.deleteMany({
    where: {
      id: applicationId,
      userId,
    },
  })

  return result.count > 0
}
