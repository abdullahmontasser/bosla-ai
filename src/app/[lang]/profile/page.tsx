import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isSupportedLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { requireSession } from '@/lib/auth/require-session'
import { WorkspaceHeader } from '@/components/workspace'
import { getOrCreateDefaultProfile } from '@/lib/db/profiles'
import { getActiveResumeLanguage } from '@/lib/i18n/resume-language'
import { prisma } from '@/lib/prisma'
import { ProfileHub, type ProfileData } from '@/components/profile/ProfileHub'
import { HealthProfileCard } from '@/components/health/HealthProfileCard'
import { getResumeHealthForProfile } from '@/lib/health/queries'
import type { Language } from '@prisma/client'

export const instant = false

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const isAr = lang === 'ar'
  const session = await requireSession(lang, `/${lang}/profile`)
  const userId = session.user?.id
  if (!userId) {
    notFound()
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const profileLangParam =
    typeof resolvedSearchParams.profileLang === 'string'
      ? resolvedSearchParams.profileLang
      : undefined

  const initialProfileLang: Language = await getActiveResumeLanguage(profileLangParam)
  const dict = await getDictionary(lang)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  })

  const profile = await getOrCreateDefaultProfile(userId, initialProfileLang, {
    name: user?.name,
    email: user?.email,
  })

  const initialData: ProfileData = {
    user: {
      id: userId,
      name: user?.name,
      email: user?.email || '',
      image: user?.image,
    },
    profile: {
      id: profile.id,
      language: profile.language as 'EN' | 'AR',
      fullName: profile.fullName,
      headline: profile.headline,
      summary: profile.summary,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      websiteUrl: profile.websiteUrl,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      isDefault: profile.isDefault,
    },
    experiences: profile.workExperiences.map((exp) => ({
      id: exp.id,
      companyName: exp.companyName,
      jobTitle: exp.jobTitle,
      location: exp.location,
      startDate: exp.startDate.toISOString(),
      endDate: exp.endDate ? exp.endDate.toISOString() : null,
      isCurrent: exp.isCurrent,
      bullets: exp.bullets,
      sortOrder: exp.sortOrder,
    })),
    educations: profile.educations.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate ? edu.startDate.toISOString() : null,
      endDate: edu.endDate ? edu.endDate.toISOString() : null,
      grade: edu.grade,
      sortOrder: edu.sortOrder,
    })),
    skills: profile.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      sortOrder: skill.sortOrder,
    })),
    projects: profile.projects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      role: proj.role,
      technologies: proj.technologies,
      url: proj.url,
      sortOrder: proj.sortOrder,
    })),
  }

  let initialHealthView = null
  try {
    initialHealthView = await getResumeHealthForProfile(userId, profile.id)
  } catch {
    initialHealthView = null
  }

  const healthSlot = (
    <Suspense fallback={<div className="h-32 rounded-[8px] bg-card/60 animate-pulse" />}>
      <HealthProfileCard
        key={profile.id}
        userId={userId}
        profileId={profile.id}
        lang={lang as 'en' | 'ar'}
        dict={dict}
      />
    </Suspense>
  )

  const userFirstName = (user?.name || profile.fullName || '').trim().split(/\s+/)[0]

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      <WorkspaceHeader
        lang={lang}
        section={isAr ? 'الملف الشخصي الموحد' : 'Candidate Profile'}
        resumeLanguage={initialProfileLang as 'EN' | 'AR'}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/70 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-px w-4 bg-primary" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {isAr ? 'الملف المهني والصورة الشخصية' : 'Candidate Profile & Identity'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
                {isAr
                  ? userFirstName
                    ? `أهلاً بك، ${userFirstName} — ابنِ ملفك المهني الموحد`
                    : 'ابنِ ملفك المهني الموحد'
                  : userFirstName
                    ? `Welcome, ${userFirstName} — Craft your master profile`
                    : 'Craft your master career profile'}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? 'أدخل بياناتك وسجل خبراتك المعتمدة هنا مرة واحدة. سنعتمد على هذا الملف الموحد لتخصيص سيرك الذاتية بما يلائم أنظمة ATS وتجهيزك للمقابلات فوراً.'
                  : 'Complete your verified career background here once. Bosla AI uses these exact details to tailor your ATS resumes and generate personalized interview prep.'}
              </p>
            </div>
          </div>

          <ProfileHub
            key={profile.id}
            initialData={initialData}
            initialHealthView={initialHealthView}
            lang={lang}
            dict={dict}
            healthCardSlot={healthSlot}
          />
        </main>
      </div>
    </div>
  )
}
