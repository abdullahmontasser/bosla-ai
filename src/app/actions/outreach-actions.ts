'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  OutreachMessagePayloadSchema,
  GenerateOutreachInputSchema,
  RegenerateOutreachVariantInputSchema,
  type OutreachMessagePayload,
  type OutreachTone,
  type OutreachRecipientType,
} from '@/lib/validations/career-prep'
import {
  buildOutreachPrompts,
  buildSingleVariantPrompt,
  trimAtWordBoundary,
} from '@/lib/ai/prompts/outreach'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'

interface SnapshotBullet {
  original?: string
  rewritten?: string
  tailored?: string
}

interface SnapshotExperience {
  companyName?: string
  jobTitle?: string
  bullets?: Array<string | SnapshotBullet>
}

interface SnapshotContent {
  tailoredExperiences?: SnapshotExperience[]
}

const AiOutreachGeneratedSchema = z.object({
  connectionNoteText: z.string().describe('LinkedIn connection note strictly under 280 characters'),
  inMail: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  email: z.object({
    subject: z.string(),
    body: z.string(),
  }),
})

const AiSingleVariantConnectionNoteSchema = z.object({
  connectionNoteText: z.string().describe('LinkedIn connection note strictly under 280 characters'),
})

const AiSingleVariantPitchSchema = z.object({
  subject: z.string(),
  body: z.string(),
})

export async function generateOutreachAction(
  tailoredResumeId: string,
  options?: {
    tone?: OutreachTone
    recipientType?: OutreachRecipientType
    language?: 'EN' | 'AR'
  },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const inputParsed = GenerateOutreachInputSchema.safeParse({
    tailoredResumeId,
    tone: options?.tone,
    recipientType: options?.recipientType,
    language: options?.language,
  })

  if (!inputParsed.success) {
    return {
      success: false,
      error: inputParsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
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

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (!activeSettings.length || !activeSettings[0].apiKey) {
      return {
        success: false,
        error: 'No active AI provider configured. Please configure an API key in Settings.',
      }
    }

    const model = getProviderModel(activeSettings[0])
    const language = inputParsed.data.language || (resume.language as 'EN' | 'AR') || 'EN'
    const tone = inputParsed.data.tone
    const recipientType = inputParsed.data.recipientType

    // Collect achievements from tailored content or base profile
    const snapshot = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const snapshotBullets: string[] = []
    if (snapshot.tailoredExperiences) {
      for (const exp of snapshot.tailoredExperiences) {
        if (exp.bullets) {
          for (const b of exp.bullets) {
            const text = typeof b === 'string' ? b : b.rewritten || b.tailored || b.original
            if (text) snapshotBullets.push(text)
          }
        }
      }
    }

    const profileBullets = resume.profile.workExperiences.flatMap((w) => w.bullets)
    const projectHighlights = resume.profile.projects.map(
      (p) => `${p.name}: ${p.description || ''} (${p.technologies.join(', ')})`,
    )

    const keyAchievements = [...snapshotBullets, ...profileBullets, ...projectHighlights].slice(
      0,
      8,
    )

    const candidateName = resume.profile.fullName || session.user.name || 'Candidate'
    const roleTitle = resume.jobPosting.title
    const companyName = resume.jobPosting.companyName
    const jobContext = `${resume.jobPosting.rawDescription}\nSkills: ${resume.jobPosting.parsedSkills.join(', ')}`

    const { system, prompt } = buildOutreachPrompts({
      candidateName,
      roleTitle,
      companyName,
      jobContext,
      keyAchievements,
      tone,
      recipientType,
      language,
    })

    const { object } = await generateObject({
      model,
      schema: AiOutreachGeneratedSchema,
      system,
      prompt,
      temperature: 0.7,
    })

    const trimmedNote = trimAtWordBoundary(object.connectionNoteText, 300)
    const now = new Date().toISOString()

    const payload: OutreachMessagePayload = {
      version: 1,
      generatedAt: now,
      updatedAt: now,
      language,
      tone,
      recipientType,
      connectionNote: {
        text: trimmedNote,
        charCount: trimmedNote.length,
      },
      inMail: object.inMail,
      email: object.email,
    }

    const validated = OutreachMessagePayloadSchema.parse(payload)

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        outreachMessage: validated as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: validated }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate outreach messages'
    return { success: false, error: message }
  }
}

export async function saveOutreachAction(tailoredResumeId: string, payload: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const validated = OutreachMessagePayloadSchema.safeParse(payload)
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
      },
    })

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const charCount = validated.data.connectionNote.text.length
    if (charCount > 300) {
      return {
        success: false,
        error: 'LinkedIn connection note must not exceed 300 characters.',
      }
    }

    const updatedPayload: OutreachMessagePayload = {
      ...validated.data,
      updatedAt: new Date().toISOString(),
      connectionNote: {
        text: validated.data.connectionNote.text,
        charCount,
      },
    }

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        outreachMessage: updatedPayload as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: updatedPayload }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save outreach messages'
    return { success: false, error: message }
  }
}

export async function regenerateOutreachVariantAction(
  tailoredResumeId: string,
  variant: 'connectionNote' | 'inMail' | 'email',
  options?: {
    tone?: OutreachTone
    recipientType?: OutreachRecipientType
    language?: 'EN' | 'AR'
  },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const inputParsed = RegenerateOutreachVariantInputSchema.safeParse({
    tailoredResumeId,
    variant,
    tone: options?.tone,
    recipientType: options?.recipientType,
    language: options?.language,
  })

  if (!inputParsed.success) {
    return {
      success: false,
      error: inputParsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
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

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const existingMessage = resume.outreachMessage as unknown as OutreachMessagePayload | null
    if (!existingMessage) {
      return {
        success: false,
        error: 'No existing outreach messages found. Please generate outreach first.',
      }
    }

    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (!activeSettings.length || !activeSettings[0].apiKey) {
      return {
        success: false,
        error: 'No active AI provider configured. Please configure an API key in Settings.',
      }
    }

    const model = getProviderModel(activeSettings[0])
    const language = inputParsed.data.language || existingMessage.language || 'EN'
    const tone = inputParsed.data.tone || existingMessage.tone
    const recipientType = inputParsed.data.recipientType || existingMessage.recipientType

    const candidateName = resume.profile.fullName || session.user.name || 'Candidate'
    const roleTitle = resume.jobPosting.title
    const companyName = resume.jobPosting.companyName
    const jobContext = `${resume.jobPosting.rawDescription}\nSkills: ${resume.jobPosting.parsedSkills.join(', ')}`
    const keyAchievements = resume.profile.workExperiences.flatMap((w) => w.bullets).slice(0, 6)

    const { system, prompt } = buildSingleVariantPrompt({
      candidateName,
      roleTitle,
      companyName,
      jobContext,
      keyAchievements,
      tone,
      recipientType,
      language,
      variant,
    })

    const updated = { ...existingMessage, updatedAt: new Date().toISOString() }

    if (variant === 'connectionNote') {
      const { object } = await generateObject({
        model,
        schema: AiSingleVariantConnectionNoteSchema,
        system,
        prompt,
      })
      const trimmed = trimAtWordBoundary(object.connectionNoteText, 300)
      updated.connectionNote = {
        text: trimmed,
        charCount: trimmed.length,
      }
    } else {
      const { object } = await generateObject({
        model,
        schema: AiSingleVariantPitchSchema,
        system,
        prompt,
      })
      if (variant === 'inMail') {
        updated.inMail = object
      } else {
        updated.email = object
      }
    }

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        outreachMessage: updated as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: updated }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate outreach variant'
    return { success: false, error: message }
  }
}
