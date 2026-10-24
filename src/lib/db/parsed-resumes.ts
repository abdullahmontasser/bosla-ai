import { prisma } from '@/lib/prisma'
import type { DocumentFormat, Prisma } from '@prisma/client'
import {
  SaveParsedResumeInputSchema,
  type SaveParsedResumeInput,
} from '@/lib/validations/parsed-resume'

/**
 * Saves raw extracted text and structured JSON from an uploaded resume.
 */
export async function saveParsedResume(userId: string, input: SaveParsedResumeInput) {
  const validated = SaveParsedResumeInputSchema.parse(input)

  return prisma.parsedResume.create({
    data: {
      userId,
      profileId: validated.profileId || null,
      originalFileName: validated.originalFileName,
      fileFormat: validated.fileFormat as DocumentFormat,
      rawText: validated.rawText,
      parsedPayload: validated.parsedPayload as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Retrieves a parsed resume record, strictly scoped to userId.
 */
export async function getParsedResumeById(userId: string, parsedResumeId: string) {
  return prisma.parsedResume.findFirst({
    where: {
      id: parsedResumeId,
      userId,
    },
  })
}

/**
 * Retrieves all parsed resumes uploaded by a user.
 */
export async function getParsedResumesByUser(userId: string) {
  return prisma.parsedResume.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
