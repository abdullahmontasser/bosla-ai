'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'
import { SaveCandidateProfileSchema } from '@/lib/validations/tailor'
import { getSampleCandidate } from '@/lib/fixtures/sample-candidate'
import { getProviderConfigurations } from '@/app/actions/provider-settings'
import { getOutreachMessageAction } from '@/app/actions/outreach-actions'
import type { Language, AiProvider, ResumeGenerationStatus } from '@prisma/client'
import { formatSnapshotAsText, type TailoredResumeContentSnapshot } from '@/lib/ai/tailor-prompt'

export { getOutreachMessageAction }

export async function getCandidateProfile(language: 'EN' | 'AR' = 'EN') {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const profile = await getDefaultProfile(session.user.id, language as Language)
    return { success: true, profile }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch candidate profile'
    return { success: false, error: message }
  }
}

export async function saveCandidateProfile(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = SaveCandidateProfileSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const result = await upsertTailoringCandidateProfile(session.user.id, {
      profileId: parsed.data.profileId,
      language: parsed.data.language as Language,
      headline: parsed.data.headline,
      summary: parsed.data.summary,
      experiences: parsed.data.experiences,
    })
    return { success: true, profileId: result.profileId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save candidate profile'
    return { success: false, error: message }
  }
}

export async function loadSampleCandidateProfile(language: 'EN' | 'AR' = 'EN') {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const sample = getSampleCandidate(language)
  return { success: true, profile: sample }
}

export interface TailorStudioData {
  resumeLanguage?: 'EN' | 'AR'
  session: {
    user: {
      id: string
      name?: string | null
      email?: string | null
      emailVerified?: boolean
    }
  } | null
  profile: {
    id: string
    headline?: string | null
    summary?: string | null
    candidateName?: string | null
    fullName?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedin?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    websiteUrl?: string | null
    emailVerified?: boolean
    workExperiences: Array<{
      companyName: string
      jobTitle: string
      bullets: string[]
    }>
    educations?: Array<{
      schoolName: string
      degree: string
      fieldOfStudy?: string | null
      startDate?: string
      endDate?: string | null
    }>
    projects?: Array<{
      title: string
      role?: string | null
      description?: string | null
      bullets: string[]
      technologies?: string[]
    }>
    skills?: Array<{
      name: string
      category?: string | null
      level?: string | null
    }>
  } | null
  activeProvider: AiProvider | null
  defaultModel: string | null
  configuredProviders: AiProvider[]
  latestTailoredResume?: {
    id: string
    status?: ResumeGenerationStatus
    atsScore?: number | null
    atsBreakdown?: unknown | null
    hasOutreach: boolean
    hasApplication: boolean
    tailoredSummary?: string | null
    tailoredContent?: TailoredResumeContentSnapshot | null
    jobPosting?: {
      title: string
      companyName: string
      rawDescription: string
    } | null
    outreachMessage?: unknown | null
  } | null
}

