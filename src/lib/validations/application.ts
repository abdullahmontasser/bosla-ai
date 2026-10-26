import { z } from 'zod'

export const ApplicationStatusEnum = z.enum([
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
])

export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>

export const CreateApplicationSchema = z
  .object({
    jobPostingId: z.string().optional(),
    tailoredResumeId: z.string().optional().nullable(),
    title: z.string().max(255).optional(),
    companyName: z.string().max(255).optional(),
    rawDescription: z.string().optional(),
    jobUrl: z.string().url('Invalid URL format').or(z.literal('')).optional().nullable(),
    status: ApplicationStatusEnum.optional().default('SAVED'),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.jobPostingId || (data.title && data.companyName), {
    message: 'Either jobPostingId or title and companyName must be provided',
  })

export type CreateApplicationInput = z.input<typeof CreateApplicationSchema>
export type CreateApplicationOutput = z.infer<typeof CreateApplicationSchema>

export const UpdateApplicationDetailsSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  title: z.string().min(1).max(255).optional(),
  companyName: z.string().min(1).max(255).optional(),
  jobUrl: z.string().url('Invalid URL format').or(z.literal('')).optional().nullable(),
  compensation: z.string().max(128).optional().nullable(),
  location: z.string().max(128).optional().nullable(),
  interviewDate: z.string().optional().nullable(),
  contactName: z.string().max(128).optional().nullable(),
  contactEmail: z.string().email('Invalid email format').or(z.literal('')).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type UpdateApplicationDetailsInput = z.infer<typeof UpdateApplicationDetailsSchema>

export const UpdateApplicationStatusAndOrderSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  status: ApplicationStatusEnum,
  sortOrder: z.number(),
})

export type UpdateApplicationStatusAndOrderInput = z.infer<
  typeof UpdateApplicationStatusAndOrderSchema
>

export const UpdateApplicationStageSchema = z.object({
  status: ApplicationStatusEnum,
  targetSortOrder: z.number().optional(),
  notes: z.string().optional(),
})

export type UpdateApplicationStageInput = z.infer<typeof UpdateApplicationStageSchema>
