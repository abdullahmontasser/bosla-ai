'use client'

import * as React from 'react'
import { useTransition } from 'react'
import Link from 'next/link'
import { ChevronsUpDown, LogOut, UserRound, Camera } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarCropModal } from '@/components/profile/AvatarCropModal'
import { signOutAction } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

export interface AccountMenuProps {
  lang: string
  name?: string | null
  email?: string | null
  image?: string | null
  variant?: 'avatar' | 'card'
  side?: 'top' | 'bottom' | 'right' | 'left'
  align?: 'start' | 'center' | 'end'
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function AccountMenu({
  lang,
  name,
  email,
  image,
  variant = 'avatar',
  side,
  align,
}: AccountMenuProps) {
  const [pending, startTransition] = useTransition()
  const [localAvatarOverride, setLocalAvatarOverride] = React.useState<string | null | undefined>(
    undefined,
  )
  const [showAvatarCrop, setShowAvatarCrop] = React.useState(false)
  const isAr = lang === 'ar'
  const currentImage = localAvatarOverride !== undefined ? localAvatarOverride : image

  React.useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ image?: string | null }>
      if (customEvent.detail && 'image' in customEvent.detail) {
        setLocalAvatarOverride(customEvent.detail.image)
      }
    }
    window.addEventListener('profile-data-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-data-updated', handleProfileUpdate)
  }, [])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'card' ? (
            <button
              type="button"
              aria-label={isAr ? 'قائمة الحساب' : 'Account menu'}
              className="flex w-full items-center gap-2 rounded-full border border-border/70 bg-card/50 p-1 text-start transition-all hover:border-primary/40 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-[10px] font-bold text-foreground">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span aria-hidden>{initials(name, email)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 px-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {name || (isAr ? 'حسابك' : 'Your account')}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {email || (isAr ? 'عرض الحساب' : 'View account')}
                </span>
              </div>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground me-1" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={isAr ? 'قائمة الحساب' : 'Account menu'}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-[10px] font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span aria-hidden>{initials(name, email)}</span>
              )}
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={side ?? (variant === 'card' ? 'top' : isAr ? 'left' : 'right')}
          align={align ?? 'start'}
          sideOffset={8}
          className={cn('p-1.5', variant === 'card' ? 'w-60' : 'w-56')}
        >
          {/* User Identity Header */}
          <DropdownMenuLabel className="flex items-start gap-2.5 px-2.5 py-2 font-normal">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-popover-foreground">
                {name || (isAr ? 'حسابك' : 'Your account')}
              </span>
              {email ? (
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {email}
                </span>
              ) : null}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1" />

          {/* Edit Profile Photo */}
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setShowAvatarCrop(true)
            }}
            className="gap-2.5 px-2.5 py-2 text-xs cursor-pointer"
          >
            <Camera className="size-4 text-primary" aria-hidden />
            <span className="font-medium text-foreground">
              {isAr ? 'تعديل الصورة الشخصية' : 'Edit profile photo'}
            </span>
          </DropdownMenuItem>

          {/* Edit Candidate Profile */}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/${lang}/profile`} className="gap-2.5 px-2.5 py-2 text-xs">
              <UserRound className="size-4 text-primary" />
              <span className="font-medium text-foreground">
                {isAr ? 'تعديل الملف المهني' : 'Edit Candidate Profile'}
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          {/* Sign Out */}
          <DropdownMenuItem
            disabled={pending}
            onSelect={(event) => {
              event.preventDefault()
              startTransition(async () => {
                await signOutAction(lang)
              })
            }}
            className="gap-2.5 px-2.5 py-2 text-xs text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="size-4 rtl:rotate-180" aria-hidden />
            <span className="font-medium">
              {pending
                ? isAr
                  ? 'جارٍ الخروج...'
                  : 'Signing out...'
                : isAr
                  ? 'تسجيل الخروج'
                  : 'Sign out'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Photo Crop Modal triggered directly from sidebar */}
      <AvatarCropModal
        isOpen={showAvatarCrop}
        onClose={() => setShowAvatarCrop(false)}
        currentImage={currentImage}
        userInitials={initials(name, email)}
        lang={lang}
        onAvatarSaved={(newImg) => {
          setLocalAvatarOverride(newImg)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('profile-data-updated', {
                detail: { image: newImg },
              }),
            )
          }
        }}
      />
    </>
  )
}
