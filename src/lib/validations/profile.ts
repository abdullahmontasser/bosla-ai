import { z } from 'zod'

export const LanguageEnum = z.enum(['EN', 'AR'])
export type Language = z.infer<typeof LanguageEnum>

export const WorkExperienceInputSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().trim().min(1, 'Company name is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  location: z.string().trim().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string().trim()).default([]),
  sortOrder: z.number().int().default(0),
})

export type WorkExperienceInput = z.infer<typeof WorkExperienceInputSchema>

export const EducationInputSchema = z.object({
  id: z.string().optional(),
  institution: z.string().trim().min(1, 'Institution is required'),
  degree: z.string().trim().min(1, 'Degree is required'),
  fieldOfStudy: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  grade: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
})

export type EducationInput = z.infer<typeof EducationInputSchema>

export const SkillInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Skill name is required'),
  category: z.string().trim().optional(),
  proficiency: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
})

export type SkillInput = z.infer<typeof SkillInputSchema>

export const ProjectInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.string().trim().min(1, 'Project description is required'),
  role: z.string().trim().optional(),
  technologies: z.array(z.string().trim()).default([]),
  url: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().default(0),
})

export type ProjectInput = z.infer<typeof ProjectInputSchema>

export const CreateProfileInputSchema = z.object({
  language: LanguageEnum.default('EN'),
  fullName: z.string().trim().min(1, 'Full name is required'),
  headline: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
  workExperiences: z.array(WorkExperienceInputSchema).default([]),
  educations: z.array(EducationInputSchema).default([]),
  skills: z.array(SkillInputSchema).default([]),
  projects: z.array(ProjectInputSchema).default([]),
})

export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>
