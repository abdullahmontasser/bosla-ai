'use client'

import React, { useState } from 'react'
import { Camera, Mail, Phone, MapPin, Globe, Sparkles, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AvatarCropModal } from './AvatarCropModal'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

interface ProfileOverviewCardProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  profile: {
    id: string
    fullName: string
    headline?: string | null
    summary?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    websiteUrl?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    language: string
  }
  lang: string
  onAvatarUpdate: (newImage: string | null) => void
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function ProfileOverviewCard({
  user,
  profile,
  lang,
  onAvatarUpdate,
}: ProfileOverviewCardProps) {
  const isAr = lang === 'ar'
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const initials = getInitials(profile.fullName || user.name, user.email)

  const activeEmail = profile.email || user.email
  const activeName = profile.fullName || user.name || (isAr ? 'المرشح' : 'Candidate')

  return (
    <>
      <Card className="relative overflow-hidden border-border bg-card">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

        <CardContent className="relative flex flex-col items-center pt-8 pb-6 text-center">
          {/* Avatar with hover trigger */}
          <div className="relative group mb-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border/80 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-[24px] font-bold text-primary shadow-sm transition-transform duration-300 group-hover:scale-102">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={activeName} className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCropModalOpen(true)}
              aria-label={isAr ? 'تعديل الصورة الشخصية' : 'Edit profile photo'}
              className="absolute bottom-0 end-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Camera className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* Name & Headline */}
          <h2 className="text-[19px] font-bold tracking-tight text-foreground">{activeName}</h2>

          {profile.headline ? (
            <p className="mt-1 text-[13px] font-medium text-muted-foreground">{profile.headline}</p>
          ) : (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/75">
              <Sparkles className="h-3 w-3 text-primary/70" />
              {isAr ? 'أضف مسمى مهني لجذب مسؤولي التوظيف' : 'Add a headline to stand out'}
            </span>
          )}

          {/* Badges / Chips */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <Badge variant="outline" className="text-[11px]">
              {profile.language === 'AR' ? 'العربية (AR)' : 'English (EN)'}
            </Badge>
            {profile.location && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {profile.location}
              </Badge>
            )}
          </div>

          {/* Contact and Links List */}
          <div className="mt-6 flex w-full flex-col gap-2 border-t border-border/60 pt-4 text-[12px] text-start">
            {activeEmail && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{activeEmail}</span>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span dir="ltr" className="truncate">
                  {profile.phone}
                </span>
              </div>
            )}

            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{profile.websiteUrl}</span>
                <ExternalLink className="h-3 w-3 ms-auto opacity-70" />
              </a>
            )}

            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <LinkedInIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">LinkedIn</span>
                <ExternalLink className="h-3 w-3 ms-auto opacity-70" />
              </a>
            )}

            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <GitHubIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">GitHub</span>
                <ExternalLink className="h-3 w-3 ms-auto opacity-70" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <AvatarCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        currentImage={user.image}
        userInitials={initials}
        lang={lang}
        onAvatarSaved={onAvatarUpdate}
      />
    </>
  )
}
