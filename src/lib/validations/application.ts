import { z } from 'zod'

export const ApplicationStatusEnum = z.enum([
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'REJECTED',
  'OFFER',
])

export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>

export const CreateApplicationSchema = z.object({
  jobPostingId: z.string().min(1, 'Job posting ID is required'),
  tailoredResumeId: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>

export const UpdateApplicationStageSchema = z.object({
  status: ApplicationStatusEnum,
  targetSortOrder: z.number().optional(),
  notes: z.string().optional(),
})

export type UpdateApplicationStageInput = z.infer<typeof UpdateApplicationStageSchema>
