import { z } from 'zod'

export const DocumentFormatEnum = z.enum(['PDF', 'DOCX', 'TXT'])
export type DocumentFormat = z.infer<typeof DocumentFormatEnum>

export const ParsedExperienceItemSchema = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  bullets: z.array(z.string()).default([]),
})

export const ParsedEducationItemSchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  endDate: z.string().optional(),
})

export const ParsedResumePayloadSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(ParsedExperienceItemSchema).default([]),
  educations: z.array(ParsedEducationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  rawMetadata: z.record(z.string(), z.unknown()).optional(),
})

export type ParsedResumePayload = z.infer<typeof ParsedResumePayloadSchema>

export const SaveParsedResumeInputSchema = z.object({
  profileId: z.string().optional(),
  originalFileName: z.string().min(1, 'File name is required'),
  fileFormat: DocumentFormatEnum,
  rawText: z.string().min(1, 'Extracted text is required'),
  parsedPayload: ParsedResumePayloadSchema,
})

export type SaveParsedResumeInput = z.infer<typeof SaveParsedResumeInputSchema>
