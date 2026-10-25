'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Check, Loader2 } from 'lucide-react'
import type { Dictionary, AtsDictionary } from '@/lib/i18n/types'

export interface PdfExportButtonProps {
  tailoredResumeId: string
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
  lastExportedAt?: string | Date | null
  className?: string
}

export function PdfExportButton({
  tailoredResumeId,
  lang,
  dict,
  lastExportedAt,
  className,
}: PdfExportButtonProps) {
  const t = (dict?.ats || {}) as Partial<AtsDictionary>
  const [isExporting, setIsExporting] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)

  const handleDownload = async () => {
    if (!tailoredResumeId || isExporting) return

    setIsExporting(true)
    setDownloaded(false)

    try {
      const exportUrl = `/api/resumes/${tailoredResumeId}/pdf?lang=${lang}`
      const response = await fetch(exportUrl)

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers.get('Content-Disposition')
      let filename = `CareerCraft_Resume_${lang.toUpperCase()}.pdf`
      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/)
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1])
        } else {
          const asciiMatch = disposition.match(/filename="?([^";]+)"?/)
          if (asciiMatch && asciiMatch[1]) {
            filename = asciiMatch[1]
          }
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch (err) {
      console.error('Error downloading resume PDF:', err)
      alert(
        lang === 'ar'
          ? 'فشل تصدير ملف PDF. يرجى المحاولة مرة أخرى.'
          : 'Failed to export PDF document.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="default"
        size="sm"
        disabled={isExporting}
        onClick={handleDownload}
        className={`gap-2 font-medium shadow-sm transition-all ${className || ''}`}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : downloaded ? (
          <Check className="h-4 w-4 text-emerald-400" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        <span>
          {isExporting
            ? t.exportingPdf || 'Generating PDF...'
            : downloaded
              ? lang === 'ar'
                ? 'تم التحميل!'
                : 'Downloaded!'
              : t.exportPdf || 'Export ATS PDF'}
        </span>
      </Button>

      {lastExportedAt && (
        <span className="text-[10px] text-muted-foreground ms-1">
          {t.lastExported || 'Last exported'}:{' '}
          {new Date(lastExportedAt).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  )
}
