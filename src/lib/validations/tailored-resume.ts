import { z } from 'zod'
import { LanguageEnum } from './profile'

export const TailoredBulletSchema = z.object({
  original: z.string().optional(),
  rewritten: z.string().min(1, 'Rewritten achievement is required'), // Google XYZ format
  matchedKeywords: z.array(z.string()).default([]),
})

export type TailoredBullet = z.infer<typeof TailoredBulletSchema>

export const CandidateHeaderSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
})

export type CandidateHeader = z.infer<typeof CandidateHeaderSchema>

export const TailoredExperienceItemSchema = z.object({
  companyName: z.string(),
  jobTitle: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  bullets: z.array(TailoredBulletSchema).default([]),
})

export type TailoredExperienceItem = z.infer<typeof TailoredExperienceItemSchema>

export const TailoredEducationItemSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type TailoredEducationItem = z.infer<typeof TailoredEducationItemSchema>

export const TailoredSkillItemSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
})

export type TailoredSkillItem = z.infer<typeof TailoredSkillItemSchema>

export const TailoredContentSchema = z.object({
  targetRole: z.string().optional(),
  tailoredSummary: z.string().optional(),
  candidateHeader: CandidateHeaderSchema.optional(),
  tailoredExperiences: z
    .array(
      z.object({
        companyName: z.string(),
        jobTitle: z.string(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        bullets: z.array(
          z.union([
            TailoredBulletSchema,
            z.object({
              tailored: z.string(),
              matchedKeywords: z.array(z.string()).optional(),
            }),
          ]),
        ),
      }),
    )
    .default([]),
  educations: z.array(TailoredEducationItemSchema).default([]),
  skills: z.array(TailoredSkillItemSchema).default([]),
  recommendedSkills: z.array(z.string()).default([]),
  keyStrengths: z.array(z.string()).default([]),
})

export type TailoredContent = z.infer<typeof TailoredContentSchema>

export const TailoredResumeContentSnapshotSchema = z.object({
  targetRole: z.string(),
  tailoredSummary: z.string(),
  candidateHeader: CandidateHeaderSchema,
  tailoredExperiences: z.array(
    z.object({
      companyName: z.string(),
      jobTitle: z.string(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isCurrent: z.boolean(),
      bullets: z.array(TailoredBulletSchema),
    }),
  ),
  educations: z.array(TailoredEducationItemSchema),
  skills: z.array(TailoredSkillItemSchema),
})

export type TailoredResumeContentSnapshot = z.infer<typeof TailoredResumeContentSnapshotSchema>

export const AtsCategorySubscoresSchema = z.object({
  keywordMatch: z.number().min(0).max(100),
  experienceRelevance: z.number().min(0).max(100),
  formattingCompliance: z.number().min(0).max(100),
})

export const AtsBreakdownSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categorySubscores: AtsCategorySubscoresSchema,
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  dismissedSkills: z.array(z.string()).default([]),
  actionableFeedback: z.array(z.string()).default([]),
  isStale: z.boolean().default(false),
  evaluatedAt: z.string(),
})

export type AtsBreakdown = z.infer<typeof AtsBreakdownSchema>

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
  atsBreakdown: AtsBreakdownSchema.optional(),
  tailoredSummary: z.string().optional(),
  tailoredContent: z.union([TailoredContentSchema, z.record(z.string(), z.any())]),
  outreachMessage: OutreachMessageSchema.optional(),
  interviewPrep: InterviewPrepSchema.optional(),
  lastExportedAt: z.coerce.date().optional(),
})

export type CreateTailoredResumeSnapshotInput = z.infer<typeof CreateTailoredResumeSnapshotSchema>
