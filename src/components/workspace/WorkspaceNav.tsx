'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpenCheck, Cpu, Kanban, Sparkles, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WorkspaceNavProps {
  lang: string
  labels: {
    profile?: string
    tailor: string
    resumes: string
    tracker: string
    careerPrep?: string
    providers: string
  }
  variant?: 'bar' | 'stack'
  onNavigate?: () => void
}

export function WorkspaceNav({ lang, labels, variant = 'bar', onNavigate }: WorkspaceNavProps) {
  const pathname = usePathname() ?? ''

  const links = [
    {
      href: `/${lang}/profile`,
      label: labels.profile || (lang === 'ar' ? 'الملف الشخصي' : 'Profile'),
      icon: UserRound,
    },
    { href: `/${lang}/tailor`, label: labels.tailor, icon: Sparkles },
    { href: `/${lang}/tracker`, label: labels.tracker, icon: Kanban },
    {
      href: `/${lang}/career-prep`,
      label: labels.careerPrep || (lang === 'ar' ? 'التحضير للمقابلات' : 'Career Prep'),
      icon: BookOpenCheck,
    },
    { href: `/${lang}/settings/providers`, label: labels.providers, icon: Cpu },
  ]

  return (
    <nav
      aria-label={lang === 'ar' ? 'مساحة العمل' : 'Workspace'}
      className={cn(
        variant === 'bar' ? 'hidden items-center gap-1 md:flex' : 'flex flex-col gap-1',
      )}
    >
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-[6px] px-2.5 text-[12.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              variant === 'bar' ? 'h-8' : 'min-h-10',
              active
                ? 'bg-accent font-semibold text-foreground border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                : 'font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground/80',
              )}
              aria-hidden
            />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
