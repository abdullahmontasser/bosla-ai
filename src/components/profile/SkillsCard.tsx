'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  ArrowUpDown,
  Undo2,
  Check,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  FolderX,
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
import { categorizeSkillsAction } from '@/app/actions/skills-actions'

export interface SkillItem {
  id: string
  name: string
  category?: string | null
  proficiency?: string | null
  sortOrder: number
}

interface SkillsCardProps {
  profileId: string
  skills: SkillItem[]
  lang: string
  onSkillsChange: (updated: SkillItem[]) => void
}

export function SkillsCard({ profileId, skills, lang, onSkillsChange }: SkillsCardProps) {
  const isAr = lang === 'ar'

  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit skill dialog state
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [updating, setUpdating] = useState(false)

  // Bulk actions state
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)
  const [clearingCategories, setClearingCategories] = useState(false)

  // Reorder mode toggle
  const [reorderMode, setReorderMode] = useState(false)

  // Undo deletion safety state
  const [recentlyDeleted, setRecentlyDeleted] = useState<{
    skill: SkillItem
    index: number
  } | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkillName.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          name: newSkillName.trim(),
          category: newSkillCategory.trim() || undefined,
          sortOrder: skills.length,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add skill')
      }

      const { skill } = await res.json()
      onSkillsChange([...skills, skill])
      setNewSkillName('')
      setNewSkillCategory('')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (skill: SkillItem) => {
    setEditingSkill(skill)
    setEditName(skill.name)
    setEditCategory(skill.category || '')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSkill || !editName.trim() || updating) return

    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`/api/profile/skills/${editingSkill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update skill')
      }

      const { skill: updated } = await res.json()
      onSkillsChange(skills.map((s) => (s.id === editingSkill.id ? updated : s)))
      setEditingSkill(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to update skill')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    const skillIndex = skills.findIndex((s) => s.id === id)
    const targetSkill = skills[skillIndex]
    if (!targetSkill) return

    // Optimistically update
    const nextSkills = skills.filter((skill) => skill.id !== id)
    onSkillsChange(nextSkills)

    // Store for undo
    setRecentlyDeleted({ skill: targetSkill, index: skillIndex })
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setRecentlyDeleted(null)
    }, 6000)

    try {
      const res = await fetch(`/api/profile/skills/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete skill')
    } catch (err) {
      console.error(err)
      // Rollback on network failure
      onSkillsChange(skills)
      setRecentlyDeleted(null)
      setError(isAr ? 'فشل حذف المهارة' : 'Failed to delete skill')
    }
  }

  const handleUndo = async () => {
    if (!recentlyDeleted) return
    const { skill, index } = recentlyDeleted
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setRecentlyDeleted(null)

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          name: skill.name,
          category: skill.category || undefined,
          sortOrder: skill.sortOrder,
        }),
      })

      if (!res.ok) throw new Error('Failed to restore skill')
      const { skill: restored } = await res.json()

      const restoredList = [...skills]
      restoredList.splice(index, 0, restored)
      onSkillsChange(restoredList)
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل التراجع عن حذف المهارة' : 'Failed to restore skill')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= skills.length) return

    const reordered = [...skills]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved!)

    onSkillsChange(reordered)

    try {
      await fetch('/api/profile/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'skills',
          itemIds: reordered.map((item) => item.id),
        }),
      })
    } catch (err) {
      console.error('Failed to sync reorder to server:', err)
    }
  }

  const handleCategorizeSkills = async () => {
    if (skills.length === 0 || isCategorizing) return
    setIsCategorizing(true)
    setError(null)
    try {
      const res = await categorizeSkillsAction({
        profileId,
        skills: skills.map((s) => s.name),
        lang: isAr ? 'AR' : 'EN',
      })
      if (res.success && res.categorized.length > 0) {
        const catMap = new Map(
          res.categorized.map((c) => [c.name.toLowerCase().trim(), c.category]),
        )
        const updated = skills.map((s) => ({
          ...s,
          category: catMap.get(s.name.toLowerCase().trim()) || s.category || null,
        }))
        onSkillsChange(updated)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
        }
      } else if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      console.error('Failed to categorize skills:', err)
      setError(
        isAr ? 'فشل تصنيف المهارات بالذكاء الاصطناعي' : 'Failed to categorize skills with AI',
      )
    } finally {
      setIsCategorizing(false)
    }
  }

  // Clear all categories from all skills (ungroup all)
  const handleClearAllCategories = async () => {
    if (skills.length === 0 || clearingCategories) return
    setClearingCategories(true)
    setError(null)

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'clear-all-categories' }),
      })

      if (!res.ok) throw new Error('Failed to clear skill categories')

      onSkillsChange(skills.map((s) => ({ ...s, category: null })))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
      }
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل إزالة التصنيفات' : 'Failed to clear skill categories')
    } finally {
      setClearingCategories(false)
    }
  }

  // Clear single category (ungroup skills in this category)
  const handleClearCategory = async (categoryName: string) => {
    setError(null)
    try {
      const res = await fetch('/api/profile/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'clear-category', category: categoryName }),
      })

      if (!res.ok) throw new Error('Failed to clear category')

      onSkillsChange(
        skills.map((s) =>
          s.category?.trim().toLowerCase() === categoryName.trim().toLowerCase()
            ? { ...s, category: null }
            : s,
        ),
      )
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
      }
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل إلغاء التصنيف' : 'Failed to ungroup category')
    }
  }

  // Delete all skills in a specific category
  const handleDeleteCategory = async (categoryName: string) => {
    setError(null)
    try {
      const res = await fetch('/api/profile/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'category', category: categoryName }),
      })

      if (!res.ok) throw new Error('Failed to delete category skills')

      onSkillsChange(
        skills.filter(
          (s) => s.category?.trim().toLowerCase() !== categoryName.trim().toLowerCase(),
        ),
      )
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
      }
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل حذف مهارات هذا التصنيف' : 'Failed to delete category skills')
    }
  }

  // Delete all skills once
  const handleClearAllSkills = async () => {
    if (skills.length === 0 || clearingAll) return
    setClearingAll(true)
    setError(null)

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action: 'all' }),
      })

      if (!res.ok) throw new Error('Failed to delete all skills')

      onSkillsChange([])
      setConfirmClearAll(false)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profileId } }))
      }
    } catch (err) {
      console.error(err)
      setError(isAr ? 'فشل حذف جميع المهارات' : 'Failed to remove all skills')
    } finally {
      setClearingAll(false)
    }
  }

  // Categorize skills grouping
  const categorizedSkills = useMemo(() => {
    const hasAnyCategory = skills.some((s) => Boolean(s.category?.trim()))
    if (!hasAnyCategory) {
      return { hasCategories: false, groups: [{ name: '', items: skills }] }
    }

    const groupsMap = new Map<string, SkillItem[]>()
    for (const skill of skills) {
      const cat = skill.category?.trim() || (isAr ? 'عامة' : 'General')
      const existing = groupsMap.get(cat) || []
      existing.push(skill)
      groupsMap.set(cat, existing)
    }

    const groups = Array.from(groupsMap.entries()).map(([name, items]) => ({
      name,
      items,
    }))

    return { hasCategories: true, groups }
  }, [skills, isAr])

  const renderSkillPill = (skill: SkillItem) => {
    const globalIdx = skills.findIndex((s) => s.id === skill.id)
    return (
      <div
        key={skill.id}
        className="group inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card ps-2.5 pe-1.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/50"
      >
        <span>{skill.name}</span>
        {skill.category && !categorizedSkills.hasCategories && (
          <span className="text-[10px] text-muted-foreground/80 font-mono">({skill.category})</span>
        )}

        {/* Reorder controls only visible when reorder mode is active */}
        {reorderMode && (
          <div className="flex items-center gap-0.5 ms-1 border-s border-border ps-1">
            <button
              type="button"
              disabled={globalIdx === 0}
              onClick={() => handleReorder(globalIdx, 'up')}
              aria-label={isAr ? 'تحريك لأعلى' : 'Move up'}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
            >
              <ArrowUp className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              disabled={globalIdx === skills.length - 1}
              onClick={() => handleReorder(globalIdx, 'down')}
              aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
            >
              <ArrowDown className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        {/* Action icons: Edit & Delete */}
        <div className="flex items-center gap-0.5 ms-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => handleOpenEdit(skill)}
            aria-label={isAr ? 'تعديل المهارة' : 'Edit skill'}
            className="rounded p-0.5 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title={isAr ? 'تعديل المهارة' : 'Edit skill'}
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(skill.id)}
            aria-label={isAr ? 'حذف المهارة' : 'Delete skill'}
            className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title={isAr ? 'حذف المهارة' : 'Delete skill'}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
      {/* Left sub-column */}
      <div>
        <h3 className="text-[17px] font-bold text-foreground">
          {isAr ? 'المهارات والكفاءات' : 'Skills & Competencies'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'المهارات التقنية والمهنية التي تستخدم لمطابقة معايير أنظمة التوظيف.'
            : 'Technical, domain, and leadership capabilities matched during ATS tailoring.'}
        </p>

        {/* Add skill form */}
        <form onSubmit={handleAddSkill} className="mt-4 space-y-2.5">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder={isAr ? 'اسم المهارة (مثال: Next.js)' : 'Skill name (e.g. Next.js)'}
            required
            className="h-8 rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Input
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            placeholder={isAr ? 'التصنيف (اختياري)' : 'Category (optional)'}
            className="h-8 rounded-[6px] border-border bg-card text-xs focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            disabled={saving || !newSkillName.trim()}
            size="sm"
            className="w-full h-8 gap-1 rounded-[6px] text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.22)_inset]"
          >
            <Plus className="h-3 w-3" />
            <span>
              {saving
                ? isAr
                  ? 'جارٍ الإضافة...'
                  : 'Adding...'
                : isAr
                  ? 'إضافة المهارة'
                  : 'Add Skill'}
            </span>
          </Button>
        </form>
      </div>

      {/* Right sub-column */}
      <div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-[6px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Undo banner */}
        {recentlyDeleted && (
          <div className="mb-4 flex items-center justify-between rounded-[6px] border border-primary/20 bg-primary/[0.06] px-3.5 py-2 text-xs text-foreground animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>
                {isAr
                  ? `تم حذف مهارة "${recentlyDeleted.skill.name}"`
                  : `Removed skill "${recentlyDeleted.skill.name}"`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-1 font-semibold text-primary hover:underline ms-4"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>{isAr ? 'تراجع' : 'Undo'}</span>
            </button>
          </div>
        )}

        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border/80 p-8 text-center bg-card/40">
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لم تتم إضافة أي مهارات بعد' : 'No skills added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف ما لا يقل عن 5 مهارات للحصول على نتائج مطابقة دقيقة في أنظمة التوظيف.'
                : 'Add at least 5 core skills to enable accurate keyword density calculation.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Action Bar: Count + AI Categorization + Ungroup All + Reorder + Clear All */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground font-mono">{skills.length}</span>{' '}
                {isAr ? 'مهارات مسجلة' : 'skills registered'}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Categorize with AI */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCategorizing || skills.length === 0}
                  onClick={handleCategorizeSkills}
                  className="h-7 px-2.5 text-xs gap-1.5 rounded-[4px] border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                  title={
                    isAr
                      ? 'تصنيف المهارات تلقائياً باستخدام الذكاء الاصطناعي'
                      : 'Automatically group skills into industry categories using AI'
                  }
                >
                  {isCategorizing ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                  <span>
                    {isCategorizing
                      ? isAr
                        ? 'جارٍ التصنيف...'
                        : 'Categorizing...'
                      : isAr
                        ? 'تصنيف ذكي (AI)'
                        : 'Categorize with AI'}
                  </span>
                </Button>

                {/* Remove Every Category (Ungroup All) */}
                {categorizedSkills.hasCategories && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={clearingCategories}
                    onClick={handleClearAllCategories}
                    className="h-7 px-2 text-xs gap-1 rounded-[4px] text-muted-foreground hover:text-foreground"
                    title={
                      isAr
                        ? 'إزالة جميع التصنيفات عن المهارات'
                        : 'Remove all categories from skills'
                    }
                  >
                    {clearingCategories ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FolderX className="h-3 w-3" />
                    )}
                    <span>{isAr ? 'إلغاء التصنيفات' : 'Clear Categories'}</span>
                  </Button>
                )}

                {/* Reorder Toggle */}
                <Button
                  type="button"
                  variant={reorderMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setReorderMode(!reorderMode)}
                  className="h-7 px-2.5 text-xs gap-1.5 rounded-[4px]"
                >
                  {reorderMode ? (
                    <>
                      <Check className="h-3 w-3 text-primary" />
                      <span>{isAr ? 'إنهاء الترتيب' : 'Done Reordering'}</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span>{isAr ? 'إعادة ترتيب' : 'Reorder'}</span>
                    </>
                  )}
                </Button>

                {/* Remove All Skills Once */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClearAll(true)}
                  className="h-7 px-2 text-xs gap-1 rounded-[4px] text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={isAr ? 'حذف جميع المهارات دفعة واحدة' : 'Remove all skills at once'}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{isAr ? 'حذف الكل' : 'Clear All'}</span>
                </Button>
              </div>
            </div>

            {/* Reorder hint if active */}
            {reorderMode && (
              <div className="rounded-[4px] border border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                {isAr
                  ? 'وضع إعادة الترتيب نشط: استخدم الأسهم على كل مهارة لضبط ترتيب الأولوية في فحص ATS.'
                  : 'Reorder mode active: use the arrow buttons to prioritize skills for ATS keyword scoring.'}
              </div>
            )}

            {/* Categorized or Flat Skill Pills */}
            {categorizedSkills.hasCategories ? (
              <div className="space-y-4">
                {categorizedSkills.groups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {group.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          ({group.items.length})
                        </span>
                      </div>

                      {/* Category Action buttons */}
                      {group.name && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleClearCategory(group.name)}
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title={
                              isAr ? `إلغاء تصنيف ${group.name}` : `Ungroup skills in ${group.name}`
                            }
                          >
                            {isAr ? 'إلغاء التصنيف' : 'Ungroup'}
                          </button>
                          <span className="text-border" aria-hidden="true">
                            ·
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(group.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title={
                              isAr
                                ? `حذف جميع مهارات قسم ${group.name}`
                                : `Delete all skills in ${group.name}`
                            }
                          >
                            {isAr ? 'حذف القسم' : 'Delete category'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((skill) => renderSkillPill(skill))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => renderSkillPill(skill))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Skill Dialog */}
      <Dialog open={Boolean(editingSkill)} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? 'تعديل المهارة' : 'Edit Skill'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isAr
                ? 'قم بتعديل اسم المهارة وتصنيفها في ملفك المهني.'
                : 'Update the skill name and category assignment in your profile.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-3.5 mt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {isAr ? 'اسم المهارة *' : 'Skill Name *'}
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={isAr ? 'مثال: Next.js' : 'e.g. Next.js'}
                required
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {isAr ? 'التصنيف (اختياري)' : 'Category (optional)'}
              </label>
              <Input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder={isAr ? 'مثال: لغات البرمجة وأطر العمل' : 'e.g. Languages & Frameworks'}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingSkill(null)}
                className="text-xs h-8"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updating || !editName.trim()}
                className="text-xs h-8 gap-1.5"
              >
                {updating && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">
              {isAr ? 'تأكيد حذف جميع المهارات' : 'Delete All Skills'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isAr
                ? `هل أنت متأكد من رغبتك في حذف جميع المهارات (${skills.length} مهارة) دفعة واحدة؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to remove all ${skills.length} skills from your profile at once? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClearAll(false)}
              className="text-xs h-8"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={clearingAll}
              onClick={handleClearAllSkills}
              className="text-xs h-8 gap-1.5"
            >
              {clearingAll && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{isAr ? 'حذف جميع المهارات' : 'Confirm Delete All'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
