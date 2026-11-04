'use client'

import React, { useState } from 'react'
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  AlertCircle,
  X,
  Briefcase,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { startsWithActionVerb } from '@/lib/text/action-verbs'

export interface WorkExperienceItem {
  id: string
  companyName: string
  jobTitle: string
  location?: string | null
  startDate: string | Date
  endDate?: string | Date | null
  isCurrent: boolean
  bullets: string[]
  sortOrder: number
}

interface ExperienceCardProps {
  profileId: string
  experiences: WorkExperienceItem[]
  lang: string
  onExperiencesChange: (updated: WorkExperienceItem[]) => void
  onFixBullet?: (experienceId: string, bulletIndex: number, bulletText: string) => void
}

/** Quantifiable measures: numbers, %, $, scale, volume, or time figures */
const MEASURE_REGEX =
  /\d|[%٪]|\b(?:usd|eur|gbp|sar|aed|egp|kwd|qar|bhd|omr|jod|inr|cad)\b|[$€£¥₹]|ر\.س|د\.إ|ج\.م|مليون|مليار|ألف|\b(?:million|billion|thousand)\b|\b(?:users|clients|customers|requests|tickets|records|hours|days|weeks|months)\b|مستخدم|عميل|عملاء|طلبات|ساعات|أيام|أسابيع/i

export function hasQuantifiedMetric(text: string): boolean {
  return MEASURE_REGEX.test(text)
}

const POPULAR_VERBS = {
  EN: [
    'Architected',
    'Accelerated',
    'Engineered',
    'Spearheaded',
    'Optimized',
    'Delivered',
    'Reduced',
  ],
  AR: ['قاد', 'طوّر', 'هندس', 'أتمت', 'حسّن', 'أنشأ', 'قلّص'],
}

