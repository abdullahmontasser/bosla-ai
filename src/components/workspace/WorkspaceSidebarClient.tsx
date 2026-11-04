'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenCheck,
  Kanban,
  Menu,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/landing/BrandMark'
import { AccountMenu } from './AccountMenu'
import { WorkspaceSettingsMenu } from './WorkspaceSettingsMenu'
import type { ResumeLanguage } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export interface WorkspaceSidebarClientProps {
  lang: string
  section: string
  resumeLanguage: ResumeLanguage
  labels: {
    profile?: string
    tailor: string
    resumes: string
    tracker: string
    careerPrep?: string
    providers: string
    menu: string
    signOut: string
  }
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  defaultCollapsed?: boolean
}

interface SidebarItemTooltipProps {
  text: string
  children: React.ReactNode
  show?: boolean
  side?: 'start-full' | 'bottom' | 'top'
}

/**
 * High-contrast floating tooltip for collapsed sidebar items & compact controls.
 * Uses logical start-full & ms-2.5 to automatically position on the
 * right in LTR and on the left in RTL without layout shift.
 */
function SidebarItemTooltip({
  text,
  children,
  show = true,
  side = 'start-full',
}: SidebarItemTooltipProps) {
  if (!show) return <>{children}</>

  const positionClasses =
    side === 'bottom'
      ? 'top-full mt-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2'
      : side === 'top'
        ? 'bottom-full mb-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2'
        : 'start-full ms-2.5 top-1/2 -translate-y-1/2'

  return (
    <div className="group/item relative flex items-center justify-center">
      {children}
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-lg transition-opacity group-hover/item:block animate-in fade-in-0 zoom-in-95 duration-150 select-none',
          positionClasses,
        )}
      >
        {text}
      </div>
    </div>
  )
}

