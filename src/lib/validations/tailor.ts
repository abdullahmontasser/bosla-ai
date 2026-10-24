import { z } from 'zod'

export const CandidateExperienceInputSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().trim().min(1, 'Company name is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  bullets: z.array(z.string().trim()).min(1, 'At least one bullet is required'),
})

export type CandidateExperienceInput = z.infer<typeof CandidateExperienceInputSchema>

export const SaveCandidateProfileSchema = z.object({
  profileId: z.string().optional(),
  language: z.enum(['EN', 'AR']).default('EN'),
  headline: z.string().trim().min(1, 'Headline is required'),
  summary: z.string().trim().min(10, 'Summary must be at least 10 characters'),
  experiences: z
    .array(CandidateExperienceInputSchema)
    .min(1, 'At least one work experience is required'),
})

export type SaveCandidateProfileInput = z.infer<typeof SaveCandidateProfileSchema>

export const TailorPayloadSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  rawJobDescription: z.string().trim().min(50, 'Job description must be at least 50 characters'),
  language: z.enum(['EN', 'AR']).default('EN'),
})

export type TailorPayload = z.infer<typeof TailorPayloadSchema>
