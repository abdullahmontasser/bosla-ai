'use client'

import * as React from 'react'
import { LayoutTemplate, Check, Download, Eye, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RESUME_TEMPLATES,
  getResumeTemplate,
  type ResumeTemplateId,
  type ResumeTemplateDefinition,
} from '@/lib/pdf/templates'

export type { ResumeTemplateId }

export interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTemplate: ResumeTemplateId
  onSelectTemplate: (templateId: ResumeTemplateId) => void
  candidateName?: string | null
  targetRole?: string | null
  summary?: string | null
  bullets?: string[]
  skills?: string[]
  lang: 'en' | 'ar'
  onDownload: () => void
  isDownloading?: boolean
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  candidateName = 'Abdullah Montasser',
  targetRole = 'Senior Full Stack Engineer',
  summary,
  bullets = [],
  skills = [],
  lang,
  onDownload,
  isDownloading = false,
}: TemplatePreviewModalProps) {
  const isArabic = lang === 'ar'
  const [filterCategory, setFilterCategory] = React.useState<string>('all')

  if (!isOpen) return null

  const currentTpl: ResumeTemplateDefinition = getResumeTemplate(selectedTemplate)

  // Filter categories for easy discovery across 15 templates
  const categories = [
    { id: 'all', labelEn: 'All 15 Templates', labelAr: 'كافة القوالب (15)' },
    { id: 'engineering', labelEn: 'Engineering & Tech', labelAr: 'التقنية والهندسة' },
    { id: 'leadership', labelEn: 'Leadership & Mgmt', labelAr: 'القيادة والإدارة' },
    { id: 'finance-strategy', labelEn: 'Finance & Strategy', labelAr: 'المالية والاستراتيجية' },
    { id: 'minimal-compact', labelEn: 'Universal & Compact', labelAr: 'الشامل والمدمج' },
  ]

  const filteredTemplates = RESUME_TEMPLATES.filter((tpl) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'engineering') {
      return [
        'tech-minimalist',
        'startup-builder',
        'data-ai-specialist',
        'cybersecurity-ops',
      ].includes(tpl.id)
    }
    if (filterCategory === 'leadership') {
      return [
        'modern-editorial',
        'executive-navy',
        'engineering-manager',
        'consultant-deliverable',
      ].includes(tpl.id)
    }
    if (filterCategory === 'finance-strategy') {
      return ['wall-street-finance', 'product-strategy', 'harvard-classic'].includes(tpl.id)
    }
    if (filterCategory === 'minimal-compact') {
      return [
        'compact-one-page',
        'bilingual-mirror',
        'clean-monochrome',
        'hybrid-functional',
      ].includes(tpl.id)
    }
    return true
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'معاينة قوالب السيرة الذاتية' : 'CV Template Preview'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-2 overflow-hidden animate-in fade-in"
    >
      <div
        className="w-full h-full sm:h-[98vh] sm:max-w-[98vw] bg-background border border-border sm:rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  {isArabic
                    ? '15 قالباً معتمداً لأنظمة الفحص والتوظيف (ATS)'
                    : '15 ATS-Proven & Recruiter-Preferred Templates'}
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                >
                  <ShieldCheck className="h-3 w-3 me-1" />
                  ATS Single-Column
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isArabic
                  ? 'تم تصميم وهندسة جميع القوالب بهيكل عمود واحد قياسي لقراءة أنظمة Workday وGreenhouse وLever بنسبة 100%.'
                  : 'Engineered with strict single-column hierarchies for 100% parse-rate across Workday, Greenhouse, Taleo, and Lever.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border/50 bg-muted/10 overflow-x-auto scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat.id
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {isArabic ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Template Selector Grid (Scrollable) */}
        <div className="p-4 border-b border-border/60 bg-muted/5 max-h-48 overflow-y-auto scrollbar-thin shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredTemplates.map((tpl) => {
              const isSelected =
                selectedTemplate === tpl.id ||
                (selectedTemplate === 'executive-classic' && tpl.id === 'executive-navy')
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectTemplate(tpl.id)}
                  className={`flex flex-col text-start p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                      : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tpl.accentColor }}
                      />
                      <span className="font-semibold text-foreground truncate">
                        {isArabic ? tpl.nameAr : tpl.nameEn}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {isArabic ? tpl.personaAr : tpl.personaEn}
                  </span>
                  <span className="text-[9.5px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                    {isArabic ? tpl.traitsAr : tpl.traitsEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Resume Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40 flex justify-center">
          <div
            className={`w-full max-w-2xl rounded-md border shadow-md p-6 sm:p-8 space-y-5 transition-all duration-300 ${currentTpl.bgClass} ${
              currentTpl.fontFamily === 'serif'
                ? 'font-serif'
                : currentTpl.fontFamily === 'mono'
                  ? 'font-mono'
                  : 'font-sans'
            }`}
          >
            {/* Document Header */}
            <div
              className={`border-b pb-4 space-y-1 ${
                currentTpl.layoutType === 'centered' ? 'text-center' : ''
              }`}
              style={{ borderBottomColor: currentTpl.borderColor }}
            >
              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ color: currentTpl.accentColor }}
              >
                {candidateName || 'Abdullah Montasser'}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {targetRole || 'Senior Full Stack Engineer'}
              </p>
              <div
                className={`flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1 ${
                  currentTpl.layoutType === 'centered' ? 'justify-center' : ''
                }`}
              >
                <span>contact@example.com</span>
                <span>•</span>
                <span>linkedin.com/in/profile</span>
                <span>•</span>
                <span>Cairo / Remote</span>
              </div>
            </div>

            {/* If skills-first layout, show skills here */}
            {currentTpl.layoutType === 'skills-first' && skills.length > 0 && (
              <div className="space-y-1.5">
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: currentTpl.accentColor }}
                >
                  {isArabic ? 'المهارات التقنية' : 'Core Technical Skills'}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 10).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded border border-border/70 bg-muted/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="space-y-1.5">
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: currentTpl.accentColor }}
                >
                  {isArabic ? 'الملخص المهني' : 'Professional Summary'}
                </h3>
                <p className="text-xs leading-relaxed opacity-90">{summary}</p>
              </div>
            )}

            {/* Experience Bullets */}
            {bullets.length > 0 && (
              <div className="space-y-2">
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: currentTpl.accentColor }}
                >
                  {isArabic
                    ? 'الخبرات المهنية والإنجازات (Google XYZ)'
                    : 'Key Experience & Quantified Metrics'}
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {bullets.slice(0, 5).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed opacity-90">
                      <span
                        className="select-none font-bold"
                        style={{ color: currentTpl.accentColor }}
                      >
                        •
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If standard layout, show skills here */}
            {currentTpl.layoutType !== 'skills-first' && skills.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: currentTpl.accentColor }}
                >
                  {isArabic ? 'المهارات التقنية' : 'Core Technical Skills'}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 10).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded border border-border/70 bg-muted/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>{isArabic ? currentTpl.nameAr : currentTpl.nameEn}</span>
            </span>
            <span className="text-muted-foreground text-[10px] hidden sm:inline">
              ({currentTpl.traitsEn})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs cursor-pointer">
              {isArabic ? 'إلغاء' : 'Close'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onDownload()
                onClose()
              }}
              disabled={isDownloading}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isArabic ? 'تحميل السيرة الآن' : 'Download Resume PDF'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
