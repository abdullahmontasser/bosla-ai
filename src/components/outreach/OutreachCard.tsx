'use client'

import * as React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check, RotateCw, Mail } from 'lucide-react'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

export interface OutreachCardProps {
  type: 'inMail' | 'email'
  subject: string
  body: string
  onSubjectChange: (newSubject: string) => void
  onBodyChange: (newBody: string) => void
  onRegenerate: () => Promise<void>
  isRegenerating?: boolean
  lang: 'en' | 'ar'
}

export function OutreachCard({
  type,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
  lang,
}: OutreachCardProps) {
  const isArabic = lang === 'ar'
  const [copiedBody, setCopiedBody] = React.useState(false)
  const [copiedAll, setCopiedAll] = React.useState(false)

  const isLinkedIn = type === 'inMail'

  const title = isLinkedIn
    ? isArabic
      ? 'رسالة لينكد إن إنميل (InMail)'
      : 'LinkedIn InMail Pitch'
    : isArabic
      ? 'بريد إلكتروني بارد مباشر'
      : 'Cold Email Pitch'

  const description = isLinkedIn
    ? isArabic
      ? 'رسالة تواصل شاملة تركز على المواءمة المهنية وعرض القيمة لمديري التوظيف.'
      : 'Comprehensive outreach message highlighting alignment and value proposition.'
    : isArabic
      ? 'مسودة بريد مهني جاهزة للإرسال المباشر تتضمن سطراً للموضوع وهيكلاً منظماً.'
      : 'Structured email pitch with a compelling subject line and clear call to action.'

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(body)
      setCopiedBody(true)
      setTimeout(() => setCopiedBody(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyAll = async () => {
    try {
      const fullText = `${isArabic ? 'الموضوع' : 'Subject'}: ${subject}\n\n${body}`
      await navigator.clipboard.writeText(fullText)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <Card className="border border-border/80 bg-card shadow-xs transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isLinkedIn ? (
                <LinkedInIcon className="size-4 text-[#0a66c2]" />
              ) : (
                <Mail className="size-4 text-primary" />
              )}
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Subject Line */}
        <div className="space-y-1">
          <label htmlFor="outreach-subject" className="text-xs font-medium text-muted-foreground">
            {isArabic ? 'عنوان الرسالة / الموضوع' : 'Subject Line'}
          </label>
          <Input
            id="outreach-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            dir={isArabic ? 'rtl' : 'ltr'}
            className="h-8 text-xs font-medium text-foreground bg-background"
            placeholder={isArabic ? 'موضوع الرسالة...' : 'Message subject line...'}
          />
        </div>

        {/* Message Body */}
        <div className="space-y-1">
          <label htmlFor="outreach-body" className="text-xs font-medium text-muted-foreground">
            {isArabic ? 'نص الرسالة' : 'Message Body'}
          </label>
          <Textarea
            id="outreach-body"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            dir={isArabic ? 'rtl' : 'ltr'}
            rows={7}
            className="text-xs leading-relaxed text-foreground bg-background resize-y"
            placeholder={isArabic ? 'نص الرسالة...' : 'Message body content...'}
          />
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between border-t border-border/40 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="h-8 gap-1.5 text-xs text-foreground"
          >
            {copiedAll ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>{isArabic ? 'تم النسخ بالكامل' : 'Copied All'}</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>{isArabic ? 'نسخ الموضوع والنص' : 'Copy Full Message'}</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyBody}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedBody ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>{isArabic ? 'تم نسخ النص' : 'Body Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>{isArabic ? 'نسخ النص فقط' : 'Copy Body'}</span>
              </>
            )}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCw className={`size-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isArabic ? 'إعادة التوليد' : 'Regenerate'}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
