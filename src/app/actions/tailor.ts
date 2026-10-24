'use server'

import { auth } from '@/auth'
import { getDefaultProfile, upsertTailoringCandidateProfile } from '@/lib/db/profiles'
import { SaveCandidateProfileSchema } from '@/lib/validations/tailor'
import { getSampleCandidate } from '@/lib/fixtures/sample-candidate'
import type { Language } from '@prisma/client'

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