export async function getTailorStudioInitialData(
  language: 'EN' | 'AR' = 'EN',
): Promise<TailorStudioData> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      resumeLanguage: language,
      session: null,
      profile: null,
      activeProvider: null,
      defaultModel: null,
      configuredProviders: [],
      latestTailoredResume: null,
    }
  }

  const [user, profile, providerConfigs, latestResume] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, emailVerified: true },
    }),
    getDefaultProfile(session.user.id, language as Language),
    getProviderConfigurations(),
    prisma.tailoredResume.findFirst({
      where: {
        userId: session.user.id,
        language: language as Language,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        atsScore: true,
        atsBreakdown: true,
        tailoredSummary: true,
        tailoredContent: true,
        outreachMessage: true,
        jobPosting: {
          select: {
            title: true,
            companyName: true,
            rawDescription: true,
          },
        },
        applications: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    }),
  ])

  const activeSetting = Array.isArray(providerConfigs)
    ? providerConfigs.find((p) => p.isActive)
    : null
  const configuredProviders = Array.isArray(providerConfigs)
    ? providerConfigs.filter((p) => p.isConfigured).map((p) => p.provider)
    : []

  const isEmailVerified = Boolean(user?.emailVerified)

  return {
    resumeLanguage: language,
    session: {
      user: {
        id: session.user.id,
        name: user?.name,
        email: session.user.email,
        emailVerified: isEmailVerified,
      },
    },
    profile: profile
      ? {
          id: profile.id,
          headline: profile.headline,
          summary: profile.summary,
          candidateName: profile.fullName || user?.name || null,
          fullName: profile.fullName || user?.name || null,
          email: profile.email || session.user.email || null,
          phone: profile.phone || null,
          location: profile.location || null,
          linkedin: profile.linkedinUrl || null,
          linkedinUrl: profile.linkedinUrl || null,
          githubUrl: profile.githubUrl || null,
          websiteUrl: profile.websiteUrl || null,
          emailVerified: isEmailVerified,
          workExperiences: profile.workExperiences.map((w) => ({
            companyName: w.companyName,
            jobTitle: w.jobTitle,
            bullets: w.bullets,
          })),
          educations: (
            (
              profile as unknown as {
                educations?: Array<{
                  institution: string
                  degree: string
                  fieldOfStudy: string | null
                  startDate: Date | null
                  endDate: Date | null
                }>
              }
            ).educations || []
          ).map((e) => ({
            schoolName: e.institution,
            degree: e.degree,
            fieldOfStudy: e.fieldOfStudy,
            startDate: e.startDate ? e.startDate.toISOString() : undefined,
            endDate: e.endDate ? e.endDate.toISOString() : null,
          })),
          projects: (
            (
              profile as unknown as {
                projects?: Array<{
                  name: string
                  role: string | null
                  description: string | null
                  technologies: string[]
                }>
              }
            ).projects || []
          ).map((p) => ({
            title: p.name,
            role: p.role,
            description: p.description,
            bullets: p.technologies,
            technologies: p.technologies,
          })),
          skills: (
            (
              profile as unknown as {
                skills?: Array<{ name: string; category: string | null; level: string | null }>
              }
            ).skills || []
          ).map((s) => ({
            name: s.name,
            category: s.category,
            level: s.level,
          })),
        }
      : null,
    activeProvider: activeSetting?.provider || null,
    defaultModel: activeSetting?.defaultModel || null,
    configuredProviders,
    latestTailoredResume: latestResume
      ? {
          id: latestResume.id,
          status: latestResume.status,
          atsScore: latestResume.atsScore,
          atsBreakdown: latestResume.atsBreakdown,
          tailoredSummary: formatSnapshotAsText(
            latestResume.tailoredSummary,
            latestResume.tailoredContent,
          ),
          tailoredContent:
            (latestResume.tailoredContent as unknown as TailoredResumeContentSnapshot) ?? null,
          hasOutreach: latestResume.outreachMessage !== null,
          hasApplication: (latestResume.applications?.length ?? 0) > 0,
          jobPosting: latestResume.jobPosting
            ? {
                title: latestResume.jobPosting.title,
                companyName: latestResume.jobPosting.companyName,
                rawDescription: latestResume.jobPosting.rawDescription,
              }
            : null,
          outreachMessage: null,
        }
      : null,
  }
}

export interface TailoredJobHistoryItem {
  id: string
  jobTitle: string
  companyName: string
  rawJobDescription: string
  atsScore: number | null
  tailoredSummary: string | null
  createdAt: string
  language: 'EN' | 'AR'
}

export async function getTailoredResumeHistoryAction(
  language: 'EN' | 'AR' = 'EN',
): Promise<{ success: boolean; error?: string; data: TailoredJobHistoryItem[] }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: [] }
  }

  try {
    const history = await prisma.tailoredResume.findMany({
      where: {
        userId: session.user.id,
        language: language as Language,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['jobPostingId'],
      take: 15,
      select: {
        id: true,
        atsScore: true,
        tailoredSummary: true,
        createdAt: true,
        language: true,
        jobPosting: {
          select: {
            title: true,
            companyName: true,
            rawDescription: true,
          },
        },
      },
    })

    // Strict deduplication by normalized (jobTitle + companyName) to guarantee zero duplicate roles in history
    const seen = new Set<string>()
    const deduplicatedData: TailoredJobHistoryItem[] = []

    for (const item of history) {
      const jobTitle = (item.jobPosting?.title || 'Untitled Role').trim()
      const companyName = (item.jobPosting?.companyName || 'Unknown Company').trim()
      const normalizedKey = `${jobTitle.toLowerCase().replace(/\s+/g, ' ')}:::${companyName.toLowerCase().replace(/\s+/g, ' ')}`

      if (seen.has(normalizedKey)) continue
      seen.add(normalizedKey)

      deduplicatedData.push({
        id: item.id,
        atsScore: item.atsScore,
        tailoredSummary: item.tailoredSummary,
        createdAt: item.createdAt.toISOString(),
        language: item.language as 'EN' | 'AR',
        jobTitle,
        companyName,
        rawJobDescription: item.jobPosting?.rawDescription || '',
      })
    }

    return {
      success: true,
      data: deduplicatedData,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch history'
    return { success: false, error: msg, data: [] }
  }
}
