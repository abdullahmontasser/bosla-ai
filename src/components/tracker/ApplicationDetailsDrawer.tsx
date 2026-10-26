'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { ApplicationStatus } from '@prisma/client'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { Button, Input, Textarea, Badge } from '@/components/ui'
import {
  X,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Mail,
  FileText,
  Sparkles,
  Trash2,
  Save,
  Check,
  Clock,
  Loader2,
} from 'lucide-react'

export interface ApplicationDetailsDrawerProps {
  card: ApplicationWithRelations | null
  isOpen: boolean
  onClose: () => void
  onUpdateDetails: (payload: {
    applicationId: string
    title?: string
    companyName?: string
    jobUrl?: string | null
    compensation?: string | null
    location?: string | null
    interviewDate?: string | null
    contactName?: string | null
    contactEmail?: string | null
    notes?: string | null
  }) => Promise<void>
  onStatusChange: (cardId: string, status: ApplicationStatus) => void
  onDelete: (cardId: string) => Promise<void>
  lang: string
  dict: Dictionary
}

export function ApplicationDetailsDrawer({
  card,
  isOpen,
  onClose,
  onUpdateDetails,
  onStatusChange,
  onDelete,
  lang,
  dict,
}: ApplicationDetailsDrawerProps) {
  if (!isOpen || !card) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Application Details"
      data-testid="application-details-drawer"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 ${lang === 'ar' ? 'left-0' : 'right-0'} flex max-w-full z-50`}
      >
        <ApplicationDetailsContent
          key={card.id}
          card={card}
          onClose={onClose}
          onUpdateDetails={onUpdateDetails}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          lang={lang}
          dict={dict}
        />
      </div>
    </div>
  )
}

function ApplicationDetailsContent({
  card,
  onClose,
  onUpdateDetails,
  onStatusChange,
  onDelete,
  lang,
  dict,
}: {
  card: ApplicationWithRelations
  onClose: () => void
  onUpdateDetails: ApplicationDetailsDrawerProps['onUpdateDetails']
  onStatusChange: ApplicationDetailsDrawerProps['onStatusChange']
  onDelete: ApplicationDetailsDrawerProps['onDelete']
  lang: string
  dict: Dictionary
}) {
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>
  const isRtl = lang === 'ar'

  // Editable fields initialized directly from card prop without useEffect
  const [title, setTitle] = useState(card.jobPosting.title || '')
  const [companyName, setCompanyName] = useState(card.jobPosting.companyName || '')
  const [jobUrl, setJobUrl] = useState(card.jobPosting.jobUrl || '')
  const [compensation, setCompensation] = useState(card.compensation || '')
  const [location, setLocation] = useState(card.location || '')
  const [interviewDate, setInterviewDate] = useState(
    card.interviewDate ? new Date(card.interviewDate).toISOString().slice(0, 16) : '',
  )
  const [contactName, setContactName] = useState(card.contactName || '')
  const [contactEmail, setContactEmail] = useState(card.contactEmail || '')
  const [notes, setNotes] = useState(card.notes || '')

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await onUpdateDetails({
        applicationId: card.id,
        title: title.trim() || undefined,
        companyName: companyName.trim() || undefined,
        jobUrl: jobUrl.trim() || null,
        compensation: compensation.trim() || null,
        location: location.trim() || null,
        interviewDate: interviewDate ? new Date(interviewDate).toISOString() : null,
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        notes: notes.trim() || null,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(card.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application')
      setIsDeleting(false)
    }
  }

  const stages: Array<{ key: ApplicationStatus; label: string }> = [
    { key: 'SAVED', label: t.saved || 'Saved' },
    { key: 'APPLIED', label: t.applied || 'Applied' },
    { key: 'INTERVIEWING', label: t.interviewing || 'Interviewing' },
    { key: 'OFFER', label: t.offer || 'Offer' },
    { key: 'REJECTED', label: t.rejected || 'Rejected' },
  ]

  const atsScore = card.tailoredResume?.atsScore

  return (
    <div className="w-screen max-w-xl bg-card border-s border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
            {title || card.jobPosting.title}
          </h2>
          <p className="text-xs text-muted-foreground truncate font-medium">
            {companyName || card.jobPosting.companyName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 ms-4">
          {jobUrl && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title={t.visitJobPosting || 'Visit Posting'}
            >
              <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label={dict.common.close || 'Close'}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Drawer Body (Scrollable Form) */}
      <form
        id="drawer-form"
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs"
      >
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Stage Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t.changeStatus || 'Hiring Stage'}
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {stages.map((stage) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => onStatusChange(card.id, stage.key)}
                className={`rounded-md border py-1.5 px-1 text-center text-xs font-medium transition-all ${
                  card.status === stage.key
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                    : 'border-border/70 bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applied At Timestamp if present */}
        {card.appliedAt && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>
              {t.appliedAtLabel || 'Applied on'}:{' '}
              <strong className="text-foreground font-medium">
                {new Date(card.appliedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>
            </span>
          </div>
        )}

        {/* Attached Resume Section */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              {t.attachedResume || 'Attached Tailored Resume'}
            </span>
            {card.tailoredResumeId ? (
              <Link
                href={`/${lang}/tailor?resumeId=${card.tailoredResumeId}`}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                Open in Studio
              </Link>
            ) : (
              <Link
                href={`/${lang}/tailor`}
                className="text-primary hover:underline text-[11px] font-medium"
              >
                {t.tailorResumeNow || 'Tailor Resume in Studio'}
              </Link>
            )}
          </div>

          {atsScore != null ? (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">ATS Match Score:</span>
              <Badge
                variant="outline"
                className={`font-semibold text-xs ${
                  atsScore >= 80
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500 text-amber-600 dark:text-amber-400'
                }`}
              >
                {Math.round(atsScore)}%
              </Badge>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t.noResumeAttached || 'No tailored resume attached to this application.'}
            </p>
          )}
        </div>

        {/* Section: Job Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
            {t.jobDetailsSection || 'Job Information'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                {t.jobTitle || 'Job Title'}
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
                data-testid="drawer-title-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                {t.companyName || 'Company Name'}
              </label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-8 text-xs"
                data-testid="drawer-company-input"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              {t.jobUrl || 'Job URL'}
            </label>
            <Input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
              data-testid="drawer-url-input"
            />
          </div>
        </div>

        {/* Section: Tracking Metadata */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
            {t.trackingSection || 'Tracking Details'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Compensation */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <DollarSign className="size-3 text-muted-foreground" />
                {t.compensationLabel || 'Compensation'}
              </label>
              <Input
                type="text"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder={t.compensationPlaceholder || 'e.g. $120k - $140k'}
                className="h-8 text-xs"
                data-testid="drawer-compensation-input"
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                {t.locationLabel || 'Location'}
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.locationPlaceholder || 'e.g. Remote, Cairo'}
                className="h-8 text-xs"
                data-testid="drawer-location-input"
              />
            </div>
          </div>

          {/* Interview Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              {t.interviewDateLabel || 'Interview Date & Time'}
            </label>
            <Input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="h-8 text-xs"
              data-testid="drawer-interview-date-input"
            />
          </div>
        </div>

        {/* Section: Recruiter Contact Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
            {t.recruiterSection || 'Recruiter & Contact'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <User className="size-3 text-muted-foreground" />
                {t.contactNameLabel || 'Contact Name'}
              </label>
              <Input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Doe"
                className="h-8 text-xs"
                data-testid="drawer-contact-name-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <Mail className="size-3 text-muted-foreground" />
                {t.contactEmailLabel || 'Contact Email'}
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="h-8 text-xs"
                data-testid="drawer-contact-email-input"
              />
            </div>
          </div>
        </div>

        {/* Section: Personal Notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
            <FileText className="size-3 text-muted-foreground" />
            {t.notesLabel || 'Personal Notes'}
          </label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              t.notesPlaceholder || 'Key talking points, recruiter feedback, follow-up dates...'
            }
            className="text-xs leading-relaxed"
            data-testid="drawer-notes-input"
          />
        </div>

        {/* Section: Job Description Preview */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
            {t.rawJobDescription || 'Job Description'}
          </h3>
          <div className="rounded-md border border-border/80 bg-background/50 p-3 max-h-48 overflow-y-auto text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {card.jobPosting.rawDescription}
          </div>
        </div>
      </form>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-border/80 bg-background flex items-center justify-between gap-3">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive font-medium">Delete?</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="drawer-confirm-delete-btn"
              className="h-8 text-xs"
            >
              {isDeleting ? <Loader2 className="size-3 animate-spin" /> : 'Yes, Delete'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="drawer-delete-btn"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 px-2.5"
          >
            <Trash2 className="size-3.5" />
            <span>{t.deleteCard || 'Delete'}</span>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            {dict.common.close || 'Close'}
          </Button>
          <Button
            type="submit"
            form="drawer-form"
            size="sm"
            disabled={isSaving}
            data-testid="drawer-save-btn"
            className="h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>{t.savedChanges || 'Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{t.saveChanges || 'Save Changes'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
