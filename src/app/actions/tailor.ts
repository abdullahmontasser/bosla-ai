'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'
import { SaveCandidateProfileSchema } from '@/lib/validations/tailor'
import { getSampleCandidate } from '@/lib/fixtures/sample-candidate'
import { getProviderConfigurations } from '@/app/actions/provider-settings'
import { getOutreachMessageAction } from '@/app/actions/outreach-actions'
import type { Language, AiProvider, ResumeGenerationStatus } from '@prisma/client'
import type { TailoredResumeContentSnapshot } from '@/lib/ai/tailor-prompt'

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
    emailVerified?: boolean
    workExperiences: Array<{
      companyName: string
      jobTitle: string
      bullets: string[]
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

function reconstructFormattedStream(
  tailoredSummary?: string | null,
  tailoredContent?: unknown,
): string {
  const snapshot = tailoredContent as TailoredResumeContentSnapshot | null | undefined
  const summary = (tailoredSummary || snapshot?.tailoredSummary || '').trim()
  const bullets: string[] = []

  if (snapshot && Array.isArray(snapshot.tailoredExperiences)) {
    for (const exp of snapshot.tailoredExperiences) {
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          const text = typeof b?.tailored === 'string' ? b.tailored.trim() : ''
          if (text) bullets.push(`- ${text}`)
        }
      }
    }
  }

  if (!summary && bullets.length === 0) {
    return ''
  }

  if (bullets.length === 0) {
    return summary
  }

  return `### SUMMARY\n${summary}\n\n### BULLETS\n${bullets.join('\n')}`
}

export async function getTailorStudioInitialData(
  language: 'EN' | 'AR' = 'EN',
): Promise<TailorStudioData> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
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
          candidateName: user?.name || null,
          emailVerified: isEmailVerified,
          workExperiences: profile.workExperiences.map((w) => ({
            companyName: w.companyName,
            jobTitle: w.jobTitle,
            bullets: w.bullets,
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
          tailoredSummary: reconstructFormattedStream(
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
