'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, AlertCircle, CheckCircle2, Camera, Languages } from 'lucide-react'
import { IdentityCard } from './IdentityCard'
import { ExperienceCard, type WorkExperienceItem } from './ExperienceCard'
import { EducationCard, type EducationItem } from './EducationCard'
import { SkillsCard, type SkillItem } from './SkillsCard'
import { ProjectsCard, type ProjectItem } from './ProjectsCard'
import { ImportResumeModal } from './ImportResumeModal'
import { AvatarCropModal } from './AvatarCropModal'
import { BulletAiFixModal } from './BulletAiFixModal'
import { cn } from '@/lib/utils'
import { SectionHealthRecommendations } from '@/components/health/SectionHealthRecommendations'
import {
  getProfileHealthAction,
  acceptHealthSuggestionAction,
  dismissHealthSuggestionAction,
  generateHealthRewriteAction,
} from '@/app/actions/resume-health'
import type { HealthAuditView, HealthSuggestionDTO } from '@/lib/health/queries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { RESUME_LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config'

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
  initialHealthView?: HealthAuditView | null
  lang: string
  dict?: Record<string, unknown>
  healthCardSlot?: React.ReactNode
}

function useSafeRouter() {
  try {
    return useRouter()
  } catch {
    return null
  }
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function ProfileHub({
  initialData,
  initialHealthView = null,
  lang,
  dict,
  healthCardSlot,
}: ProfileHubProps) {
  const router = useSafeRouter()
  const isAr = lang === 'ar'
  const [user, setUser] = useState(initialData.user)
  const [profile, setProfile] = useState(initialData.profile)
  const [experiences, setExperiences] = useState<WorkExperienceItem[]>(initialData.experiences)
  const [educations, setEducations] = useState<EducationItem[]>(initialData.educations)
  const [skills, setSkills] = useState<SkillItem[]>(initialData.skills)
  const [projects, setProjects] = useState<ProjectItem[]>(initialData.projects)
  const [healthView, setHealthView] = useState<HealthAuditView | null>(initialHealthView || null)
  const [loadingLanguage, setLoadingLanguage] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingLanguageSwitch, setPendingLanguageSwitch] = useState<'EN' | 'AR' | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false)
  const [showCommitSuccessToast, setShowCommitSuccessToast] = useState(false)
  const activeLanguageRef = useRef(profile.language)

  const initials = getInitials(profile.fullName || user.name, user.email)

  useEffect(() => {
    activeLanguageRef.current = profile.language
  }, [profile.language])

  // Warn user if leaving tab with unsubmitted edits
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Notify health card and workspace of profile data changes
  const notifyProfileDataUpdated = (targetProfileId: string = profile.id) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('profile-data-updated', {
          detail: { profileId: targetProfileId },
        }),
      )
    }
  }

  const hasLoadedHealthRef = useRef(false)

  // Load and continuously update health audit view
  useEffect(() => {
    let isCancelled = false
    const reloadHealth = async (event?: Event) => {
      const customEvent = event as CustomEvent<{ profileId?: string }>
      const targetId = customEvent?.detail?.profileId || profile.id
      if (!targetId) return
      try {
        const nextView = await getProfileHealthAction(targetId)
        if (!isCancelled && nextView) {
          setHealthView(nextView)
        }
        // Only refresh live profile from API on explicit update events
        if (event && !isCancelled) {
          const profileRes = await fetch(`/api/profile?language=${profile.language}`, {
            cache: 'no-store',
          })
          if (profileRes.ok) {
            const data: ProfileData = await profileRes.json()
            setProfile(data.profile)
            setExperiences(data.experiences)
            setEducations(data.educations)
            setSkills(data.skills)
            setProjects(data.projects)
            if (data.user) setUser(data.user)
          }
        }
      } catch (err) {
        console.error('Failed to load health audit in ProfileHub:', err)
      }
    }

    if (!hasLoadedHealthRef.current) {
      hasLoadedHealthRef.current = true
      void reloadHealth()
    }

    window.addEventListener('profile-data-updated', reloadHealth)
    window.addEventListener('profile-language-changed', reloadHealth)
    return () => {
      isCancelled = true
      window.removeEventListener('profile-data-updated', reloadHealth)
      window.removeEventListener('profile-language-changed', reloadHealth)
    }
  }, [profile.id])

  // Section update handlers with reactive health notification
  const handleExperiencesChange = (updated: WorkExperienceItem[]) => {
    setExperiences(updated)
    notifyProfileDataUpdated(profile.id)
  }

  const handleEducationsChange = (updated: EducationItem[]) => {
    setEducations(updated)
    notifyProfileDataUpdated(profile.id)
  }

  const handleSkillsChange = (updated: SkillItem[]) => {
    setSkills(updated)
    notifyProfileDataUpdated(profile.id)
  }

  const handleProjectsChange = (updated: ProjectItem[]) => {
    setProjects(updated)
    notifyProfileDataUpdated(profile.id)
  }

  // Health recommendation handlers
  const handleAcceptSuggestion = async (suggestion: HealthSuggestionDTO) => {
    try {
      const res = await acceptHealthSuggestionAction(suggestion.id)
      if (res.ok) {
        setHealthView(res.view)

        // Optimistically update the bullet or field directly in live state
        if (
          suggestion.targetKind === 'WORK_EXPERIENCE_BULLET' &&
          suggestion.targetId &&
          suggestion.proposedText
        ) {
          setExperiences((prev) =>
            prev.map((exp) => {
              if (exp.id !== suggestion.targetId) return exp
              const bullets = [...exp.bullets]
              const targetIdx = suggestion.targetIndex ?? -1
              if (targetIdx >= 0 && targetIdx < bullets.length) {
                bullets[targetIdx] = suggestion.proposedText!
              } else {
                const foundIdx = bullets.findIndex(
                  (b) => b.trim() === suggestion.originalText.trim(),
                )
                if (foundIdx !== -1) {
                  bullets[foundIdx] = suggestion.proposedText!
                }
              }
              return { ...exp, bullets }
            }),
          )
        } else if (
          suggestion.targetKind === 'WORK_EXPERIENCE' &&
          suggestion.targetId &&
          suggestion.proposedText
        ) {
          setExperiences((prev) =>
            prev.map((exp) => {
              if (exp.id !== suggestion.targetId) return exp
              return { ...exp, bullets: [...exp.bullets, suggestion.proposedText!] }
            }),
          )
        } else if (suggestion.targetKind === 'PROFILE_SUMMARY' && suggestion.proposedText) {
          setProfile((prev) => ({ ...prev, summary: suggestion.proposedText! }))
        }

        // Refresh live profile state from API to ensure full server sync
        try {
          const profileRes = await fetch(`/api/profile?language=${profile.language}`, {
            cache: 'no-store',
          })
          if (profileRes.ok) {
            const data: ProfileData = await profileRes.json()
            setProfile(data.profile)
            setExperiences(data.experiences)
            setEducations(data.educations)
            setSkills(data.skills)
            setProjects(data.projects)
            if (data.user) setUser(data.user)
          }
        } catch (fetchErr) {
          console.error('Failed to reload profile data after accept:', fetchErr)
        }

        notifyProfileDataUpdated(profile.id)
      } else if (res.error === 'CONFLICT') {
        // Suggestion was already accepted or decided: gracefully sync live state
        const profileRes = await fetch(`/api/profile?language=${profile.language}`, {
          cache: 'no-store',
        })
        if (profileRes.ok) {
          const data: ProfileData = await profileRes.json()
          setProfile(data.profile)
          setExperiences(data.experiences)
        }
        notifyProfileDataUpdated(profile.id)
      } else {
        throw new Error(res.error || 'Failed to accept recommendation')
      }
    } catch (err) {
      console.error('Failed to apply health suggestion fix:', err)
      throw err
    }
  }

  const handleDismissSuggestion = async (suggestion: HealthSuggestionDTO) => {
    try {
      const res = await dismissHealthSuggestionAction(suggestion.id)
      if (res.ok) {
        setHealthView(res.view)
        notifyProfileDataUpdated(profile.id)
      }
    } catch (err) {
      console.error('Failed to dismiss health suggestion:', err)
    }
  }

  const handleRegenerateSuggestion = async (suggestion: HealthSuggestionDTO) => {
    try {
      const res = await generateHealthRewriteAction(suggestion.id)
      if (res.ok) {
        setHealthView(res.view)
      }
    } catch (err) {
      console.error('Failed to regenerate health rewrite:', err)
    }
  }

  const handleFixAllSection = async (suggestionsToFix: HealthSuggestionDTO[]) => {
    try {
      let lastView: HealthAuditView | null = null
      for (const s of suggestionsToFix) {
        if (s.proposedText && !s.isAiStale) {
          const res = await acceptHealthSuggestionAction(s.id)
          if (res.ok) {
            lastView = res.view
            if (s.targetKind === 'WORK_EXPERIENCE_BULLET' && s.targetId && s.proposedText) {
              setExperiences((prev) =>
                prev.map((exp) => {
                  if (exp.id !== s.targetId) return exp
                  const bullets = [...exp.bullets]
                  const targetIdx = s.targetIndex ?? -1
                  if (targetIdx >= 0 && targetIdx < bullets.length) {
                    bullets[targetIdx] = s.proposedText!
                  } else {
                    const foundIdx = bullets.findIndex((b) => b.trim() === s.originalText.trim())
                    if (foundIdx !== -1) {
                      bullets[foundIdx] = s.proposedText!
                    }
                  }
                  return { ...exp, bullets }
                }),
              )
            }
          }
        }
      }
      if (lastView) {
        setHealthView(lastView)
      }
      try {
        const profileRes = await fetch(`/api/profile?language=${profile.language}`, {
          cache: 'no-store',
        })
        if (profileRes.ok) {
          const data: ProfileData = await profileRes.json()
          setProfile(data.profile)
          setExperiences(data.experiences)
          setEducations(data.educations)
          setSkills(data.skills)
          setProjects(data.projects)
          if (data.user) setUser(data.user)
        }
      } catch (fetchErr) {
        console.error('Failed to reload profile data after fix all:', fetchErr)
      }
      const nextView = await getProfileHealthAction(profile.id)
      if (nextView) setHealthView(nextView)
      notifyProfileDataUpdated(profile.id)
    } catch (err) {
      console.error('Failed to fix all suggestions:', err)
      throw err
    }
  }

  const [activeBulletFix, setActiveBulletFix] = useState<{
    experienceId: string
    bulletIndex: number
    bulletText: string
  } | null>(null)

  const handleOpenBulletFix = (experienceId: string, bulletIndex: number, bulletText: string) => {
    setActiveBulletFix({ experienceId, bulletIndex, bulletText })
  }

  // Segment pending suggestions by profile section
  const pendingSuggestions = healthView?.suggestions.filter((s) => s.status === 'PENDING') || []

  const identitySuggestions = pendingSuggestions.filter((s) =>
    ['PROFILE_CONTACT', 'PROFILE_SUMMARY', 'PROFILE_GENERAL'].includes(s.targetKind),
  )
  const experienceIncompleteSuggestions = pendingSuggestions.filter(
    (s) =>
      ['WORK_EXPERIENCE', 'WORK_EXPERIENCE_BULLET'].includes(s.targetKind) &&
      (s.category === 'ATS_COMPLETENESS' || s.targetKind === 'WORK_EXPERIENCE'),
  )
  const educationSuggestions = pendingSuggestions.filter(
    (s) => s.targetKind === 'PROFILE_EDUCATION',
  )
  const skillsSuggestions = pendingSuggestions.filter((s) => s.targetKind === 'PROFILE_SKILLS')

  const matchingBulletSuggestion = activeBulletFix
    ? healthView?.suggestions.find(
        (s) =>
          s.status === 'PENDING' &&
          s.targetKind === 'WORK_EXPERIENCE_BULLET' &&
          s.targetId === activeBulletFix.experienceId &&
          (s.targetIndex === activeBulletFix.bulletIndex ||
            s.originalText.trim() === activeBulletFix.bulletText.trim()),
      )
    : null

  const handleApplyBulletFixFromModal = async (newText: string, suggestionId?: string) => {
    if (!activeBulletFix) return
    const { experienceId, bulletIndex } = activeBulletFix

    // 1. If matching suggestion exists and is PENDING, attempt accept action
    if (suggestionId) {
      const matching = healthView?.suggestions.find(
        (s) => s.id === suggestionId && s.status === 'PENDING',
      )
      if (matching) {
        try {
          const res = await acceptHealthSuggestionAction(matching.id)
          if (res.ok) {
            setHealthView(res.view)
            // Immediately update the bullet in local experiences state
            setExperiences((prev) =>
              prev.map((exp) => {
                if (exp.id !== experienceId) return exp
                const updatedBullets = [...exp.bullets]
                updatedBullets[bulletIndex] = newText
                return { ...exp, bullets: updatedBullets }
              }),
            )
            notifyProfileDataUpdated(profile.id)
            return
          }
        } catch (err) {
          console.warn(
            'Accept action returned conflict or failed, falling back to direct write:',
            err,
          )
        }
      }
    }

    // 2. Direct fallback update
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== experienceId) return exp
        const updatedBullets = [...exp.bullets]
        updatedBullets[bulletIndex] = newText
        return { ...exp, bullets: updatedBullets }
      }),
    )

    // Save to database
    try {
      const exp = experiences.find((e) => e.id === experienceId)
      if (exp) {
        const updatedBullets = [...exp.bullets]
        updatedBullets[bulletIndex] = newText
        await fetch(`/api/profile/experiences/${experienceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: exp.companyName,
            jobTitle: exp.jobTitle,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
            bullets: updatedBullets,
          }),
        })
      }
    } catch (err) {
      console.error('Failed to save experience bullet update:', err)
    }
    notifyProfileDataUpdated(profile.id)
  }

  const handleRegenerateBulletFixFromModal = async (suggestionId: string) => {
    const s = healthView?.suggestions.find((item) => item.id === suggestionId)
    if (s) {
      await handleRegenerateSuggestion(s)
    }
  }

  // Handle successful resume AI import by refreshing profile data
  const handleImportSuccess = async () => {
    try {
      setLoadingLanguage(true)
      const res = await fetch(`/api/profile?language=${profile.language}`)
      if (res.ok) {
        const data: ProfileData = await res.json()
        setProfile(data.profile)
        setExperiences(data.experiences)
        setEducations(data.educations)
        setSkills(data.skills)
        setProjects(data.projects)
        if (data.user) setUser(data.user)
        notifyProfileDataUpdated(data.profile.id)
      }
    } catch (err) {
      console.error('Failed to reload profile after import:', err)
    } finally {
      setLoadingLanguage(false)
    }
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

  // Handle avatar update from AvatarCropModal
  const handleAvatarSaved = (newImage: string | null) => {
    setUser((prev) => ({ ...prev, image: newImage }))
    notifyProfileDataUpdated(profile.id)
  }

  // Guarded language switch between EN and AR profile records
  const handleSelectLanguage = (newLang: 'EN' | 'AR') => {
    if (newLang === activeLanguageRef.current) return
    if (hasUnsavedChanges) {
      setPendingLanguageSwitch(newLang)
      return
    }
    executeLanguageSwitch(newLang)
  }

  const executeLanguageSwitch = async (newLang: 'EN' | 'AR') => {
    activeLanguageRef.current = newLang
    setLoadingLanguage(true)
    setHasUnsavedChanges(false)
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

      if (typeof window !== 'undefined') {
        document.cookie = `careercraft_profile_lang=${newLang.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`
        document.cookie = `${RESUME_LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
        window.dispatchEvent(
          new CustomEvent('profile-language-changed', {
            detail: { profileId: data.profile.id, language: newLang },
          }),
        )
        window.dispatchEvent(
          new CustomEvent('resume-language-changed', {
            detail: { language: newLang },
          }),
        )
      }

      router?.replace(`/${lang}/profile?profileLang=${newLang.toLowerCase()}`, { scroll: false })
      router?.refresh()
    } catch (err) {
      console.error('Failed to switch profile language:', err)
    } finally {
      setLoadingLanguage(false)
    }
  }

  const handleSelectLanguageRef = useRef(handleSelectLanguage)
  useEffect(() => {
    handleSelectLanguageRef.current = handleSelectLanguage
  })

  // Listen for global resume language changes (from sidebar/settings switcher)
  useEffect(() => {
    const handleGlobalResumeLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: 'EN' | 'AR' }>
      const newLang = customEvent.detail?.language
      if (
        newLang &&
        (newLang === 'EN' || newLang === 'AR') &&
        newLang !== activeLanguageRef.current
      ) {
        handleSelectLanguageRef.current(newLang)
      }
    }

    window.addEventListener('resume-language-changed', handleGlobalResumeLangChange)
    return () => window.removeEventListener('resume-language-changed', handleGlobalResumeLangChange)
  }, [])

  return (
    <div className="relative w-full space-y-6">
      {loadingLanguage && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-xs rounded-[10px]">
          <div className="flex items-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[13px] font-medium text-foreground">
              {isAr ? 'جارٍ تحميل الملف...' : 'Loading profile...'}
            </span>
          </div>
        </div>
      )}

      {/* Top Utility Instrument: Candidate Identity Chip + Base Resume Health + Fast AI Import */}
      <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-500 ease-out motion-reduce:animate-none">
        {/* Candidate Identity Strip (Compact 1-row summary) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            {/* Interactive Avatar with Hover Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-xs font-bold text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={profile.fullName || user.name || (isAr ? 'مرشح' : 'Candidate')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarCropModal(true)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 cursor-pointer"
                aria-label={isAr ? 'تعديل الصورة الشخصية' : 'Edit profile photo'}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold tracking-tight text-foreground truncate">
                {profile.fullName || user.name || (isAr ? 'مرشح' : 'Candidate')}
              </span>
              {profile.headline && (
                <p className="text-xs text-muted-foreground truncate">{profile.headline}</p>
              )}
            </div>
          </div>

          {/* Utility Controls: Bilingual Master Switcher + Fast AI Import */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Direct Bilingual Resume Profile Switcher */}
            <div
              className="inline-flex items-center rounded-full border border-border/80 bg-background/80 p-0.5 text-xs font-medium shadow-2xs"
              role="group"
              aria-label={isAr ? 'لغة الملف المهني' : 'Master profile language'}
            >
              <button
                type="button"
                onClick={() => handleSelectLanguage('EN')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer',
                  profile.language === 'EN'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-pressed={profile.language === 'EN'}
              >
                <span>EN</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">English</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLanguage('AR')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all duration-150 font-arabic cursor-pointer',
                  profile.language === 'AR'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-pressed={profile.language === 'AR'}
              >
                <span>عربي</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">RTL</span>
              </button>
            </div>

            {/* Fast Action: Import Resume with AI */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 rounded-full border-primary/30 bg-primary/[0.07] px-3.5 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:border-primary/60 hover:bg-primary/15 hover:shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary group"
              aria-label={isAr ? 'استيراد السيرة بالذكاء الاصطناعي' : 'Import resume with AI'}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              <span>{isAr ? 'استيراد بالذكاء الاصطناعي' : 'Import with AI'}</span>
            </Button>
          </div>
        </div>

        {/* Base Resume Health Card */}
        {healthCardSlot && <div className="w-full">{healthCardSlot}</div>}

        {/* Success Toast Banner */}
        {showCommitSuccessToast && (
          <div
            data-testid="profile-sync-success-toast"
            className="flex items-center justify-between rounded-[8px] border border-success/30 bg-success/10 p-3.5 text-xs text-success animate-in fade-in-50 motion-reduce:animate-none"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span className="font-semibold">
                {isAr
                  ? 'تم تحديث ومزامنة ملفك المهني بنجاح من السيرة الذاتية!'
                  : 'Master profile successfully updated and synchronized from your resume!'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCommitSuccessToast(false)}
              className="text-success hover:opacity-80 text-xs font-medium cursor-pointer"
              aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss notice'}
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}
      </div>

      {/* Single-Column Editorial Ledger */}
      <div className="rounded-[10px] border border-border divide-y divide-border overflow-hidden bg-card/40 shadow-xs animate-in fade-in-0 duration-500 delay-100 ease-out motion-reduce:animate-none">
        <div id="section-identity">
          <SectionHealthRecommendations
            sectionTitle={isAr ? 'البيانات الشخصية والملخص المهني' : 'Contact & Profile Summary'}
            suggestions={identitySuggestions}
            lang={lang}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
            onRegenerate={handleRegenerateSuggestion}
            onFixAll={handleFixAllSection}
          />
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
            onDirtyChange={setHasUnsavedChanges}
          />
        </div>

        <div id="section-experience">
          {experienceIncompleteSuggestions.length > 0 && (
            <SectionHealthRecommendations
              sectionTitle={
                isAr ? 'بيانات الخبرات المهنية غير المكتملة' : 'Incomplete Experience Details'
              }
              suggestions={experienceIncompleteSuggestions}
              lang={lang}
              onAccept={handleAcceptSuggestion}
              onDismiss={handleDismissSuggestion}
              onRegenerate={handleRegenerateSuggestion}
              onFixAll={handleFixAllSection}
            />
          )}
          <ExperienceCard
            profileId={profile.id}
            experiences={experiences}
            lang={lang}
            onExperiencesChange={handleExperiencesChange}
            onFixBullet={handleOpenBulletFix}
          />
        </div>

        <div id="section-education">
          <SectionHealthRecommendations
            sectionTitle={isAr ? 'التعليم والمؤهلات الأكاديمية' : 'Education & Credentials'}
            suggestions={educationSuggestions}
            lang={lang}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
            onRegenerate={handleRegenerateSuggestion}
            onFixAll={handleFixAllSection}
          />
          <EducationCard
            profileId={profile.id}
            educations={educations}
            lang={lang}
            onEducationsChange={handleEducationsChange}
          />
        </div>

        <div id="section-skills">
          <SectionHealthRecommendations
            sectionTitle={isAr ? 'المهارات والكفاءات' : 'Skills & Competencies'}
            suggestions={skillsSuggestions}
            lang={lang}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
            onRegenerate={handleRegenerateSuggestion}
            onFixAll={handleFixAllSection}
          />
          <SkillsCard
            profileId={profile.id}
            skills={skills}
            lang={lang}
            onSkillsChange={handleSkillsChange}
          />
        </div>

        <div id="section-projects">
          <ProjectsCard
            profileId={profile.id}
            projects={projects}
            lang={lang}
            onProjectsChange={handleProjectsChange}
          />
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={!!pendingLanguageSwitch}
        onOpenChange={(open) => !open && setPendingLanguageSwitch(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              {isAr ? 'تعديلات غير محفوظة' : 'Unsaved Changes'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              {isAr
                ? 'لديك تعديلات غير محفوظة في ملفك الشخصي. سيؤدي التبديل بين اللغات إلى تجاهل هذه التعديلات وتحميل بيانات الملف المختار.'
                : 'You have unsaved changes in your profile. Switching language will discard your draft edits and load the selected profile version.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingLanguageSwitch(null)}
            >
              {isAr ? 'متابعة التعديل' : 'Keep Editing'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (pendingLanguageSwitch) {
                  const targetLang = pendingLanguageSwitch
                  setPendingLanguageSwitch(null)
                  executeLanguageSwitch(targetLang)
                }
              }}
            >
              {isAr ? 'تجاهل والتبديل' : 'Discard & Switch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Resume Ingestion & Review Modal Popup */}
      <ImportResumeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        profileId={profile.id}
        profileLanguage={profile.language}
        lang={lang}
        dict={dict}
        onImportSuccess={handleImportSuccess}
      />

      {/* Avatar Photo Upload & Interactive Cropper Modal */}
      <AvatarCropModal
        isOpen={showAvatarCropModal}
        onClose={() => setShowAvatarCropModal(false)}
        currentImage={user.image}
        userInitials={initials}
        lang={lang}
        onAvatarSaved={handleAvatarSaved}
      />

      {/* Direct Interactive Bullet AI Fix Modal */}
      <BulletAiFixModal
        open={Boolean(activeBulletFix)}
        onOpenChange={(open) => !open && setActiveBulletFix(null)}
        lang={lang}
        bulletText={activeBulletFix?.bulletText || ''}
        suggestion={matchingBulletSuggestion}
        onApplyFix={handleApplyBulletFixFromModal}
        onRegenerateAi={handleRegenerateBulletFixFromModal}
      />
    </div>
  )
}
