'use client'

import React, { useState } from 'react'
import { Check, AlertCircle, Save, Sparkles, RotateCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { enhanceProfileSummaryAction } from '@/app/actions/profile-ai'

interface IdentityCardProps {
  profileId: string
  fullName: string
  headline?: string | null
  summary?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  lang: string
  onSaveSuccess: (updated: {
    fullName: string
    headline?: string | null
    summary?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    websiteUrl?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
  }) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function IdentityCard({
  profileId,
  fullName: initialFullName,
  headline: initialHeadline,
  summary: initialSummary,
  email: initialEmail,
  phone: initialPhone,
  location: initialLocation,
  websiteUrl: initialWebsiteUrl,
  linkedinUrl: initialLinkedinUrl,
  githubUrl: initialGithubUrl,
  lang,
  onSaveSuccess,
  onDirtyChange,
}: IdentityCardProps) {
  const isAr = lang === 'ar'

  const [fullName, setFullName] = useState(initialFullName || '')
  const [headline, setHeadline] = useState(initialHeadline || '')
  const [summary, setSummary] = useState(initialSummary || '')
  const [email, setEmail] = useState(initialEmail || '')
  const [phone, setPhone] = useState(initialPhone || '')
  const [location, setLocation] = useState(initialLocation || '')
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl || '')
  const [githubUrl, setGithubUrl] = useState(initialGithubUrl || '')

  // Track unsaved dirty state against initial props
  const isDirty =
    fullName !== (initialFullName || '') ||
    headline !== (initialHeadline || '') ||
    summary !== (initialSummary || '') ||
    email !== (initialEmail || '') ||
    phone !== (initialPhone || '') ||
    location !== (initialLocation || '') ||
    websiteUrl !== (initialWebsiteUrl || '') ||
    linkedinUrl !== (initialLinkedinUrl || '') ||
    githubUrl !== (initialGithubUrl || '')

  // Keep local fields in sync with incoming props (e.g. after AI health fixes or external saves).
  // Adjusted during render so the sync does not trigger a cascading effect render.
  const initialValues = {
    fullName: initialFullName || '',
    headline: initialHeadline || '',
    summary: initialSummary || '',
    email: initialEmail || '',
    phone: initialPhone || '',
    location: initialLocation || '',
    websiteUrl: initialWebsiteUrl || '',
    linkedinUrl: initialLinkedinUrl || '',
    githubUrl: initialGithubUrl || '',
  }
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues)
  if (
    initialValues.fullName !== prevInitialValues.fullName ||
    initialValues.headline !== prevInitialValues.headline ||
    initialValues.summary !== prevInitialValues.summary ||
    initialValues.email !== prevInitialValues.email ||
    initialValues.phone !== prevInitialValues.phone ||
    initialValues.location !== prevInitialValues.location ||
    initialValues.websiteUrl !== prevInitialValues.websiteUrl ||
    initialValues.linkedinUrl !== prevInitialValues.linkedinUrl ||
    initialValues.githubUrl !== prevInitialValues.githubUrl
  ) {
    setPrevInitialValues(initialValues)
    setFullName(initialValues.fullName)
    setHeadline(initialValues.headline)
    setSummary(initialValues.summary)
    setEmail(initialValues.email)
    setPhone(initialValues.phone)
    setLocation(initialValues.location)
    setWebsiteUrl(initialValues.websiteUrl)
    setLinkedinUrl(initialValues.linkedinUrl)
    setGithubUrl(initialValues.githubUrl)
  }

  React.useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false)

  const handleEnhanceSummary = async () => {
    if (isEnhancingSummary) return
    setIsEnhancingSummary(true)
    try {
      const res = await enhanceProfileSummaryAction({
        fullName,
        headline,
        currentSummary: summary,
        language: isAr ? 'AR' : 'EN',
      })
      if (res.success && res.enhancedSummary) {
        setSummary(res.enhancedSummary)
      }
    } catch (err) {
      console.error('Failed to enhance summary:', err)
    } finally {
      setIsEnhancingSummary(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/profile/identity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          fullName: fullName.trim(),
          headline: headline.trim(),
          summary: summary.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          location: location.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update identity')
      }

      const result = await res.json()
      setSavedSuccess(true)
      onSaveSuccess({
        fullName: result.profile.fullName,
        headline: result.profile.headline,
        summary: result.profile.summary,
        email: result.profile.email,
        phone: result.profile.phone,
        location: result.profile.location,
        websiteUrl: result.profile.websiteUrl,
        linkedinUrl: result.profile.linkedinUrl,
        githubUrl: result.profile.githubUrl,
      })

      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
      {/* Left sub-column */}
      <div>
        <h3 className="text-[17px] font-bold text-foreground">
          {isAr ? 'البيانات الشخصية والمهنية' : 'Personal & Professional Identity'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'المصدر الرئيسي لبياناتك الشخصية ومعلومات الاتصال عبر جميع السير الذاتية ومساحة العمل.'
            : 'Single source of truth for your name, professional summary, and contact channels.'}
        </p>
      </div>

      {/* Right sub-column: Form */}
      <div>
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-primary/30 bg-primary/10 p-3 text-[12px] text-primary">
            <Check className="h-4 w-4 shrink-0" />
            <span>{isAr ? 'تم حفظ التعديلات بنجاح' : 'Identity details saved successfully'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="identity-field-fullName"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'الاسم الكامل *' : 'Full Name *'}
              </label>
              <Input
                id="identity-field-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? 'مثال: عبد الله أحمد' : 'e.g. Alex Morgan'}
                required
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="identity-field-headline"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'المسمى المهني الرئيسي' : 'Professional Headline'}
              </label>
              <Input
                id="identity-field-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={isAr ? 'مثال: كبير مهندسي برمجيات' : 'e.g. Senior Full-Stack Engineer'}
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="identity-field-summary"
                className="block text-[12px] font-semibold text-foreground"
              >
                {isAr ? 'الملخص المهني' : 'Professional Summary'}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isEnhancingSummary}
                onClick={handleEnhanceSummary}
                className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-[4px] font-medium transition-colors"
                title={
                  isAr
                    ? 'تحسين صياغة الملخص بالذكاء الاصطناعي'
                    : 'Enhance executive summary with AI'
                }
              >
                {isEnhancingSummary ? (
                  <RotateCw className="h-3 w-3 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
                <span>
                  {isEnhancingSummary
                    ? isAr
                      ? 'جارٍ التحسين...'
                      : 'Enhancing...'
                    : isAr
                      ? 'تحسين بالذكاء الاصطناعي'
                      : 'Enhance with AI'}
                </span>
              </Button>
            </div>
            <Textarea
              id="identity-field-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder={
                isAr
                  ? 'نبذة شاملة عن خبراتك ومجالات تخصصك وأهم إنجازاتك المهنية...'
                  : 'Compelling summary highlighting your domain expertise, core strengths, and major career achievements...'
              }
              className="rounded-[6px] border-border bg-card text-xs leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="identity-field-email"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'البريد الإلكتروني' : 'Contact Email'}
              </label>
              <Input
                id="identity-field-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="identity-field-phone"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <Input
                id="identity-field-phone"
                value={phone}
                dir="ltr"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="identity-field-location"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'الموقع الجغرافي' : 'Location'}
              </label>
              <Input
                id="identity-field-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'San Francisco, CA'}
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="identity-field-websiteUrl"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                {isAr ? 'الموقع الشخصي' : 'Personal Website'}
              </label>
              <Input
                id="identity-field-websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="identity-field-linkedinUrl"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                LinkedIn URL
              </label>
              <Input
                id="identity-field-linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="identity-field-githubUrl"
                className="block text-[12px] font-semibold text-foreground mb-1"
              >
                GitHub URL
              </label>
              <Input
                id="identity-field-githubUrl"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 rounded-[6px] bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] hover:bg-primary/90 text-xs font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              {saving
                ? isAr
                  ? 'جارٍ الحفظ...'
                  : 'Saving...'
                : isAr
                  ? 'حفظ التعديلات'
                  : 'Save Identity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
