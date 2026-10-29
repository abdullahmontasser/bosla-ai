import { getResumeHealthForProfile } from '@/lib/health/queries'
import type { Dictionary } from '@/lib/i18n/types'
import { HealthProfileCardClient } from './HealthProfileCardClient'

export interface HealthProfileCardProps {
  userId: string
  /** The profile the page already loaded; the card reloads scoring inputs itself. */
  profileId: string
  /** Page locale, used for the route of the audit link. */
  lang: 'en' | 'ar'
  dict: Dictionary
}

/**
 * Compact audit card for `/profile` (spec 0014, AC-1).
 * Server loads initial view, client component reacts when profile language changes.
 */
export async function HealthProfileCard({ userId, profileId, lang, dict }: HealthProfileCardProps) {
  const view = await getResumeHealthForProfile(userId, profileId)

  return (
    <HealthProfileCardClient initialView={view} profileId={profileId} lang={lang} dict={dict} />
  )
}
