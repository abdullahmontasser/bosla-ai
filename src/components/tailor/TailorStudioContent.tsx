import { auth } from '@/auth'
import { getDefaultProfile } from '@/lib/db/profiles'
import { getProviderConfigurations } from '@/app/actions/provider-settings'
import { StudioContainer } from './StudioContainer'
import { SignInCard } from './SignInCard'
import type { Dictionary } from '@/lib/i18n/types'

export async function TailorStudioContent({ lang, dict }: { lang: string; dict: Dictionary }) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center py-6">
        <SignInCard lang={lang} dict={dict} />
      </div>
    )
  }

  const language = lang === 'ar' ? 'AR' : 'EN'
  const profile = await getDefaultProfile(session.user.id, language)

  const providerConfigs = await getProviderConfigurations()
  const activeSetting = Array.isArray(providerConfigs)
    ? providerConfigs.find((p) => p.isActive)
    : null
  const configuredProviders = Array.isArray(providerConfigs)
    ? providerConfigs.filter((p) => p.isConfigured).map((p) => p.provider)
    : []

  return (
    <StudioContainer
      initialProfile={
        profile
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
          : null
      }
      initialActiveProvider={activeSetting?.provider || null}
      initialDefaultModel={activeSetting?.defaultModel || null}
      configuredProviders={configuredProviders}
      lang={lang as 'en' | 'ar'}
      dict={dict}
    />
  )
}
