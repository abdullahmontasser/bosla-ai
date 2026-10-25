'use client'

import React, { useState } from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Check,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Globe,
} from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@/components/ui'
import type {
  ParsedResumePayload,
  SectionMergeConfig,
  MergeAction,
} from '@/lib/validations/parsed-resume'

export interface ResumeReviewWorkbenchProps {
  lang: string
  dict: Record<string, unknown>
  parsedResumeId: string
  initialData: ParsedResumePayload
  fileName: string
  fileFormat: 'PDF' | 'DOCX'
  onCommitSuccess?: (profileId: string) => void
  onCommitAction: (input: {
    parsedResumeId: string
    targetProfileId?: string
    mergeConfig: SectionMergeConfig
    editedData: ParsedResumePayload
  }) => Promise<{
    success: boolean
    profileId?: string
    error?: string
  }>
  onResetUpload?: () => void
}

export function ResumeReviewWorkbench({
  lang,
  dict,
  parsedResumeId,
  initialData,
  fileName,
  fileFormat,
  onCommitSuccess,
  onCommitAction,
  onResetUpload,
}: ResumeReviewWorkbenchProps) {
  const r = (dict.resume || {}) as Record<string, string>
  const [data, setData] = useState<ParsedResumePayload>(initialData)
  const [mergeConfig, setMergeConfig] = useState<SectionMergeConfig>({
    personalInfo: 'replace',
    experiences: 'replace',
    educations: 'replace',
    skills: 'append',
    projects: 'replace',
  })

  const [newSkillInput, setNewSkillInput] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitSuccessProfileId, setCommitSuccessProfileId] = useState<string | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  const docDir = data.language === 'AR' ? 'rtl' : 'ltr'

  // Handlers for scalar fields
  const handleScalarChange = (field: keyof ParsedResumePayload, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  // Work experience handlers
  const handleExperienceChange = (
    index: number,
    field: string,
    value: string | boolean | string[],
  ) => {
    setData((prev) => {
      const nextExp = [...prev.experiences]
      nextExp[index] = { ...nextExp[index], [field]: value }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleAddExperience = () => {
    setData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          companyName: '',
          jobTitle: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          bullets: [''],
        },
      ],
    }))
  }

  const handleRemoveExperience = (index: number) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }))
  }

  const handleAddBullet = (expIndex: number) => {
    setData((prev) => {
      const nextExp = [...prev.experiences]
      nextExp[expIndex] = {
        ...nextExp[expIndex],
        bullets: [...(nextExp[expIndex].bullets || []), ''],
      }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleBulletChange = (expIndex: number, bulletIndex: number, val: string) => {
    setData((prev) => {
      const nextExp = [...prev.experiences]
      const nextBullets = [...(nextExp[expIndex].bullets || [])]
      nextBullets[bulletIndex] = val
      nextExp[expIndex] = { ...nextExp[expIndex], bullets: nextBullets }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    setData((prev) => {
      const nextExp = [...prev.experiences]
      nextExp[expIndex] = {
        ...nextExp[expIndex],
        bullets: nextExp[expIndex].bullets.filter((_, bi) => bi !== bulletIndex),
      }
      return { ...prev, experiences: nextExp }
    })
  }

  // Education handlers
  const handleEducationChange = (index: number, field: string, value: string) => {
    setData((prev) => {
      const nextEdu = [...prev.educations]
      nextEdu[index] = { ...nextEdu[index], [field]: value }
      return { ...prev, educations: nextEdu }
    })
  }

  const handleAddEducation = () => {
    setData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          grade: '',
        },
      ],
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setData((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }))
  }

  // Skills handlers
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim()
    if (!trimmed) return
    setData((prev) => {
      if (prev.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        return prev
      }
      return { ...prev, skills: [...prev.skills, trimmed] }
    })
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillIndex: number) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== skillIndex),
    }))
  }

  // Projects handlers
  const handleProjectChange = (index: number, field: string, value: string | string[]) => {
    setData((prev) => {
      const nextProj = [...prev.projects]
      nextProj[index] = { ...nextProj[index], [field]: value }
      return { ...prev, projects: nextProj }
    })
  }

  const handleAddProject = () => {
    setData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: '',
          description: '',
          role: '',
          technologies: [],
          url: '',
        },
      ],
    }))
  }

  const handleRemoveProject = (index: number) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  // Commit handler
  const handleCommit = async () => {
    setIsCommitting(true)
    setCommitError(null)

    try {
      const res = await onCommitAction({
        parsedResumeId,
        mergeConfig,
        editedData: data,
      })

      if (res.success && res.profileId) {
        setCommitSuccessProfileId(res.profileId)
        if (onCommitSuccess) onCommitSuccess(res.profileId)
      } else {
        setCommitError(res.error || 'Failed to commit parsed resume.')
      }
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Commit transaction failed.')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Workbench Header & Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {r.reviewTitle || 'Review & Ingest Candidate Profile'}
            </h2>
            <Badge
              variant="outline"
              className="text-xs font-mono uppercase bg-primary/10 text-primary border-primary/20"
            >
              {fileFormat}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-xs">
              {fileName}
            </span>
            <Badge
              variant="secondary"
              className="text-xs font-mono uppercase"
              data-testid="doc-language-badge"
            >
              <Globe className="h-3 w-3 me-1 inline" />
              {data.language === 'AR' ? 'العربية (AR)' : 'English (EN)'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {r.reviewSubtitle ||
              'Inspect extracted details, adjust fields, and choose merge strategies before committing to your master profile.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onResetUpload && (
            <Button variant="outline" size="sm" onClick={onResetUpload} className="text-xs">
              {r.uploadNewFile || 'Upload Different File'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleCommit}
            disabled={isCommitting || !!commitSuccessProfileId}
            className="gap-2 bg-primary text-primary-foreground font-medium"
            data-testid="commit-profile-button"
          >
            {isCommitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{r.committing || 'Committing Updates...'}</span>
              </>
            ) : commitSuccessProfileId ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span>{r.commitSuccess || 'Committed!'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{r.commitButton || 'Commit to Master Profile'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {commitSuccessProfileId && (
        <div
          data-testid="commit-success-banner"
          className="rounded-lg border border-success/30 bg-success/10 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">
                {r.commitSuccess || 'Candidate profile committed successfully!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'تم حفظ وتحديث ملفك المهني بنجاح وفق استراتيجيات الدمج المحددة.'
                  : 'Profile successfully updated with selected merge rules.'}
              </p>
            </div>
          </div>
          <a
            href={`/${lang}/tailor`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>{lang === 'ar' ? 'الذهاب لاستوديو التخصيص' : 'Open Tailor Studio'}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </a>
        </div>
      )}

      {/* Error Banner */}
      {commitError && (
        <div
          data-testid="commit-error-banner"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            <p className="font-semibold">{lang === 'ar' ? 'فشل الحفظ' : 'Commit Failed'}</p>
            <p>{commitError}</p>
          </div>
        </div>
      )}

      {/* DirectionProvider wrapping document cards workbench (AC-4) */}
      <DirectionProvider dir={docDir}>
        <div data-testid="document-direction-workbench" dir={docDir} className="space-y-6">
          {/* SECTION 1: Personal Information */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {r.personalInfo || 'Personal Information'}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground me-1">
                    {r.mergeStrategy || 'Strategy'}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMergeConfig((prev) => ({ ...prev, personalInfo: 'replace' }))}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      mergeConfig.personalInfo === 'replace'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {r.replace || 'Replace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeConfig((prev) => ({ ...prev, personalInfo: 'skip' }))}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      mergeConfig.personalInfo === 'skip'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {r.skip || 'Skip'}
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.fullName || 'Full Name'}
                  </label>
                  <Input
                    value={data.fullName || ''}
                    onChange={(e) => handleScalarChange('fullName', e.target.value)}
                    placeholder="Full name"
                    data-testid="input-fullName"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.headline || 'Headline'}
                  </label>
                  <Input
                    value={data.headline || ''}
                    onChange={(e) => handleScalarChange('headline', e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    data-testid="input-headline"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {r.summary || 'Summary'}
                </label>
                <Textarea
                  value={data.summary || ''}
                  onChange={(e) => handleScalarChange('summary', e.target.value)}
                  placeholder="Professional summary statement..."
                  rows={3}
                  data-testid="textarea-summary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.email || 'Email'}
                  </label>
                  <Input
                    value={data.email || ''}
                    onChange={(e) => handleScalarChange('email', e.target.value)}
                    placeholder="email@example.com"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.phone || 'Phone'}
                  </label>
                  <Input
                    value={data.phone || ''}
                    onChange={(e) => handleScalarChange('phone', e.target.value)}
                    placeholder="+1 555-0100"
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.location || 'Location'}
                  </label>
                  <Input
                    value={data.location || ''}
                    onChange={(e) => handleScalarChange('location', e.target.value)}
                    placeholder="City, Country"
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.websiteUrl || 'Website / Portfolio'}
                  </label>
                  <Input
                    value={data.websiteUrl || ''}
                    onChange={(e) => handleScalarChange('websiteUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.linkedinUrl || 'LinkedIn URL'}
                  </label>
                  <Input
                    value={data.linkedinUrl || ''}
                    onChange={(e) => handleScalarChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {r.githubUrl || 'GitHub URL'}
                  </label>
                  <Input
                    value={data.githubUrl || ''}
                    onChange={(e) => handleScalarChange('githubUrl', e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Work Experience */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {r.experiences || 'Work Experience'} ({data.experiences.length})
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground me-1">
                    {r.mergeStrategy || 'Strategy'}:
                  </span>
                  {(['replace', 'append', 'skip'] as MergeAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setMergeConfig((prev) => ({ ...prev, experiences: action }))}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        mergeConfig.experiences === action
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {r[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {data.experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3 relative"
                  data-testid={`experience-card-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {exp.companyName || `Role #${idx + 1}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExperience(idx)}
                      className="text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      <span>{r.removeExperience || 'Remove'}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.company || 'Company'}
                      </label>
                      <Input
                        value={exp.companyName || ''}
                        onChange={(e) => handleExperienceChange(idx, 'companyName', e.target.value)}
                        placeholder="Company name"
                        data-testid={`input-exp-company-${idx}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.jobTitle || 'Job Title'}
                      </label>
                      <Input
                        value={exp.jobTitle || ''}
                        onChange={(e) => handleExperienceChange(idx, 'jobTitle', e.target.value)}
                        placeholder="Job title"
                        data-testid={`input-exp-jobTitle-${idx}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                      </label>
                      <Input
                        value={exp.startDate || ''}
                        onChange={(e) => handleExperienceChange(idx, 'startDate', e.target.value)}
                        placeholder="YYYY-MM"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
                      </label>
                      <Input
                        value={exp.endDate || ''}
                        disabled={exp.isCurrent}
                        onChange={(e) => handleExperienceChange(idx, 'endDate', e.target.value)}
                        placeholder={
                          exp.isCurrent ? (lang === 'ar' ? 'حالي' : 'Present') : 'YYYY-MM'
                        }
                      />
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent || false}
                          onChange={(e) =>
                            handleExperienceChange(idx, 'isCurrent', e.target.checked)
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{r.currentJob || 'Current Position'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">
                        {r.bullets || 'Achievements & Responsibilities'}
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddBullet(idx)}
                        className="text-xs h-6 px-2 text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 me-1" />
                        <span>{r.addBullet || 'Add Bullet'}</span>
                      </Button>
                    </div>

                    {exp.bullets?.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <Input
                          value={bullet}
                          onChange={(e) => handleBulletChange(idx, bIdx, e.target.value)}
                          placeholder="Achievement bullet point..."
                          className="text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx, bIdx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExperience}
                className="w-full text-xs gap-1.5"
                data-testid="add-experience-button"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{r.addExperience || 'Add Work Experience'}</span>
              </Button>
            </CardContent>
          </Card>

          {/* SECTION 3: Education */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {r.educations || 'Education'} ({data.educations.length})
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground me-1">
                    {r.mergeStrategy || 'Strategy'}:
                  </span>
                  {(['replace', 'append', 'skip'] as MergeAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setMergeConfig((prev) => ({ ...prev, educations: action }))}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        mergeConfig.educations === action
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {r[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {data.educations.map((edu, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
                  data-testid={`education-card-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {edu.institution || `Degree #${idx + 1}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEducation(idx)}
                      className="text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      <span>{r.removeExperience || 'Remove'}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.institution || 'Institution'}
                      </label>
                      <Input
                        value={edu.institution || ''}
                        onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                        placeholder="University name"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.degree || 'Degree'}
                      </label>
                      <Input
                        value={edu.degree || ''}
                        onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                        placeholder="e.g. Bachelor of Science"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.fieldOfStudy || 'Field of Study'}
                      </label>
                      <Input
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => handleEducationChange(idx, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEducation}
                className="w-full text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{r.addEducation || 'Add Education'}</span>
              </Button>
            </CardContent>
          </Card>

          {/* SECTION 4: Skills */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {r.skills || 'Skills'} ({data.skills.length})
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground me-1">
                    {r.mergeStrategy || 'Strategy'}:
                  </span>
                  {(['replace', 'append', 'skip'] as MergeAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setMergeConfig((prev) => ({ ...prev, skills: action }))}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        mergeConfig.skills === action
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {r[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div
                className="flex flex-wrap gap-2 min-h-12 p-3 rounded-lg border border-border/60 bg-muted/20"
                data-testid="skills-chip-container"
              >
                {data.skills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-xs font-medium rounded-xs bg-secondary text-secondary-foreground"
                    data-testid={`skill-chip-${idx}`}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-muted-foreground hover:text-destructive rounded-full"
                      data-testid={`remove-skill-btn-${idx}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                  placeholder={r.skillPlaceholder || 'Enter skill (e.g. Next.js, PostgreSQL)'}
                  className="text-xs"
                  data-testid="new-skill-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSkill}
                  className="shrink-0 text-xs gap-1"
                  data-testid="add-skill-button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{r.addSkill || 'Add'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: Projects */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {r.projects || 'Projects'} ({data.projects.length})
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground me-1">
                    {r.mergeStrategy || 'Strategy'}:
                  </span>
                  {(['replace', 'append', 'skip'] as MergeAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setMergeConfig((prev) => ({ ...prev, projects: action }))}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        mergeConfig.projects === action
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {r[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {data.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
                  data-testid={`project-card-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {proj.name || `Project #${idx + 1}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProject(idx)}
                      className="text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      <span>{r.removeExperience || 'Remove'}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {r.projectName || 'Project Name'}
                      </label>
                      <Input
                        value={proj.name || ''}
                        onChange={(e) => handleProjectChange(idx, 'name', e.target.value)}
                        placeholder="Project name"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {lang === 'ar' ? 'الدور في المشروع' : 'Role'}
                      </label>
                      <Input
                        value={proj.role || ''}
                        onChange={(e) => handleProjectChange(idx, 'role', e.target.value)}
                        placeholder="e.g. Lead Developer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {r.projectDesc || 'Description'}
                    </label>
                    <Textarea
                      value={proj.description || ''}
                      onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                      placeholder="Project description and impact..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {r.technologies || 'Technologies (comma-separated)'}
                    </label>
                    <Input
                      value={(proj.technologies || []).join(', ')}
                      onChange={(e) =>
                        handleProjectChange(
                          idx,
                          'technologies',
                          e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="e.g. Next.js, Prisma, PostgreSQL"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProject}
                className="w-full text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{r.addProject || 'Add Project'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DirectionProvider>
    </div>
  )
}
