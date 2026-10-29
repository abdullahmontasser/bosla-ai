'use client'

import React, { useState } from 'react'
import { User, Check, AlertCircle, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

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

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <CardTitle className="text-[17px] font-bold text-foreground">
            {isAr ? 'البيانات الشخصية والمهنية' : 'Personal & Professional Identity'}
          </CardTitle>
        </div>
        <CardDescription className="text-[13px] text-muted-foreground">
          {isAr
            ? 'المصدر الرئيسي لبياناتك الشخصية ومعلومات الاتصال عبر جميع السير الذاتية ومساحة العمل.'
            : 'Single source of truth for your name, professional summary, and contact channels.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-primary/30 bg-primary/10 p-3 text-[12px] text-primary">
            <Check className="h-4 w-4 shrink-0" />
            <span>{isAr ? 'تم حفظ التعديلات بنجاح' : 'Identity details saved successfully'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'الاسم الكامل *' : 'Full Name *'}
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? 'مثال: عبد الله أحمد' : 'e.g. Alex Morgan'}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'المسمى المهني الرئيسي' : 'Professional Headline'}
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={isAr ? 'مثال: كبير مهندسي برمجيات' : 'e.g. Senior Full-Stack Engineer'}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-foreground mb-1">
              {isAr ? 'الملخص المهني' : 'Professional Summary'}
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder={
                isAr
                  ? 'نبذة شاملة عن خبراتك ومجالات تخصصك وأهم إنجازاتك المهنية...'
                  : 'Compelling summary highlighting your domain expertise, core strengths, and major career achievements...'
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Contact Email'}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <Input
                value={phone}
                dir="ltr"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'الموقع الجغرافي' : 'Location'}
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'San Francisco, CA'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                {isAr ? 'الموقع الشخصي' : 'Personal Website'}
              </label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                LinkedIn URL
              </label>
              <Input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-foreground mb-1">
                GitHub URL
              </label>
              <Input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
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
      </CardContent>
    </Card>
  )
}
