'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileOverviewCard } from './ProfileOverviewCard'
import { LanguageProfileSwitch } from './LanguageProfileSwitch'
import { IdentityCard } from './IdentityCard'
import { ExperienceCard, type WorkExperienceItem } from './ExperienceCard'
import { EducationCard, type EducationItem } from './EducationCard'
import { SkillsCard, type SkillItem } from './SkillsCard'
import { ProjectsCard, type ProjectItem } from './ProjectsCard'

export interface ProfileData {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  profile: {
    id: string
    language: 'EN' | 'AR'
    fullName: string
    headline?: string | null
    summary?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    websiteUrl?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    isDefault: boolean
  }
  experiences: WorkExperienceItem[]
  educations: EducationItem[]
  skills: SkillItem[]
  projects: ProjectItem[]
}

interface ProfileHubProps {
  initialData: ProfileData
  lang: string
}

function useSafeRouter() {
  try {
    return useRouter()
  } catch {
    return null
  }
}

export function ProfileHub({ initialData, lang }: ProfileHubProps) {
  const router = useSafeRouter()
  const [user, setUser] = useState(initialData.user)
  const [profile, setProfile] = useState(initialData.profile)
  const [experiences, setExperiences] = useState<WorkExperienceItem[]>(initialData.experiences)
  const [educations, setEducations] = useState<EducationItem[]>(initialData.educations)
  const [skills, setSkills] = useState<SkillItem[]>(initialData.skills)
  const [projects, setProjects] = useState<ProjectItem[]>(initialData.projects)
  const [loadingLanguage, setLoadingLanguage] = useState(false)

  // Notify health card of profile data changes
  const notifyProfileDataUpdated = (targetProfileId: string = profile.id) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('profile-data-updated', {
          detail: { profileId: targetProfileId },
        }),
      )
    }
  }

  // Handle avatar update
  const handleAvatarUpdate = (newImage: string | null) => {
    setUser((prev) => ({ ...prev, image: newImage }))
  }

  // Handle identity update
  const handleIdentitySave = (updated: {
    fullName: string
    headline?: string | null
    summary?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    websiteUrl?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
  }) => {
    setProfile((prev) => ({
      ...prev,
      ...updated,
    }))
    if (updated.fullName) {
      setUser((prev) => ({ ...prev, name: updated.fullName }))
    }
    notifyProfileDataUpdated(profile.id)
  }

  // Handle language switch between EN and AR profile records
  const handleSelectLanguage = async (newLang: 'EN' | 'AR') => {
    if (newLang === profile.language) return

    setLoadingLanguage(true)
    try {
      const res = await fetch(`/api/profile?language=${newLang}`)
      if (!res.ok) throw new Error('Failed to load profile')

      const data: ProfileData = await res.json()
      setProfile(data.profile)
      setExperiences(data.experiences)
      setEducations(data.educations)
      setSkills(data.skills)
      setProjects(data.projects)
      if (data.user) {
        setUser(data.user)
      }

      // Notify HealthProfileCard and any other listeners that profile language changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile-language-changed', {
            detail: { profileId: data.profile.id, language: newLang },
          }),
        )
        // Store profile language preference in cookie for cross-page persistence
        document.cookie = `careercraft_profile_lang=${newLang.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`
      }

      router?.replace(`/${lang}/profile?profileLang=${newLang.toLowerCase()}`, { scroll: false })
      router?.refresh()
    } catch (err) {
      console.error('Failed to switch profile language:', err)
    } finally {
      setLoadingLanguage(false)
    }
  }

  return (
    <div className="relative w-full">
      {loadingLanguage && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-xl">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[13px] font-medium text-foreground">
              {lang === 'ar' ? 'جارٍ تحميل الملف...' : 'Loading profile...'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column / Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
          <ProfileOverviewCard
            user={user}
            profile={profile}
            lang={lang}
            onAvatarUpdate={handleAvatarUpdate}
          />
          <LanguageProfileSwitch
            currentProfileLang={profile.language}
            onSelectLanguage={handleSelectLanguage}
            lang={lang}
          />
        </aside>

        {/* Right Column / Master Sections */}
        <main className="lg:col-span-8 xl:col-span-8 space-y-6">
          <IdentityCard
            key={profile.id}
            profileId={profile.id}
            fullName={profile.fullName}
            headline={profile.headline}
            summary={profile.summary}
            email={profile.email}
            phone={profile.phone}
            location={profile.location}
            websiteUrl={profile.websiteUrl}
            linkedinUrl={profile.linkedinUrl}
            githubUrl={profile.githubUrl}
            lang={lang}
            onSaveSuccess={handleIdentitySave}
          />

          <ExperienceCard
            profileId={profile.id}
            experiences={experiences}
            lang={lang}
            onExperiencesChange={(newExps) => {
              setExperiences(newExps)
              notifyProfileDataUpdated(profile.id)
            }}
          />

          <EducationCard
            profileId={profile.id}
            educations={educations}
            lang={lang}
            onEducationsChange={(newEdus) => {
              setEducations(newEdus)
              notifyProfileDataUpdated(profile.id)
            }}
          />

          <SkillsCard
            profileId={profile.id}
            skills={skills}
            lang={lang}
            onSkillsChange={(newSkills) => {
              setSkills(newSkills)
              notifyProfileDataUpdated(profile.id)
            }}
          />

          <ProjectsCard
            profileId={profile.id}
            projects={projects}
            lang={lang}
            onProjectsChange={(newProjects) => {
              setProjects(newProjects)
              notifyProfileDataUpdated(profile.id)
            }}
          />
        </main>
      </div>
    </div>
  )
}
