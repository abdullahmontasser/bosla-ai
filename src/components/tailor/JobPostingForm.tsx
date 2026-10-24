'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface JobPostingFormProps {
  jobTitle: string
  companyName: string
  rawJobDescription: string
  dict: Partial<Dictionary>
  onChange: (data: { jobTitle: string; companyName: string; rawJobDescription: string }) => void
}

export function JobPostingForm({
  jobTitle,
  companyName,
  rawJobDescription,
  dict,
  onChange,
}: JobPostingFormProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const charCount = rawJobDescription.trim().length
  const isTooShort = charCount > 0 && charCount < 50

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Briefcase className="size-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {t.jobPostingPanelTitle || 'Target Job Posting'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t.jobPostingPanelDesc || 'Role requirements you want the AI to tailor against.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t.jobTitleLabel || 'Target Role Title'}
            </label>
            <Input
              value={jobTitle}
              onChange={(e) =>
                onChange({
                  jobTitle: e.target.value,
                  companyName,
                  rawJobDescription,
                })
              }
              placeholder="e.g. Senior Full Stack Engineer"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t.companyNameLabel || 'Company Name'}
            </label>
            <Input
              value={companyName}
              onChange={(e) =>
                onChange({
                  jobTitle,
                  companyName: e.target.value,
                  rawJobDescription,
                })
              }
              placeholder="e.g. Anthropic Partner Labs"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              {t.jobDescriptionLabel || 'Target Job Description'}
            </label>
            <span
              className={`text-[11px] ${
                isTooShort ? 'text-destructive font-medium' : 'text-muted-foreground'
              }`}
            >
              {charCount} / 50 min chars
            </span>
          </div>

          <Textarea
            value={rawJobDescription}
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
            className="text-xs font-mono resize-none leading-relaxed"
          />

          {isTooShort && (
            <p className="text-[11px] text-destructive">
              Job description must have at least 50 characters for meaningful AI tailoring.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
