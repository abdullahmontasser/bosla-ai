'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface JobPostingFormProps {
  jobTitle: string
  companyName: string
  rawJobDescription: string
  customInstructions?: string
  dict: Partial<Dictionary>
  onChange: (data: { jobTitle: string; companyName: string; rawJobDescription: string }) => void
  onCustomInstructionsChange?: (instructions: string) => void
  onSubmit?: () => void
}

const SAMPLE_JOB_PRESET = {
  jobTitle: 'Senior Full Stack Engineer (AI Integration)',
  companyName: 'Anthropic Labs Partner',
  rawJobDescription: `We are seeking a Senior Full Stack Engineer with extensive experience in Next.js App Router, TypeScript, and PostgreSQL.
Key Responsibilities:
- Design and implement AI response streaming pipelines with Vercel AI SDK.
- Architect bilingual user interfaces using Tailwind CSS and Radix UI.
- Optimize relational schemas with Prisma ORM and ensure high throughput.
Requirements:
- 5+ years building full stack web applications.
- Strong proficiency in TypeScript, React, and PostgreSQL.`,
}

export const JobPostingForm = React.memo(function JobPostingForm({
  jobTitle,
  companyName,
  rawJobDescription,
  customInstructions,
  onCustomInstructionsChange,
  dict,
  onChange,
  onSubmit,
}: JobPostingFormProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const charCount = rawJobDescription.trim().length
  const isTooShort = charCount > 0 && charCount < 50

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (onSubmit && charCount >= 50) {
        onSubmit()
      }
    }
  }

  const handleLoadSample = () => {
    onChange(SAMPLE_JOB_PRESET)
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between border-b border-border/70 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
            {t.jobPostingPanelTitle || 'Target Job Posting'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.jobPostingPanelDesc || 'Role requirements you want the AI to tailor against.'}
          </p>
        </div>

        {charCount === 0 && (
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Load sample brief
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="job-title-input" className="text-xs font-medium text-foreground">
              {t.jobTitleLabel || 'Target Role Title'}
            </label>
            <Input
              id="job-title-input"
              value={jobTitle}
              onChange={(e) =>
                onChange({
                  jobTitle: e.target.value,
                  companyName,
                  rawJobDescription,
                })
              }
              placeholder="e.g. Senior Full Stack Engineer"
              className="h-9 rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company-name-input" className="text-xs font-medium text-foreground">
              {t.companyNameLabel || 'Company Name'}
            </label>
            <Input
              id="company-name-input"
              value={companyName}
              onChange={(e) =>
                onChange({
                  jobTitle,
                  companyName: e.target.value,
                  rawJobDescription,
                })
              }
              placeholder="e.g. Anthropic Partner Labs"
              className="h-9 rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="job-desc-input" className="text-xs font-medium text-foreground">
              {t.jobDescriptionLabel || 'Target Job Description'}
            </label>
            <span
              className={`text-[10px] tabular-nums font-mono ${
                isTooShort ? 'text-destructive font-medium' : 'text-muted-foreground'
              }`}
            >
              {charCount} / 50 min chars
              {charCount >= 50 && charCount < 300 && (
                <span className="text-muted-foreground/75 ms-1.5 hidden sm:inline font-sans">
                  · (300+ chars recommended)
                </span>
              )}
            </span>
          </div>

          <Textarea
            id="job-desc-input"
            value={rawJobDescription}
            aria-invalid={isTooShort}
            aria-describedby={isTooShort ? 'job-desc-error' : undefined}
            onChange={(e) =>
              onChange({
                jobTitle,
                companyName,
                rawJobDescription: e.target.value,
              })
            }
            placeholder={
              t.jobDescriptionPlaceholder ||
              'Paste the full job posting requirements and responsibilities here (minimum 50 characters)...'
            }
            rows={7}
            className="rounded-[6px] border-border bg-card text-xs font-mono resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-primary"
          />

          {isTooShort && (
            <p id="job-desc-error" className="text-[11px] text-destructive">
              Job description must have at least 50 characters for meaningful AI tailoring.
            </p>
          )}
        </div>

        {/* AI Guidance Comments Section */}
        {onCustomInstructionsChange && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="custom-ai-comments" className="text-xs font-medium text-foreground">
                {t.customInstructions || 'Candidate Preferences & AI Guidance (Optional)'}
              </label>
              <span className="text-[10px] text-muted-foreground">
                e.g. Focus on leadership, tone down junior tasks
              </span>
            </div>
            <Input
              id="custom-ai-comments"
              value={customInstructions || ''}
              onChange={(e) => onCustomInstructionsChange(e.target.value)}
              placeholder="Add comments or instructions for the AI to prioritize..."
              className="h-8 text-xs bg-card"
            />
          </div>
        )}
      </div>
    </div>
  )
})
JobPostingForm.displayName = 'JobPostingForm'
