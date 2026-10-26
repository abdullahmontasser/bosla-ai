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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, RotateCw, AlertTriangle } from 'lucide-react'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

export interface ConnectionNoteEditorProps {
  value: string
  onChange: (newValue: string) => void
  onRegenerate: () => Promise<void>
  isRegenerating?: boolean
  lang: 'en' | 'ar'
  title?: string
  description?: string
}

export function ConnectionNoteEditor({
  value,
  onChange,
  onRegenerate,
  isRegenerating = false,
  lang,
  title,
  description,
}: ConnectionNoteEditorProps) {
  const isArabic = lang === 'ar'
  const charCount = value.length
  const isOverLimit = charCount > 300
  const isNearLimit = charCount >= 280 && charCount <= 300
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Visual status for character limit
  let counterVariant: 'default' | 'secondary' | 'destructive' = 'secondary'
  let counterColorClass = 'text-muted-foreground'
  if (isOverLimit) {
    counterVariant = 'destructive'
    counterColorClass = 'text-destructive font-semibold'
  } else if (isNearLimit) {
    counterColorClass = 'text-amber-600 dark:text-amber-400 font-medium'
  }

  return (
    <Card className="border border-border/80 bg-card shadow-xs transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LinkedInIcon className="size-4 text-[#0a66c2]" />
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {title || (isArabic ? 'ملاحظة طلب اتصال لينكد إن' : 'LinkedIn Connection Note')}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {description ||
                (isArabic
                  ? 'رسالة دعوة موجزة تظهر مع طلب الاتصال، محددة بـ 300 حرف كحد أقصى.'
                  : 'Concise note included with connection invitations, capped at 300 characters.')}
            </CardDescription>
          </div>

          <Badge variant={counterVariant} className="text-[11px] font-mono px-2 py-0.5">
            <span className={counterColorClass}>{charCount}</span>
            <span className="text-muted-foreground/70"> / 300</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir={isArabic ? 'rtl' : 'ltr'}
            rows={4}
            className={`resize-none text-xs leading-relaxed text-foreground ${
              isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''
            }`}
            placeholder={
              isArabic
                ? 'اكتب رسالة الاتصال هنا...'
                : 'Write your personalized LinkedIn connection note here...'
            }
          />
        </div>

        {isOverLimit && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              {isArabic
                ? `تجاوزت الحد الأقصى بمقدار ${charCount - 300} حرفاً. سيتم اقتطاع الرسالة على لينكد إن.`
                : `Exceeds LinkedIn limit by ${charCount - 300} characters. Trimming required.`}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-1 flex items-center justify-between border-t border-border/40 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>{isArabic ? 'نسخ الملاحظة' : 'Copy Note'}</span>
            </>
          )}
        </Button>

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