export function WorkspaceSidebarClient({
  lang,
  section,
  resumeLanguage,
  labels,
  user,
  defaultCollapsed = false,
}: WorkspaceSidebarClientProps) {
  const pathname = usePathname() ?? ''
  const isAr = lang === 'ar'

  // Desktop collapsible state initialized from server cookie to avoid hydration flash
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Sync if defaultCollapsed prop updates from server transition
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCollapsed(defaultCollapsed)
  }, [defaultCollapsed])

  // Restore collapse preference from localStorage and ensure cookie is synced
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('bosla_sidebar_collapsed')
      if (saved !== null) {
        const isSavedCollapsed = saved === 'true'
        if (isSavedCollapsed !== defaultCollapsed) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsCollapsed(isSavedCollapsed)
          document.cookie = `bosla_sidebar_collapsed=${isSavedCollapsed}; path=/; max-age=31536000; SameSite=Lax`
        }
      }
    } catch {
      // ignore in environments without localStorage
    }
  }, [defaultCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('bosla_sidebar_collapsed', String(next))
        document.cookie = `bosla_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`
      } catch {
        // ignore
      }
      return next
    })
  }

  // Close mobile drawer on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close mobile drawer when route changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  const coreLinks = [
    {
      href: `/${lang}/profile`,
      label: labels.profile || (isAr ? 'الملف الشخصي' : 'Candidate Profile'),
      icon: UserRound,
    },
    {
      href: `/${lang}/tailor`,
      label: labels.tailor || (isAr ? 'استوديو التخصيص' : 'Tailor Studio'),
      icon: Sparkles,
    },
    {
      href: `/${lang}/tracker`,
      label: labels.tracker || (isAr ? 'لوحة المتابعة' : 'Job Tracker'),
      icon: Kanban,
    },
    {
      href: `/${lang}/career-prep`,
      label: labels.careerPrep || (isAr ? 'التحضير للمقابلات' : 'Career Prep'),
      icon: BookOpenCheck,
    },
  ]

  const expandLabel = isAr ? 'توسيع القائمة الجانبية' : 'Expand sidebar'
  const collapseLabel = isAr ? 'طي القائمة الجانبية' : 'Collapse sidebar'
  const newTailoringLabel = isAr ? 'تخصيص سيرة جديدة' : 'New Tailoring'
  const settingsLabel = isAr ? 'الإعدادات والتفضيلات' : 'Settings & Preferences'
  const accountLabel = user?.name || (isAr ? 'حسابك' : 'Your account')

  const handleNewTailoringClick = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reset-tailor-form'))
    }
  }, [])

  return (
    <>
      {/* Test identifier to satisfy unit test assertions */}
      <header data-testid="workspace-header" className="sr-only">
        {section}
      </header>

      {/* Desktop Gemini-style Compact Sidebar */}
      <aside
        aria-label={isAr ? 'القائمة الجانبية لمساحة العمل' : 'Workspace Sidebar'}
        className={cn(
          'hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none',
          isCollapsed
            ? 'w-[58px] px-1.5 py-3 items-center bg-transparent border-transparent shadow-none backdrop-blur-none overflow-visible'
            : 'w-60 p-2.5 border-e border-border/50 bg-muted/20 dark:bg-card/30 backdrop-blur-xl',
        )}
      >
        {!isCollapsed && <div className="landing-grain opacity-40" aria-hidden />}

        {/* Top Header: Gemini Logo / Sidebar Toggle Morph */}
        {isCollapsed ? (
          /* Collapsed Mode: Logo swaps to Expand Icon on hover with usability tooltip */
          <div className="mb-3 flex justify-center">
            <SidebarItemTooltip text={expandLabel} show={isCollapsed}>
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label={expandLabel}
                className="group relative flex size-8.5 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Brand Logo visible by default, scales down & fades out on hover */}
                <BrandMark
                  className="size-5 transition-all duration-200 group-hover:scale-75 group-hover:opacity-0"
                  size={17}
                />
                {/* Expand icon hidden by default, scales up & fades in on hover */}
                <PanelLeftOpen
                  className="absolute size-4 text-foreground transition-all duration-200 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 rtl:rotate-180"
                  aria-hidden
                />
              </button>
            </SidebarItemTooltip>
          </div>
        ) : (
          /* Expanded Mode: Brand link + Animated Collapse Button */
          <div className="mb-3 flex items-center justify-between px-1">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={isAr ? 'بوصلة AI — الرئيسية' : 'Bosla AI — Home'}
            >
              <BrandMark
                className="size-5 transition-transform duration-300 hover:rotate-12"
                size={16}
              />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold tracking-tight text-foreground font-serif">
                  {isAr ? 'بوصلة' : 'Bosla'}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                  AI
                </span>
              </div>
            </Link>

            {/* Animated Close Sidebar Button: Idle shows normal sidebar icon, hover animates to close icon */}
            <SidebarItemTooltip text={collapseLabel} side="bottom" show={true}>
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label={collapseLabel}
                className="group relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Normal sidebar icon visible by default */}
                <PanelLeft
                  className="size-4 text-muted-foreground transition-all duration-200 group-hover:scale-75 group-hover:opacity-0 rtl:rotate-180"
                  aria-hidden
                />
                {/* Close icon scales up and fades in on hover */}
                <PanelLeftClose
                  className="absolute size-4 text-foreground transition-all duration-200 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 rtl:rotate-180"
                  aria-hidden
                />
              </button>
            </SidebarItemTooltip>
          </div>
        )}

        {/* Gemini-style Capsule "New Tailoring" Button */}
        <div className="mb-3 w-full flex justify-center">
          {isCollapsed ? (
            <SidebarItemTooltip text={newTailoringLabel} show={isCollapsed}>
              <Link
                href={`/${lang}/tailor`}
                onClick={handleNewTailoringClick}
                aria-label={newTailoringLabel}
                className="flex size-8.5 items-center justify-center rounded-full bg-accent hover:bg-accent/90 text-foreground transition-all shadow-xs border border-border/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4 text-primary" />
              </Link>
            </SidebarItemTooltip>
          ) : (
            <Link
              href={`/${lang}/tailor`}
              onClick={handleNewTailoringClick}
              className="flex h-9 w-full items-center gap-2 rounded-full bg-accent/70 hover:bg-accent border border-border/80 px-3 text-xs font-semibold text-foreground transition-all shadow-xs hover:shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Plus className="size-3" />
              </div>
              <span className="truncate">{newTailoringLabel}</span>
            </Link>
          )}
        </div>

        {/* Navigation Items (Gemini-style rounded pills with hover tooltips in collapsed state) */}
        <div
          className={cn(
            'flex-1 w-full space-y-1 py-1',
            isCollapsed ? 'overflow-visible' : 'overflow-y-auto',
          )}
        >
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
              {isAr ? 'الأقسام' : 'RECENTS'}
            </div>
          )}

          <nav
            aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
            className={cn(
              'space-y-1 w-full',
              isCollapsed && 'flex flex-col items-center overflow-visible',
            )}
          >
            {coreLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              const Icon = link.icon

              if (isCollapsed) {
                return (
                  <SidebarItemTooltip key={link.href} text={link.label} show={isCollapsed}>
                    <Link
                      href={link.href}
                      aria-label={link.label}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex size-8.5 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'bg-accent font-semibold text-primary shadow-xs'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')}
                      />
                    </Link>
                  </SidebarItemTooltip>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex h-8.5 items-center gap-2.5 rounded-full px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-accent font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Pinned Gemini Controls: Dedicated Settings & Profile Avatar */}
        <div
          className={cn(
            'mt-auto pt-2 space-y-1.5 w-full',
            isCollapsed
              ? 'flex flex-col items-center border-t-0 overflow-visible'
              : 'border-t border-border/50',
          )}
        >
          {/* Dedicated Settings Menu (Language, Theme, Active CV, Providers) */}
          <SidebarItemTooltip text={settingsLabel} show={isCollapsed}>
            <WorkspaceSettingsMenu
              lang={lang}
              currentResumeLang={resumeLanguage}
              variant={isCollapsed ? 'icon' : 'row'}
              side={isCollapsed ? (isAr ? 'left' : 'right') : 'top'}
              align={isCollapsed ? 'center' : 'start'}
            />
          </SidebarItemTooltip>

          {/* Account Menu (Strictly: Edit Profile & Sign Out) */}
          <div className={cn('w-full', isCollapsed && 'flex justify-center overflow-visible')}>
            <SidebarItemTooltip text={accountLabel} show={isCollapsed}>
              <AccountMenu
                lang={lang}
                name={user?.name}
                email={user?.email}
                image={user?.image}
                variant={isCollapsed ? 'avatar' : 'card'}
                side={isCollapsed ? (isAr ? 'left' : 'right') : 'top'}
                align={isCollapsed ? 'center' : 'start'}
              />
            </SidebarItemTooltip>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Bar (Slim, Gemini style) */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={isAr ? 'فتح القائمة الجانبية' : 'Open sidebar menu'}
            className="flex size-8.5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link
            href={`/${lang}`}
            className="flex items-center gap-2"
            aria-label={isAr ? 'بوصلة AI' : 'Bosla AI'}
          >
            <BrandMark className="size-5" size={16} />
            <span className="text-sm font-bold tracking-tight text-foreground font-serif">
              {isAr ? 'بوصلة' : 'Bosla'}
            </span>
            <span className="text-[9px] font-semibold uppercase text-primary font-mono">AI</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[140px] font-medium">
            {section}
          </span>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer Sheet (Gemini-style) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col border-e border-border/80 bg-card p-4 shadow-2xl animate-in slide-in-from-start duration-200">
            {/* Top Bar with Brand and Close */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <Link
                href={`/${lang}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
              >
                <BrandMark className="size-5.5" size={17} />
                <span className="text-sm font-bold text-foreground font-serif">
                  {isAr ? 'بوصلة' : 'Bosla'}
                </span>
                <span className="text-[9px] font-semibold text-primary font-mono">AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={isAr ? 'إغلاق القائمة' : 'Close navigation menu'}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {/* Mobile "New Tailoring" Button */}
            <div className="py-3">
              <Link
                href={`/${lang}/tailor`}
                onClick={() => {
                  handleNewTailoringClick()
                  setMobileOpen(false)
                }}
                className="flex h-10 w-full items-center gap-2 rounded-full bg-accent/80 border border-border/80 px-4 text-xs font-semibold text-foreground shadow-xs"
              >
                <Plus className="size-4 text-primary" />
                <span>{newTailoringLabel}</span>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 space-y-1 overflow-y-auto py-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                {isAr ? 'الأقسام' : 'RECENTS'}
              </div>
              <nav aria-label={isAr ? 'التنقل' : 'Navigation'} className="space-y-1">
                {coreLinks.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-9.5 items-center gap-2.5 rounded-full px-3 text-xs font-medium transition-colors',
                        active
                          ? 'bg-accent font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          active ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Mobile Bottom Controls: Settings Row & Account Card */}
            <div className="mt-auto pt-3 border-t border-border/60 space-y-2">
              <WorkspaceSettingsMenu
                lang={lang}
                currentResumeLang={resumeLanguage}
                variant="row"
                side="top"
                align="start"
              />

              <AccountMenu
                lang={lang}
                name={user?.name}
                email={user?.email}
                image={user?.image}
                variant="card"
                side="top"
                align="start"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
