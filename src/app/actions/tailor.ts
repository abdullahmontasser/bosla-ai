'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'
import { SaveCandidateProfileSchema } from '@/lib/validations/tailor'
import { getSampleCandidate } from '@/lib/fixtures/sample-candidate'
import { getProviderConfigurations } from '@/app/actions/provider-settings'
import type { Language, AiProvider } from '@prisma/client'

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
      email?: string | null
    }
  } | null
  profile: {
    id: string
    headline?: string | null
    summary?: string | null
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
    atsScore?: number | null
    atsBreakdown?: unknown | null
    outreachMessage?: unknown | null
    interviewPrep?: unknown | null
  } | null
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

  const profile = await getDefaultProfile(session.user.id, language as Language)
  const providerConfigs = await getProviderConfigurations()
  const activeSetting = Array.isArray(providerConfigs)
    ? providerConfigs.find((p) => p.isActive)
    : null
  const configuredProviders = Array.isArray(providerConfigs)
    ? providerConfigs.filter((p) => p.isConfigured).map((p) => p.provider)
    : []

  const latestResume = await prisma.tailoredResume.findFirst({
    where: {
      userId: session.user.id,
      language: language as Language,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      atsScore: true,
      atsBreakdown: true,
      outreachMessage: true,
      interviewPrep: true,
    },
  })

  return {
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    },
    profile: profile
      ? {
          id: profile.id,
          headline: profile.headline,
          summary: profile.summary,
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
          atsScore: latestResume.atsScore,
          atsBreakdown: latestResume.atsBreakdown,
          outreachMessage: latestResume.outreachMessage,
          interviewPrep: latestResume.interviewPrep,
        }
      : null,
  }
}
