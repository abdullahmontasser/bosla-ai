import Link from 'next/link'
import { BrandMark } from '@/components/landing/BrandMark'
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui'
import { auth } from '@/auth'
import { AccountMenu } from './AccountMenu'
import { WorkspaceMobileMenu } from './WorkspaceMobileMenu'
import { WorkspaceNav } from './WorkspaceNav'

export interface WorkspaceHeaderProps {
  lang: string
  section: string
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

export async function WorkspaceHeader({ lang, section }: WorkspaceHeaderProps) {
  const session = await auth()
  const labels = getWorkspaceLabels(lang)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href={`/${lang}`}
          className="group flex shrink-0 items-center gap-2 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          aria-label={lang === 'ar' ? 'بوصلة AI — الصفحة الرئيسية' : 'Bosla AI — Home'}
        >
          <BrandMark
            className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12"
            size={22}
          />
          <span className="hidden items-baseline gap-1.5 sm:flex">
            <span className="text-[14px] font-bold tracking-[-0.02em] text-foreground">
              {lang === 'ar' ? 'بوصلة' : 'Bosla'}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              AI
            </span>
          </span>
        </Link>

        <span className="mx-1 hidden h-4 w-px bg-border md:block" aria-hidden />

        <WorkspaceNav lang={lang} labels={labels} />

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <span className="me-1 hidden max-w-[14rem] truncate text-[12px] font-medium text-muted-foreground lg:block">
            {section}
          </span>
          <LanguageSwitcher currentLang={lang} className="h-9 gap-1.5 px-2.5 text-[12px]" />
          <ThemeSwitcher />
          <AccountMenu
            lang={lang}
            name={session?.user?.name}
            email={session?.user?.email}
            image={session?.user?.image}
          />
          <WorkspaceMobileMenu lang={lang} labels={labels} />
        </div>
      </div>
    </header>
  )
}