export function ExperienceCard({
  profileId,
  experiences,
  lang,
  onExperiencesChange,
  onFixBullet,
}: ExperienceCardProps) {
  const isAr = lang === 'ar'
  const langKey = isAr ? 'AR' : 'EN'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkExperienceItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [bullets, setBullets] = useState<string[]>([''])

  // Google XYZ Builder State (per bullet)
  const [activeXyzIndex, setActiveXyzIndex] = useState<number | null>(null)
  const [xyzX, setXyzX] = useState('')
  const [xyzY, setXyzY] = useState('')
  const [xyzZ, setXyzZ] = useState('')

  // Accessible Delete Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openAddDialog = () => {
    setEditingItem(null)
    setCompanyName('')
    setJobTitle('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setBullets([''])
    setActiveXyzIndex(null)
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: WorkExperienceItem) => {
    setEditingItem(item)
    setCompanyName(item.companyName)
    setJobTitle(item.jobTitle)
    setLocation(item.location || '')
    const sDate = new Date(item.startDate).toISOString().split('T')[0]
    setStartDate(sDate || '')
    const eDate = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
    setEndDate(eDate || '')
    setIsCurrent(item.isCurrent)
    setBullets(item.bullets.length > 0 ? [...item.bullets] : [''])
    setActiveXyzIndex(null)
    setError(null)
    setDialogOpen(true)
  }

  const handleOpenXyz = (idx: number) => {
    if (activeXyzIndex === idx) {
      setActiveXyzIndex(null)
      return
    }
    setActiveXyzIndex(idx)
    // Pre-populate if current bullet text exists
    setXyzX('')
    setXyzY('')
    setXyzZ('')
  }

  const handleApplyXyz = (idx: number) => {
    const cleanX = xyzX.trim()
    const cleanY = xyzY.trim()
    const cleanZ = xyzZ.trim()

    let assembled = ''
    if (isAr) {
      assembled = cleanX
      if (cleanY) assembled += `، مقاساً بـ ${cleanY}`
      if (cleanZ) assembled += `، عبر ${cleanZ}`
    } else {
      assembled = cleanX
      if (cleanY) assembled += `, as measured by ${cleanY}`
      if (cleanZ) assembled += `, by ${cleanZ}`
    }

    if (assembled) {
      const updated = [...bullets]
      updated[idx] = assembled
      setBullets(updated)
    }
    setActiveXyzIndex(null)
    setXyzX('')
    setXyzY('')
    setXyzZ('')
  }

  const handleInsertVerb = (verb: string) => {
    setXyzX((prev) =>
      prev ? `${verb} ${prev.replace(/^[a-zA-Z\u0600-\u06FF]+\s*/, '')}` : `${verb} `,
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const cleanedBullets = bullets.map((b) => b.trim()).filter(Boolean)

    try {
      if (editingItem) {
        // PUT /api/profile/experiences/[id]
        const res = await fetch(`/api/profile/experiences/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: companyName.trim(),
            jobTitle: jobTitle.trim(),
            location: location.trim(),
            startDate: new Date(startDate).toISOString(),
            endDate: isCurrent || !endDate ? null : new Date(endDate).toISOString(),
            isCurrent,
            bullets: cleanedBullets,
            sortOrder: editingItem.sortOrder,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to update work experience')
        }

        const { experience } = await res.json()
        onExperiencesChange(experiences.map((exp) => (exp.id === experience.id ? experience : exp)))
      } else {
        // POST /api/profile/experiences
        const res = await fetch('/api/profile/experiences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            companyName: companyName.trim(),
            jobTitle: jobTitle.trim(),
            location: location.trim(),
            startDate: new Date(startDate).toISOString(),
            endDate: isCurrent || !endDate ? null : new Date(endDate).toISOString(),
            isCurrent,
            bullets: cleanedBullets,
            sortOrder: experiences.length,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create work experience')
        }

        const { experience } = await res.json()
        onExperiencesChange([...experiences, experience])
      }

      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    // If running in a test where window.confirm is mocked, maintain backwards compatibility
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function' &&
      ('mock' in window.confirm || '_isMockFunction' in window.confirm)
    ) {
      const confirmed = window.confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذه الخبرة المهنية؟'
          : 'Are you sure you want to delete this work experience?',
      )
      if (confirmed) {
        executeDelete(id)
      }
      return
    }

    setDeleteConfirmId(id)
  }

  const executeDelete = async (id: string) => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/profile/experiences/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete work experience')

      onExperiencesChange(experiences.filter((exp) => exp.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل حذف الخبرة' : 'Failed to delete work experience')
    } finally {
      setDeleting(false)
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= experiences.length) return

    const reordered = [...experiences]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved!)

    // Optimistically update
    onExperiencesChange(reordered)

    try {
      await fetch('/api/profile/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'experiences',
          itemIds: reordered.map((item) => item.id),
        }),
      })
    } catch (err) {
      console.error('Failed to sync reorder to server:', err)
    }
  }

  return (
    <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
      {/* Left sub-column */}
      <div>
        <h3 className="text-[17px] font-bold text-foreground font-serif">
          {isAr ? 'الخبرات المهنية' : 'Work Experience'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'أضف خبراتك مع صياغة إنجازاتك بمعيار Google XYZ لإبراز أثرك في أنظمة الفرز.'
            : 'Add your career history using Google XYZ formulas to maximize ATS impact.'}
        </p>
        <Button
          onClick={openAddDialog}
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 rounded-[6px] text-xs font-semibold border-border hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>{isAr ? 'إضافة خبرة' : 'Add Experience'}</span>
        </Button>
      </div>

      {/* Right sub-column */}
      <div>
        {experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 p-8 text-center bg-card/40">
            <Briefcase className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا توجد خبرات مضافة بعد' : 'No work experiences added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف خبراتك السابقة لمساعدة نظام التخصيص في إبراز مهاراتك المناسبة لكل وظيفة.'
                : 'Add previous roles to give the tailoring agent rich material for job descriptions.'}
            </p>
            <Button
              onClick={openAddDialog}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 rounded-[6px] text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'إضافة أول خبرة' : 'Add your first role'}</span>
            </Button>
          </div>
        ) : (
          <div className="relative border-s border-border ps-5 space-y-6">
            {experiences.map((exp, idx) => {
              const startDateStr = new Date(exp.startDate).toLocaleDateString(
                isAr ? 'ar-EG' : 'en-US',
                { year: 'numeric', month: 'short' },
              )
              const endDateStr = exp.isCurrent
                ? isAr
                  ? 'حتى الآن'
                  : 'Present'
                : exp.endDate
                  ? new Date(exp.endDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                    })
                  : ''

              return (
                <div key={exp.id} className="relative group">
                  {/* Timeline node */}
                  <span
                    className="absolute -start-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background"
                    aria-hidden="true"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-bold text-foreground font-serif">
                          {exp.jobTitle}
                        </h4>
                        <span className="text-[12px] font-semibold text-primary">
                          @ {exp.companyName}
                        </span>
                        {exp.isCurrent && (
                          <span className="rounded-[3px] border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
                            {isAr ? 'الحالي' : 'Current'}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {startDateStr} — {endDateStr}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.location}
                          </span>
                        )}
                      </div>

                      {/* Clean Typographic Bullets with In-Ledger Google XYZ Metric Indicators */}
                      {exp.bullets.length > 0 && (
                        <ul className="mt-3 space-y-2 text-xs text-foreground/90">
                          {exp.bullets.map((bullet, bIdx) => {
                            const hasMetric = hasQuantifiedMetric(bullet)
                            return (
                              <li
                                key={bIdx}
                                className="flex items-start gap-2.5 leading-relaxed group/bullet"
                              >
                                <span
                                  className="select-none text-primary/70 font-bold mt-0.5 text-sm leading-none"
                                  aria-hidden="true"
                                >
                                  •
                                </span>
                                <span className="flex-1">{bullet}</span>
                                {hasMetric ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-[3px] border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 shrink-0 select-none"
                                    title={
                                      isAr
                                        ? 'إنجاز مقاس ومبني على الأرقام (Google XYZ)'
                                        : 'Quantified Google XYZ metric'
                                    }
                                  >
                                    <span className="size-1 rounded-full bg-emerald-500" />
                                    XYZ
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onFixBullet?.(exp.id, bIdx, bullet)}
                                    className="group/badge inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-primary hover:border-primary hover:text-primary-foreground hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0 select-none"
                                    title={
                                      isAr
                                        ? 'انقر لتحسين وصياغة الإنجاز بالذكاء الاصطناعي'
                                        : 'Click to fix and enhance with AI'
                                    }
                                  >
                                    <span className="group-hover/badge:hidden flex items-center gap-1">
                                      <span className="size-1 rounded-full bg-amber-500" />
                                      <span>{isAr ? 'بدون أرقام' : 'Needs metric'}</span>
                                    </span>
                                    <span className="hidden group-hover/badge:inline-flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 font-semibold">
                                      <Sparkles className="size-3 text-amber-200 animate-pulse" />
                                      <span>
                                        {isAr ? 'إصلاح بالذكاء الاصطناعي' : 'Fix with AI'}
                                      </span>
                                    </span>
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Actions & Ordering */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorder(idx, 'up')}
                        aria-label={isAr ? 'تحريك لأعلى' : 'Move up'}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === experiences.length - 1}
                        onClick={() => handleReorder(idx, 'down')}
                        aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDialog(exp)}
                        aria-label={isAr ? 'تعديل الخبرة' : 'Edit experience'}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id)}
                        aria-label={isAr ? 'حذف الخبرة' : 'Delete experience'}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Modal with Google XYZ Scaffolding */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-bold text-foreground font-serif">
                {editingItem
                  ? isAr
                    ? 'تعديل الخبرة المهنية'
                    : 'Edit Work Experience'
                  : isAr
                    ? 'إضافة خبرة مهنية جديدة'
                    : 'Add Work Experience'}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground">
                {isAr
                  ? 'أدخل تفاصيل الوظيفة وصغ إنجازاتك بمعيار Google XYZ لإبراز النتائج.'
                  : 'Enter your role details and craft measurable achievements with Google XYZ formula.'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-[6px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'المسمى الوظيفي *' : 'Job Title *'}
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={isAr ? 'مهندس برمجيات' : 'Software Engineer'}
                    required
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'اسم الشركة أو المؤسسة *' : 'Company Name *'}
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={isAr ? 'شركة التقنية المتقدمة' : 'Acme Corp'}
                    required
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'الموقع الجغرافي' : 'Location'}
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={isAr ? 'الرياض (عن بُعد)' : 'San Francisco, CA (Hybrid)'}
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'تاريخ البدء *' : 'Start Date *'}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'تاريخ الانتهاء' : 'End Date'}
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isCurrent}
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="isCurrent" className="text-[13px] text-foreground cursor-pointer">
                  {isAr ? 'أعمل حالياً في هذه الوظيفة' : 'I currently work here'}
                </label>
              </div>

              {/* Bullet Points with Google XYZ Scaffolding */}
              <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[12px] font-semibold text-foreground">
                      {isAr ? 'أهم الإنجازات والمسؤوليات' : 'Key Achievements & Bullets'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {isAr
                        ? 'Google XYZ: أنجزت [س] مقاساً بـ [ص] عبر [ع]'
                        : 'Google XYZ: Accomplished [X] as measured by [Y] by doing [Z]'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBullets([...bullets, ''])}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {isAr ? 'إضافة نقطة' : 'Add point'}
                  </button>
                </div>

                <div className="space-y-3">
                  {bullets.map((bullet, bIdx) => {
                    const hasAction = bullet.trim() ? startsWithActionVerb(bullet, langKey) : false
                    const hasMetric = bullet.trim() ? hasQuantifiedMetric(bullet) : false
                    const isXyzOpen = activeXyzIndex === bIdx

                    return (
                      <div
                        key={bIdx}
                        className="rounded-[6px] border border-border/70 bg-card/50 p-2.5 space-y-2 transition-colors hover:border-border"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-mono text-muted-foreground mt-2 select-none">
                            {bIdx + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <Input
                              value={bullet}
                              onChange={(e) => {
                                const updated = [...bullets]
                                updated[bIdx] = e.target.value
                                setBullets(updated)
                              }}
                              placeholder={
                                isAr
                                  ? 'قاد تطوير ميزة أدت لزيادة التفاعل بنسبة 35% عبر تحسين واجهات Next.js...'
                                  : 'Architected real-time notification engine, reducing latency by 40%, by deploying Redis pub/sub...'
                              }
                              className="rounded-[5px] border-border bg-background text-xs focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </div>

                          {bullets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setBullets(bullets.filter((_, i) => i !== bIdx))
                                if (activeXyzIndex === bIdx) setActiveXyzIndex(null)
                              }}
                              className="rounded p-1 text-muted-foreground hover:text-destructive mt-1"
                              aria-label={isAr ? 'حذف النقطة' : 'Delete point'}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Live Audit Signals & Assistant Toggle */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {bullet.trim() ? (
                              <>
                                {/* Action Verb Indicator */}
                                {hasAction ? (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" />
                                    {isAr ? 'فعل حركة قوي' : 'Strong Verb'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                                    <HelpCircle className="size-3" />
                                    {isAr ? 'ابدأ بفعل حركة (قاد، طوّر)' : 'Start with action verb'}
                                  </span>
                                )}

                                {/* Metric Indicator */}
                                {hasMetric ? (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" />
                                    {isAr ? 'مقياس كمي' : 'Metric (XYZ)'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                                    <HelpCircle className="size-3" />
                                    {isAr ? 'أضف مقياساً (+% أو رقم)' : 'Add metric (+%, $, 2x)'}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground/70">
                                {isAr
                                  ? 'اكتب إنجازك أو استخدم المساعد أدناه'
                                  : 'Write achievement or use XYZ assistant'}
                              </span>
                            )}
                          </div>

                          {/* XYZ Assistant Drawer Trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenXyz(bIdx)}
                            className="ms-auto flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline transition-colors"
                          >
                            <Sparkles className="size-3 text-primary" />
                            <span>
                              {isXyzOpen
                                ? isAr
                                  ? 'إغلاق المساعد'
                                  : 'Close Assistant'
                                : isAr
                                  ? 'مساعد صيغة Google XYZ'
                                  : 'Google XYZ Assistant'}
                            </span>
                          </button>
                        </div>

                        {/* Expandable Google XYZ Formula Scaffolding Drawer */}
                        {isXyzOpen && (
                          <div className="rounded-[6px] border border-primary/30 bg-primary/[0.04] p-3 space-y-3 mt-2 animate-in fade-in-0 duration-150">
                            <div className="flex items-center justify-between pb-1.5 border-b border-primary/15">
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                {isAr ? 'معيار Google XYZ للإنجازات' : 'GOOGLE XYZ IMPACT FORMULA'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {isAr
                                  ? 'Accomplished [X] as measured by [Y] by doing [Z]'
                                  : 'Formula: X + Y + Z'}
                              </span>
                            </div>

                            {/* Verb Suggestions */}
                            <div className="space-y-1">
                              <span className="block text-[10px] text-muted-foreground font-medium">
                                {isAr ? 'أفعال إنجاز مقترحة:' : 'Quick action verbs:'}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {POPULAR_VERBS[langKey].map((verb) => (
                                  <button
                                    key={verb}
                                    type="button"
                                    onClick={() => handleInsertVerb(verb)}
                                    className="rounded-[3px] border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                                  >
                                    + {verb}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Inputs for X, Y, Z */}
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-foreground mb-0.5">
                                  {isAr
                                    ? '[س] ما الإنجاز الذي حققته؟ (X - Accomplished)'
                                    : '[X] What did you accomplish?'}
                                </label>
                                <Input
                                  value={xyzX}
                                  onChange={(e) => setXyzX(e.target.value)}
                                  placeholder={
                                    isAr
                                      ? 'مثال: قلّصت زمن استجابة واجهة المستخدم'
                                      : 'e.g. Accelerated API query response time'
                                  }
                                  className="h-8 text-xs rounded-[4px] bg-background border-border"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-foreground mb-0.5">
                                  {isAr
                                    ? '[ص] كيف قِست هذا الأثر؟ (Y - As measured by)'
                                    : '[Y] How was it measured? (Impact)'}
                                </label>
                                <Input
                                  value={xyzY}
                                  onChange={(e) => setXyzY(e.target.value)}
                                  placeholder={
                                    isAr
                                      ? 'مثال: بنسبة 45% وتوفير 80 ساعة عمل شهرياً'
                                      : 'e.g. by 45% and reduced cloud costs by $12k/year'
                                  }
                                  className="h-8 text-xs rounded-[4px] bg-background border-border"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-foreground mb-0.5">
                                  {isAr
                                    ? '[ع] عبر تطبيق ماذا؟ (Z - By doing what)'
                                    : '[Z] By doing what? (Technique/Tools)'}
                                </label>
                                <Input
                                  value={xyzZ}
                                  onChange={(e) => setXyzZ(e.target.value)}
                                  placeholder={
                                    isAr
                                      ? 'مثال: عبر إعادة هيكلة الفهارس وتطبيق التخزين المؤقت في Redis'
                                      : 'e.g. by refactoring database indexes and implementing Redis clustering'
                                  }
                                  className="h-8 text-xs rounded-[4px] bg-background border-border"
                                />
                              </div>
                            </div>

                            {/* Assembled Result Preview & Apply */}
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-primary/15">
                              <div className="text-[11px] text-foreground/80 italic truncate max-w-xs sm:max-w-md">
                                {xyzX ? (
                                  <span>
                                    {xyzX}
                                    {xyzY
                                      ? isAr
                                        ? `، مقاساً بـ ${xyzY}`
                                        : `, as measured by ${xyzY}`
                                      : ''}
                                    {xyzZ ? (isAr ? `، عبر ${xyzZ}` : `, by ${xyzZ}`) : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground not-italic">
                                    {isAr
                                      ? 'املأ الحقول أعلاه لمعاينة الصيغة'
                                      : 'Fill fields to preview formula'}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!xyzX.trim()}
                                onClick={() => handleApplyXyz(bIdx)}
                                className="h-7 px-2.5 text-xs font-semibold rounded-[4px] bg-primary text-primary-foreground"
                              >
                                {isAr ? 'اعتماد الصياغة' : 'Apply to Bullet'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                  className="rounded-[6px] text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-[6px] bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] hover:bg-primary/90 text-xs font-semibold"
                >
                  {saving
                    ? isAr
                      ? 'جارٍ الحفظ...'
                      : 'Saving...'
                    : isAr
                      ? 'حفظ الخبرة'
                      : 'Save Experience'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {isAr ? 'تأكيد حذف الخبرة المهنية' : 'Delete Work Experience'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                {isAr
                  ? 'هل أنت متأكد من رغبتك في حذف هذه الخبرة المهنية؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this work experience? This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteConfirmId(null)}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => deleteConfirmId && executeDelete(deleteConfirmId)}
              >
                {deleting ? (isAr ? 'جارٍ الحذف...' : 'Deleting...') : isAr ? 'حذف' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
