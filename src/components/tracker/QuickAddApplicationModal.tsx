'use client'

import React, { useState } from 'react'
import type { ApplicationStatus } from '@prisma/client'
import type { Dictionary } from '@/lib/i18n/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@/components/ui'
import { Plus, Loader2 } from 'lucide-react'

export interface QuickAddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    companyName: string
    jobUrl?: string
    status: ApplicationStatus
  }) => Promise<void>
  lang: string
  dict: Dictionary
}

export function QuickAddApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  lang,
  dict,
}: QuickAddApplicationModalProps) {
  const t = (dict.tracker ?? {}) as Record<string, string | undefined>
  const isRtl = lang === 'ar'

  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('SAVED')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !companyName.trim()) {
      setError(
        isRtl ? 'يرجى إدخال المسمى الوظيفي واسم الشركة' : 'Job title and company name are required',
      )
      return
    }

    if (
      jobUrl.trim() &&
      !jobUrl.trim().startsWith('http://') &&
      !jobUrl.trim().startsWith('https://')
    ) {
      setError(
        isRtl
          ? 'رابط الوظيفة غير صالح (يجب أن يبدأ بـ https://)'
          : 'Invalid URL format (must begin with https://)',
      )
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        companyName: companyName.trim(),
        jobUrl: jobUrl.trim() || undefined,
        status,
      })
      // Reset form
      setTitle('')
      setCompanyName('')
      setJobUrl('')
      setStatus('SAVED')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stages: Array<{ key: ApplicationStatus; label: string }> = [
    { key: 'SAVED', label: t.saved || 'Saved' },
    { key: 'APPLIED', label: t.applied || 'Applied' },
    { key: 'INTERVIEWING', label: t.interviewing || 'Interviewing' },
    { key: 'OFFER', label: t.offer || 'Offer' },
    { key: 'REJECTED', label: t.rejected || 'Rejected' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t.modalTitle || 'Quick Add Application'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t.modalDescription || 'Track a new job posting on your kanban board.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3 py-1">
            {/* Job Title */}
            <div className="space-y-1">
              <label htmlFor="quick-add-title" className="text-xs font-medium text-foreground">
                {t.jobTitle || 'Job Title'} <span className="text-destructive">*</span>
              </label>
              <Input
                id="quick-add-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.jobTitlePlaceholder || 'e.g. Senior Frontend Engineer'}
                className="h-9 text-xs"
                data-testid="quick-add-title-input"
              />
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label htmlFor="quick-add-company" className="text-xs font-medium text-foreground">
                {t.companyName || 'Company Name'} <span className="text-destructive">*</span>
              </label>
              <Input
                id="quick-add-company"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t.companyNamePlaceholder || 'e.g. Acme Tech'}
                className="h-9 text-xs"
                data-testid="quick-add-company-input"
              />
            </div>

            {/* Job URL */}
            <div className="space-y-1">
              <label htmlFor="quick-add-url" className="text-xs font-medium text-foreground">
                {t.jobUrl || 'Job URL (Optional)'}
              </label>
              <Input
                id="quick-add-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder={t.jobUrlPlaceholder || 'https://...'}
                className="h-9 text-xs"
                data-testid="quick-add-url-input"
              />
            </div>

            {/* Initial Stage */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-foreground block">
                {t.initialStatus || 'Initial Stage'}
              </span>
              <div
                className="grid grid-cols-3 gap-1.5 pt-1"
                role="radiogroup"
                aria-label={t.initialStatus || 'Initial Stage'}
              >
                {stages.map((stage) => (
                  <button
                    key={stage.key}
                    type="button"
                    role="radio"
                    aria-checked={status === stage.key}
                    onClick={() => setStatus(stage.key)}
                    className={`rounded-md border py-1.5 px-2 text-center text-xs font-medium transition-all ${
                      status === stage.key
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                        : 'border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              {dict.common.cancel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !title.trim() || !companyName.trim()}
              data-testid="quick-add-submit-btn"
              className="h-9 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{t.saving || 'Adding...'}</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>{t.addApplication || 'Add Application'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
