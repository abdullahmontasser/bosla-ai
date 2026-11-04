import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { getActiveResumeLanguage } from '@/lib/i18n/resume-language'
import type { ResumeLanguage } from '@/lib/i18n/config'
import { WorkspaceSidebarClient } from './WorkspaceSidebarClient'

export interface WorkspaceHeaderProps {
  lang: string
  section: string
  resumeLanguage?: ResumeLanguage
}

export function getWorkspaceLabels(lang: string) {
  const isAr = lang === 'ar'
  return {
    profile: isAr ? 'الملف الشخصي' : 'Profile',
    tailor: isAr ? 'التخصيص' : 'Tailor',
    resumes: isAr ? 'السير' : 'Resumes',
    tracker: isAr ? 'المتابعة' : 'Tracker',
    careerPrep: isAr ? 'التحضير للمقابلات' : 'Career Prep',
    providers: isAr ? 'المزوّدون' : 'Providers',
    menu: isAr ? 'قائمة مساحة العمل' : 'Workspace menu',
    signOut: isAr ? 'تسجيل الخروج' : 'Sign out',
  }
}

export async function WorkspaceHeader({ lang, section, resumeLanguage }: WorkspaceHeaderProps) {
  let defaultCollapsed = false
  try {
    const cookieStore = await cookies()
    defaultCollapsed = cookieStore.get('bosla_sidebar_collapsed')?.value === 'true'
  } catch {
    // fallback for environments without next/headers context
  }

  const [session, cookieResumeLang] = await Promise.all([
    auth(),
    resumeLanguage ? Promise.resolve(resumeLanguage) : getActiveResumeLanguage(),
  ])
  const activeResumeLang = resumeLanguage || cookieResumeLang
  const labels = getWorkspaceLabels(lang)

  return (
    <WorkspaceSidebarClient
      lang={lang}
      section={section}
      resumeLanguage={activeResumeLang}
      labels={labels}
      user={session?.user}
      defaultCollapsed={defaultCollapsed}
    />
  )
}
