'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import {
  createParsedResume,
  updateParsedResumeSuccess,
  updateParsedResumeFailure,
  getParsedResumeById,
} from '@/lib/db/parsed-resumes'
import { detectDocumentFormat, extractDocumentText, ExtractionError } from '@/lib/parsing/extract'
import { parseResumeWithAi } from '@/lib/ai/prompts/resume-parser'
import {
  CommitParsedResumeInputSchema,
  type CommitParsedResumeInput,
} from '@/lib/validations/parsed-resume'
import type { Language, DocumentFormat } from '@prisma/client'

/**
 * Parses flexible date strings into valid Date objects with fallback.
 */
function parseFlexibleDate(dateStr?: string | null): Date {
  if (!dateStr || !dateStr.trim()) return new Date()
  const trimmed = dateStr.trim()

  // Match YYYY
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-01-01T00:00:00.000Z`)
  }

  // Match YYYY-MM
  if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
    return new Date(`${trimmed}-01T00:00:00.000Z`)
  }

  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

function parseOptionalDate(dateStr?: string | null): Date | null {
  if (!dateStr || !dateStr.trim()) return null
  return parseFlexibleDate(dateStr)
}

/**
 * Server Action: parseResumeAction
 * Uploads a PDF or DOCX resume, validates magic bytes, extracts text in memory,
 * invokes AI structured extraction with 60s timeout, and persists parsing status.
 */
export async function parseResumeAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: 'UNAUTHORIZED',
      error: 'You must be signed in to upload and parse a resume.',
    }
  }

  const userId = session.user.id
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return {
      success: false,
      errorCode: 'INVALID_FORMAT',
      error: 'No file provided in the upload request.',
    }
  }

  // 1. Client & Server size check
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  if (fileBuffer.length > 10 * 1024 * 1024) {
    return {
      success: false,
      errorCode: 'FILE_TOO_LARGE',
      error: 'File size exceeds the 10MB limit. Please upload a smaller document.',
    }
  }

  // 2. Validate magic bytes and format
  let detectedFormat: DocumentFormat
  try {
    detectedFormat = detectDocumentFormat(fileBuffer)
  } catch (err) {
    const errorMsg =
      err instanceof ExtractionError
        ? err.message
        : 'Invalid file format. Only genuine PDF and DOCX files are supported.'
    return {
      success: false,
      errorCode: 'INVALID_FORMAT',
      error: errorMsg,
    }
  }

  // 3. Create initial ParsedResume record in PROCESSING state
  let parsedRecord
  try {
    parsedRecord = await createParsedResume(userId, {
      originalFileName: file.name,
      fileFormat: detectedFormat,
      status: 'PROCESSING',
    })
  } catch {
    return {
      success: false,
      errorCode: 'DATABASE_ERROR',
      error: 'Failed to initialize resume parsing record.',
    }
  }

  // 4. In-memory text extraction
  let extracted
  try {
    extracted = await extractDocumentText(fileBuffer, file.name)
  } catch (err) {
    const errorCode = err instanceof ExtractionError ? err.code : 'EXTRACTION_FAILED'
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Failed to extract text. The document may be empty, encrypted, or a scanned image.'

    await updateParsedResumeFailure(userId, parsedRecord.id, {
      errorCode,
      errorMessage: errorMsg,
      rawText: null,
    })

    return {
      success: false,
      parsedResumeId: parsedRecord.id,
      errorCode,
      error: errorMsg,
    }
  }

  // 5. Verify active AI provider configuration
  const activeSettings = await getActiveProviderSettings(userId)
  if (!activeSettings.length) {
    const missingProviderMsg =
      'No active AI provider configured. Please configure an active provider in Settings.'
    await updateParsedResumeFailure(userId, parsedRecord.id, {
      errorCode: 'AI_PROVIDER_ERROR',
      errorMessage: missingProviderMsg,
      rawText: extracted.text,
    })

    return {
      success: false,
      parsedResumeId: parsedRecord.id,
      errorCode: 'AI_PROVIDER_ERROR',
      error: missingProviderMsg,
    }
  }

  // 6. AI structured extraction via generateObject with 60s timeout
  try {
    const payload = await parseResumeWithAi(extracted.text, activeSettings[0])

    await updateParsedResumeSuccess(userId, parsedRecord.id, {
      rawText: extracted.text,
      parsedPayload: payload,
    })

    return {
      success: true,
      parsedResumeId: parsedRecord.id,
      data: payload,
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'AI structured extraction failed or timed out.'
    await updateParsedResumeFailure(userId, parsedRecord.id, {
      errorCode: 'AI_PROVIDER_ERROR',
      errorMessage,
      rawText: extracted.text,
    })

    return {
      success: false,
      parsedResumeId: parsedRecord.id,
      errorCode: 'AI_PROVIDER_ERROR',
      error: errorMessage,
    }
  }
}

/**
 * Server Action: retryParsingAction
 * Re-runs AI structured extraction using the preserved rawText without requiring file re-upload.
 */
export async function retryParsingAction(parsedResumeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: 'UNAUTHORIZED',
      error: 'You must be signed in to retry parsing.',
    }
  }

  const userId = session.user.id
  const record = await getParsedResumeById(userId, parsedResumeId)

  if (!record) {
    return {
      success: false,
      errorCode: 'NOT_FOUND',
      error: 'Parsed resume record not found.',
    }
  }

  if (!record.rawText || !record.rawText.trim()) {
    return {
      success: false,
      errorCode: 'EXTRACTION_FAILED',
      error: 'No raw text preserved for this record. Please upload the file again.',
    }
  }

  const activeSettings = await getActiveProviderSettings(userId)
  if (!activeSettings.length) {
    return {
      success: false,
      errorCode: 'AI_PROVIDER_ERROR',
      error: 'No active AI provider configured. Please configure an active provider in Settings.',
    }
  }

  // Update status back to PROCESSING during retry
  await prisma.parsedResume.updateMany({
    where: { id: parsedResumeId, userId },
    data: { status: 'PROCESSING', errorCode: null, errorMessage: null },
  })

  try {
    const payload = await parseResumeWithAi(record.rawText, activeSettings[0])

    await updateParsedResumeSuccess(userId, parsedResumeId, {
      rawText: record.rawText,
      parsedPayload: payload,
    })

    return {
      success: true,
      data: payload,
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'AI structured extraction retry failed.'
    await updateParsedResumeFailure(userId, parsedResumeId, {
      errorCode: 'AI_PROVIDER_ERROR',
      errorMessage,
      rawText: record.rawText,
    })

    return {
      success: false,
      errorCode: 'AI_PROVIDER_ERROR',
      error: errorMessage,
    }
  }
}

/**
 * Server Action: commitParsedResumeAction
 * Atomically commits reviewed candidate details to a target profile or creates a new default profile.
 * Applies section-level merge rules (replace, append, skip) and marks ParsedResume status as APPLIED.
 */
export async function commitParsedResumeAction(input: CommitParsedResumeInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: 'UNAUTHORIZED',
      error: 'You must be signed in to commit profile updates.',
    }
  }

  const userId = session.user.id
  const parsed = CommitParsedResumeInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const { parsedResumeId, targetProfileId, mergeConfig, editedData } = parsed.data

  const record = await getParsedResumeById(userId, parsedResumeId)
  if (!record) {
    return {
      success: false,
      errorCode: 'NOT_FOUND',
      error: 'Parsed resume record not found.',
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve or create target Profile (AC-4, AC-5)
      let profile = targetProfileId
        ? await tx.profile.findFirst({
            where: { id: targetProfileId, userId },
          })
        : await tx.profile.findFirst({
            where: {
              userId,
              language: editedData.language as Language,
              isDefault: true,
            },
          })

      // If user has no existing profile, create a default profile automatically
      if (!profile) {
        const existingProfilesCount = await tx.profile.count({ where: { userId } })
        profile = await tx.profile.create({
          data: {
            userId,
            language: editedData.language as Language,
            isDefault: existingProfilesCount === 0,
            fullName: editedData.fullName || 'Candidate Profile',
            headline: editedData.headline || null,
            summary: editedData.summary || null,
            email: editedData.email || null,
            phone: editedData.phone || null,
            location: editedData.location || null,
            websiteUrl: editedData.websiteUrl || null,
            linkedinUrl: editedData.linkedinUrl || null,
            githubUrl: editedData.githubUrl || null,
          },
        })
      } else if (mergeConfig.personalInfo === 'replace') {
        // Scalar details replace
        profile = await tx.profile.update({
          where: { id: profile.id },
          data: {
            fullName: editedData.fullName || profile.fullName,
            headline: editedData.headline !== undefined ? editedData.headline : profile.headline,
            summary: editedData.summary !== undefined ? editedData.summary : profile.summary,
            email: editedData.email !== undefined ? editedData.email : profile.email,
            phone: editedData.phone !== undefined ? editedData.phone : profile.phone,
            location: editedData.location !== undefined ? editedData.location : profile.location,
            websiteUrl:
              editedData.websiteUrl !== undefined ? editedData.websiteUrl : profile.websiteUrl,
            linkedinUrl:
              editedData.linkedinUrl !== undefined ? editedData.linkedinUrl : profile.linkedinUrl,
            githubUrl:
              editedData.githubUrl !== undefined ? editedData.githubUrl : profile.githubUrl,
          },
        })
      }

      const profileId = profile.id

      // 2. Work Experiences merge semantics (AC-4, AC-5)
      if (mergeConfig.experiences === 'replace') {
        await tx.workExperience.deleteMany({ where: { profileId } })
        if (editedData.experiences.length > 0) {
          await tx.workExperience.createMany({
            data: editedData.experiences.map((exp, idx) => ({
              profileId,
              companyName: exp.companyName || 'Company',
              jobTitle: exp.jobTitle || 'Role',
              location: exp.location || null,
              startDate: parseFlexibleDate(exp.startDate),
              endDate: exp.isCurrent ? null : parseOptionalDate(exp.endDate),
              isCurrent: exp.isCurrent || false,
              bullets: exp.bullets || [],
              sortOrder: idx,
            })),
          })
        }
      } else if (mergeConfig.experiences === 'append' && editedData.experiences.length > 0) {
        const lastExp = await tx.workExperience.findFirst({
          where: { profileId },
          orderBy: { sortOrder: 'desc' },
        })
        const startSortOrder = (lastExp?.sortOrder ?? -1) + 1

        await tx.workExperience.createMany({
          data: editedData.experiences.map((exp, idx) => ({
            profileId,
            companyName: exp.companyName || 'Company',
            jobTitle: exp.jobTitle || 'Role',
            location: exp.location || null,
            startDate: parseFlexibleDate(exp.startDate),
            endDate: exp.isCurrent ? null : parseOptionalDate(exp.endDate),
            isCurrent: exp.isCurrent || false,
            bullets: exp.bullets || [],
            sortOrder: startSortOrder + idx,
          })),
        })
      }

      // 3. Educations merge semantics (AC-4, AC-5)
      if (mergeConfig.educations === 'replace') {
        await tx.education.deleteMany({ where: { profileId } })
        if (editedData.educations.length > 0) {
          await tx.education.createMany({
            data: editedData.educations.map((edu, idx) => ({
              profileId,
              institution: edu.institution || 'Institution',
              degree: edu.degree || 'Degree',
              fieldOfStudy: edu.fieldOfStudy || null,
              startDate: parseOptionalDate(edu.startDate),
              endDate: parseOptionalDate(edu.endDate),
              grade: edu.grade || null,
              sortOrder: idx,
            })),
          })
        }
      } else if (mergeConfig.educations === 'append' && editedData.educations.length > 0) {
        const lastEdu = await tx.education.findFirst({
          where: { profileId },
          orderBy: { sortOrder: 'desc' },
        })
        const startSortOrder = (lastEdu?.sortOrder ?? -1) + 1

        await tx.education.createMany({
          data: editedData.educations.map((edu, idx) => ({
            profileId,
            institution: edu.institution || 'Institution',
            degree: edu.degree || 'Degree',
            fieldOfStudy: edu.fieldOfStudy || null,
            startDate: parseOptionalDate(edu.startDate),
            endDate: parseOptionalDate(edu.endDate),
            grade: edu.grade || null,
            sortOrder: startSortOrder + idx,
          })),
        })
      }

      // 4. Skills merge semantics with case-insensitive name deduplication (AC-4, AC-5)
      if (mergeConfig.skills === 'replace') {
        await tx.skill.deleteMany({ where: { profileId } })
        if (editedData.skills.length > 0) {
          await tx.skill.createMany({
            data: editedData.skills.map((skillName, idx) => ({
              profileId,
              name: skillName.trim(),
              sortOrder: idx,
            })),
          })
        }
      } else if (mergeConfig.skills === 'append' && editedData.skills.length > 0) {
        const existingSkills = await tx.skill.findMany({
          where: { profileId },
          select: { name: true, sortOrder: true },
        })
        const existingLowerNames = new Set(existingSkills.map((s) => s.name.trim().toLowerCase()))
        const maxSortOrder = existingSkills.reduce((max, s) => Math.max(max, s.sortOrder), -1)

        // Deduplicate parsed skills by name
        const uniqueNewSkills = editedData.skills
          .map((s) => s.trim())
          .filter((name) => name.length > 0 && !existingLowerNames.has(name.toLowerCase()))

        if (uniqueNewSkills.length > 0) {
          await tx.skill.createMany({
            data: uniqueNewSkills.map((name, idx) => ({
              profileId,
              name,
              sortOrder: maxSortOrder + 1 + idx,
            })),
          })
        }
      }

      // 5. Projects merge semantics (AC-4, AC-5)
      if (mergeConfig.projects === 'replace') {
        await tx.project.deleteMany({ where: { profileId } })
        if (editedData.projects.length > 0) {
          await tx.project.createMany({
            data: editedData.projects.map((proj, idx) => ({
              profileId,
              name: proj.name || 'Project',
              description: proj.description || '',
              role: proj.role || null,
              technologies: proj.technologies || [],
              url: proj.url || null,
              sortOrder: idx,
            })),
          })
        }
      } else if (mergeConfig.projects === 'append' && editedData.projects.length > 0) {
        const lastProj = await tx.project.findFirst({
          where: { profileId },
          orderBy: { sortOrder: 'desc' },
        })
        const startSortOrder = (lastProj?.sortOrder ?? -1) + 1

        await tx.project.createMany({
          data: editedData.projects.map((proj, idx) => ({
            profileId,
            name: proj.name || 'Project',
            description: proj.description || '',
            role: proj.role || null,
            technologies: proj.technologies || [],
            url: proj.url || null,
            sortOrder: startSortOrder + idx,
          })),
        })
      }

      // 6. Update ParsedResume status to APPLIED and link target profileId (AC-5)
      await tx.parsedResume.update({
        where: { id: parsedResumeId },
        data: {
          status: 'APPLIED',
          profileId,
        },
      })

      return { profileId }
    })

    return {
      success: true,
      profileId: result.profileId,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Database transaction failed.'
    return {
      success: false,
      errorCode: 'TRANSACTION_FAILED',
      error: `Failed to commit profile updates: ${errorMsg}`,
    }
  }
}
