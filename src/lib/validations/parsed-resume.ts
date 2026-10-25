import { z } from 'zod'

export const DocumentFormatEnum = z.enum(['PDF', 'DOCX', 'TXT'])
export type DocumentFormat = z.infer<typeof DocumentFormatEnum>

export const ParsingStatusEnum = z.enum(['PROCESSING', 'REVIEWING', 'APPLIED', 'FAILED'])
export type ParsingStatus = z.infer<typeof ParsingStatusEnum>

export const ParsedExperienceItemSchema = z.object({
  companyName: z.string().optional().default(''),
  company: z.string().optional(),
  jobTitle: z.string().optional().default(''),
  title: z.string().optional(),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
})

export type ParsedExperienceItem = z.infer<typeof ParsedExperienceItemSchema>

export const ParsedEducationItemSchema = z.object({
  institution: z.string().default(''),
  degree: z.string().default(''),
  fieldOfStudy: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  grade: z.string().optional().default(''),
})

export type ParsedEducationItem = z.infer<typeof ParsedEducationItemSchema>

export const ParsedSkillItemSchema = z.string()
export type ParsedSkillItem = z.infer<typeof ParsedSkillItemSchema>

export const ParsedProjectItemSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  role: z.string().optional().default(''),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional().default(''),
})
export type ParsedProjectItem = z.infer<typeof ParsedProjectItemSchema>

export const ParsedResumePayloadSchema = z.object({
  language: z.enum(['EN', 'AR']).default('EN'),
  fullName: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  summary: z.string().optional().default(''),
  websiteUrl: z.string().optional().default(''),
  linkedinUrl: z.string().optional().default(''),
  githubUrl: z.string().optional().default(''),
  experiences: z.array(ParsedExperienceItemSchema).default([]),
  educations: z.array(ParsedEducationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(ParsedProjectItemSchema).default([]),
  languages: z.array(z.string()).default([]),
  rawMetadata: z.record(z.string(), z.unknown()).optional(),
})
export type ParsedResumePayload = z.infer<typeof ParsedResumePayloadSchema>

export const MergeActionEnum = z.enum(['replace', 'append', 'skip'])
export type MergeAction = z.infer<typeof MergeActionEnum>

export const ScalarMergeActionEnum = z.enum(['replace', 'skip'])
export type ScalarMergeAction = z.infer<typeof ScalarMergeActionEnum>

export const SectionMergeConfigSchema = z.object({
  personalInfo: ScalarMergeActionEnum.default('replace'),
  experiences: MergeActionEnum.default('replace'),
  educations: MergeActionEnum.default('replace'),
  skills: MergeActionEnum.default('append'),
  projects: MergeActionEnum.default('replace'),
})
export type SectionMergeConfig = z.infer<typeof SectionMergeConfigSchema>

export const SaveParsedResumeInputSchema = z.object({
  profileId: z.string().optional(),
  originalFileName: z.string().min(1, 'File name is required'),
  fileFormat: DocumentFormatEnum,
  status: ParsingStatusEnum.default('PROCESSING'),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  rawText: z.string().optional(),
  parsedPayload: ParsedResumePayloadSchema.default(() => ParsedResumePayloadSchema.parse({})),
})
export type SaveParsedResumeInput = z.infer<typeof SaveParsedResumeInputSchema>

export const CommitParsedResumeInputSchema = z.object({
  parsedResumeId: z.string().min(1, 'Parsed resume ID is required'),
  targetProfileId: z.string().optional(),
  mergeConfig: SectionMergeConfigSchema,
  editedData: ParsedResumePayloadSchema,
})
export type CommitParsedResumeInput = z.infer<typeof CommitParsedResumeInputSchema>
