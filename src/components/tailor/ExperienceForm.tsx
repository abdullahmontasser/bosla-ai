'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Sparkles, Check, AlertCircle } from 'lucide-react'
import { saveCandidateProfile, loadSampleCandidateProfile } from '@/app/actions/tailor'
import type { CandidateExperienceInput } from '@/lib/validations/tailor'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface ExperienceFormProps {
  profileId?: string
  headline: string
  summary: string
  experiences: CandidateExperienceInput[]
  language: 'EN' | 'AR'
  dict: Partial<Dictionary>
  onProfileChange: (data: {
    profileId?: string
    headline: string
    summary: string
    experiences: CandidateExperienceInput[]
  }) => void
}

export function ExperienceForm({
  profileId,
  headline,
  summary,
  experiences,
  language,
  dict,
  onProfileChange,
}: ExperienceFormProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoadingSample, setIsLoadingSample] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  function updateExperience(idx: number, patch: Partial<CandidateExperienceInput>) {
    const updated = experiences.map((exp, i) => (i === idx ? { ...exp, ...patch } : exp))
    onProfileChange({ profileId, headline, summary, experiences: updated })
  }

  function addExperience() {
    const newExp: CandidateExperienceInput = {
      companyName: '',
      jobTitle: '',
      bullets: [''],
    }
    onProfileChange({
      profileId,
      headline,
      summary,
      experiences: [...experiences, newExp],
    })
  }

  function removeExperience(idx: number) {
    const updated = experiences.filter((_, i) => i !== idx)
    onProfileChange({ profileId, headline, summary, experiences: updated })
  }

  function updateBullet(expIdx: number, bulletIdx: number, value: string) {
    const exp = experiences[expIdx]
    if (!exp) return
    const updatedBullets = exp.bullets.map((b, i) => (i === bulletIdx ? value : b))
    updateExperience(expIdx, { bullets: updatedBullets })
  }

  function addBullet(expIdx: number) {
    const exp = experiences[expIdx]
    if (!exp) return
    updateExperience(expIdx, { bullets: [...exp.bullets, ''] })
  }

  function removeBullet(expIdx: number, bulletIdx: number) {
    const exp = experiences[expIdx]
    if (!exp || exp.bullets.length <= 1) return
    updateExperience(expIdx, {
      bullets: exp.bullets.filter((_, i) => i !== bulletIdx),
    })
  }

  async function handleLoadSample() {
    setIsLoadingSample(true)
    setNotification(null)
    try {
      const res = await loadSampleCandidateProfile(language)
      if (res.success && res.profile) {
        onProfileChange({
          profileId,
          headline: res.profile.headline,
          summary: res.profile.summary,
          experiences: res.profile.workExperiences.map((w) => ({
            companyName: w.companyName,
            jobTitle: w.jobTitle,
            bullets: w.bullets,
          })),
        })
        setNotification({
          type: 'success',
          message: t.loadSampleData || 'Loaded sample candidate data.',
        })
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to load sample profile',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to load sample candidate data',
      })
    } finally {
      setIsLoadingSample(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setNotification(null)
    try {
      const res = await saveCandidateProfile({
        profileId,
        language,
        headline,
        summary,
        experiences,
      })

      if (res.success && res.profileId) {
        onProfileChange({
          profileId: res.profileId,
          headline,
          summary,
          experiences,
        })
        setNotification({
          type: 'success',
          message: t.profileSaved || 'Profile saved successfully.',
        })
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Validation error while saving profile.',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Network error while saving profile.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {t.experiencePanelTitle || 'Candidate Experience'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t.experiencePanelDesc || 'Baseline qualifications used for grounded AI tailoring.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              disabled={isLoadingSample}
              className="h-8 gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5 text-primary" />
              {t.loadSampleData || 'Load Sample'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Check className="size-3.5" />
              {isSaving ? dict?.common?.loading || 'Saving...' : t.saveProfile || 'Save'}
            </Button>
          </div>
        </div>

        {notification && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-md p-2.5 text-xs ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Headline */}
        <div className="space-y-1.5">
          <label htmlFor="profile-headline" className="text-xs font-medium text-foreground">
            {t.headline || 'Professional Headline'}
          </label>
          <Input
            id="profile-headline"
            value={headline}
            onChange={(e) =>
              onProfileChange({ profileId, headline: e.target.value, summary, experiences })
            }
            placeholder={t.headlinePlaceholder || 'e.g. Senior Full Stack Engineer'}
            className="h-9 text-xs"
          />
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <label htmlFor="profile-summary" className="text-xs font-medium text-foreground">
            {t.summary || 'Professional Summary'}
          </label>
          <Textarea
            id="profile-summary"
            value={summary}
            onChange={(e) =>
              onProfileChange({ profileId, headline, summary: e.target.value, experiences })
            }
            placeholder={t.summaryPlaceholder || 'Executive summary of qualifications...'}
            rows={3}
            className="text-xs resize-none"
          />
        </div>

        {/* Experiences List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.experiences || 'Work Experience'}
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExperience}
              className="h-7 gap-1 text-xs px-2"
            >
              <Plus className="size-3" />
              {t.addExperience || 'Add Role'}
            </Button>
          </div>

          {experiences.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No work experiences added yet. Click &quot;Load Sample&quot; or &quot;Add Role&quot;
              to begin.
            </div>
          ) : (
            experiences.map((exp, expIdx) => (
              <div
                key={expIdx}
                className="rounded-lg border border-border/80 bg-background/50 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">#{expIdx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(expIdx)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title={t.removeExperience || 'Remove'}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      {t.companyName || 'Company Name'}
                    </label>
                    <Input
                      value={exp.companyName}
                      onChange={(e) => updateExperience(expIdx, { companyName: e.target.value })}
                      placeholder="TechVanguard Systems"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      {t.jobTitle || 'Job Title'}
                    </label>
                    <Input
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(expIdx, { jobTitle: e.target.value })}
                      placeholder="Senior Full Stack Engineer"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      {t.bullets || 'Bullets'}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addBullet(expIdx)}
                      className="h-5 gap-1 text-[11px] text-primary hover:text-primary px-1.5"
                    >
                      <Plus className="size-3" />
                      {t.addBullet || 'Add Bullet'}
                    </Button>
                  </div>

                  {exp.bullets.map((bullet, bulletIdx) => (
                    <div key={bulletIdx} className="flex items-start gap-1.5">
                      <span className="text-xs text-muted-foreground pt-1.5">•</span>
                      <Textarea
                        value={bullet}
                        onChange={(e) => updateBullet(expIdx, bulletIdx, e.target.value)}
                        placeholder={t.bulletPlaceholder || 'Accomplished X...'}
                        rows={2}
                        className="text-xs resize-none flex-1 min-h-[48px]"
                      />
                      {exp.bullets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBullet(expIdx, bulletIdx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
