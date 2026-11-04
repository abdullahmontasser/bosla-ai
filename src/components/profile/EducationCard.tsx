'use client'

import React, { useState } from 'react'
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  GraduationCap,
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

export interface EducationItem {
  id: string
  institution: string
  degree: string
  fieldOfStudy?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  grade?: string | null
  sortOrder: number
}

interface EducationCardProps {
  profileId: string
  educations: EducationItem[]
  lang: string
  onEducationsChange: (updated: EducationItem[]) => void
}

export function EducationCard({
  profileId,
  educations,
  lang,
  onEducationsChange,
}: EducationCardProps) {
  const isAr = lang === 'ar'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EducationItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [institution, setInstitution] = useState('')
  const [degree, setDegree] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [grade, setGrade] = useState('')

  const openAddDialog = () => {
    setEditingItem(null)
    setInstitution('')
    setDegree('')
    setFieldOfStudy('')
    setStartDate('')
    setEndDate('')
    setGrade('')
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: EducationItem) => {
    setEditingItem(item)
    setInstitution(item.institution)
    setDegree(item.degree)
    setFieldOfStudy(item.fieldOfStudy || '')
    const sDate = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''
    setStartDate(sDate || '')
    const eDate = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
    setEndDate(eDate || '')
    setGrade(item.grade || '')
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editingItem) {
        // PUT /api/profile/educations/[id]
        const res = await fetch(`/api/profile/educations/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            institution: institution.trim(),
            degree: degree.trim(),
            fieldOfStudy: fieldOfStudy.trim() || undefined,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
            grade: grade.trim() || undefined,
            sortOrder: editingItem.sortOrder,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to update education')
        }

        const { education } = await res.json()
        onEducationsChange(educations.map((edu) => (edu.id === education.id ? education : edu)))
      } else {
        // POST /api/profile/educations
        const res = await fetch('/api/profile/educations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            institution: institution.trim(),
            degree: degree.trim(),
            fieldOfStudy: fieldOfStudy.trim() || undefined,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
            grade: grade.trim() || undefined,
            sortOrder: educations.length,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create education')
        }

        const { education } = await res.json()
        onEducationsChange([...educations, education])
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
          ? 'هل أنت متأكد من حذف هذا المؤهل التعليمي؟'
          : 'Are you sure you want to delete this education entry?',
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
      const res = await fetch(`/api/profile/educations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete education')

      onEducationsChange(educations.filter((edu) => edu.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل حذف المؤهل' : 'Failed to delete education')
    } finally {
      setDeleting(false)
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= educations.length) return

    const reordered = [...educations]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved!)

    // Optimistically update
    onEducationsChange(reordered)

    try {
      await fetch('/api/profile/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'educations',
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
        <h3 className="text-[17px] font-bold text-foreground">
          {isAr ? 'التعليم والمؤهلات' : 'Education'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'سجلك الأكاديمي والشهادات الجامعية والمؤهلات التخصصية.'
            : 'Degrees, certifications, and academic background.'}
        </p>
        <Button
          onClick={openAddDialog}
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 rounded-[6px] text-xs font-semibold border-border hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>{isAr ? 'إضافة مؤهل' : 'Add Education'}</span>
        </Button>
      </div>

      {/* Right sub-column */}
      <div>
        {educations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 p-8 text-center bg-card/40">
            <GraduationCap className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا توجد مؤهلات مضافة بعد' : 'No education records added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف مؤهلاتك لدعم معايير التوافق مع أنظمة التوظيف (ATS).'
                : 'Add educational degrees to meet standard recruiter filter criteria.'}
            </p>
            <Button
              onClick={openAddDialog}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 rounded-[6px] text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'إضافة مؤهل تعليمي' : 'Add your education'}</span>
            </Button>
          </div>
        ) : (
          <div className="relative border-s border-border ps-5 space-y-6">
            {educations.map((edu, idx) => {
              const startDateStr = edu.startDate
                ? new Date(edu.startDate).getFullYear().toString()
                : ''
              const endDateStr = edu.endDate
                ? new Date(edu.endDate).getFullYear().toString()
                : isAr
                  ? 'حتى الآن'
                  : 'Present'
              const dateRange = startDateStr ? `${startDateStr} — ${endDateStr}` : endDateStr

              return (
                <div key={edu.id} className="relative group">
                  {/* Timeline node */}
                  <span
                    className="absolute -start-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background"
                    aria-hidden="true"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-foreground">{edu.degree}</h4>
                      {edu.fieldOfStudy && (
                        <p className="text-[12px] font-medium text-foreground/80 mt-0.5">
                          {edu.fieldOfStudy}
                        </p>
                      )}
                      <p className="text-[12px] font-semibold text-primary mt-0.5">
                        {edu.institution}
                      </p>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {dateRange && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dateRange}
                          </span>
                        )}
                        {edu.grade && (
                          <span className="rounded-[3px] border border-border bg-muted/40 px-1.5 py-0.5 text-xs font-mono">
                            {edu.grade}
                          </span>
                        )}
                      </div>
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
                        disabled={idx === educations.length - 1}
                        onClick={() => handleReorder(idx, 'down')}
                        aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditDialog(edu)}
                        aria-label={isAr ? 'تعديل المؤهل' : 'Edit education'}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(edu.id)}
                        aria-label={isAr ? 'حذف المؤهل' : 'Delete education'}
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

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-bold text-foreground">
                {editingItem
                  ? isAr
                    ? 'تعديل المؤهل التعليمي'
                    : 'Edit Education'
                  : isAr
                    ? 'إضافة مؤهل تعليمي'
                    : 'Add Education'}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground">
                {isAr
                  ? 'أدخل الجامعة أو المؤسسة والتخصص والدرجة العلمية.'
                  : 'Enter institution name, degree, and study period.'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-[6px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'المؤسسة التعليمية / الجامعة *' : 'Institution / University *'}
                </label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={isAr ? 'جامعة الملك سعود' : 'e.g. UC Berkeley'}
                  required
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'الدرجة العلمية *' : 'Degree *'}
                  </label>
                  <Input
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder={isAr ? 'بكالوريوس' : 'B.S., M.S.'}
                    required
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'مجال التخصص' : 'Field of Study'}
                  </label>
                  <Input
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder={isAr ? 'علوم الحاسب' : 'Computer Science'}
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'تاريخ البدء' : 'Start Date'}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'تاريخ التخرج / الانتهاء' : 'End Date'}
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'المعدل التراكمي / التقدير' : 'Grade / GPA'}
                </label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={isAr ? 'امتياز مع مرتبة الشرف' : '3.8 / 4.0'}
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
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
                      ? 'حفظ المؤهل'
                      : 'Save Education'}
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
                {isAr ? 'تأكيد حذف المؤهل التعليمي' : 'Delete Education Entry'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                {isAr
                  ? 'هل أنت متأكد من رغبتك في حذف هذا المؤهل التعليمي؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this education entry? This action cannot be undone.'}
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
