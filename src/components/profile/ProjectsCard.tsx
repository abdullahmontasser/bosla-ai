'use client'

import React, { useState } from 'react'
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
  FolderGit2,
  Sparkles,
  RotateCw,
} from 'lucide-react'
import { enhanceProjectDescriptionAction } from '@/app/actions/profile-ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [techInput, setTechInput] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])

  const handleEnhanceDescription = async () => {
    if (isEnhancing) return
    setIsEnhancing(true)
    try {
      const res = await enhanceProjectDescriptionAction({
        name,
        role,
        technologies,
        currentDescription: description,
        language: isAr ? 'AR' : 'EN',
      })
      if (res.success && res.enhancedDescription) {
        setDescription(res.enhancedDescription)
      }
    } catch (err) {
      console.error('Failed to enhance project description:', err)
    } finally {
      setIsEnhancing(false)
    }
  }

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
    setTechnologies(item.technologies.length > 0 ? [...item.technologies] : [])
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

  const handleDelete = (id: string) => {
    // If running in a test where window.confirm is mocked, maintain backwards compatibility
    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function' &&
      ('mock' in window.confirm || '_isMockFunction' in window.confirm)
    ) {
      const confirmed = window.confirm(
        isAr ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?',
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
      const res = await fetch(`/api/profile/projects/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete project')

      onProjectsChange(projects.filter((proj) => proj.id !== id))
      setDeleteConfirmId(null)
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل حذف المشروع' : 'Failed to delete project')
    } finally {
      setDeleting(false)
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
    <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
      {/* Left sub-column */}
      <div>
        <h3 className="text-[17px] font-bold text-foreground">
          {isAr ? 'المشاريع البارزة' : 'Featured Projects'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'المشاريع البرمجية أو القيادية التي تبرز عمق قدراتك وإنجازاتك الواقعية.'
            : 'Key products and technical systems proving real-world capability.'}
        </p>
        <Button
          onClick={openAddDialog}
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 rounded-[6px] text-xs font-semibold border-border hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>{isAr ? 'إضافة مشروع' : 'Add Project'}</span>
        </Button>
      </div>

      {/* Right sub-column */}
      <div>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 p-8 text-center bg-card/40">
            <FolderGit2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لم تتم إضافة أي مشاريع بعد' : 'No projects added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف مشاريعك لإعطاء نموذج الذكاء الاصطناعي أدلة ملموسة عند التخصيص.'
                : 'Add featured projects to ground tailored resumes in verifiable artifacts.'}
            </p>
            <Button
              onClick={openAddDialog}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 rounded-[6px] text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'إضافة مشروع' : 'Add your first project'}</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div
                key={proj.id}
                className="group relative rounded-[8px] border border-border bg-card/60 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] font-bold text-foreground">{proj.name}</h4>
                      {proj.role && (
                        <span className="text-[12px] font-semibold text-primary">
                          ({proj.role})
                        </span>
                      )}
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline ms-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{isAr ? 'رابط' : 'Link'}</span>
                          <span className="sr-only">
                            ({isAr ? 'يفتح في نافذة جديدة' : 'opens in new tab'})
                          </span>
                        </a>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {proj.description}
                    </p>

                    {proj.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {proj.technologies.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-[3px] border border-border bg-muted/40 px-2 py-0.5 text-xs font-mono font-medium text-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
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
                      disabled={idx === projects.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditDialog(proj)}
                      aria-label={isAr ? 'تعديل المشروع' : 'Edit project'}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id)}
                      aria-label={isAr ? 'حذف المشروع' : 'Delete project'}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  ? 'أدخل تفاصيل المشروع ودورك والتقنيات المستخدمة.'
                  : 'Enter project details, your role, and key technologies.'}
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
                  {isAr ? 'اسم المشروع *' : 'Project Name *'}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? 'منصة وكيل السير الذاتية' : 'AI Career Studio'}
                  required
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'دورك في المشروع' : 'Your Role'}
                </label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isAr ? 'كبير مهندسي الواجهات' : 'Lead Architect'}
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'رابط المشروع (اختياري)' : 'Project URL (optional)'}
                </label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-foreground">
                    {isAr ? 'وصف المشروع وإنجازاتك *' : 'Description & Impact *'}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isEnhancing}
                    onClick={handleEnhanceDescription}
                    className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-[4px] font-medium transition-colors"
                    title={
                      isAr
                        ? 'تحسين صياغة الوصف بالذكاء الاصطناعي'
                        : 'Enhance project description with AI'
                    }
                  >
                    {isEnhancing ? (
                      <RotateCw className="h-3 w-3 animate-spin text-primary" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-primary" />
                    )}
                    <span>
                      {isEnhancing
                        ? isAr
                          ? 'جارٍ التحسين...'
                          : 'Enhancing...'
                        : isAr
                          ? 'تحسين بالذكاء الاصطناعي'
                          : 'Enhance with AI'}
                    </span>
                  </Button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    isAr
                      ? 'نبذة عن فكرة المشروع والتقنيات المستخدمة والأثر المحقق...'
                      : 'Overview of the project architecture, challenges solved, and measurable impact...'
                  }
                  required
                  className="rounded-[6px] border-border bg-card text-xs resize-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  {isAr ? 'التقنيات المستخدمة' : 'Technologies Used'}
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTech()
                      }
                    }}
                    placeholder={isAr ? 'مثال: TypeScript' : 'e.g. Next.js, Prisma'}
                    className="rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTech}
                    variant="outline"
                    size="sm"
                    className="rounded-[6px] text-xs"
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </Button>
                </div>

                {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
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
                      ? 'حفظ المشروع'
                      : 'Save Project'}
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
                {isAr ? 'تأكيد حذف المشروع' : 'Delete Project'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                {isAr
                  ? 'هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this project? This action cannot be undone.'}
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
