import { z } from 'zod'

export const CreateJobPostingSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  jobUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  rawDescription: z.string().trim().min(1, 'Job description is required'),
  parsedSkills: z.array(z.string().trim()).default([]),
})

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>
