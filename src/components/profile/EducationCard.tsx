'use client'

import React, { useState } from 'react'
import {
  GraduationCap,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
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

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isAr
          ? 'هل أنت متأكد من حذف هذا المؤهل التعليمي؟'
          : 'Are you sure you want to delete this education record?',
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/profile/educations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete education')

      onEducationsChange(educations.filter((edu) => edu.id !== id))
    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل حذف المؤهل' : 'Failed to delete education')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= educations.length) return

    const reordered = [...educations]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved!)

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
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-[17px] font-bold text-foreground">
              {isAr ? 'التعليم والمؤهلات' : 'Education'}
            </CardTitle>
          </div>
          <CardDescription className="text-[13px] text-muted-foreground mt-1">
            {isAr
              ? 'الدرجات العلمية والجامعات والشهادات التخصصية.'
              : 'Degrees, colleges, and academic certifications.'}
          </CardDescription>
        </div>
        <Button onClick={openAddDialog} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مؤهل' : 'Add Education'}
        </Button>
      </CardHeader>

      <CardContent>
        {educations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border/70 p-8 text-center bg-card/40">
            <GraduationCap className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا يوجد تعليم مضاف بعد' : 'No education records added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف درجتك العلمية أو شهاداتك الأكاديمية لإكمال ملفك التعريفي.'
                : 'Add university degrees and academic credentials to strengthen your ATS rating.'}
            </p>
            <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة أول مؤهل' : 'Add your first degree'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {educations.map((edu, idx) => {
              const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : null
              const endYear = edu.endDate ? new Date(edu.endDate).getFullYear() : null

              return (
                <div
                  key={edu.id}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[10px] border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] font-bold text-foreground truncate">
                        {edu.degree}
                      </h4>
                      {edu.fieldOfStudy && (
                        <span className="text-[13px] text-muted-foreground">
                          — {edu.fieldOfStudy}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[12px] text-primary flex-wrap font-medium">
                      <span>{edu.institution}</span>
                      {edu.grade && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground font-normal">
                          {edu.grade}
                        </span>
                      )}
                    </div>

                    {(startYear || endYear) && (
                      <div className="mt-1 flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {startYear ? `${startYear} ` : ''}
                          {endYear ? `— ${endYear}` : ''}
                        </span>
                      </div>
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
                      disabled={idx === educations.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditDialog(edu)}
                      aria-label={isAr ? 'تعديل المؤهل' : 'Edit education'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(edu.id)}
                      aria-label={isAr ? 'حذف المؤهل' : 'Delete education'}
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
                  ? 'أدخل الجامعة أو المعهد والدرجة العلمية وتاريخ التخرج.'
                  : 'Enter institution, degree, major, and graduation year.'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'الجامعة أو المؤسسة التعليمية *' : 'Institution *'}
                </label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={isAr ? 'جامعة الملك سعود' : 'Stanford University'}
                  required
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
                    placeholder={isAr ? 'بكالوريوس' : 'B.S.'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'التخصص الدراسي' : 'Field of Study'}
                  </label>
                  <Input
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder={isAr ? 'علوم الحاسب' : 'Computer Science'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'سنة البدء' : 'Start Date'}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {isAr ? 'سنة التخرج' : 'Graduation Date'}
                  </label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'المعدل / التقدير (اختياري)' : 'Grade / GPA (Optional)'}
                </label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={isAr ? 'امتياز مع مرتبة الشرف (3.9 / 4.0)' : '3.85 / 4.0 GPA'}
                />
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
                      ? 'حفظ المؤهل'
                      : 'Save Education'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
