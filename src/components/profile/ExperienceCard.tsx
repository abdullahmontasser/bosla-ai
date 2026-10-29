'use client'

import React, { useState } from 'react'
import {
  Briefcase,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  AlertCircle,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
}

export function ExperienceCard({
  profileId,
  experiences,
  lang,
  onExperiencesChange,
}: ExperienceCardProps) {
  const isAr = lang === 'ar'

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

  const openAddDialog = () => {
    setEditingItem(null)
    setCompanyName('')
    setJobTitle('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setBullets([''])
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
    setError(null)
    setDialogOpen(true)
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

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذه الخبرة المهنية؟'
          : 'Are you sure you want to delete this work experience?',
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/profile/experiences/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete work experience')

      onExperiencesChange(experiences.filter((exp) => exp.id !== id))
    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل حذف الخبرة' : 'Failed to delete work experience')
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
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-[17px] font-bold text-foreground">
              {isAr ? 'الخبرات المهنية' : 'Work Experience'}
            </CardTitle>
          </div>
          <CardDescription className="text-[13px] text-muted-foreground mt-1">
            {isAr
              ? 'أضف خبراتك مع ترتيبها وإنجازاتك المقاسة لدعم التخصيص التلقائي.'
              : 'Add your career history with measurable achievements and explicit ordering.'}
          </CardDescription>
        </div>
        <Button onClick={openAddDialog} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة خبرة' : 'Add Experience'}
        </Button>
      </CardHeader>

      <CardContent>
        {experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border/70 p-8 text-center bg-card/40">
            <Briefcase className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا توجد خبرات مضافة بعد' : 'No work experiences added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف خبراتك السابقة لمساعدة نظام التخصيص في إبراز مهاراتك المناسبة لكل وظيفة.'
                : 'Add previous roles to give the tailoring agent rich material for job descriptions.'}
            </p>
            <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة أول خبرة' : 'Add your first role'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
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
                <div
                  key={exp.id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[10px] border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] font-bold text-foreground truncate">
                        {exp.jobTitle}
                      </h4>
                      <span className="text-[12px] font-medium text-primary">
                        @ {exp.companyName}
                      </span>
                      {exp.isCurrent && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {isAr ? 'الحالي' : 'Current'}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
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

                    {exp.bullets.length > 0 && (
                      <ul className="mt-2.5 space-y-1 list-disc list-inside text-[12px] text-muted-foreground/90">
                        {exp.bullets.slice(0, 2).map((bullet, bIdx) => (
                          <li key={bIdx} className="truncate">
                            {bullet}
                          </li>
                        ))}
                        {exp.bullets.length > 2 && (
                          <li className="list-none text-[11px] font-medium text-primary/80">
                            +{exp.bullets.length - 2} {isAr ? 'نقاط إضافية' : 'more bullet points'}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Actions & Ordering */}
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, 'up')}
                      aria-label={isAr ? 'تحريك لأعلى' : 'Move up'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === experiences.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditDialog(exp)}
                      aria-label={isAr ? 'تعديل الخبرة' : 'Edit experience'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id)}
                      aria-label={isAr ? 'حذف الخبرة' : 'Delete experience'}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-bold text-foreground">
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
                  ? 'أدخل تفاصيل الوظيفة والشركة وإنجازاتك بصيغة مقاسة.'
                  : 'Enter your role details and measurable achievements.'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
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

              {/* Bullet Points */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-foreground">
                    {isAr ? 'أهم الإنجازات والمسؤوليات' : 'Key Achievements & Bullets'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setBullets([...bullets, ''])}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {isAr ? 'إضافة نقطة' : 'Add point'}
                  </button>
                </div>

                <div className="space-y-2">
                  {bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...bullets]
                          updated[bIdx] = e.target.value
                          setBullets(updated)
                        }}
                        placeholder={
                          isAr
                            ? 'قاد تطوير ميزة زادت تفاعل المستخدمين بنسبة 35%...'
                            : 'Architected real-time notification engine reducing latency by 40%...'
                        }
                      />
                      {bullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBullets(bullets.filter((_, i) => i !== bIdx))}
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                          aria-label={isAr ? 'حذف النقطة' : 'Delete point'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={saving}>
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
      </CardContent>
    </Card>
  )
}
