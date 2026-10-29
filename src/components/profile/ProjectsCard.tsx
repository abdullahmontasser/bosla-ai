'use client'

import React, { useState } from 'react'
import {
  FolderGit2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export interface ProjectItem {
  id: string
  name: string
  description: string
  role?: string | null
  technologies: string[]
  url?: string | null
  sortOrder: number
}

interface ProjectsCardProps {
  profileId: string
  projects: ProjectItem[]
  lang: string
  onProjectsChange: (updated: ProjectItem[]) => void
}

export function ProjectsCard({ profileId, projects, lang, onProjectsChange }: ProjectsCardProps) {
  const isAr = lang === 'ar'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [techInput, setTechInput] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])

  const openAddDialog = () => {
    setEditingItem(null)
    setName('')
    setDescription('')
    setRole('')
    setUrl('')
    setTechInput('')
    setTechnologies([])
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: ProjectItem) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description)
    setRole(item.role || '')
    setUrl(item.url || '')
    setTechInput('')
    setTechnologies([...item.technologies])
    setError(null)
    setDialogOpen(true)
  }

  const handleAddTech = () => {
    if (!techInput.trim()) return
    if (!technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()])
    }
    setTechInput('')
  }

  const handleRemoveTech = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editingItem) {
        // PUT /api/profile/projects/[id]
        const res = await fetch(`/api/profile/projects/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            role: role.trim() || undefined,
            technologies,
            url: url.trim() || undefined,
            sortOrder: editingItem.sortOrder,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to update project')
        }

        const { project } = await res.json()
        onProjectsChange(projects.map((proj) => (proj.id === project.id ? project : proj)))
      } else {
        // POST /api/profile/projects
        const res = await fetch('/api/profile/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            name: name.trim(),
            description: description.trim(),
            role: role.trim() || undefined,
            technologies,
            url: url.trim() || undefined,
            sortOrder: projects.length,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create project')
        }

        const { project } = await res.json()
        onProjectsChange([...projects, project])
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
        isAr ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?',
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/profile/projects/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete project')

      onProjectsChange(projects.filter((proj) => proj.id !== id))
    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل حذف المشروع' : 'Failed to delete project')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= projects.length) return

    const reordered = [...projects]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved!)

    onProjectsChange(reordered)

    try {
      await fetch('/api/profile/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'projects',
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
            <FolderGit2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-[17px] font-bold text-foreground">
              {isAr ? 'المشاريع البارزة' : 'Featured Projects'}
            </CardTitle>
          </div>
          <CardDescription className="text-[13px] text-muted-foreground mt-1">
            {isAr
              ? 'مشاريع عملية ونماذج تبرز قدراتك التقنية وحلولك الواقعية.'
              : 'Practical initiatives, case studies, and open-source contributions.'}
          </CardDescription>
        </div>
        <Button onClick={openAddDialog} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مشروع' : 'Add Project'}
        </Button>
      </CardHeader>

      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border/70 p-8 text-center bg-card/40">
            <FolderGit2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا توجد مشاريع مضافة بعد' : 'No projects added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف مشاريعك البرمجية والحلول التي قمت ببنائها لإثراء سيرتك الذاتية.'
                : 'Showcase hands-on projects, technologies used, and deployment links.'}
            </p>
            <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة أول مشروع' : 'Add your first project'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((proj, idx) => (
              <div
                key={proj.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[10px] border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[14px] font-bold text-foreground truncate">{proj.name}</h4>
                    {proj.role && (
                      <span className="text-[12px] font-medium text-primary">({proj.role})</span>
                    )}
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{isAr ? 'رابط المشروع' : 'View Project'}</span>
                      </a>
                    )}
                  </div>

                  <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">
                    {proj.description}
                  </p>

                  {proj.technologies.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {proj.technologies.map((tech, tIdx) => (
                        <Badge key={tIdx} variant="secondary" className="text-[10px]">
                          {tech}
                        </Badge>
                      ))}
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
                    disabled={idx === projects.length - 1}
                    onClick={() => handleReorder(idx, 'down')}
                    aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(proj)}
                    aria-label={isAr ? 'تعديل المشروع' : 'Edit project'}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(proj.id)}
                    aria-label={isAr ? 'حذف المشروع' : 'Delete project'}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-bold text-foreground">
                {editingItem
                  ? isAr
                    ? 'تعديل المشروع'
                    : 'Edit Project'
                  : isAr
                    ? 'إضافة مشروع جديد'
                    : 'Add Project'}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground">
                {isAr
                  ? 'أدخل تفاصيل المشروع والتقنيات المستخدمة ورابط العمل.'
                  : 'Enter project details, technical stack, and repository/live link.'}
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
                  {isAr ? 'اسم المشروع *' : 'Project Name *'}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'نظام إدارة المهام الذكي' : 'AI Resume Builder'}
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'دورك في المشروع' : 'Your Role'}
                </label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isAr ? 'كبير مطوري الواجهات' : 'Lead Full-Stack Developer'}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'وصف المشروع *' : 'Project Description *'}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    isAr
                      ? 'وصف مقتضب للحل والمشكلة التي يعالجها والأثر المحقق...'
                      : 'Brief description of the problem solved, architecture, and impact...'
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'رابط المشروع (اختياري)' : 'Project URL (Optional)'}
                </label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/example/project"
                />
              </div>

              {/* Technologies Tagging */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'التقنيات المستخدمة' : 'Technologies Used'}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTech()
                      }
                    }}
                    placeholder={isAr ? 'مثال: Next.js (اضغط إضافة)' : 'e.g. Next.js (Press Add)'}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTech}
                    disabled={!techInput.trim()}
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>

                {technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                      ? 'حفظ المشروع'
                      : 'Save Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
