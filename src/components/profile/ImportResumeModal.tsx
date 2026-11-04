'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  Sparkles,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { parseResumeAction, commitParsedResumeAction } from '@/app/actions/resume-actions'
import { categorizeSkillsAction } from '@/app/actions/skills-actions'
import { classifySkillFallback } from '@/lib/skills/classifier'
import type {
  ParsedResumePayload,
  SectionMergeConfig,
  MergeAction,
  ScalarMergeAction,
} from '@/lib/validations/parsed-resume'

export interface ImportResumeModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  profileLanguage?: 'EN' | 'AR'
  lang: string
  dict?: Record<string, unknown>
  onImportSuccess: () => void
}

type WizardStep = 'identity' | 'experience' | 'education' | 'skills' | 'projects'

interface StepMeta {
  key: WizardStep
  number: string
  labelEn: string
  labelAr: string
  kickerEn: string
  kickerAr: string
  icon: React.ComponentType<{ className?: string }>
}

const WIZARD_STEPS: StepMeta[] = [
  {
    key: 'identity',
    number: '01',
    labelEn: 'Identity',
    labelAr: 'البيانات الشخصية',
    kickerEn: 'STEP 01 / 05 — PERSONAL IDENTITY',
    kickerAr: 'الخطوة 01 / 05 — البيانات المهنية والشخصية',
    icon: User,
  },
  {
    key: 'experience',
    number: '02',
    labelEn: 'Experience',
    labelAr: 'الخبرات المهنية',
    kickerEn: 'STEP 02 / 05 — WORK EXPERIENCE',
    kickerAr: 'الخطوة 02 / 05 — سجل الخبرات المهنية',
    icon: Briefcase,
  },
  {
    key: 'education',
    number: '03',
    labelEn: 'Education',
    labelAr: 'التعليم والمؤهلات',
    kickerEn: 'STEP 03 / 05 — EDUCATION & DEGREES',
    kickerAr: 'الخطوة 03 / 05 — التعليم والمؤهلات الأكاديمية',
    icon: GraduationCap,
  },
  {
    key: 'skills',
    number: '04',
    labelEn: 'Skills',
    labelAr: 'المهارات والتقنيات',
    kickerEn: 'STEP 04 / 05 — SKILLS & COMPETENCIES',
    kickerAr: 'الخطوة 04 / 05 — المهارات والكفاءات',
    icon: Wrench,
  },
  {
    key: 'projects',
    number: '05',
    labelEn: 'Projects',
    labelAr: 'المشاريع البارزة',
    kickerEn: 'STEP 05 / 05 — FEATURED PROJECTS',
    kickerAr: 'الخطوة 05 / 05 — المشاريع والأعمال البارزة',
    icon: FolderGit2,
  },
]

