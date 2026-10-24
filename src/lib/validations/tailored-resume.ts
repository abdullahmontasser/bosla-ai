import { z } from 'zod'
import { LanguageEnum } from './profile'

export const TailoredBulletSchema = z.object({
  original: z.string().optional(),
  rewritten: z.string().min(1, 'Rewritten achievement is required'), // Google XYZ format
  matchedKeywords: z.array(z.string()).default([]),
})

export const TailoredContentSchema = z.object({
  targetRole: z.string().optional(),
  tailoredSummary: z.string().optional(),
  tailoredExperiences: z
    .array(
      z.object({
        companyName: z.string(),
        jobTitle: z.string(),
        bullets: z.array(TailoredBulletSchema),
      }),
    )
    .default([]),
  recommendedSkills: z.array(z.string()).default([]),
  keyStrengths: z.array(z.string()).default([]),
})

export type TailoredContent = z.infer<typeof TailoredContentSchema>

export const OutreachMessageSchema = z.object({
  linkedinConnectionNote: z
    .string()
    .max(300, 'Connection note must be <= 300 characters')
    .optional(),
  linkedinInMail: z.string().optional(),
  coldEmail: z
    .object({
      subject: z.string(),
      body: z.string(),
    })
    .optional(),
})

export type OutreachMessage = z.infer<typeof OutreachMessageSchema>

export const InterviewPrepSchema = z.object({
  behavioralQuestions: z
    .array(
      z.object({
        question: z.string(),
        suggestedStarAnswer: z.object({
          situation: z.string(),
          task: z.string(),
          action: z.string(),
          result: z.string(),
        }),
      }),
    )
    .default([]),
  technicalQuestions: z
    .array(
      z.object({
        topic: z.string(),
        question: z.string(),
        keyTalkingPoints: z.array(z.string()),
      }),
    )
    .default([]),
})

export type InterviewPrep = z.infer<typeof InterviewPrepSchema>

export const CreateTailoredResumeSnapshotSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  jobPostingId: z.string().min(1, 'Job posting ID is required'),
  language: LanguageEnum.default('EN'),
  title: z.string().trim().optional(),
  atsScore: z.number().min(0).max(100).optional(),
  missingSkills: z.array(z.string()).default([]),
  tailoredSummary: z.string().optional(),
  tailoredContent: TailoredContentSchema,
  outreachMessage: OutreachMessageSchema.optional(),
  interviewPrep: InterviewPrepSchema.optional(),
  pdfExportPath: z.string().optional(),
})

export type CreateTailoredResumeSnapshotInput = z.infer<typeof CreateTailoredResumeSnapshotSchema>
