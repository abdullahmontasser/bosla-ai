'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import { RtlIcon } from '@/components/ui/rtl-icon'

export function PrintControls({
  lang,
  tailoredResumeId,
  backLabel,
  printLabel,
}: {
  lang: string
  tailoredResumeId: string
  backLabel: string
  printLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 mb-6 rounded-lg border border-border/80 bg-card shadow-xs print:hidden">
      <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs text-foreground">
        <Link href={`/${lang}/career-prep?tailoredResumeId=${tailoredResumeId}`}>
          <RtlIcon icon={ArrowLeft} className="size-3.5" />
          <span>{backLabel}</span>
        </Link>
      </Button>

      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={() => window.print()}
        className="gap-1.5 text-xs font-semibold"
        data-testid="print-route-btn"
      >
        <Printer className="size-3.5" />
        <span>{printLabel}</span>
      </Button>
    </div>
  )
}
