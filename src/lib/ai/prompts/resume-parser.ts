import { generateObject } from 'ai'
import { z } from 'zod'
import { getProviderModel } from '@/lib/ai/provider-client'
import type { DecryptedProviderSetting } from '@/lib/db/provider-settings'
import type { ParsedResumePayload } from '@/lib/validations/parsed-resume'

export const ResumeExtractionSchema = z.object({
  language: z
    .enum(['EN', 'AR'])
    .describe('Dominant document language: EN for English or AR for Arabic.'),
  fullName: z.string().default('').describe('Full name of the candidate.'),
  email: z.string().default('').describe('Candidate email address, or empty string if not found.'),
  phone: z.string().default('').describe('Phone or WhatsApp number, or empty string if not found.'),
  location: z.string().default('').describe('City, Country, or current residence.'),
  headline: z
    .string()
    .default('')
    .describe('Current professional title or headline (e.g. Senior Full Stack Engineer).'),
  summary: z
    .string()
    .default('')
    .describe('Executive summary, professional profile, or bio statement.'),
  websiteUrl: z
    .string()
    .default('')
    .describe('Personal website or portfolio URL, or empty string.'),
  linkedinUrl: z.string().default('').describe('LinkedIn profile URL, or empty string.'),
  githubUrl: z.string().default('').describe('GitHub or code repository URL, or empty string.'),
  experiences: z
    .array(
      z.object({
        companyName: z.string().default('').describe('Company, client, or employer name.'),
        jobTitle: z.string().default('').describe('Job title or role.'),
        location: z.string().default('').describe('Work location or Remote.'),
        startDate: z.string().default('').describe('Start date in YYYY-MM or Month YYYY format.'),
        endDate: z
          .string()
          .default('')
          .describe('End date in YYYY-MM or Month YYYY format, or empty if current.'),
        isCurrent: z.boolean().default(false).describe('True if this position is current/present.'),
        bullets: z
          .array(z.string())
          .default([])
          .describe('Achievement and responsibility bullet points.'),
      }),
    )
    .default([])
    .describe('Chronological work experiences.'),
  educations: z
    .array(
      z.object({
        institution: z.string().default('').describe('University or school name.'),
        degree: z.string().default('').describe('Degree or qualification title.'),
        fieldOfStudy: z.string().default('').describe('Major or field of study.'),
        startDate: z.string().default('').describe('Start year or date.'),
        endDate: z.string().default('').describe('End year or graduation date.'),
        grade: z.string().default('').describe('GPA, honors, or grade, or empty string.'),
      }),
    )
    .default([])
    .describe('Academic education and degrees.'),
  skills: z.array(z.string()).default([]).describe('Individual technical and professional skills.'),
  languages: z.array(z.string()).default([]).describe('Spoken and written natural languages.'),
  projects: z
    .array(
      z.object({
        name: z.string().default('').describe('Project name.'),
        description: z.string().default('').describe('Project summary and impact.'),
        role: z.string().default('').describe('Role played on the project.'),
        technologies: z.array(z.string()).default([]).describe('Tech stack used.'),
        url: z.string().default('').describe('Project repository or live URL, or empty string.'),
      }),
    )
    .default([])
    .describe('Key projects or open source contributions.'),
})

export type ResumeExtractionResult = z.infer<typeof ResumeExtractionSchema>

export const RESUME_PARSER_SYSTEM_PROMPT = `You are an expert bilingual ATS resume parser and candidate data extractor.
Your task is to accurately parse raw extracted resume text into a strictly structured JSON candidate profile.

Guidelines:
1. Language Detection:
   - Identify whether the primary language is English ("EN") or Arabic ("AR").
   - Preserve authentic phrasing and terminology in the original language. Do NOT translate Arabic text into English, or English into Arabic.
2. Grounded Extraction:
   - Extract only what is present or clearly implied in the text. Do NOT hallucinate experiences, skills, or fake contact info.
   - If contact details (email, phone, urls) are absent, leave them as empty strings.
3. Experiences & Dates:
   - Extract each job role, organization name, dates, and bullet points.
   - If a role is marked as present, current, or ongoing (e.g. "حتى الآن" or "Present"), set isCurrent to true and endDate to "".
4. Skills:
   - Break down concatenated skill lists into clean individual skill names.
5. Projects:
   - Extract named projects with technologies used and descriptions if present.

Return a clean, structured object conforming exactly to the requested schema.`

export class AiParsingError extends Error {
  readonly code: 'AI_PROVIDER_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'AiParsingError'
    this.code = 'AI_PROVIDER_ERROR'
  }
}

/**
 * Extracts structured candidate profile data from raw resume text using Vercel AI SDK generateObject.
 * Enforces a strict 60-second timeout using AbortSignal.timeout(60000).
 */
export async function parseResumeWithAi(
  rawText: string,
  activeSetting: DecryptedProviderSetting,
): Promise<ParsedResumePayload> {
  const model = getProviderModel(activeSetting)

  try {
    const { object } = await generateObject({
      model,
      schema: ResumeExtractionSchema,
      system: RESUME_PARSER_SYSTEM_PROMPT,
      prompt: `Please extract the candidate details from the following resume text:\n\n${rawText}`,
      abortSignal: AbortSignal.timeout(60000), // 60s explicit timeout (AC-3)
    })

    return {
      language: object.language,
      fullName: object.fullName,
      email: object.email,
      phone: object.phone,
      location: object.location,
      headline: object.headline,
      summary: object.summary,
      websiteUrl: object.websiteUrl,
      linkedinUrl: object.linkedinUrl,
      githubUrl: object.githubUrl,
      experiences: object.experiences.map((exp) => ({
        companyName: exp.companyName,
        company: exp.companyName,
        jobTitle: exp.jobTitle,
        title: exp.jobTitle,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        bullets: exp.bullets,
      })),
      educations: object.educations,
      skills: object.skills,
      languages: object.languages || [],
      projects: object.projects,
    }
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'AI provider request failed or timed out after 60 seconds.'
    throw new AiParsingError(
      `AI extraction failed: ${errorMsg}. Your raw text was preserved, so you can retry without re-uploading.`,
    )
  }
}
