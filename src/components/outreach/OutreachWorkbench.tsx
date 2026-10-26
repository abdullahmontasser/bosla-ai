'use client'

import * as React from 'react'
import type {
  OutreachMessagePayload,
  OutreachTone,
  OutreachRecipientType,
} from '@/lib/validations/career-prep'
import {
  generateOutreachAction,
  saveOutreachAction,
  regenerateOutreachVariantAction,
} from '@/app/actions/outreach-actions'
import { ConnectionNoteEditor } from './ConnectionNoteEditor'
import { OutreachCard } from './OutreachCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  UserCheck,
  Building,
  Users,
  GraduationCap,
} from 'lucide-react'

export interface OutreachWorkbenchProps {
  tailoredResumeId: string
  initialOutreach?: OutreachMessagePayload | null
  lang: 'en' | 'ar'
  onPayloadChange?: (payload: OutreachMessagePayload) => void
}

export function OutreachWorkbench({
  tailoredResumeId,
  initialOutreach = null,
  lang,
  onPayloadChange,
}: OutreachWorkbenchProps) {
  const isArabic = lang === 'ar'
  const [payload, setPayload] = React.useState<OutreachMessagePayload | null>(initialOutreach)
  const [tone, setTone] = React.useState<OutreachTone>(initialOutreach?.tone || 'PROFESSIONAL')
  const [recipientType, setRecipientType] = React.useState<OutreachRecipientType>(
    initialOutreach?.recipientType || 'RECRUITER',
  )

  const [isGeneratingAll, setIsGeneratingAll] = React.useState(false)
  const [regeneratingVariant, setRegeneratingVariant] = React.useState<
    'connectionNote' | 'inMail' | 'email' | null
  >(null)
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Ref for debounced autosave
  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestPayloadRef = React.useRef<OutreachMessagePayload | null>(payload)

  React.useEffect(() => {
    latestPayloadRef.current = payload
  }, [payload])

  // Flush any pending debounced autosave
  const flushPendingAutosave = React.useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
      if (latestPayloadRef.current && tailoredResumeId) {
        setSaveStatus('saving')
        try {
          const res = await saveOutreachAction(tailoredResumeId, latestPayloadRef.current)
          if (res.success && res.data) {
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else {
            setSaveStatus('error')
          }
        } catch {
          setSaveStatus('error')
        }
      }
    }
  }, [tailoredResumeId])

  // Trigger 1000ms debounced autosave
  const triggerDebouncedAutosave = React.useCallback(
    (newPayload: OutreachMessagePayload) => {
      setPayload(newPayload)
      latestPayloadRef.current = newPayload
      onPayloadChange?.(newPayload)

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }

      setSaveStatus('saving')
      autosaveTimerRef.current = setTimeout(async () => {
        autosaveTimerRef.current = null
        try {
          const res = await saveOutreachAction(tailoredResumeId, newPayload)
          if (res.success && res.data) {
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2500)
          } else {
            setSaveStatus('error')
            if (res.error) setErrorMessage(res.error)
          }
        } catch {
          setSaveStatus('error')
          setErrorMessage(
            isArabic
              ? 'حدث خطأ أثناء حفظ رسائل التواصل تلقائياً.'
              : 'Failed to autosave outreach messages.',
          )
        }
      }, 1000)
    },
    [tailoredResumeId, isArabic, onPayloadChange],
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  // Handle Full Generation
  const handleGenerateAll = async () => {
    await flushPendingAutosave()
    setIsGeneratingAll(true)
    setErrorMessage(null)

    try {
      const res = await generateOutreachAction(tailoredResumeId, {
        tone,
        recipientType,
        language: isArabic ? 'AR' : 'EN',
      })

      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
        onPayloadChange?.(res.data)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر توليد رسائل التواصل المهني. يرجى التحقق من إعدادات مزود الذكاء الاصطناعي.'
          : 'Failed to generate outreach messages. Please check your AI provider configuration.',
      )
    } finally {
      setIsGeneratingAll(false)
    }
  }

  // Handle Single Variant Regeneration
  const handleRegenerateVariant = async (variant: 'connectionNote' | 'inMail' | 'email') => {
    await flushPendingAutosave()
    setRegeneratingVariant(variant)
    setErrorMessage(null)

    try {
      const res = await regenerateOutreachVariantAction(tailoredResumeId, variant, {
        tone,
        recipientType,
        language: isArabic ? 'AR' : 'EN',
      })

      if (res.success && res.data) {
        setPayload(res.data)
        latestPayloadRef.current = res.data
        onPayloadChange?.(res.data)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر إعادة توليد النموذج المحدد.'
          : 'Failed to regenerate selected outreach variant.',
      )
    } finally {
      setRegeneratingVariant(null)
    }
  }

  // Edit Handlers
  const handleConnectionNoteChange = (text: string) => {
    if (!payload) return
    const updated: OutreachMessagePayload = {
      ...payload,
      connectionNote: {
        text,
        charCount: text.length,
      },
    }
    triggerDebouncedAutosave(updated)
  }

  const handleInMailSubjectChange = (subject: string) => {
    if (!payload) return
    const updated: OutreachMessagePayload = {
      ...payload,
      inMail: {
        ...payload.inMail,
        subject,
      },
    }
    triggerDebouncedAutosave(updated)
  }

  const handleInMailBodyChange = (body: string) => {
    if (!payload) return
    const updated: OutreachMessagePayload = {
      ...payload,
      inMail: {
        ...payload.inMail,
        body,
      },
    }
    triggerDebouncedAutosave(updated)
  }

  const handleEmailSubjectChange = (subject: string) => {
    if (!payload) return
    const updated: OutreachMessagePayload = {
      ...payload,
      email: {
        ...payload.email,
        subject,
      },
    }
    triggerDebouncedAutosave(updated)
  }

  const handleEmailBodyChange = (body: string) => {
    if (!payload) return
    const updated: OutreachMessagePayload = {
      ...payload,
      email: {
        ...payload.email,
        body,
      },
    }
    triggerDebouncedAutosave(updated)
  }

  const recipientOptions: Array<{
    id: OutreachRecipientType
    labelEn: string
    labelAr: string
    icon: React.ElementType
  }> = [
    { id: 'RECRUITER', labelEn: 'Recruiter', labelAr: 'مسؤول التوظيف', icon: UserCheck },
    { id: 'HIRING_MANAGER', labelEn: 'Hiring Manager', labelAr: 'المدير الفني', icon: Building },
    { id: 'PEER', labelEn: 'Peer Engineer', labelAr: 'زميل هندسي', icon: Users },
    {
      id: 'ALUMNI',
      labelEn: 'Alumni / Network',
      labelAr: 'زميل دراسة / شبكة',
      icon: GraduationCap,
    },
  ]

  const toneOptions: Array<{ id: OutreachTone; labelEn: string; labelAr: string }> = [
    { id: 'PROFESSIONAL', labelEn: 'Professional', labelAr: 'احترافي رصين' },
    { id: 'CONFIDENT', labelEn: 'Confident', labelAr: 'واثق ومؤثر' },
    { id: 'CONVERSATIONAL', labelEn: 'Conversational', labelAr: 'ودي وتفاعلي' },
  ]

  return (
    <div className="space-y-6" data-testid="outreach-workbench">
      {/* Workbench Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {isArabic ? 'مولد رسائل التواصل المهني البارد' : 'Cold Career Outreach Generator'}
            </h3>
            {saveStatus === 'saving' && (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground animate-pulse py-0"
              >
                {isArabic ? 'جارٍ الحفظ...' : 'Autosaving...'}
              </Badge>
            )}
            {saveStatus === 'saved' && (
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 border-emerald-500/30 gap-1 py-0"
              >
                <CheckCircle2 className="size-2.5" />
                {isArabic ? 'تم الحفظ' : 'Saved'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {isArabic
              ? 'صياغة رسائل موجهة للتواصل مع مسؤولي التوظيف والمديرين استناداً إلى نقاط قوتك في السيرة.'
              : 'Generate targeted outreach for recruiters and hiring managers based on your tailored profile.'}
          </p>
        </div>

        {/* Generate / Regenerate Action Trigger */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Sparkles className={`size-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAll
                ? isArabic
                  ? 'جارٍ صياغة الرسائل...'
                  : 'Generating Messages...'
                : payload
                  ? isArabic
                    ? 'إعادة صياغة الكل'
                    : 'Regenerate All Variants'
                  : isArabic
                    ? 'توليد رسائل التواصل'
                    : 'Generate Outreach Messages'}
            </span>
          </Button>
        </div>
      </div>

      {/* Target Recipient and Tone Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border/60 bg-muted/20">
        {/* Recipient Targeting Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-primary" />
            <span>{isArabic ? 'الجهة أو الشخص المستهدف' : 'Target Recipient Type'}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {recipientOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = recipientType === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecipientType(opt.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="size-3" />
                  <span>{isArabic ? opt.labelAr : opt.labelEn}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>{isArabic ? 'نبرة الخطاب' : 'Outreach Tone'}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {toneOptions.map((opt) => {
              const isSelected = tone === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTone(opt.id)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <span>{isArabic ? opt.labelAr : opt.labelEn}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Generated Message Cards Grid */}
      {payload ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: LinkedIn Connection Note */}
          <div className="lg:col-span-5 space-y-4">
            <ConnectionNoteEditor
              value={payload.connectionNote.text}
              onChange={handleConnectionNoteChange}
              onRegenerate={() => handleRegenerateVariant('connectionNote')}
              isRegenerating={regeneratingVariant === 'connectionNote'}
              lang={lang}
            />
          </div>

          {/* Right Column: InMail and Cold Email Cards */}
          <div className="lg:col-span-7 space-y-6">
            <OutreachCard
              type="inMail"
              subject={payload.inMail.subject}
              body={payload.inMail.body}
              onSubjectChange={handleInMailSubjectChange}
              onBodyChange={handleInMailBodyChange}
              onRegenerate={() => handleRegenerateVariant('inMail')}
              isRegenerating={regeneratingVariant === 'inMail'}
              lang={lang}
            />

            <OutreachCard
              type="email"
              subject={payload.email.subject}
              body={payload.email.body}
              onSubjectChange={handleEmailSubjectChange}
              onBodyChange={handleEmailBodyChange}
              onRegenerate={() => handleRegenerateVariant('email')}
              isRegenerating={regeneratingVariant === 'email'}
              lang={lang}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80 rounded-lg bg-card/30 space-y-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Send className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              {isArabic ? 'لم يتم توليد رسائل تواصل بعد' : 'No outreach messages generated yet'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {isArabic
                ? 'اختر النبرة والفئة المستهدفة ثم اضغط على زر التوليد لإنشاء نماذج رسائل لينكد إن والبريد الإلكتروني.'
                : 'Select your preferred tone and target recipient, then click generate to create personalized LinkedIn and email notes.'}
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground mt-2"
          >
            <Sparkles className="size-3.5" />
            <span>{isArabic ? 'توليد رسائل التواصل الآن' : 'Generate Outreach Messages'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
