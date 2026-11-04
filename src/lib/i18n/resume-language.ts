import { cookies } from 'next/headers'
import { RESUME_LANGUAGE_COOKIE_NAME, type ResumeLanguage } from './config'

/**
 * Resolves the active resume language for the workspace.
 * Decoupled from the UI locale (lang): defaults to 'EN' unless explicitly set to 'AR'.
 */
export async function getActiveResumeLanguage(
  explicitParam?: string | null,
  defaultLang?: ResumeLanguage,
): Promise<ResumeLanguage> {
  const paramUpper = explicitParam?.toUpperCase()
  if (paramUpper === 'AR' || paramUpper === 'EN') {
    return paramUpper as ResumeLanguage
  }

  try {
    const cookieStore = await cookies()
    const cookieVal =
      cookieStore.get(RESUME_LANGUAGE_COOKIE_NAME)?.value?.toUpperCase() ||
      cookieStore.get('careercraft_profile_lang')?.value?.toUpperCase()

    if (cookieVal === 'AR' || cookieVal === 'EN') {
      return cookieVal as ResumeLanguage
    }
  } catch {
    // Outside request store (e.g., unit test environments)
  }

  return defaultLang || 'EN'
}