export function ImportResumeModal({
  isOpen,
  onClose,
  profileId,
  profileLanguage,
  lang,
  onImportSuccess,
}: ImportResumeModalProps) {
  const isAr = lang === 'ar'
  const targetResumeLang = profileLanguage || (isAr ? 'AR' : 'EN')
  const isTargetAr = targetResumeLang === 'AR'
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [modalStage, setModalStage] = useState<'upload' | 'review' | 'success'>('upload')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState<
    'idle' | 'validating' | 'extracting' | 'structuring'
  >('idle')
  const [error, setError] = useState<string | null>(null)

  const [parsedResumeId, setParsedResumeId] = useState<string | null>(null)
  const [data, setData] = useState<ParsedResumePayload | null>(null)
  const [mergeConfig, setMergeConfig] = useState<SectionMergeConfig>({
    personalInfo: 'replace',
    experiences: 'replace',
    educations: 'replace',
    skills: 'append',
    projects: 'replace',
  })

  const [newSkillInput, setNewSkillInput] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)
  const [isCategorizingSkills, setIsCategorizingSkills] = useState(false)

  const currentStep = WIZARD_STEPS[activeStepIndex] || WIZARD_STEPS[0]!
  const isFirstStep = activeStepIndex === 0
  const isLastStep = activeStepIndex === WIZARD_STEPS.length - 1

  const handleModalClose = () => {
    if (isProcessing || isCommitting) return
    onClose()
  }

  const handleResetFlow = () => {
    setModalStage('upload')
    setActiveStepIndex(0)
    setSelectedFile(null)
    setIsProcessing(false)
    setProcessingPhase('idle')
    setError(null)
    setParsedResumeId(null)
    setData(null)
  }

  // Upload validation
  const validateAndSelectFile = (file: File) => {
    setError(null)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        isAr
          ? 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت).'
          : 'File size exceeds the 10MB limit. Please upload a smaller file.',
      )
      return
    }

    const lowerName = file.name.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf'
    const isDocx =
      lowerName.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!isPdf && !isDocx) {
      setError(
        isAr
          ? 'نوع الملف غير مدعوم. يرجى اختيار ملف PDF أو Word (DOCX).'
          : 'Unsupported file format. Please upload a genuine PDF or Word (DOCX) document.',
      )
      return
    }

    setSelectedFile(file)
    handleStartExtraction(file)
  }

  // Live progressive upload execution
  const handleStartExtraction = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setProcessingPhase('validating')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Transition animation stages
      setTimeout(() => setProcessingPhase('extracting'), 500)
      setTimeout(() => setProcessingPhase('structuring'), 1400)

      const result = await parseResumeAction(formData)

      if (!result.success || !result.data || !result.parsedResumeId) {
        throw new Error(result.error || 'Failed to parse resume.')
      }

      setParsedResumeId(result.parsedResumeId)
      setData(result.data)
      setModalStage('review')
      setActiveStepIndex(0)
    } catch (err) {
      console.error('Resume parsing failed:', err)
      setError(err instanceof Error ? err.message : 'Extraction failed.')
      setProcessingPhase('idle')
      setSelectedFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Section mutations
  const handleIdentityChange = (field: keyof ParsedResumePayload, value: string) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // Experience mutations
  const handleExperienceChange = (
    index: number,
    field: string,
    value: string | boolean | string[],
  ) => {
    setData((prev) => {
      if (!prev) return prev
      const nextExp = [...prev.experiences]
      nextExp[index] = { ...nextExp[index], [field]: value }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleAddExperienceBullet = (expIndex: number) => {
    setData((prev) => {
      if (!prev) return prev
      const nextExp = [...prev.experiences]
      const currentBullets = nextExp[expIndex]?.bullets || []
      nextExp[expIndex] = {
        ...nextExp[expIndex],
        bullets: [...currentBullets, ''],
      }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleRemoveExperienceBullet = (expIndex: number, bulletIndex: number) => {
    setData((prev) => {
      if (!prev) return prev
      const nextExp = [...prev.experiences]
      nextExp[expIndex] = {
        ...nextExp[expIndex],
        bullets: (nextExp[expIndex]?.bullets || []).filter((_, bi) => bi !== bulletIndex),
      }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleUpdateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
    setData((prev) => {
      if (!prev) return prev
      const nextExp = [...prev.experiences]
      const currentBullets = [...(nextExp[expIndex]?.bullets || [])]
      currentBullets[bulletIndex] = value
      nextExp[expIndex] = { ...nextExp[expIndex], bullets: currentBullets }
      return { ...prev, experiences: nextExp }
    })
  }

  const handleAddExperience = () => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        experiences: [
          ...prev.experiences,
          {
            jobTitle: '',
            companyName: '',
            location: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            bullets: [''],
          },
        ],
      }
    })
  }

  const handleRemoveExperience = (index: number) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        experiences: prev.experiences.filter((_, i) => i !== index),
      }
    })
  }

  // Education mutations
  const handleEducationChange = (index: number, field: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev
      const nextEdu = [...prev.educations]
      nextEdu[index] = { ...nextEdu[index], [field]: value }
      return { ...prev, educations: nextEdu }
    })
  }

  const handleAddEducation = () => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        educations: [
          ...prev.educations,
          {
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startDate: '',
            endDate: '',
            grade: '',
          },
        ],
      }
    })
  }

  const handleRemoveEducation = (index: number) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        educations: prev.educations.filter((_, i) => i !== index),
      }
    })
  }

  // Skills mutations
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim()
    if (!trimmed || !data) return
    if (data.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput('')
      return
    }
    const autoCat = classifySkillFallback(trimmed, isTargetAr)
    setData((prev) => {
      if (!prev) return prev
      const currentCatMap = (prev.rawMetadata?.skillCategories as Record<string, string>) || {}
      return {
        ...prev,
        skills: [...prev.skills, trimmed],
        rawMetadata: {
          ...(prev.rawMetadata || {}),
          skillCategories: {
            ...currentCatMap,
            [trimmed]: autoCat,
          },
        },
      }
    })
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillIndex: number) => {
    setData((prev) => {
      if (!prev) return prev
      const removedSkill = prev.skills[skillIndex]
      const currentCatMap = {
        ...((prev.rawMetadata?.skillCategories as Record<string, string>) || {}),
      }
      if (removedSkill && currentCatMap[removedSkill]) {
        delete currentCatMap[removedSkill]
      }
      return {
        ...prev,
        skills: prev.skills.filter((_, i) => i !== skillIndex),
        rawMetadata: {
          ...(prev.rawMetadata || {}),
          skillCategories: currentCatMap,
        },
      }
    })
  }

  const handleCategorizeSkills = async () => {
    if (!data || data.skills.length === 0 || isCategorizingSkills) return
    setIsCategorizingSkills(true)
    setError(null)
    try {
      const res = await categorizeSkillsAction({
        skills: data.skills,
        lang: isTargetAr ? 'AR' : 'EN',
      })
      if (res.success && res.categorized.length > 0) {
        const catMap: Record<string, string> = {}
        for (const item of res.categorized) {
          catMap[item.name.trim()] = item.category
        }
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            rawMetadata: {
              ...(prev.rawMetadata || {}),
              skillCategories: catMap,
            },
          }
        })
      } else if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      console.error('Failed to categorize skills:', err)
      setError(
        isAr ? 'فشل تصنيف المهارات بالذكاء الاصطناعي' : 'Failed to categorize skills with AI',
      )
    } finally {
      setIsCategorizingSkills(false)
    }
  }

  // Categorization grouping for review UI
  const skillCategoriesMap = (data?.rawMetadata?.skillCategories as Record<string, string>) || {}
  const hasSkillCategories = Object.keys(skillCategoriesMap).length > 0
  const categorizedSkillsGroups = (() => {
    if (!data?.skills || data.skills.length === 0) return []
    if (!hasSkillCategories) {
      return [{ category: '', items: data.skills }]
    }

    const map = new Map<string, string[]>()
    for (const s of data.skills) {
      const cat = skillCategoriesMap[s.trim()] || (isAr ? 'عامة' : 'General')
      const list = map.get(cat) || []
      list.push(s)
      map.set(cat, list)
    }

    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
    }))
  })()

  // Projects mutations
  const handleProjectChange = (index: number, field: string, value: string | string[]) => {
    setData((prev) => {
      if (!prev) return prev
      const nextProj = [...prev.projects]
      nextProj[index] = { ...nextProj[index], [field]: value }
      return { ...prev, projects: nextProj }
    })
  }

  const handleAddProject = () => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        projects: [
          ...prev.projects,
          {
            name: '',
            description: '',
            role: '',
            technologies: [],
            url: '',
          },
        ],
      }
    })
  }

  const handleRemoveProject = (index: number) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        projects: prev.projects.filter((_, i) => i !== index),
      }
    })
  }

  // Commit execution
  const handleCommitToProfile = async () => {
    if (!parsedResumeId || !data) return

    setIsCommitting(true)
    setError(null)

    try {
      const res = await commitParsedResumeAction({
        parsedResumeId,
        targetProfileId: profileId,
        mergeConfig,
        editedData: data,
      })

      if (!res.success) {
        throw new Error(res.error || 'Failed to commit updates to master profile.')
      }

      setModalStage('success')
      setTimeout(() => {
        onImportSuccess()
        onClose()
      }, 1100)
    } catch (err) {
      console.error('Commit error:', err)
      setError(err instanceof Error ? err.message : 'Commit failed.')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent
        data-testid="import-resume-modal-content"
        className="max-w-3xl w-[95vw] h-[85vh] max-h-[760px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Modal Top Header with Stepper in Review Stage */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/15 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground font-serif tracking-tight">
                    {isAr
                      ? 'استيراد ومراجعة السيرة الذاتية بالذكاء الاصطناعي'
                      : 'Import & Review Resume with AI'}
                  </DialogTitle>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border',
                      isTargetAr
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-primary/30 bg-primary/10 text-primary',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isTargetAr ? 'bg-emerald-500' : 'bg-primary',
                      )}
                    />
                    <span>
                      {isTargetAr
                        ? isAr
                          ? 'السيرة المستهدفة: العربية'
                          : 'Target: Arabic Resume'
                        : isAr
                          ? 'السيرة المستهدفة: الإنجليزية'
                          : 'Target: English Resume'}
                    </span>
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {isAr
                    ? isTargetAr
                      ? 'ارفع سيرتك الذاتية وراجع بيانات نسختك العربية بدقة قبل دمجها مع ملفك الموحد.'
                      : 'ارفع سيرتك الذاتية وراجع كل قسم بدقة قبل دمجه مع ملفك الموحد.'
                    : isTargetAr
                      ? 'Upload your CV and verify details structured specifically for your Arabic Master Resume.'
                      : 'Upload your CV and review each section step-by-step before syncing with your master profile.'}
                </DialogDescription>
              </div>
            </div>

            {modalStage === 'review' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFlow}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5"
                title={isAr ? 'رفع ملف آخر' : 'Upload different file'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isAr ? 'ملف آخر' : 'Change file'}</span>
              </Button>
            )}
          </div>

          {/* Clean Stepper Tabs for Guided Review */}
          {modalStage === 'review' && (
            <div
              className="mt-4 flex items-center justify-between gap-1 overflow-x-auto pb-1 border-t border-border/50 pt-3"
              role="tablist"
              aria-label={isAr ? 'خطوات مراجعة البيانات' : 'Review steps'}
            >
              {WIZARD_STEPS.map((step, idx) => {
                const IconComponent = step.icon
                const isActive = idx === activeStepIndex
                const isPassed = idx < activeStepIndex

                return (
                  <button
                    key={step.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveStepIndex(idx)}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : isPassed
                          ? 'text-primary/90 hover:bg-primary/10'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold font-mono',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : isPassed
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isPassed ? <Check className="h-3 w-3" /> : step.number}
                    </span>
                    <IconComponent className="h-3.5 w-3.5 hidden sm:inline-block" />
                    <span className="whitespace-nowrap">{isAr ? step.labelAr : step.labelEn}</span>
                  </button>
                )
              })}
            </div>
          )}
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-[8px] border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">{isAr ? 'تنبيه' : 'Notice'}</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STAGE 1: UPLOAD DROPZONE & LIVE ANIMATED EXTRACTION */}
          {/* ========================================================== */}
          {modalStage === 'upload' && (
            <div className="space-y-4 py-2">
              {/* Context Banner for Active Resume Language Target */}
              {isTargetAr && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 flex items-start gap-3 text-start animate-in fade-in-50 duration-300">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-xs leading-relaxed space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {isAr
                          ? 'الاستيراد مخصص للسيرة الذاتية العربية'
                          : 'Target: Arabic Master Resume'}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono"
                      >
                        {isAr ? 'النسخة العربية (AR)' : 'Arabic Version (AR)'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {isAr
                        ? 'أنت الآن بصدد استيراد وتحديث نسختك العربية من السيرة الذاتية. يمكنك رفع ملفك باللغة العربية أو الإنجليزية؛ وسيتولى الذكاء الاصطناعي استخراج البيانات وتنظيمها باللغة العربية مع دعم كامل للاتجاه من اليمين لليسار (RTL) وتصنيف المهارات حسب معايير الـ ATS العربية.'
                        : 'You are importing data into your Arabic Master Resume. You can upload a document in either Arabic or English; our AI will extract, structure, and format it for your Arabic profile with full RTL support and localized skill taxonomy.'}
                    </p>
                  </div>
                </div>
              )}

              {!isProcessing ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOver(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      validateAndSelectFile(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isDragOver
                      ? 'border-primary bg-primary/10 scale-[1.005]'
                      : 'border-border/80 bg-muted/10 hover:border-primary/50 hover:bg-muted/20',
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        validateAndSelectFile(e.target.files[0])
                      }
                    }}
                  />

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card text-primary shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/40">
                    <UploadCloud className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-foreground">
                    {isAr
                      ? 'اسحب وأفلت سيرتك الذاتية هنا، أو تصفح الملفات'
                      : 'Drop your resume here, or browse files'}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
                    {isAr
                      ? 'يدعم ملفات PDF و Word (DOCX) بحجم يصل إلى 10 ميجابايت. سيقوم الذكاء الاصطناعي باستخراج وتنظيم بياناتك فوراً.'
                      : 'Supports PDF & Word (DOCX) up to 10MB. Bosla AI will structure and verify your experience.'}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-mono uppercase bg-card/60">
                      PDF
                    </Badge>
                    <span className="text-muted-foreground text-xs">•</span>
                    <Badge variant="outline" className="text-[11px] font-mono uppercase bg-card/60">
                      DOCX
                    </Badge>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-[11px] text-muted-foreground font-mono">Max 10MB</span>
                  </div>
                </div>
              ) : (
                /* Live Processing Progress Animation */
                <div className="rounded-xl border border-border/80 bg-muted/10 p-8 space-y-6 text-center animate-in fade-in-0 duration-300">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                      {isAr
                        ? 'جارٍ تحليل واستخراج السيرة الذاتية'
                        : 'Analyzing & Structuring Resume'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground font-mono truncate max-w-sm mx-auto">
                      {selectedFile?.name || 'document.pdf'}
                    </p>
                  </div>

                  {/* Progressive Stage Stepper */}
                  <div className="mx-auto max-w-md space-y-3 text-start">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground block">
                          {isAr ? '1. فحص بنية وتنسيق الملف' : '1. Validating format & magic bytes'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300',
                        processingPhase === 'extracting' || processingPhase === 'structuring'
                          ? 'border-border/50 bg-card'
                          : 'border-border/20 bg-muted/20 opacity-60',
                      )}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                        {processingPhase === 'structuring' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground block">
                          {isAr
                            ? '2. استخراج النصوص والفقرات الرقمية'
                            : '2. Extracting raw document text'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300',
                        processingPhase === 'structuring'
                          ? 'border-border/50 bg-card'
                          : 'border-border/20 bg-muted/20 opacity-50',
                      )}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground block">
                          {isAr
                            ? '3. الذكاء الاصطناعي يصنف الخبرات والمؤهلات'
                            : '3. AI structuring career background'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STAGE 2: GUIDED ONE-SECTION-AT-A-TIME REVIEW WORKBENCH */}
          {/* ========================================================== */}
          {modalStage === 'review' && data && (
            <div
              key={currentStep.key}
              className="space-y-4 animate-in fade-in-0 slide-in-from-right-2 duration-200 motion-reduce:animate-none"
              dir={isTargetAr || data.language === 'AR' ? 'rtl' : 'ltr'}
            >
              {/* Context indicator for active resume version */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isTargetAr ? 'bg-emerald-500' : 'bg-primary',
                    )}
                  />
                  <span className="font-medium text-foreground">
                    {isTargetAr
                      ? isAr
                        ? 'مراجعة وتدقيق بيانات السيرة الذاتية باللغة العربية'
                        : 'Reviewing data for your Arabic Master Resume'
                      : isAr
                        ? 'مراجعة وتدقيق بيانات السيرة الذاتية باللغة الإنجليزية'
                        : 'Reviewing data for your English Master Resume'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {isTargetAr
                    ? isAr
                      ? 'الهدف: السيرة العربية (AR)'
                      : 'Target: Arabic Profile (AR)'
                    : isAr
                      ? 'الهدف: السيرة الإنجليزية (EN)'
                      : 'Target: English Profile (EN)'}
                </span>
              </div>

              {/* Section Header with Strategy Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-px w-4 bg-primary" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      {isAr ? currentStep.kickerAr : currentStep.kickerEn}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? currentStep.labelAr : currentStep.labelEn}
                  </h3>
                </div>

                {/* Per-Section Merge Strategy Controller */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-full border border-border/60">
                  <span className="text-[11px] font-medium text-muted-foreground px-2">
                    {isAr ? 'الدمج:' : 'Merge:'}
                  </span>
                  {(['replace', 'append', 'skip'] as const).map((strategy) => {
                    const isScalar = currentStep.key === 'identity'
                    if (isScalar && strategy === 'append') return null

                    const currentChoice =
                      currentStep.key === 'identity'
                        ? mergeConfig.personalInfo
                        : currentStep.key === 'experience'
                          ? mergeConfig.experiences
                          : currentStep.key === 'education'
                            ? mergeConfig.educations
                            : currentStep.key === 'skills'
                              ? mergeConfig.skills
                              : mergeConfig.projects

                    const isSelected = currentChoice === strategy

                    return (
                      <button
                        key={strategy}
                        type="button"
                        onClick={() => {
                          if (currentStep.key === 'identity') {
                            setMergeConfig((prev) => ({
                              ...prev,
                              personalInfo: strategy as ScalarMergeAction,
                            }))
                          } else {
                            setMergeConfig((prev) => ({
                              ...prev,
                              [currentStep.key === 'experience'
                                ? 'experiences'
                                : currentStep.key === 'education'
                                  ? 'educations'
                                  : currentStep.key === 'skills'
                                    ? 'skills'
                                    : 'projects']: strategy as MergeAction,
                            }))
                          }
                        }}
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {strategy === 'replace'
                          ? isAr
                            ? 'استبدال'
                            : 'Replace'
                          : strategy === 'append'
                            ? isAr
                              ? 'إضافة'
                              : 'Append'
                            : isAr
                              ? 'تخطي'
                              : 'Skip'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* SECTION 1: IDENTITY */}
              {/* -------------------------------------------------------- */}
              {currentStep.key === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                      </label>
                      <Input
                        value={data.fullName || ''}
                        onChange={(e) => handleIdentityChange('fullName', e.target.value)}
                        placeholder="e.g. John Doe"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'المسمى المهني الرئيسي' : 'Headline / Title'}
                      </label>
                      <Input
                        value={data.headline || ''}
                        onChange={(e) => handleIdentityChange('headline', e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-foreground mb-1">
                      {isAr ? 'الملخص المهني' : 'Professional Summary'}
                    </label>
                    <Textarea
                      rows={3}
                      value={data.summary || ''}
                      onChange={(e) => handleIdentityChange('summary', e.target.value)}
                      placeholder="Brief summary of experience and accomplishments..."
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <Input
                        type="email"
                        value={data.email || ''}
                        onChange={(e) => handleIdentityChange('email', e.target.value)}
                        placeholder="john@example.com"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'رقم الهاتف' : 'Phone'}
                      </label>
                      <Input
                        value={data.phone || ''}
                        onChange={(e) => handleIdentityChange('phone', e.target.value)}
                        placeholder="+1 555-0199"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'الموقع الجغرافي' : 'Location'}
                      </label>
                      <Input
                        value={data.location || ''}
                        onChange={(e) => handleIdentityChange('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        LinkedIn
                      </label>
                      <Input
                        value={data.linkedinUrl || ''}
                        onChange={(e) => handleIdentityChange('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        GitHub
                      </label>
                      <Input
                        value={data.githubUrl || ''}
                        onChange={(e) => handleIdentityChange('githubUrl', e.target.value)}
                        placeholder="https://github.com/..."
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-foreground mb-1">
                        {isAr ? 'الموقع الشخصي' : 'Website'}
                      </label>
                      <Input
                        value={data.websiteUrl || ''}
                        onChange={(e) => handleIdentityChange('websiteUrl', e.target.value)}
                        placeholder="https://..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SECTION 2: WORK EXPERIENCE */}
              {/* -------------------------------------------------------- */}
              {currentStep.key === 'experience' && (
                <div className="space-y-4">
                  {data.experiences.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      {isAr
                        ? 'لم يتم استخراج خبرات وظيفية من هذا الملف.'
                        : 'No work experience records extracted.'}
                    </div>
                  ) : (
                    data.experiences.map((exp, expIdx) => (
                      <div
                        key={expIdx}
                        className="rounded-lg border border-border bg-card p-4 space-y-3 relative group/item"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                            {isAr ? `خبرة ${expIdx + 1}` : `ROLE #${expIdx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(expIdx)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-sm transition-colors cursor-pointer"
                            title={isAr ? 'حذف هذه الخبرة' : 'Delete role'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'المسمى الوظيفي *' : 'Job Title *'}
                            </label>
                            <Input
                              value={exp.jobTitle || exp.title || ''}
                              onChange={(e) =>
                                handleExperienceChange(expIdx, 'jobTitle', e.target.value)
                              }
                              placeholder="e.g. Senior Frontend Engineer"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'الشركة / جهة العمل *' : 'Company *'}
                            </label>
                            <Input
                              value={exp.companyName || exp.company || ''}
                              onChange={(e) =>
                                handleExperienceChange(expIdx, 'companyName', e.target.value)
                              }
                              placeholder="e.g. Acme Inc."
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'تاريخ البدء' : 'Start Date'}
                            </label>
                            <Input
                              value={exp.startDate || ''}
                              onChange={(e) =>
                                handleExperienceChange(expIdx, 'startDate', e.target.value)
                              }
                              placeholder="YYYY-MM"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'تاريخ الانتهاء' : 'End Date'}
                            </label>
                            <Input
                              value={exp.endDate || ''}
                              disabled={exp.isCurrent}
                              onChange={(e) =>
                                handleExperienceChange(expIdx, 'endDate', e.target.value)
                              }
                              placeholder={
                                exp.isCurrent ? (isAr ? 'حتى الآن' : 'Present') : 'YYYY-MM'
                              }
                              className="text-xs"
                            />
                          </div>
                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!exp.isCurrent}
                                onChange={(e) =>
                                  handleExperienceChange(expIdx, 'isCurrent', e.target.checked)
                                }
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{isAr ? 'أعمل هنا حالياً' : 'Current role'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-2 pt-1 border-t border-border/40">
                          <label className="block text-[11px] font-semibold text-foreground">
                            {isAr ? 'النقاط والإنجازات (Bullets)' : 'Accomplishment Bullets'}
                          </label>
                          {(exp.bullets || []).map((bullet, bi) => (
                            <div key={bi} className="flex items-start gap-2">
                              <span className="text-primary mt-2 text-xs">•</span>
                              <Textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) =>
                                  handleUpdateExperienceBullet(expIdx, bi, e.target.value)
                                }
                                placeholder="Accomplished [X] as measured by [Y], by doing [Z]..."
                                className="text-xs flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExperienceBullet(expIdx, bi)}
                                className="text-muted-foreground hover:text-destructive p-1 mt-1 transition-colors cursor-pointer"
                                title={isAr ? 'حذف هذه النقطة' : 'Delete bullet'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddExperienceBullet(expIdx)}
                            className="text-xs text-primary gap-1 h-7 px-2"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{isAr ? 'إضافة نقطة إنجاز' : 'Add bullet'}</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddExperience}
                    className="w-full text-xs gap-1.5 border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAr ? 'إضافة خبرة عمل جديدة' : 'Add work experience'}</span>
                  </Button>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SECTION 3: EDUCATION */}
              {/* -------------------------------------------------------- */}
              {currentStep.key === 'education' && (
                <div className="space-y-4">
                  {data.educations.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      {isAr
                        ? 'لم يتم استخراج مؤهلات تعليمية من هذا الملف.'
                        : 'No education records extracted.'}
                    </div>
                  ) : (
                    data.educations.map((edu, eduIdx) => (
                      <div
                        key={eduIdx}
                        className="rounded-lg border border-border bg-card p-4 space-y-3 relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                            {isAr ? `المؤهل ${eduIdx + 1}` : `DEGREE #${eduIdx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(eduIdx)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-sm transition-colors cursor-pointer"
                            title={isAr ? 'حذف المؤهل' : 'Delete education'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'الدرجة العلمية *' : 'Degree *'}
                            </label>
                            <Input
                              value={edu.degree || ''}
                              onChange={(e) =>
                                handleEducationChange(eduIdx, 'degree', e.target.value)
                              }
                              placeholder="e.g. Bachelor of Science"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'المؤسسة التعليمية / الجامعة *' : 'Institution *'}
                            </label>
                            <Input
                              value={edu.institution || ''}
                              onChange={(e) =>
                                handleEducationChange(eduIdx, 'institution', e.target.value)
                              }
                              placeholder="e.g. MIT"
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'مجال الدراسة' : 'Field of Study'}
                            </label>
                            <Input
                              value={edu.fieldOfStudy || ''}
                              onChange={(e) =>
                                handleEducationChange(eduIdx, 'fieldOfStudy', e.target.value)
                              }
                              placeholder="e.g. Computer Science"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'تاريخ التخرج / الانتهاء' : 'Graduation Date'}
                            </label>
                            <Input
                              value={edu.endDate || ''}
                              onChange={(e) =>
                                handleEducationChange(eduIdx, 'endDate', e.target.value)
                              }
                              placeholder="YYYY-MM"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'التقدير / المعدل' : 'Grade / GPA'}
                            </label>
                            <Input
                              value={edu.grade || ''}
                              onChange={(e) =>
                                handleEducationChange(eduIdx, 'grade', e.target.value)
                              }
                              placeholder="e.g. 3.8 / 4.0"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEducation}
                    className="w-full text-xs gap-1.5 border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAr ? 'إضافة مؤهل تعليمي جديد' : 'Add education record'}</span>
                  </Button>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SECTION 4: SKILLS */}
              {/* -------------------------------------------------------- */}
              {currentStep.key === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSkill()
                        }
                      }}
                      placeholder={
                        isAr
                          ? 'أدخل اسم مهارة جديدة واضغط Enter...'
                          : 'Type a new skill and press Enter...'
                      }
                      className="text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSkill}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isAr ? 'إضافة' : 'Add'}</span>
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 min-h-[140px]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {isAr ? 'المهارات المعتمدة المستخرجة' : 'Extracted Competencies'}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {data.skills.length} {isAr ? 'مهارة' : 'skills'}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCategorizingSkills || data.skills.length === 0}
                        onClick={handleCategorizeSkills}
                        className="h-7 px-2.5 text-xs gap-1.5 rounded-[4px] border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                        title={
                          isAr
                            ? 'تصنيف المهارات تلقائياً باستخدام الذكاء الاصطناعي'
                            : 'Automatically categorize skills using AI'
                        }
                      >
                        {isCategorizingSkills ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-primary" />
                        )}
                        <span>
                          {isCategorizingSkills
                            ? isAr
                              ? 'جارٍ التصنيف...'
                              : 'Categorizing...'
                            : isAr
                              ? 'تصنيف ذكي (AI)'
                              : 'Categorize with AI'}
                        </span>
                      </Button>
                    </div>

                    {data.skills.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {isAr ? 'لم تتم إضافة مهارات بعد.' : 'No skills added yet.'}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {categorizedSkillsGroups.map((group) => (
                          <div key={group.category || 'all'} className="space-y-2">
                            {group.category && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {group.category}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/70">
                                  ({group.items.length})
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {group.items.map((skill) => {
                                const sIdx = data.skills.indexOf(skill)
                                return (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/40"
                                  >
                                    <span>{skill}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSkill(sIdx)}
                                      className="text-muted-foreground hover:text-destructive p-0.5 rounded-full transition-colors cursor-pointer"
                                      title={isAr ? 'حذف المهارة' : 'Remove skill'}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SECTION 5: PROJECTS */}
              {/* -------------------------------------------------------- */}
              {currentStep.key === 'projects' && (
                <div className="space-y-4">
                  {data.projects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                      {isAr
                        ? 'لم يتم استخراج مشاريع من هذا الملف.'
                        : 'No projects extracted from resume.'}
                    </div>
                  ) : (
                    data.projects.map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        className="rounded-lg border border-border bg-card p-4 space-y-3 relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                            {isAr ? `مشروع ${pIdx + 1}` : `PROJECT #${pIdx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(pIdx)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-sm transition-colors cursor-pointer"
                            title={isAr ? 'حذف المشروع' : 'Delete project'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'اسم المشروع *' : 'Project Name *'}
                            </label>
                            <Input
                              value={proj.name || ''}
                              onChange={(e) => handleProjectChange(pIdx, 'name', e.target.value)}
                              placeholder="e.g. Next.js SaaS Platform"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              {isAr ? 'دورك في المشروع' : 'Role'}
                            </label>
                            <Input
                              value={proj.role || ''}
                              onChange={(e) => handleProjectChange(pIdx, 'role', e.target.value)}
                              placeholder="e.g. Lead Architect"
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            {isAr
                              ? 'التقنيات المستخدمة (مفصولة بفواصل)'
                              : 'Technologies (comma separated)'}
                          </label>
                          <Input
                            value={(proj.technologies || []).join(', ')}
                            onChange={(e) =>
                              handleProjectChange(
                                pIdx,
                                'technologies',
                                e.target.value
                                  .split(',')
                                  .map((t) => t.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="React, TypeScript, Tailwind CSS, PostgreSQL"
                            className="text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            {isAr ? 'وصف المشروع والإنجاز' : 'Description'}
                          </label>
                          <Textarea
                            rows={2}
                            value={proj.description || ''}
                            onChange={(e) =>
                              handleProjectChange(pIdx, 'description', e.target.value)
                            }
                            placeholder="Engineered high-performance web platform serving 50k MAU..."
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddProject}
                    className="w-full text-xs gap-1.5 border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAr ? 'إضافة مشروع جديد' : 'Add project record'}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* STAGE 3: SUCCESS CELEBRATION */}
          {/* ========================================================== */}
          {modalStage === 'success' && (
            <div className="py-12 text-center space-y-4 animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
                <CheckCircle2 className="h-9 w-9 text-success animate-in zoom-in-75 duration-300 ease-out motion-reduce:animate-none" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-serif">
                {isAr ? 'تم تحديث الملف المهني بنجاح!' : 'Profile Successfully Synchronized!'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isAr
                  ? 'تم دمج وتحديث جميع البيانات المحددة في ملفك المهني الموحد.'
                  : 'All verified career details and merge rules were committed to your master profile.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Footer */}
        {modalStage === 'review' && (
          <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Left Actions: Back or Reset */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="text-xs gap-1 h-8"
                >
                  {isAr ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  )}
                  <span>{isAr ? 'السابق' : 'Back'}</span>
                </Button>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {activeStepIndex + 1} / {WIZARD_STEPS.length}
              </span>
            </div>

            {/* Right Actions: Next Step or Finish */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Optional Quick-commit button for power users */}
              {!isLastStep && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isCommitting}
                  onClick={handleCommitToProfile}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  {isAr ? 'تطبيق الكل فوراً' : 'Apply All Now'}
                </Button>
              )}

              {!isLastStep ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setActiveStepIndex((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1))
                  }
                  className="text-xs gap-1.5 h-8 font-medium"
                >
                  <span>
                    {isAr
                      ? `التالي: ${WIZARD_STEPS[activeStepIndex + 1]?.labelAr || ''}`
                      : `Next: ${WIZARD_STEPS[activeStepIndex + 1]?.labelEn || ''}`}
                  </span>
                  {isAr ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={isCommitting}
                  onClick={handleCommitToProfile}
                  className="text-xs gap-1.5 h-8 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{isAr ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {isTargetAr
                          ? isAr
                            ? 'اعتماد ومزامنة السيرة العربية'
                            : 'Sync to Arabic Resume'
                          : isAr
                            ? 'اعتماد ومزامنة الملف المهني'
                            : 'Finish & Sync to Profile'}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
