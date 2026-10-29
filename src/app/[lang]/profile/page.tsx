import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isSupportedLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { requireSession } from '@/lib/auth/require-session'
import { WorkspaceHeader } from '@/components/workspace'
import { getOrCreateDefaultProfile } from '@/lib/db/profiles'
import { prisma } from '@/lib/prisma'
import { ProfileHub, type ProfileData } from '@/components/profile/ProfileHub'
import { HealthProfileCard } from '@/components/health/HealthProfileCard'
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

  const isAr = lang === 'ar'
  const initialProfileLang: Language =
    profileLangParam?.toUpperCase() === 'AR'
      ? 'AR'
      : profileLangParam?.toUpperCase() === 'EN'
        ? 'EN'
        : isAr
          ? 'AR'
          : 'EN'
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <WorkspaceHeader lang={lang} section={isAr ? 'الملف الشخصي الموحد' : 'Candidate Profile'} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAr ? 'الملف المهني والصورة الشخصية' : 'Candidate Profile & Identity'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? 'المصدر الموحد لهويتك المهنية وخبراتك وصورتك الشخصية لجميع السير الذاتية ومساحة العمل.'
              : 'Single source of truth for your professional identity, avatar photo, and career history across the workspace.'}
          </p>
        </div>

        <div className="mb-6">
          <Suspense fallback={<div className="h-40 rounded-lg bg-card animate-pulse" />}>
            <HealthProfileCard
              key={profile.id}
              userId={userId}
              profileId={profile.id}
              lang={lang}
              dict={dict}
            />
          </Suspense>
        </div>

        <ProfileHub initialData={initialData} lang={lang} />
      </main>
    </div>
  )
}
