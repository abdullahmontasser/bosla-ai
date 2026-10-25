import { prisma } from '@/lib/prisma'
import { Prisma, type DocumentFormat, type ParsingStatus } from '@prisma/client'
import {
  SaveParsedResumeInputSchema,
  type SaveParsedResumeInput,
  type ParsedResumePayload,
} from '@/lib/validations/parsed-resume'

/**
 * Creates an initial ParsedResume record in PROCESSING state.
 */
export async function createParsedResume(
  userId: string,
  params: {
    originalFileName: string
    fileFormat: DocumentFormat
    profileId?: string | null
    status?: ParsingStatus
    rawText?: string | null
  },
) {
  return prisma.parsedResume.create({
    data: {
      userId,
      profileId: params.profileId || null,
      originalFileName: params.originalFileName,
      fileFormat: params.fileFormat,
      status: params.status || 'PROCESSING',
      rawText: params.rawText || null,
    },
  })
}

/**
 * Updates a ParsedResume to REVIEWING with structured payload and rawText.
 */
export async function updateParsedResumeSuccess(
  userId: string,
  parsedResumeId: string,
  data: {
    rawText: string
    parsedPayload: ParsedResumePayload
  },
) {
  return prisma.parsedResume.updateMany({
    where: {
      id: parsedResumeId,
      userId,
    },
    data: {
      status: 'REVIEWING',
      rawText: data.rawText,
      parsedPayload: data.parsedPayload as unknown as Prisma.InputJsonValue,
      errorCode: null,
      errorMessage: null,
    },
  })
}

/**
 * Updates a ParsedResume to FAILED with error code and optional raw text preservation.
 */
export async function updateParsedResumeFailure(
  userId: string,
  parsedResumeId: string,
  data: {
    errorCode: string
    errorMessage: string
    rawText?: string | null
  },
) {
  return prisma.parsedResume.updateMany({
    where: {
      id: parsedResumeId,
      userId,
    },
    data: {
      status: 'FAILED',
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      ...(data.rawText !== undefined ? { rawText: data.rawText } : {}),
    },
  })
}

/**
 * Saves raw extracted text and structured JSON from an uploaded resume (compat).
 */
export async function saveParsedResume(userId: string, input: SaveParsedResumeInput) {
  const validated = SaveParsedResumeInputSchema.parse(input)

  return prisma.parsedResume.create({
    data: {
      userId,
      profileId: validated.profileId || null,
      originalFileName: validated.originalFileName,
      fileFormat: validated.fileFormat as DocumentFormat,
      status: (validated.status as ParsingStatus) || 'PROCESSING',
      errorCode: validated.errorCode || null,
      errorMessage: validated.errorMessage || null,
      rawText: validated.rawText || null,
      parsedPayload: (validated.parsedPayload as unknown as Prisma.InputJsonValue) || Prisma.DbNull,
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
