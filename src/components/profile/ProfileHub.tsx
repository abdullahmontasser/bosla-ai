'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Briefcase, GraduationCap, Wrench, FolderGit2 } from 'lucide-react'
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
  const isAr = lang === 'ar'
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

  const sectionNavItems = [
    {
      href: '#section-identity',
      label: isAr ? 'الهوية المهنية' : 'Personal Identity',
      count: profile.summary ? (isAr ? 'مكتمل' : 'Ready') : (isAr ? 'أساسي' : 'Basic'),
      icon: User,
      isComplete: Boolean(profile.fullName && profile.summary),
    },
    {
      href: '#section-experience',
      label: isAr ? 'الخبرات المهنية' : 'Work Experience',
      count: String(experiences.length),
      icon: Briefcase,
      isComplete: experiences.length > 0,
    },
    {
      href: '#section-education',
      label: isAr ? 'التعليم والمؤهلات' : 'Education',
      count: String(educations.length),
      icon: GraduationCap,
      isComplete: educations.length > 0,
    },
    {
      href: '#section-skills',
      label: isAr ? 'المهارات والكفاءات' : 'Skills',
      count: String(skills.length),
      icon: Wrench,
      isComplete: skills.length >= 5,
    },
    {
      href: '#section-projects',
      label: isAr ? 'المشاريع البارزة' : 'Projects',
      count: String(projects.length),
      icon: FolderGit2,
      isComplete: projects.length > 0,
    },
  ]

  return (
    <div className="relative w-full">
      {loadingLanguage && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-xs rounded-xl">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[13px] font-medium text-foreground">
              {isAr ? 'جارٍ تحميل الملف...' : 'Loading profile...'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column / Sticky Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
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

          {/* Quick Section Jump Navigation & Completion Summary */}
          <nav
            aria-label={isAr ? 'أقسام الملف المهني' : 'Profile sections'}
            className="rounded-xl border border-border/70 bg-card p-3 space-y-1"
          >
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? 'أقسام السيرة الذاتية' : 'Resume Sections'}
            </p>
            {sectionNavItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="size-3.5 text-primary/80" />
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                      item.isComplete
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </a>
              )
            })}
          </nav>
        </aside>

        {/* Right Column / Master Sections */}
        <main className="lg:col-span-8 xl:col-span-8 space-y-6">
          <div id="section-identity" className="scroll-mt-20">
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
          </div>

          <div id="section-experience" className="scroll-mt-20">
            <ExperienceCard
              profileId={profile.id}
              experiences={experiences}
              lang={lang}
              onExperiencesChange={(newExps) => {
                setExperiences(newExps)
                notifyProfileDataUpdated(profile.id)
              }}
            />
          </div>

          <div id="section-education" className="scroll-mt-20">
            <EducationCard
              profileId={profile.id}
              educations={educations}
              lang={lang}
              onEducationsChange={(newEdus) => {
                setEducations(newEdus)
                notifyProfileDataUpdated(profile.id)
              }}
            />
          </div>

          <div id="section-skills" className="scroll-mt-20">
            <SkillsCard
              profileId={profile.id}
              skills={skills}
              lang={lang}
              onSkillsChange={(newSkills) => {
                setSkills(newSkills)
                notifyProfileDataUpdated(profile.id)
              }}
            />
          </div>

          <div id="section-projects" className="scroll-mt-20">
            <ProjectsCard
              profileId={profile.id}
              projects={projects}
              lang={lang}
              onProjectsChange={(newProjects) => {
                setProjects(newProjects)
                notifyProfileDataUpdated(profile.id)
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
