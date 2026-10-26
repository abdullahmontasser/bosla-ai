'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateObject } from 'ai'
import { z } from 'zod'
import {
  InterviewPrepPayloadSchema,
  GenerateInterviewPrepInputSchema,
  RegenerateInterviewQuestionInputSchema,
  type InterviewPrepPayload,
} from '@/lib/validations/career-prep'
import {
  buildInterviewPrepPrompts,
  buildSingleQuestionPrompt,
} from '@/lib/ai/prompts/interview-prep'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'

const AiStarResponseSchema = z.object({
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
})

const AiInterviewQuestionGeneratedSchema = z.object({
  category: z.enum(['BEHAVIORAL', 'TECHNICAL', 'SITUATIONAL']),
  question: z.string(),
  whyAsked: z.string(),
  starResponse: AiStarResponseSchema,
  referencedSources: z.array(z.string()),
  missingMetricFlags: z.array(z.string()),
})

const AiQuestionsToAskGeneratedSchema = z.object({
  question: z.string(),
  strategicGoal: z.string(),
})

const AiInterviewPrepFullSchema = z.object({
  questions: z.array(AiInterviewQuestionGeneratedSchema).length(3),
  questionsToAskInterviewer: z.array(AiQuestionsToAskGeneratedSchema).length(3),
})

export async function generateInterviewPrepAction(
  tailoredResumeId: string,
  options?: { language?: 'EN' | 'AR' },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const inputParsed = GenerateInterviewPrepInputSchema.safeParse({
    tailoredResumeId,
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

    const candidateName = resume.profile.fullName || session.user.name || 'Candidate'
    const roleTitle = resume.jobPosting.title
    const companyName = resume.jobPosting.companyName
    const jobContext = `${resume.jobPosting.rawDescription}\nTarget Skills: ${resume.jobPosting.parsedSkills.join(', ')}`

    const { system, prompt } = buildInterviewPrepPrompts({
      candidateName,
      roleTitle,
      companyName,
      jobContext,
      workExperiences: resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        bullets: w.bullets,
      })),
      projects: resume.profile.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
      })),
      language,
    })

    const { object } = await generateObject({
      model,
      schema: AiInterviewPrepFullSchema,
      system,
      prompt,
      temperature: 0.6,
    })

    const now = new Date().toISOString()
    const questions = object.questions.map((q) => ({
      id: crypto.randomUUID(),
      category: q.category,
      question: q.question,
      whyAsked: q.whyAsked,
      starResponse: q.starResponse,
      referencedSources: q.referencedSources,
      missingMetricFlags: q.missingMetricFlags,
    }))

    const questionsToAskInterviewer = object.questionsToAskInterviewer.map((qi) => ({
      id: crypto.randomUUID(),
      question: qi.question,
      strategicGoal: qi.strategicGoal,
    }))

    const payload: InterviewPrepPayload = {
      version: 1,
      generatedAt: now,
      updatedAt: now,
      language,
      roleTitle,
      companyName,
      questions,
      questionsToAskInterviewer,
    }

    const validated = InterviewPrepPayloadSchema.parse(payload)

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        interviewPrep: validated as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: validated }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate interview prep'
    return { success: false, error: message }
  }
}

export async function saveInterviewPrepAction(tailoredResumeId: string, payload: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const validated = InterviewPrepPayloadSchema.safeParse(payload)
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

    const updatedPayload: InterviewPrepPayload = {
      ...validated.data,
      updatedAt: new Date().toISOString(),
    }

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        interviewPrep: updatedPayload as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: updatedPayload }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save interview prep'
    return { success: false, error: message }
  }
}

export async function regenerateInterviewQuestionAction(
  tailoredResumeId: string,
  questionId: string,
  options?: { language?: 'EN' | 'AR' },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const inputParsed = RegenerateInterviewQuestionInputSchema.safeParse({
    tailoredResumeId,
    questionId,
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

    const existingPrep = resume.interviewPrep as unknown as InterviewPrepPayload | null
    if (!existingPrep || !existingPrep.questions?.length) {
      return {
        success: false,
        error: 'No existing interview prep found. Please generate interview prep first.',
      }
    }

    const targetIndex = existingPrep.questions.findIndex((q) => q.id === questionId)
    if (targetIndex === -1) {
      return { success: false, error: 'Question not found in interview prep.' }
    }

    const targetQuestion = existingPrep.questions[targetIndex]

    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (!activeSettings.length || !activeSettings[0].apiKey) {
      return {
        success: false,
        error: 'No active AI provider configured. Please configure an API key in Settings.',
      }
    }

    const model = getProviderModel(activeSettings[0])
    const language = inputParsed.data.language || existingPrep.language || 'EN'

    const candidateName = resume.profile.fullName || session.user.name || 'Candidate'
    const roleTitle = resume.jobPosting.title
    const companyName = resume.jobPosting.companyName
    const jobContext = `${resume.jobPosting.rawDescription}\nSkills: ${resume.jobPosting.parsedSkills.join(', ')}`

    const { system, prompt } = buildSingleQuestionPrompt({
      candidateName,
      roleTitle,
      companyName,
      jobContext,
      category: targetQuestion.category,
      existingQuestionText: targetQuestion.question,
      workExperiences: resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        bullets: w.bullets,
      })),
      projects: resume.profile.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
      })),
      language,
    })

    const { object } = await generateObject({
      model,
      schema: AiInterviewQuestionGeneratedSchema,
      system,
      prompt,
    })

    const updatedQuestions = [...existingPrep.questions]
    updatedQuestions[targetIndex] = {
      id: crypto.randomUUID(),
      category: targetQuestion.category,
      question: object.question,
      whyAsked: object.whyAsked,
      starResponse: object.starResponse,
      referencedSources: object.referencedSources,
      missingMetricFlags: object.missingMetricFlags,
    }

    const updatedPayload: InterviewPrepPayload = {
      ...existingPrep,
      updatedAt: new Date().toISOString(),
      questions: updatedQuestions,
    }

    await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        interviewPrep: updatedPayload as unknown as Prisma.InputJsonValue,
      },
    })

    return { success: true, data: updatedPayload }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate interview question'
    return { success: false, error: message }
  }
}
