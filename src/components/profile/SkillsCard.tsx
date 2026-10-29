'use client'

import React, { useState } from 'react'
import { Wrench, Plus, X, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [error, setError] = useState<string | null>(null)

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

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/skills/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete skill')

      onSkillsChange(skills.filter((s) => s.id !== id))
    } catch (err) {
      console.error(err)
      alert(isAr ? 'فشل حذف المهارة' : 'Failed to delete skill')
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

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <CardTitle className="text-[17px] font-bold text-foreground">
            {isAr ? 'المهارات والكفاءات' : 'Skills & Competencies'}
          </CardTitle>
        </div>
        <CardDescription className="text-[13px] text-muted-foreground">
          {isAr
            ? 'المهارات التقنية والقيادية والأدوات البرمجية لتحسين مطابقة أنظمة ATS.'
            : 'Technical proficiencies, frameworks, tools, and domain skills.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleAddSkill} className="mb-4 flex flex-col sm:flex-row gap-2">
          <Input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder={isAr ? 'اسم المهارة (مثال: TypeScript)' : 'Skill name (e.g. TypeScript)'}
            className="flex-1"
          />
          <Input
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            placeholder={isAr ? 'التصنيف (مثال: لغات، سحاب)' : 'Category (e.g. Languages, Cloud)'}
            className="sm:w-44"
          />
          <Button
            type="submit"
            disabled={saving || !newSkillName.trim()}
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Add'}
          </Button>
        </form>

        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border/70 p-6 text-center bg-card/40">
            <p className="text-[13px] font-semibold text-foreground">
              {isAr ? 'لا توجد مهارات مضافة بعد' : 'No skills added yet'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
              {isAr
                ? 'أضف أهم مهاراتك التقنية لزيادة توافقك مع إعلانات الوظائف.'
                : 'Add technical competencies to boost your ATS keyword coverage.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <div
                key={skill.id}
                className="group flex items-center gap-1.5 rounded-[8px] border border-border bg-card/80 ps-2.5 pe-1 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span>{skill.name}</span>
                {skill.category && (
                  <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                    {skill.category}
                  </span>
                )}

                <div className="ms-1 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorder(idx, 'up')}
                    aria-label={isAr ? 'تحريك لأعلى' : 'Move up'}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === skills.length - 1}
                    onClick={() => handleReorder(idx, 'down')}
                    aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(skill.id)}
                    aria-label={isAr ? 'حذف المهارة' : 'Delete skill'}
                    className="p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
