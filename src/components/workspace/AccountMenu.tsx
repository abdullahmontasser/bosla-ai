'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { LogOut, Settings, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOutAction } from '@/app/actions/auth'

interface AccountMenuProps {
  lang: string
  name?: string | null
  email?: string | null
  image?: string | null
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function AccountMenu({ lang, name, email, image }: AccountMenuProps) {
  const [pending, startTransition] = useTransition()
  const isAr = lang === 'ar'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={isAr ? 'قائمة الحساب' : 'Account menu'}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden>{initials(name, email)}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-start gap-2.5 py-2.5 font-normal">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-popover-foreground">
              {name || (isAr ? 'حسابك' : 'Your account')}
            </span>
            {email ? (
              <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                {email}
              </span>
            ) : null}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/${lang}/profile`} className="gap-2">
            <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {isAr ? 'الملف الشخصي والصورة' : 'Candidate profile'}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/${lang}/settings/providers`} className="gap-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {isAr ? 'إعدادات المزوّدين' : 'Provider settings'}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault()
            startTransition(async () => {
              await signOutAction(lang)
            })
          }}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          {pending
            ? isAr
              ? 'جارٍ الخروج...'
              : 'Signing out...'
            : isAr
              ? 'تسجيل الخروج'
              : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
