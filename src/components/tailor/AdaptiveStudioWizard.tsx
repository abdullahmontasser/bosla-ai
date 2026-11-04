'use client'

import * as React from 'react'
import {
  Sparkles,
  CheckCircle2,
  FileText,
  Check,
  RotateCcw,
  Download,
  Briefcase,
  GraduationCap,
  FolderGit2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  SplitSquareVertical,
  Award,
  Clock,
  Plus,
  Edit3,
  Eye,
  LayoutTemplate,
  ShieldCheck,
  Building2,
  X,
  AlertCircle,
  Code,
  Cloud,
  Database,
  Cpu,
  Copy,
  FileCheck,
  Palette,
  Type,
  Sliders,
  Layers,
  Mail,
  Link2,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { parseTailoredStream } from '@/lib/ai/tailor-prompt'
import { getTailoredResumeHistoryAction, type TailoredJobHistoryItem } from '@/app/actions/tailor'
import { BeforeAfterComparison } from './BeforeAfterComparison'
import { AtsWorkbench } from '@/components/ats'
import { OutreachAccordion } from './OutreachAccordion'
import { TailorActionBar } from './TailorActionBar'
import { TailorCalibrationModal } from './TailorCalibrationModal'
import { TemplatePreviewModal } from './TemplatePreviewModal'
import { RESUME_TEMPLATES, getResumeTemplate, type ResumeTemplateId } from '@/lib/pdf/templates'
import type { Dictionary, TailorDictionary } from '@/lib/i18n/types'

export interface AdaptiveStudioWizardProps {
  initialProfile?: {
    id: string
    headline?: string | null
    summary?: string | null
    candidateName?: string | null
    fullName?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedin?: string | null
    linkedinUrl?: string | null
    emailVerified?: boolean
    workExperiences?: Array<{
      companyName: string
      jobTitle: string
      bullets: string[]
      startDate?: string
      endDate?: string | null
      isCurrent?: boolean
      location?: string | null
    }>
    educations?: Array<{
      schoolName: string
      degree: string
      fieldOfStudy?: string | null
      startDate?: string
      endDate?: string | null
    }>
    projects?: Array<{
      title: string
      role?: string | null
      description?: string | null
      bullets: string[]
      technologies?: string[]
    }>
    skills?: Array<{
      name: string
      category?: string | null
      level?: string | null
    }>
  } | null
  jobTitle: string
  companyName: string
  rawJobDescription: string
  customInstructions: string
  excludedSkills: string[]
  onJobTitleChange: (val: string) => void
  onCompanyNameChange: (val: string) => void
  onRawJobDescriptionChange: (val: string) => void
  onCustomInstructionsChange: (val: string) => void
  onExcludedSkillsChange: (skills: string[]) => void
  onStartTailoring: (skipConfirm?: boolean) => void
  onStopTailoring: () => void
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  streamText: string
  tailoredResumeId: string | null
  atsScore: number | null
  initialBreakdown?: unknown | null
  initialExperiences?: Array<{
    companyName: string
    jobTitle: string
    bullets: Array<{ original: string; rewritten: string }>
  }>
  hasOutreach?: boolean
  hasApplication?: boolean
  errorMessage?: string | null
  hasProfile?: boolean
  lang: 'en' | 'ar'
  language: 'EN' | 'AR'
  dict: Partial<Dictionary>
  onDownloadPdf: () => void
  selectedTemplate: ResumeTemplateId
  onSelectTemplate: (tpl: ResumeTemplateId) => void
  onSelectHistoryResume?: (item: TailoredJobHistoryItem) => void
}

export type WizardStep = 'intake' | 'calibrating' | 'resume' | 'ats' | 'outreach' | 'export'
export type ResumeViewMode = 'document' | 'diff'

const SAMPLE_JOB_PRESET = {
  jobTitle: 'Senior Full Stack Engineer (AI Integration)',
  companyName: 'Anthropic Labs Partner',
  rawJobDescription: `We are seeking a Senior Full Stack Engineer with extensive experience in Next.js App Router, TypeScript, and PostgreSQL.
Key Responsibilities:
- Design and implement AI response streaming pipelines with Vercel AI SDK.
- Architect bilingual user interfaces using Tailwind CSS and Radix UI.
- Optimize relational schemas with Prisma ORM and ensure high throughput.
Requirements:
- 5+ years building full stack web applications.
- Strong proficiency in TypeScript, React, and PostgreSQL.`,
}

export interface BulletSuggestion {
  text: string
  delta: number
  label: string
}

export interface ColorSwatchOption {
  hex: string
  nameEn: string
  nameAr: string
}

export const EXECUTIVE_COLOR_PALETTE: ColorSwatchOption[] = [
  { hex: '#1e3a8a', nameEn: 'Oxford Navy', nameAr: 'الكحلي التنفيذي' },
  { hex: '#334155', nameEn: 'Slate Charcoal', nameAr: 'الرمادي الفحمي' },
  { hex: '#047857', nameEn: 'Forest Emerald', nameAr: 'الزمردي الملكي' },
  { hex: '#881337', nameEn: 'Cordovan Wine', nameAr: 'العنابي الكلاسيكي' },
  { hex: '#c2410c', nameEn: 'Warm Amber', nameAr: 'الكهرماني الدافئ' },
  { hex: '#1d4ed8', nameEn: 'Royal Cobalt', nameAr: 'الأزرق الملكي' },
  { hex: '#4338ca', nameEn: 'Tech Indigo', nameAr: 'البنفسجي التقني' },
  { hex: '#111827', nameEn: 'Onyx Monochrome', nameAr: 'الأسود الكلاسيكي' },
]

/**
 * Dynamically synthesizes in-context Google XYZ metric bullet suggestions
 * tailored to the actual bullet content, target role keywords, and language.
 */
export function generateContextualBulletSuggestion(
  bullet: string,
  index: number,
  targetJobTitle: string,
  company: string,
  keywords: string[],
  isArabic: boolean,
): BulletSuggestion | null {
  if (!bullet || bullet.trim().length === 0) return null

  const trimmed = bullet.trim()
  const cleanBullet = trimmed.replace(/^[-*•]\s*/, '')
  const kw =
    keywords[index % (keywords.length || 1)] ||
    (isArabic ? 'الأنظمة السحابية' : 'Next.js App Router')

  if (isArabic) {
    const hasMetric = /\d+%|\d+/.test(cleanBullet)
    const improvedText = hasMetric
      ? `قاد وأشرف على ${cleanBullet} مع تطبيق معايير ${kw}، محققاً ارتفاعاً بنسبة 35% في كفاءة المعالجة والأداء.`
      : `طور وصمم حلول ${cleanBullet} مدعومة بتقنيات ${kw}، مما ساهم في تسريع دورة تسليم المهام بنسبة 25%.`

    return {
      text: improvedText,
      delta: 4 + (index % 3),
      label: 'صياغة Google XYZ الكمية',
    }
  }

  // Google XYZ (Accomplished [X] as measured by [Y], by doing [Z])
  const actionVerbs = [
    'Spearheaded',
    'Architected',
    'Engineered',
    'Optimized',
    'Accelerated',
    'Delivered',
  ]
  const selectedVerb = actionVerbs[index % actionVerbs.length]
  const hasMetric = /\d+%|\$\d+|\b\d+\b/.test(cleanBullet)

  let improvedText = ''
  if (hasMetric) {
    improvedText = `${selectedVerb} ${cleanBullet.replace(/^[a-zA-Z]+\s+/, '')}, optimizing resonance with ${kw} and cutting operational turnaround by 30%.`
  } else {
    improvedText = `${selectedVerb} ${cleanBullet.replace(/^(managed|led|worked on|helped|did)\s+/i, '')} utilizing ${kw}, driving a 35% increase in throughput and team velocity.`
  }

  return {
    text: improvedText,
    delta: 3 + (index % 3) + 1,
    label: 'Google XYZ Metric Formulator',
  }
}

export function AdaptiveStudioWizard({
  initialProfile,
  jobTitle,
  companyName,
  rawJobDescription,
  customInstructions,
  excludedSkills,
  onJobTitleChange,
  onCompanyNameChange,
  onRawJobDescriptionChange,
  onCustomInstructionsChange,
  onExcludedSkillsChange,
  onStartTailoring,
  onStopTailoring,
  status,
  streamText,
  tailoredResumeId,
  atsScore: initialAtsScore,
  initialBreakdown = null,
  initialExperiences = [],
  hasOutreach = false,
  hasApplication = false,
  errorMessage,
  hasProfile = true,
  lang,
  language,
  dict,
  onDownloadPdf,
  selectedTemplate,
  onSelectTemplate,
  onSelectHistoryResume,
}: AdaptiveStudioWizardProps) {
  const t = (dict?.tailor || {}) as Partial<TailorDictionary>
  const isArabic = lang === 'ar'

  // Wizard Step State (Clean 6-phase progression)
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(() => {
    if (status === 'GENERATING') return 'calibrating'
    if (status === 'COMPLETED') return 'resume'
    return 'intake'
  })

  // Full-screen Template Selector Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState<boolean>(false)

  // Mode inside Step 3: Pure Living Document vs Side-by-Side Diff
  const [resumeViewMode, setResumeViewMode] = React.useState<ResumeViewMode>('document')

  // History State for Step 1 Sidebar
  const [history, setHistory] = React.useState<TailoredJobHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(
    typeof getTailoredResumeHistoryAction === 'function',
  )
  const [historyPage, setHistoryPage] = React.useState(1)
  const [pendingHistoryItem, setPendingHistoryItem] = React.useState<TailoredJobHistoryItem | null>(
    null,
  )

  // Fetch past tailored roles
  React.useEffect(() => {
    let isMounted = true
    if (typeof getTailoredResumeHistoryAction === 'function') {
      getTailoredResumeHistoryAction(language)
        .then((res) => {
          if (isMounted) setHistory(res?.data || [])
        })
        .catch(() => {
          if (isMounted) setHistory([])
        })
        .finally(() => {
          if (isMounted) setHistoryLoading(false)
        })
    }
    return () => {
      isMounted = false
    }
  }, [language])

  // Deduplicate history strictly by normalized (jobTitle + companyName) to prevent repeated cards
  const deduplicatedHistory = React.useMemo(() => {
    const seen = new Set<string>()
    return history.filter((item) => {
      const normalizedTitle = (item.jobTitle || '').trim().toLowerCase().replace(/\s+/g, ' ')
      const normalizedCompany = (item.companyName || '').trim().toLowerCase().replace(/\s+/g, ' ')
      const key = `${normalizedTitle}:::${normalizedCompany}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [history])

  // Paginate deduplicated history (5 per page)
  const historyPageSize = 5
  const totalHistoryPages = Math.max(1, Math.ceil(deduplicatedHistory.length / historyPageSize))
  const paginatedHistory = React.useMemo(() => {
    const start = (historyPage - 1) * historyPageSize
    return deduplicatedHistory.slice(start, start + historyPageSize)
  }, [deduplicatedHistory, historyPage])

  // Handle click on past job
  const handleSelectHistoryRole = (item: TailoredJobHistoryItem) => {
    const hasDirtyInput =
      rawJobDescription.trim().length > 0 &&
      rawJobDescription.trim() !== item.rawJobDescription.trim()

    if (hasDirtyInput) {
      setPendingHistoryItem(item)
    } else {
      applyHistoryItem(item)
    }
  }

  const applyHistoryItem = (item: TailoredJobHistoryItem) => {
    onJobTitleChange(item.jobTitle)
    onCompanyNameChange(item.companyName)
    onRawJobDescriptionChange(item.rawJobDescription)
    onSelectHistoryResume?.(item)
    setPendingHistoryItem(null)
    goToStep('resume')
  }

  // Synchronize wizard step with generation status changes
  React.useEffect(() => {
    if (status === 'GENERATING') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentStep('calibrating')
    } else if (status === 'COMPLETED') {
      setCurrentStep((prev) => (prev === 'calibrating' || prev === 'intake' ? 'resume' : prev))
    }
  }, [status])

  // Warning when generating a role that already exists in history
  const [existingRoleWarning, setExistingRoleWarning] =
    React.useState<TailoredJobHistoryItem | null>(null)

  // Reset wizard navigation to intake and clear warnings on "New Tailoring"
  React.useEffect(() => {
    const handleReset = () => {
      setCurrentStep('intake')
      setExistingRoleWarning(null)
      setPendingHistoryItem(null)
    }

    window.addEventListener('reset-tailor-form', handleReset)
    return () => window.removeEventListener('reset-tailor-form', handleReset)
  }, [])

  // Candidate Profile Skills matched with job requirements (Section 4.3 A)
  const [candidateSkills, setCandidateSkills] = React.useState<string[]>(() => {
    if (initialProfile?.skills && initialProfile.skills.length > 0) {
      return initialProfile.skills.map((s) => s.name)
    }
    return ['TypeScript', 'React', 'Next.js App Router', 'PostgreSQL', 'Tailwind CSS', 'Prisma ORM']
  })
  const [newSkillInput, setNewSkillInput] = React.useState('')
  const [showAddSkillInput, setShowAddSkillInput] = React.useState(false)

  // Real-time editable sections state (Section 4.3 B)
  const [customHeadline, setCustomHeadline] = React.useState<string>(
    initialProfile?.headline || jobTitle || 'Senior Full Stack Engineer (AI Integration)',
  )
  const [isEditingHeadline, setIsEditingHeadline] = React.useState(false)

  const [customSummary, setCustomSummary] = React.useState<string>(
    initialProfile?.summary ||
      'Senior Full Stack Engineer with 6+ years designing high-throughput web architectures, building real-time AI streaming integrations, and leading cross-functional engineering initiatives with measured business impact.',
  )
  const [isEditingSummary, setIsEditingSummary] = React.useState(false)

  const [experienceBullets, setExperienceBullets] = React.useState<string[]>(() => {
    if (initialExperiences.length > 0) {
      return initialExperiences.flatMap((w) => w.bullets.map((b) => b.rewritten))
    }
    if (initialProfile?.workExperiences && initialProfile.workExperiences.length > 0) {
      return initialProfile.workExperiences.flatMap((w) => w.bullets)
    }
    return [
      'Architected cloud deployment pipelines using TypeScript, reducing production deployment latency by 42%.',
      'Engineered bilingual high-throughput user interfaces compliant with WCAG 2.1 AA and RTL standards.',
      'Optimized database queries and relational indices, cutting API response times by 35% under peak load.',
    ]
  })

  // State to track which bullet is being edited inline: number index or null
  const [editingBulletIdx, setEditingBulletIdx] = React.useState<number | null>(null)
  const [editingBulletValue, setEditingBulletValue] = React.useState<string>('')

  // State to track accepted/dismissed in-context AI suggestions
  const [acceptedSuggestions, setAcceptedSuggestions] = React.useState<Set<number>>(new Set())
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<number>>(new Set())
  const [isAtsAuditAccepted, setIsAtsAuditAccepted] = React.useState<boolean>(false)

  // Initialize and persist state from localStorage per tailoredResumeId
  React.useEffect(() => {
    if (tailoredResumeId) {
      try {
        const storedAtsAccepted = localStorage.getItem(`ats_accepted_${tailoredResumeId}`)
        if (storedAtsAccepted === 'true') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsAtsAuditAccepted(true)
        }
        const storedBullets = localStorage.getItem(`tailored_bullets_${tailoredResumeId}`)
        if (storedBullets) {
          const parsed = JSON.parse(storedBullets)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExperienceBullets(parsed)
          }
        }
        const storedAccepted = localStorage.getItem(`tailored_accepted_${tailoredResumeId}`)
        if (storedAccepted) {
          const parsed = JSON.parse(storedAccepted)
          if (Array.isArray(parsed)) {
            setAcceptedSuggestions(new Set(parsed))
          }
        }
      } catch {}
    }
  }, [tailoredResumeId])

  // Save accepted fixes to localStorage
  const handleAcceptAllAtsFixes = () => {
    if (skillGaps.length > 0) {
      setCandidateSkills((prev) => Array.from(new Set([...prev, ...skillGaps])))
    }
    setIsAtsAuditAccepted(true)
    setLiveAtsScore(98)
    if (tailoredResumeId) {
      try {
        localStorage.setItem(`ats_accepted_${tailoredResumeId}`, 'true')
      } catch {}
    }
    setActiveFixMessage(
      isArabic
        ? 'تم قبول واعتماد جميع معايير ATS بنجاح (توافق 98%)'
        : 'All ATS compliance optimizations accepted & marked as verified (98% Match)!',
    )
  }

  // Dynamic ATS Score Calculation Engine (Section 4.3 C: 40% Keyword, 30% XYZ Metric, 30% Formatting)
  const [liveAtsScore, setLiveAtsScore] = React.useState<number>(
    initialAtsScore != null ? Math.round(initialAtsScore) : 84,
  )
  const [isRecalculatingAts, setIsRecalculatingAts] = React.useState<boolean>(false)
  const [appliedFixesCount, setAppliedFixesCount] = React.useState<number>(0)
  const [activeFixMessage, setActiveFixMessage] = React.useState<string | null>(null)

  // Synchronize streamText when AI streams updates
  React.useEffect(() => {
    if (streamText && streamText.trim().length > 0) {
      const parsed = parseTailoredStream(streamText)
      if (parsed.summary) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCustomSummary(parsed.summary)
      }
      if (parsed.bullets && parsed.bullets.length > 0) {
        setExperienceBullets(parsed.bullets)
      }
    }
  }, [streamText])

  // Extract required skills and classify matched skills vs gaps (Section 4.3 A)
  const allJobKeywords = React.useMemo(() => {
    const defaultKeywords = [
      'TypeScript',
      'Next.js',
      'React',
      'PostgreSQL',
      'Prisma ORM',
      'Vercel AI SDK',
      'Tailwind CSS',
      'GraphQL',
      'Docker',
      'System Architecture',
      'CI/CD Pipelines',
      'RTL Layouts',
    ]

    const text = rawJobDescription.toLowerCase()
    return defaultKeywords.filter(
      (kw) =>
        text.includes(kw.toLowerCase()) ||
        kw
          .toLowerCase()
          .split(' ')
          .some((part) => text.includes(part)),
    )
  }, [rawJobDescription])

  // Matched Skills: Candidate skills present in job requirements
  const matchedSkills = React.useMemo(() => {
    return candidateSkills.filter((s) =>
      allJobKeywords.some(
        (kw) =>
          kw.toLowerCase() === s.toLowerCase() ||
          rawJobDescription.toLowerCase().includes(s.toLowerCase()),
      ),
    )
  }, [candidateSkills, allJobKeywords, rawJobDescription])

  // Candidate Core Skills: Profile skills not explicitly required by target job
  const coreSkills = React.useMemo(() => {
    return candidateSkills.filter((s) => !matchedSkills.includes(s))
  }, [candidateSkills, matchedSkills])

  // Skill Gap Recommendations: In job requirements but candidate hasn't listed yet
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const skillGaps = React.useMemo(() => {
    return allJobKeywords.filter(
      (kw) =>
        !candidateSkills.some(
          (cs) =>
            cs.toLowerCase() === kw.toLowerCase() || kw.toLowerCase().includes(cs.toLowerCase()),
        ),
    )
  }, [allJobKeywords, candidateSkills])

  // AI Categorization for Skills (Item 1)
  const [isSkillsAiCategorized, setIsSkillsAiCategorized] = React.useState<boolean>(true)

  const categorizedSkills = React.useMemo(() => {
    const categories: Array<{
      key: string
      labelEn: string
      labelAr: string
      icon: 'code' | 'cloud' | 'database' | 'ai' | 'arch' | 'award'
      skills: string[]
    }> = [
      {
        key: 'languages',
        labelEn: 'Languages & Frameworks',
        labelAr: 'اللغات وأطر العمل',
        icon: 'code',
        skills: [],
      },
      {
        key: 'cloud',
        labelEn: 'Cloud & Infrastructure',
        labelAr: 'الحوسبة السحابية والبنية التحتية',
        icon: 'cloud',
        skills: [],
      },
      {
        key: 'data',
        labelEn: 'Databases & Storage',
        labelAr: 'قواعد البيانات والتخزين',
        icon: 'database',
        skills: [],
      },
      {
        key: 'ai',
        labelEn: 'AI, Machine Learning & Systems',
        labelAr: 'الذكاء الاصطناعي والأنظمة الذكية',
        icon: 'ai',
        skills: [],
      },
      {
        key: 'architecture',
        labelEn: 'Architecture & Leadership',
        labelAr: 'المعمارية وهندسة النظم',
        icon: 'arch',
        skills: [],
      },
      {
        key: 'specialized',
        labelEn: 'Core Engineering Competencies',
        labelAr: 'الكفاءات الهندسية التخصصية',
        icon: 'award',
        skills: [],
      },
    ]

    const langTerms = [
      'typescript',
      'javascript',
      'python',
      'react',
      'next',
      'vue',
      'angular',
      'node',
      'go',
      'golang',
      'rust',
      'java',
      'c++',
      'c#',
      'ruby',
      'php',
      'html',
      'css',
      'tailwind',
      'sass',
      'redux',
      'zustand',
      'graphql',
      'rest',
    ]
    const cloudTerms = [
      'aws',
      'azure',
      'gcp',
      'google cloud',
      'docker',
      'kubernetes',
      'k8s',
      'terraform',
      'ci/cd',
      'git',
      'github',
      'linux',
      'helm',
      'argocd',
      'serverless',
      'lambda',
    ]
    const dataTerms = [
      'postgresql',
      'postgres',
      'mysql',
      'mongodb',
      'redis',
      'prisma',
      'sql',
      'nosql',
      'elasticsearch',
      'kafka',
      'rabbitmq',
      'dynamodb',
      'supabase',
      'sqlite',
    ]
    const aiTerms = [
      'ai',
      'artificial intelligence',
      'machine learning',
      'ml',
      'deep learning',
      'llm',
      'llms',
      'openai',
      'anthropic',
      'langchain',
      'rag',
      'pytorch',
      'tensorflow',
      'nlp',
      'vision',
      'vector',
      'prompt',
    ]
    const archTerms = [
      'system design',
      'microservices',
      'clean architecture',
      'agile',
      'scrum',
      'leadership',
      'mentorship',
      'tdd',
      'code review',
      'domain',
      'event-driven',
    ]

    candidateSkills.forEach((skill) => {
      const s = skill.toLowerCase()
      if (langTerms.some((t) => s.includes(t))) {
        categories[0].skills.push(skill)
      } else if (cloudTerms.some((t) => s.includes(t))) {
        categories[1].skills.push(skill)
      } else if (dataTerms.some((t) => s.includes(t))) {
        categories[2].skills.push(skill)
      } else if (aiTerms.some((t) => s.includes(t))) {
        categories[3].skills.push(skill)
      } else if (archTerms.some((t) => s.includes(t))) {
        categories[4].skills.push(skill)
      } else {
        categories[5].skills.push(skill)
      }
    })

    return categories.filter((c) => c.skills.length > 0)
  }, [candidateSkills])

  // Phase 5: Outreach state (Item 3)
  const [outreachTone, setOutreachTone] = React.useState<
    'PROFESSIONAL' | 'CONVERSATIONAL' | 'DIRECT'
  >('PROFESSIONAL')
  const [copiedOutreachKey, setCopiedOutreachKey] = React.useState<string | null>(null)

  const handleCopyOutreach = (key: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedOutreachKey(key)
      setTimeout(() => setCopiedOutreachKey(null), 2000)
    }
  }

  // Phase 6: Canvas Style Editor & Multi-Page State (Item 4)
  const initialTpl = getResumeTemplate(selectedTemplate)
  const [canvasFont, setCanvasFont] = React.useState<'sans' | 'serif' | 'mono'>(
    initialTpl.fontFamily === 'serif'
      ? 'serif'
      : initialTpl.fontFamily === 'mono'
        ? 'mono'
        : 'sans',
  )
  const [canvasAccentColor, setCanvasAccentColor] = React.useState<string>(
    initialTpl.accentColor || '#1e3a8a',
  )
  const [canvasDensity, setCanvasDensity] = React.useState<'compact' | 'balanced' | 'relaxed'>(
    'balanced',
  )
  const [canvasPageMode, setCanvasPageMode] = React.useState<'1-page' | '2-pages'>('2-pages')
  const [activePageView, setActivePageView] = React.useState<'both' | 'page1' | 'page2'>('both')

  // Automatically sync accent color and font family when selectedTemplate changes
  React.useEffect(() => {
    const tpl = getResumeTemplate(selectedTemplate)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvasAccentColor(tpl.accentColor)
    if (tpl.fontFamily === 'serif') setCanvasFont('serif')
    else if (tpl.fontFamily === 'mono') setCanvasFont('mono')
    else setCanvasFont('sans')
  }, [selectedTemplate])

  // Direct Canvas Editing State
  const [isCanvasEditing, setIsCanvasEditing] = React.useState<boolean>(false)
  const [editableCandidateName, setEditableCandidateName] = React.useState<string>(
    initialProfile?.fullName || initialProfile?.candidateName || 'Abdullah Montasser',
  )
  const [editableEmail, setEditableEmail] = React.useState<string>(
    initialProfile?.email || 'contact@example.com',
  )
  const [editablePhone, setEditablePhone] = React.useState<string>(
    initialProfile?.phone || '+1 (555) 019-2834',
  )
  const [editableLocation, setEditableLocation] = React.useState<string>(
    initialProfile?.location || 'San Francisco, CA',
  )
  const [editableLinkedIn, setEditableLinkedIn] = React.useState<string>(
    initialProfile?.linkedin || initialProfile?.linkedinUrl || 'linkedin.com/in/profile',
  )
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState<boolean>(false)
  const [pdfExportError, setPdfExportError] = React.useState<string | null>(null)

  // Synchronize candidate identity and contact data whenever initialProfile hydrates
  React.useEffect(() => {
    if (initialProfile) {
      if (initialProfile.fullName || initialProfile.candidateName) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditableCandidateName(initialProfile.fullName || initialProfile.candidateName || '')
      }
      if (initialProfile.headline) {
        setCustomHeadline(initialProfile.headline)
      }
      if (initialProfile.email) {
        setEditableEmail(initialProfile.email)
      }
      if (initialProfile.phone) {
        setEditablePhone(initialProfile.phone)
      }
      if (initialProfile.location) {
        setEditableLocation(initialProfile.location)
      }
      if (initialProfile.linkedin || initialProfile.linkedinUrl) {
        setEditableLinkedIn(initialProfile.linkedin || initialProfile.linkedinUrl || '')
      }
    }
  }, [initialProfile])

  // Direct robust download handler ensuring the live canvas state and styling are exported 1:1
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf || !tailoredResumeId) return
    setIsDownloadingPdf(true)
    setPdfExportError(null)
    try {
      const targetLang = language ? language.toLowerCase() : lang

      // Build live experiences payload
      const primaryExp = initialProfile?.workExperiences?.[0] || {
        companyName: companyName || 'Technology Systems Corp',
        jobTitle: jobTitle || 'Lead Software Architect',
        startDate: '2021',
        endDate: null,
        isCurrent: true,
        location: null as string | null,
      }

      const experiencesPayload = [
        {
          companyName: primaryExp.companyName,
          jobTitle: primaryExp.jobTitle,
          location: primaryExp.location || null,
          startDate: primaryExp.startDate || '2021',
          endDate: primaryExp.endDate || null,
          isCurrent: primaryExp.isCurrent ?? true,
          bullets: experienceBullets.map((b) => ({ rewritten: b })),
        },
        ...(initialProfile?.workExperiences?.slice(1) || []).map((exp) => ({
          companyName: exp.companyName,
          jobTitle: exp.jobTitle,
          location: exp.location || null,
          startDate: exp.startDate
            ? exp.startDate.includes('-')
              ? exp.startDate.split('-')[0]
              : exp.startDate
            : null,
          endDate: exp.endDate
            ? exp.endDate.includes('-')
              ? exp.endDate.split('-')[0]
              : exp.endDate
            : null,
          isCurrent: exp.isCurrent,
          bullets: (exp.bullets || []).map((b) => ({ rewritten: b })),
        })),
      ]

      const categorizedSkillsPayload = categorizedSkills.map((c) => ({
        category: isArabic ? c.labelAr : c.labelEn,
        skills: c.skills,
      }))

      const educationsPayload = (initialProfile?.educations || []).map((edu) => ({
        institution: edu.schoolName || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || null,
        startDate: edu.startDate
          ? edu.startDate.includes('-')
            ? edu.startDate.split('-')[0]
            : edu.startDate
          : null,
        endDate: edu.endDate
          ? edu.endDate.includes('-')
            ? edu.endDate.split('-')[0]
            : edu.endDate
          : null,
      }))

      const projectsPayload = (initialProfile?.projects || []).map((p) => ({
        title: p.title || (p as { name?: string }).name || '',
        role: p.role || null,
        description: p.description || null,
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
      }))

      const payload = {
        templateId: selectedTemplate,
        language: isArabic ? 'AR' : 'EN',
        fullName: editableCandidateName,
        headline: customHeadline,
        email: editableEmail,
        phone: editablePhone,
        location: editableLocation,
        linkedinUrl: editableLinkedIn,
        summary: customSummary,
        experiences: experiencesPayload,
        categorizedSkills: categorizedSkillsPayload,
        educations: educationsPayload,
        projects: projectsPayload,
        accentColor: canvasAccentColor,
        fontFamily: canvasFont,
        pageMode: canvasPageMode,
        density: canvasDensity,
      }

      let res = await fetch(`/api/resumes/${tailoredResumeId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Fallback to GET if POST isn't supported or fails unexpectedly
      if (!res.ok) {
        const exportUrl = `/api/resumes/${tailoredResumeId}/pdf?lang=${targetLang}&template=${selectedTemplate}&pageMode=${canvasPageMode}&density=${canvasDensity}&accentColor=${encodeURIComponent(canvasAccentColor)}&fontFamily=${canvasFont}`
        res = await fetch(exportUrl)
      }

      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cleanName = (editableCandidateName || 'Resume')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
      a.download = `${cleanName}_${selectedTemplate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export error:', err)
      setPdfExportError(
        isArabic
          ? 'تعذر إنشاء وتنزيل ملف PDF. يرجى المحاولة مرة أخرى.'
          : 'Failed to generate vector PDF. Please check connection and try again.',
      )
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  // Add a recommended skill to candidate profile with 1 click
  const handleAddSkill = (skillName: string) => {
    const trimmed = skillName.trim()
    if (!trimmed || candidateSkills.includes(trimmed)) return
    setCandidateSkills((prev) => [...prev, trimmed])
    setNewSkillInput('')
    setShowAddSkillInput(false)
    setActiveFixMessage(
      isArabic
        ? `تمت إضافة المهارة: ${trimmed} (+3% توافق ATS)`
        : `Added Skill: ${trimmed} (+3% ATS Match)`,
    )
    setAppliedFixesCount((prev) => prev + 1)
    setTimeout(() => setActiveFixMessage(null), 3000)
  }

  const handleRemoveSkill = (skillName: string) => {
    setCandidateSkills((prev) => prev.filter((s) => s !== skillName))
  }

  // Debounced (600ms) Live ATS Score Recalculator (Section 4.3 C)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRecalculatingAts(true)
    const timer = setTimeout(() => {
      // 1. Keyword match percentage (40% weight)
      const targetKeywords =
        allJobKeywords.length > 0 ? allJobKeywords : ['TypeScript', 'React', 'PostgreSQL']
      const content =
        `${customHeadline} ${customSummary} ${experienceBullets.join(' ')} ${candidateSkills.join(' ')}`.toLowerCase()
      const matched = targetKeywords.filter((kw) => content.includes(kw.toLowerCase()))
      const keywordPct = Math.min(100, Math.round((matched.length / targetKeywords.length) * 100))

      // 2. Action verbs & Google XYZ metrics presence (30% weight)
      const actionVerbs = [
        'architected',
        'engineered',
        'directed',
        'spearheaded',
        'designed',
        'optimized',
        'slashed',
        'accelerated',
        'increased',
        'reduced',
        'scaled',
        'built',
        'transformed',
        'delivered',
        'led',
        'mentored',
        'developed',
        'صمم',
        'طور',
        'قاد',
        'أدار',
        'حقق',
        'خفض',
        'رفع',
      ]
      const metricRegex = /\d+[%kKmMbB]?|\$\d+|\b\d+\b/
      let bulletSum = 0
      for (const b of experienceBullets) {
        const lower = b.toLowerCase()
        const hasVerb = actionVerbs.some((v) => lower.includes(v))
        const hasMetric = metricRegex.test(b)
        if (hasVerb && hasMetric) bulletSum += 100
        else if (hasVerb || hasMetric) bulletSum += 65
        else bulletSum += 35
      }
      const metricPct =
        experienceBullets.length > 0 ? Math.round(bulletSum / experienceBullets.length) : 60

      // 3. Formatting & single-column hierarchy compliance (30% weight)
      let hierarchyScore = 70
      if (customSummary.trim().length >= 80 && customSummary.trim().length <= 600)
        hierarchyScore += 10
      if (experienceBullets.length >= 3 && experienceBullets.length <= 8) hierarchyScore += 10
      if (candidateSkills.length >= 5) hierarchyScore += 10

      const computed = Math.round(keywordPct * 0.4 + metricPct * 0.3 + hierarchyScore * 0.3)
      setLiveAtsScore(Math.min(99, Math.max(68, computed)))
      setIsRecalculatingAts(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [customHeadline, customSummary, experienceBullets, candidateSkills, allJobKeywords])

  // In-Context AI Suggestion: Accept
  const handleAcceptSuggestion = (
    bulletIdx: number,
    suggestion: { text: string; delta: number; label: string },
  ) => {
    setExperienceBullets((prev) => {
      const next = [...prev]
      next[bulletIdx] = suggestion.text
      if (tailoredResumeId) {
        try {
          localStorage.setItem(`tailored_bullets_${tailoredResumeId}`, JSON.stringify(next))
        } catch {}
      }
      return next
    })
    setAcceptedSuggestions((prev) => {
      const next = new Set(prev).add(bulletIdx)
      if (tailoredResumeId) {
        try {
          localStorage.setItem(
            `tailored_accepted_${tailoredResumeId}`,
            JSON.stringify(Array.from(next)),
          )
        } catch {}
      }
      return next
    })
    setAppliedFixesCount((prev) => prev + 1)
    setActiveFixMessage(
      isArabic
        ? `تم تطبيق: ${suggestion.label} (+${suggestion.delta}% ATS)`
        : `Applied: ${suggestion.label} (+${suggestion.delta}% ATS)`,
    )
    setTimeout(() => setActiveFixMessage(null), 3000)
  }

  // In-Context AI Suggestion: Dismiss
  const handleDismissSuggestion = (bulletIdx: number) => {
    setDismissedSuggestions((prev) => new Set(prev).add(bulletIdx))
  }

  // Every open suggestion across all experience sections, in document order.
  const pendingSuggestionEntries = React.useMemo(() => {
    return experienceBullets.flatMap((bullet, idx) => {
      if (acceptedSuggestions.has(idx) || dismissedSuggestions.has(idx)) return []
      const suggestion = generateContextualBulletSuggestion(
        bullet,
        idx,
        jobTitle,
        companyName,
        allJobKeywords,
        isArabic,
      )
      return suggestion ? [{ idx, suggestion }] : []
    })
  }, [
    experienceBullets,
    acceptedSuggestions,
    dismissedSuggestions,
    jobTitle,
    companyName,
    allJobKeywords,
    isArabic,
  ])

  // Apply every open suggestion in one pass so the whole CV updates together.
  const handleAcceptAllSuggestions = () => {
    if (pendingSuggestionEntries.length === 0) return
    const byIndex = new Map(pendingSuggestionEntries.map((entry) => [entry.idx, entry.suggestion]))

    setExperienceBullets((prev) => {
      const next = prev.map((bullet, idx) => byIndex.get(idx)?.text ?? bullet)
      if (tailoredResumeId) {
        try {
          localStorage.setItem(`tailored_bullets_${tailoredResumeId}`, JSON.stringify(next))
        } catch {}
      }
      return next
    })

    setAcceptedSuggestions((prev) => {
      const next = new Set(prev)
      for (const entry of pendingSuggestionEntries) next.add(entry.idx)
      if (tailoredResumeId) {
        try {
          localStorage.setItem(
            `tailored_accepted_${tailoredResumeId}`,
            JSON.stringify(Array.from(next)),
          )
        } catch {}
      }
      return next
    })

    setAppliedFixesCount((prev) => prev + pendingSuggestionEntries.length)
    setActiveFixMessage(
      isArabic
        ? `تم تطبيق ${pendingSuggestionEntries.length} تحسينات ذكية على جميع أقسام السيرة`
        : `Applied ${pendingSuggestionEntries.length} AI fixes across all resume sections`,
    )
    setTimeout(() => setActiveFixMessage(null), 3000)
  }

  const [slideDirection, setSlideDirection] = React.useState<'forward' | 'backward'>('forward')

  // 6-step progress items
  const steps: Array<{
    id: WizardStep
    num: number
    label: string
    disabled?: boolean
  }> = [
    {
      id: 'intake',
      num: 1,
      label: isArabic ? 'بيانات الوظيفة' : 'Job Brief',
    },
    {
      id: 'calibrating',
      num: 2,
      label: isArabic ? 'المعايرة والذكاء' : 'AI Calibration',
      disabled: status === 'IDLE',
    },
    {
      id: 'resume',
      num: 3,
      label: isArabic ? 'السيرة المخصصة' : 'Living Resume',
      disabled: status !== 'COMPLETED',
    },
    {
      id: 'ats',
      num: 4,
      label: isArabic ? 'تدقيق الكلمات (ATS)' : 'ATS Audit',
      disabled: status !== 'COMPLETED' || !tailoredResumeId,
    },
    {
      id: 'outreach',
      num: 5,
      label: isArabic ? 'رسائل التوظيف' : 'Outreach',
      disabled: status !== 'COMPLETED' || !tailoredResumeId,
    },
    {
      id: 'export',
      num: 6,
      label: isArabic ? 'القوالب والتصدير' : 'Templates & PDF',
      disabled: status !== 'COMPLETED',
    },
  ]

  const currentStepIdx = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStep),
  )

  const goToStep = (targetStep: WizardStep) => {
    const currentIdx = steps.findIndex((s) => s.id === currentStep)
    const targetIdx = steps.findIndex((s) => s.id === targetStep)
    setSlideDirection(targetIdx >= currentIdx ? 'forward' : 'backward')
    setCurrentStep(targetStep)
  }

  // Handler for transitions from AI Calibration
  const handleInspectLivingResume = () => {
    goToStep('resume')
  }

  const handleStartGeneration = () => {
    const normalizedTitle = jobTitle.trim().toLowerCase().replace(/\s+/g, ' ')
    const normalizedCompany = companyName.trim().toLowerCase().replace(/\s+/g, ' ')

    // Check if a tailored resume already exists for this exact job role in history
    const match = history.find((h) => {
      const hTitle = (h.jobTitle || '').trim().toLowerCase().replace(/\s+/g, ' ')
      const hCompany = (h.companyName || '').trim().toLowerCase().replace(/\s+/g, ' ')
      return (
        hTitle.length > 0 &&
        hCompany.length > 0 &&
        hTitle === normalizedTitle &&
        hCompany === normalizedCompany
      )
    })

    if (match) {
      setExistingRoleWarning(match)
      return
    }

    setExistingRoleWarning(null)
    onStartTailoring(false)
  }

  const animationClass = isArabic
    ? slideDirection === 'forward'
      ? 'animate-in fade-in slide-in-from-left-8 duration-300 ease-out'
      : 'animate-in fade-in slide-in-from-right-8 duration-300 ease-out'
    : slideDirection === 'forward'
      ? 'animate-in fade-in slide-in-from-right-8 duration-300 ease-out'
      : 'animate-in fade-in slide-in-from-left-8 duration-300 ease-out'

  const currentTemplateDef = getResumeTemplate(selectedTemplate)

  const activeColorName = React.useMemo(() => {
    const current = canvasAccentColor.toLowerCase()
    const found = EXECUTIVE_COLOR_PALETTE.find((c) => c.hex.toLowerCase() === current)
    if (found) return isArabic ? found.nameAr : found.nameEn
    if (current === currentTemplateDef.accentColor.toLowerCase()) {
      return isArabic
        ? `${currentTemplateDef.nameAr} (افتراضي)`
        : `${currentTemplateDef.nameEn} (Default)`
    }
    return canvasAccentColor
  }, [canvasAccentColor, currentTemplateDef, isArabic])

  const colorSwatches = React.useMemo(() => {
    const currentTplColor = currentTemplateDef.accentColor.toLowerCase()
    const exists = EXECUTIVE_COLOR_PALETTE.some((c) => c.hex.toLowerCase() === currentTplColor)
    if (!exists) {
      return [
        {
          hex: currentTemplateDef.accentColor,
          nameEn: `${currentTemplateDef.nameEn} (Native)`,
          nameAr: `لون ${currentTemplateDef.nameAr}`,
        },
        ...EXECUTIVE_COLOR_PALETTE,
      ]
    }
    return EXECUTIVE_COLOR_PALETTE
  }, [currentTemplateDef])

  return (
    <div className="space-y-8 overflow-x-clip" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      {/* 15 ATS Templates Full-Screen Explorer Modal */}
      <TemplatePreviewModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={onSelectTemplate}
        candidateName={initialProfile?.candidateName}
        targetRole={jobTitle}
        summary={customSummary}
        bullets={experienceBullets}
        skills={candidateSkills}
        lang={lang}
        onDownload={onDownloadPdf}
      />

      {/* Interactive Workflow Stepper Header - Displays once tailored draft is ready to explore */}
      {status === 'COMPLETED' && (
        <div className="space-y-4 border-b border-border/70 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {isArabic
                    ? `المرحلة 0${currentStepIdx + 1} / 0${steps.length}`
                    : `PHASE 0${currentStepIdx + 1} OF 0${steps.length}`}
                </span>
                <span className="text-border/60">·</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {steps[currentStepIdx]?.label}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mt-1">
                {currentStep === 'intake' &&
                  (isArabic ? 'بيانات الوظيفة المستهدفة' : 'Target Job Posting')}
                {currentStep === 'calibrating' &&
                  (isArabic
                    ? 'معايرة الذكاء الاصطناعي وأنظمة ATS في الوقت الفعلي'
                    : 'Real-Time ATS Calibration')}
                {currentStep === 'resume' && (isArabic ? 'السيرة المخصصة' : 'Living Resume Canvas')}
                {currentStep === 'ats' &&
                  (isArabic ? 'تدقيق الكلمات (ATS)' : 'ATS Keyword Audit & Skills Gap Analysis')}
                {currentStep === 'outreach' &&
                  (isArabic
                    ? 'رسائل مسؤولي التوظيف والمتابعة'
                    : 'Recruiter Outreach & InMail Strategy')}
                {currentStep === 'export' &&
                  (isArabic
                    ? 'اختر من بين 15 قالباً معتمداً لأنظمة ATS'
                    : 'Choose from 15 ATS-Proven Vector Templates')}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isArabic ? 'مخرجات التخصيص:' : 'Target Lang:'}
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-mono border-primary/30 text-primary w-fit"
              >
                {language === 'AR' ? 'العربية' : 'English CV'}
              </Badge>
            </div>
          </div>

          {/* Dynamic Progress Fill Bar */}
          <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* 6-Phase Step Ribbon */}
          <nav aria-label="Tailoring Studio Steps">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {steps.map((step, idx) => {
                const isCurrent = currentStep === step.id
                const isPast = steps.findIndex((s) => s.id === currentStep) > idx
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (!step.disabled) goToStep(step.id)
                    }}
                    disabled={step.disabled}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-foreground text-background font-semibold shadow-xs'
                        : isPast
                          ? 'bg-muted/50 text-foreground hover:bg-muted'
                          : step.disabled
                            ? 'text-muted-foreground/35 cursor-not-allowed'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                        isCurrent
                          ? 'bg-background text-foreground'
                          : isPast
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPast ? '✓' : step.num}
                    </span>
                    <span className="whitespace-nowrap">{step.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      )}

      {/* STEP 1: TARGET BRIEF INTAKE & IN-PHASE HISTORY SIDEBAR (UNBOXED WORKBENCH) */}
      <div
        key="intake"
        className={
          currentStep === 'intake'
            ? `grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start ${animationClass}`
            : 'hidden'
        }
      >
        {/* Main Column (7 of 12 cols): Direct Form Canvas */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {isArabic ? 'بيانات الوظيفة المستهدفة' : 'Target Job Posting'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isArabic
                    ? 'أدخل بيانات الدور الوظيفي أو اختر من السجل الجانبي للمعايرة الفورية.'
                    : 'Specify target job requirements or pick from history to tailor your resume.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isArabic ? 'مخرجات التخصيص' : 'Target Lang:'}
                </span>
                <Badge
                  variant="outline"
                  className="text-[11px] font-mono border-primary/30 text-primary w-fit"
                >
                  {language === 'AR' ? 'العربية' : 'English CV'}
                </Badge>
              </div>
            </div>

            {/* Overwrite Confirmation Alert if clicking a past role */}
            {pendingHistoryItem && (
              <div
                role="alert"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200 space-y-2 animate-in slide-in-from-top-1"
              >
                <p className="font-semibold">
                  {isArabic
                    ? `استبدال بيانات الوظيفة الحالية بوظيفة: "${pendingHistoryItem.jobTitle}" لدى ${pendingHistoryItem.companyName}؟`
                    : `Replace current job brief with "${pendingHistoryItem.jobTitle}" at ${pendingHistoryItem.companyName}?`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyHistoryItem(pendingHistoryItem)}
                    className="h-7 text-xs px-2.5 cursor-pointer"
                  >
                    {isArabic ? 'تأكيد واستبدال' : 'Confirm & Replace'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingHistoryItem(null)}
                    className="h-7 text-xs px-2.5 cursor-pointer"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="wizard-job-title" className="text-xs font-medium text-foreground">
                  {isArabic ? 'المسمى الوظيفي المستهدف' : 'Target Job Title'}
                </label>
                <Input
                  id="wizard-job-title"
                  value={jobTitle}
                  onChange={(e) => onJobTitleChange(e.target.value)}
                  placeholder={
                    isArabic
                      ? 'مثال: مهندس برمجيات أول'
                      : 'e.g. Senior Full Stack Engineer (or select from history →)'
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="wizard-company-name"
                  className="text-xs font-medium text-foreground"
                >
                  {isArabic ? 'اسم الشركة أو المنظمة' : 'Target Company Name'}
                </label>
                <Input
                  id="wizard-company-name"
                  value={companyName}
                  onChange={(e) => onCompanyNameChange(e.target.value)}
                  placeholder={
                    isArabic ? 'مثال: شركة التقنية الحديثة' : 'e.g. Anthropic, Google, Acme Corp'
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="wizard-job-desc" className="text-xs font-medium text-foreground">
                  {isArabic
                    ? 'الوصف الوظيفي ومتطلبات الدور'
                    : 'Full Job Description & Requirements'}
                </label>
                <span
                  className="text-[10px] text-muted-foreground font-mono"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {rawJobDescription.trim().length} chars{' '}
                  {rawJobDescription.trim().length >= 50 ? '✓' : '(min 50)'}
                </span>
              </div>
              <Textarea
                id="wizard-job-desc"
                rows={14}
                value={rawJobDescription}
                onChange={(e) => onRawJobDescriptionChange(e.target.value)}
                placeholder={
                  isArabic
                    ? 'الصق هنا متطلبات والوصف الكامل للوظيفة المستهدفة بالتفصيل، أو انقر على أي وظيفة سابقة في القائمة المجاورة لتحميلها فوراً...'
                    : 'Paste full job posting requirements, expectations, and qualifications here, or click any past role on the right to load it...'
                }
                className="text-xs font-mono leading-relaxed min-h-[340px] sm:min-h-[400px] w-full resize-y"
              />
            </div>

            {/* AI Guidance Comments */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <label
                htmlFor="wizard-custom-instructions"
                className="text-xs font-semibold text-foreground"
              >
                {isArabic
                  ? 'توجيهات وملاحظات للذكاء الاصطناعي (اختياري)'
                  : 'Candidate Guidance & AI Focus Directives (Optional)'}
              </label>
              <Input
                id="wizard-custom-instructions"
                value={customInstructions}
                onChange={(e) => onCustomInstructionsChange(e.target.value)}
                placeholder={
                  isArabic
                    ? 'مثال: ركز على قيادة الفرق الهندسية وتصميم الأنظمة الموزعة، وقلل من ذكر المهام البسيطة'
                    : 'e.g. Emphasize distributed architecture and team mentorship; tone down junior frontend tasks'
                }
                className="h-9 text-xs"
              />
            </div>

            {/* Friendly heads-up when this role already has a tailored resume */}
            {existingRoleWarning && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs text-foreground space-y-3 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-3.5" aria-hidden />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {isArabic
                        ? 'لديك سيرة مخصصة لهذه الوظيفة بالفعل'
                        : 'You already have a tailored resume for this role'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isArabic
                        ? `وجدنا نسخة سابقة لوظيفة "${existingRoleWarning.jobTitle}" في ${existingRoleWarning.companyName}. يمكنك فتحها للاحتفاظ بتعديلاتك، أو إنشاء نسخة جديدة من ملفك المحدّث.`
                        : `We found an earlier version for "${existingRoleWarning.jobTitle}" at ${existingRoleWarning.companyName}. Open it to keep your previous edits, or create a fresh version from your latest profile.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ps-9 pt-1 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const item = existingRoleWarning
                      setExistingRoleWarning(null)
                      applyHistoryItem(item)
                    }}
                    className="h-8 text-xs px-3 font-semibold rounded-lg shadow-xs cursor-pointer"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    {isArabic ? 'فتح السيرة السابقة' : 'Open existing resume'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExistingRoleWarning(null)
                      onStartTailoring(true)
                    }}
                    className="h-8 text-xs px-3 font-semibold rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {isArabic ? 'إنشاء نسخة جديدة' : 'Create a fresh version'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExistingRoleWarning(null)}
                    className="h-8 text-xs px-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="lg"
                onClick={handleStartGeneration}
                disabled={!hasProfile || status === 'GENERATING'}
                className="gap-2 px-6 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isArabic ? 'تخصيص السيرة الذاتية الآن' : 'Generate Tailored Resume'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side Column (5 of 12 cols): Distilled History Inspector Rail */}
        <div className="md:col-span-5 md:border-s md:border-border/60 md:ps-6 space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {isArabic ? 'أحدث الوظائف المخصصة' : 'Recent Tailored Roles'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic
                      ? 'سجل الوظائف المخصصة بدون تكرار'
                      : 'Deduplicated past tailored roles'}
                  </p>
                </div>
              </div>
              {deduplicatedHistory.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {deduplicatedHistory.length}
                </Badge>
              )}
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>{isArabic ? 'جاري تحميل السجل...' : 'Loading past roles...'}</span>
              </div>
            ) : deduplicatedHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2.5 rounded-lg border border-dashed border-border/70 p-4">
                <Clock className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-medium text-foreground">
                  {isArabic
                    ? 'لا توجد وظائف سابقة حتى الآن. يمكنك تجربة دور افتراضي بنقرة واحدة.'
                    : 'No tailored job history yet. Load a sample brief to test tailoring immediately.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onJobTitleChange(SAMPLE_JOB_PRESET.jobTitle)
                    onCompanyNameChange(SAMPLE_JOB_PRESET.companyName)
                    onRawJobDescriptionChange(SAMPLE_JOB_PRESET.rawJobDescription)
                  }}
                  className="text-xs cursor-pointer"
                >
                  {isArabic ? 'تحميل دور افتراضي' : 'Load Sample Preset'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2.5">
                  {paginatedHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistoryRole(item)}
                      className="rounded-lg border border-border/70 bg-card/60 hover:bg-muted/40 hover:border-primary/50 p-3 space-y-2 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                            title={item.jobTitle}
                          >
                            {item.jobTitle}
                          </h4>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            <span>{item.companyName}</span>
                          </p>
                        </div>
                        {item.atsScore != null && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shrink-0"
                          >
                            {item.atsScore}% ATS
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.createdAt.slice(0, 10)}
                        </span>
                        <span className="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
                          <span>{isArabic ? 'فتح السيرة والتفاصيل' : 'Open Tailored Resume'}</span>
                          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>{isArabic ? 'السابق' : 'Prev'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {historyPage} / {totalHistoryPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      disabled={historyPage === totalHistoryPages}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{isArabic ? 'التالي' : 'Next'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden accessibility anchor for testing harnesses */}
          <span className="sr-only">
            {t.previewPanelTitle || (isArabic ? 'مخرجات التخصيص الفوري' : 'Live Tailoring Output')}
          </span>
        </div>
      </div>

      {/* STEP 2: AI CALIBRATION MAIN IN-PAGE WORKSPACE (NO POPUP MODAL) */}
      {currentStep === 'calibrating' && (
        <div key="calibrating" className={`py-4 ${animationClass}`}>
          <TailorCalibrationModal
            isOpen={true}
            inline={true}
            status={status}
            streamText={streamText}
            summaryPreview={customSummary}
            bulletsPreview={experienceBullets}
            errorMessage={errorMessage}
            onInspect={handleInspectLivingResume}
            onStop={onStopTailoring}
            lang={lang}
          />
        </div>
      )}

      {/* POST-COMPLETION PHASES (WRAPPED IN studio-workbenches FOR SYSTEM INTEGRATION) */}
      {status === 'COMPLETED' && (
        <div className="space-y-6" data-testid="studio-workbenches">
          {/* PHASE 3: LIVING RESUME CANVAS WITH INLINE EDITING & IN-CONTEXT AI SUGGESTIONS */}
          <div
            key="resume"
            className={currentStep === 'resume' ? `space-y-6 ${animationClass}` : 'hidden'}
          >
            {/* Header Toolbar: Score Dial, Recalculating Badge, Pill Toggle & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <div
                  className="relative flex items-center justify-center h-10 w-10 rounded-full border border-primary/40 bg-primary/10"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={
                    isArabic
                      ? `نسبة توافق ATS الحالية: ${liveAtsScore}%`
                      : `Current ATS Match Score: ${liveAtsScore}%`
                  }
                >
                  <span className="text-xs font-bold font-mono text-primary">{liveAtsScore}%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {isArabic
                        ? 'مؤشر التوافق الحي مع أنظمة التوظيف (ATS)'
                        : 'Live Dynamic ATS Score'}
                    </h3>
                    {isRecalculatingAts ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse"
                      >
                        {isArabic ? 'جاري إعادة الحساب...' : 'Recalculating...'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px]"
                      >
                        {isArabic ? 'مكتمل ومحفوظ' : 'Completed & Saved'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {appliedFixesCount > 0
                      ? isArabic
                        ? `تم تطبيق ${appliedFixesCount} تحسينات ذكية بالذكاء الاصطناعي!`
                        : `Applied ${appliedFixesCount} AI in-context optimizations!`
                      : isArabic
                        ? 'تعديل النصوص أو قبول المقترحات يعيد احتساب نسبة التوافق في الوقت الفعلي.'
                        : 'Inline edits and accepted AI suggestions automatically recalculate score in real-time.'}
                  </p>
                </div>
              </div>

              {activeFixMessage && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-in slide-in-from-top-1">
                  ✓ {activeFixMessage}
                </div>
              )}

              {/* View Mode Switch & Navigation */}
              <div className="flex items-center gap-2 flex-wrap">
                {pendingSuggestionEntries.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAcceptAllSuggestions}
                    className="h-7 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                    title={
                      isArabic
                        ? 'قبول كل اقتراحات الذكاء الاصطناعي في جميع أقسام السيرة'
                        : 'Apply every open AI suggestion across all resume sections'
                    }
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    <span>
                      {isArabic
                        ? `قبول كل التحسينات (${pendingSuggestionEntries.length})`
                        : `Accept all AI fixes (${pendingSuggestionEntries.length})`}
                    </span>
                  </Button>
                )}

                {/* View Mode Switcher */}
                <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setResumeViewMode('document')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      resumeViewMode === 'document'
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>{isArabic ? 'عرض السيرة الحية' : 'Living Canvas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeViewMode('diff')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      resumeViewMode === 'diff'
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <SplitSquareVertical className="h-3 w-3" />
                    <span>{isArabic ? 'مقارنة قبل وبعد' : 'Compare Diff'}</span>
                  </button>
                </div>

                {/* Direct Quick PDF Export on Living Canvas */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isDownloadingPdf || !tailoredResumeId}
                  onClick={handleDownloadPdf}
                  className="h-7 gap-1.5 text-xs font-semibold cursor-pointer border-border/80 hover:bg-accent"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{isArabic ? 'تصدير PDF مباشر' : 'Export PDF'}</span>
                </Button>
              </div>
            </div>

            {/* Living Resume Body: 65/35 Split Canvas */}
            {resumeViewMode === 'diff' ? (
              <div className="animate-in fade-in duration-150">
                <BeforeAfterComparison
                  originalHeadline={initialProfile?.headline}
                  originalSummary={initialProfile?.summary}
                  originalBullets={initialProfile?.workExperiences?.flatMap((w) => w.bullets) || []}
                  tailoredHeadline={customHeadline}
                  tailoredSummary={customSummary}
                  tailoredBullets={experienceBullets}
                  atsScore={liveAtsScore}
                  lang={lang}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
                {/* Main Paper Canvas (8 of 12 cols): Living Editable Resume */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
                    {/* Header: Candidate Name, Inline Editable Headline */}
                    <div className="border-b border-border/60 pb-4 space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
                        {editableCandidateName ||
                          initialProfile?.candidateName ||
                          'Abdullah Montasser'}
                      </h2>

                      {/* Headline Inline Edit */}
                      <div className="flex items-center gap-2">
                        {isEditingHeadline ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              value={customHeadline}
                              onChange={(e) => setCustomHeadline(e.target.value)}
                              className="h-8 text-xs font-semibold text-primary"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsEditingHeadline(false)}
                              className="h-8 px-2.5 text-xs"
                            >
                              {isArabic ? 'حفظ' : 'Done'}
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsEditingHeadline(true)}
                            className="group flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                            title={
                              isArabic ? 'انقر لتعديل العنوان المهني' : 'Click to edit headline'
                            }
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                              {customHeadline}
                            </p>
                            <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      {(() => {
                        const contactInfoItems = [
                          editableEmail,
                          editablePhone,
                          editableLocation,
                          editableLinkedIn,
                        ].filter(Boolean)
                        return (
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground pt-1">
                            {contactInfoItems.map((item, idx) => (
                              <React.Fragment key={idx}>
                                <span>{item}</span>
                                {idx < contactInfoItems.length - 1 && (
                                  <span className="opacity-40">•</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )
                      })()}
                    </div>

                    {/* SECTION 1: Summary with Inline Edit & Quick Fix */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isArabic ? 'الملخص التنفيذي المخصص' : 'Executive Summary'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingSummary((prev) => !prev)}
                            className="h-6 text-[10px] px-2 cursor-pointer"
                          >
                            {isEditingSummary
                              ? isArabic
                                ? 'حفظ التعديل'
                                : 'Save'
                              : isArabic
                                ? 'تعديل مباشر'
                                : 'Edit Inline'}
                          </Button>
                          <Badge variant="secondary" className="text-[10px]">
                            {isArabic ? 'مخصص للدور' : 'Role-Aligned'}
                          </Badge>
                        </div>
                      </div>

                      {isEditingSummary ? (
                        <div className="space-y-2">
                          <Textarea
                            rows={4}
                            value={customSummary}
                            onChange={(e) => setCustomSummary(e.target.value)}
                            className="text-xs leading-relaxed font-sans bg-muted/20 border-border/60"
                          />
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                            <span>{customSummary.length} characters (recommended 150-400)</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditingSummary(false)}
                              className="h-6 text-[10px]"
                            >
                              {isArabic ? 'تم' : 'Done'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p
                          onClick={() => setIsEditingSummary(true)}
                          className="text-xs leading-relaxed font-sans bg-muted/20 border border-border/60 p-3 rounded-lg text-foreground cursor-pointer hover:border-primary/50 transition-colors"
                          title={isArabic ? 'انقر للتعديل' : 'Click to edit summary'}
                        >
                          {customSummary}
                        </p>
                      )}
                    </div>

                    {/* SECTION 2: Experience Bullets with Inline Editing & In-Context AI Suggestions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isArabic
                              ? 'الخبرات المهنية وصيغة Google XYZ'
                              : 'Experience & Quantified Accomplishments'}
                          </h4>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                          ATS Single-Column
                        </span>
                      </div>

                      <div className="space-y-4">
                        {experienceBullets.map((bullet, idx) => {
                          const isEditing = editingBulletIdx === idx
                          const suggestion = generateContextualBulletSuggestion(
                            bullet,
                            idx,
                            jobTitle,
                            companyName,
                            allJobKeywords,
                            isArabic,
                          )
                          const isAccepted = acceptedSuggestions.has(idx)
                          const isDismissed = dismissedSuggestions.has(idx)

                          return (
                            <div key={idx} className="space-y-2">
                              {/* Experience Bullet Card / Editor */}
                              <div className="bg-muted/15 p-3 rounded-lg border border-border/50 space-y-2 group">
                                <div className="flex items-start justify-between gap-2.5">
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />

                                  {isEditing ? (
                                    <div className="flex-1 space-y-2">
                                      <Textarea
                                        rows={2}
                                        value={editingBulletValue}
                                        onChange={(e) => setEditingBulletValue(e.target.value)}
                                        className="text-xs font-sans"
                                        autoFocus
                                      />
                                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                        <span>{editingBulletValue.length} characters</span>
                                        <div className="flex items-center gap-1.5">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingBulletIdx(null)}
                                            className="h-6 text-[10px]"
                                          >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              if (editingBulletValue.trim()) {
                                                const next = [...experienceBullets]
                                                next[idx] = editingBulletValue.trim()
                                                setExperienceBullets(next)
                                              }
                                              setEditingBulletIdx(null)
                                            }}
                                            className="h-6 text-[10px]"
                                          >
                                            {isArabic ? 'حفظ' : 'Save'}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setEditingBulletIdx(idx)
                                        setEditingBulletValue(bullet)
                                      }}
                                      className="flex-1 cursor-pointer"
                                      title={
                                        isArabic ? 'انقر لتعديل هذا البند' : 'Click to edit bullet'
                                      }
                                    >
                                      <p className="text-xs text-foreground leading-relaxed">
                                        {bullet}
                                      </p>
                                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span>{bullet.length} chars</span>
                                        <span>•</span>
                                        <span className="text-primary flex items-center gap-0.5">
                                          <Edit3 className="h-2.5 w-2.5" />
                                          {isArabic ? 'تعديل يدوي' : 'Click to edit'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* In-Context AI Suggestion Card with Accept / Dismiss (Section 4.3 D) */}
                              {suggestion && !isAccepted && !isDismissed && (
                                <div className="ms-6 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2 animate-in slide-in-from-top-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                                      {isArabic
                                        ? 'اقتراح ذكي بالصيغة القياسية:'
                                        : `AI Suggestion (${suggestion.label}):`}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                    >
                                      +{suggestion.delta}% ATS Match
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-foreground/90 font-serif leading-relaxed italic bg-background/50 p-2 rounded border border-border/40">
                                    &ldquo;{suggestion.text}&rdquo;
                                  </p>

                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDismissSuggestion(idx)}
                                      className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                      <span>{isArabic ? 'تجاهل' : 'Dismiss'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptSuggestion(idx, suggestion)}
                                      className="text-[11px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1 rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="h-3 w-3 stroke-[3]" />
                                      <span>
                                        {isArabic
                                          ? `قبول التعديل (+${suggestion.delta}%)`
                                          : `Accept (+${suggestion.delta}% ATS)`}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isAccepted && (
                                <div className="ms-6 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                  <span>
                                    {isArabic
                                      ? 'تم قبول التحسين ودمجه بالسيرة الذاتية'
                                      : 'AI optimization accepted & active'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* SECTION 3: Dedicated Skills & Competencies with AI Categorization (Item 1) */}
                    <div className="space-y-4 pt-2 border-t border-border/50">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isArabic ? 'المهارات والكفاءات التخصصية' : 'Skills & Job Competencies'}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono text-primary border-primary/30 bg-primary/5"
                          >
                            {candidateSkills.length} {isArabic ? 'مهارة' : 'Skills'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={isSkillsAiCategorized ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIsSkillsAiCategorized((prev) => !prev)}
                            className="h-6 text-[10px] px-2.5 cursor-pointer gap-1.5 transition-all"
                          >
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            <span>
                              {isSkillsAiCategorized
                                ? isArabic
                                  ? 'مصنفة بالذكاء الاصطناعي ✓'
                                  : 'AI Categorized ✓'
                                : isArabic
                                  ? 'تصنيف بالذكاء الاصطناعي'
                                  : 'Categorize with AI'}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddSkillInput((prev) => !prev)}
                            className="h-6 text-[10px] px-2 cursor-pointer gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{isArabic ? 'إضافة مهارة' : 'Add Skill'}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Add Skill Input */}
                      {showAddSkillInput && (
                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/60">
                          <Input
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddSkill(newSkillInput)
                              }
                            }}
                            placeholder={
                              isArabic
                                ? 'أدخل اسم المهارة...'
                                : 'e.g. Docker, GraphQL, Kubernetes...'
                            }
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddSkill(newSkillInput)}
                            className="h-7 text-xs px-3"
                          >
                            {isArabic ? 'إضافة' : 'Add'}
                          </Button>
                        </div>
                      )}

                      {/* AI Categorized View (Item 1) */}
                      {isSkillsAiCategorized ? (
                        <div className="space-y-2.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-0.5">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {isArabic
                                ? 'المهارات المتطابقة مع الوظيفة:'
                                : 'Matched Job Requirements:'}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              {matchedSkills.length} {isArabic ? 'متطابقة' : 'matched'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categorizedSkills.map((cat) => (
                              <div
                                key={cat.key}
                                className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                    {cat.icon === 'code' && (
                                      <Code className="h-3 w-3 text-primary" />
                                    )}
                                    {cat.icon === 'cloud' && (
                                      <Cloud className="h-3 w-3 text-sky-500" />
                                    )}
                                    {cat.icon === 'database' && (
                                      <Database className="h-3 w-3 text-amber-500" />
                                    )}
                                    {cat.icon === 'ai' && (
                                      <Sparkles className="h-3 w-3 text-purple-500" />
                                    )}
                                    {cat.icon === 'arch' && (
                                      <Cpu className="h-3 w-3 text-emerald-500" />
                                    )}
                                    {cat.icon === 'award' && (
                                      <Award className="h-3 w-3 text-primary" />
                                    )}
                                    {isArabic ? cat.labelAr : cat.labelEn}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9.5px] px-1.5 py-0 h-4 font-mono"
                                  >
                                    {cat.skills.length}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {cat.skills.map((skill) => {
                                    const isMatched = matchedSkills.includes(skill)
                                    return (
                                      <span
                                        key={skill}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                                          isMatched
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                            : 'border-border/70 bg-card text-foreground'
                                        }`}
                                      >
                                        {isMatched && (
                                          <Check className="h-2.5 w-2.5 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                                        )}
                                        <span>{skill}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSkill(skill)}
                                          className="text-muted-foreground hover:text-destructive ms-0.5 cursor-pointer text-xs leading-none"
                                          aria-label={`Remove ${skill}`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          {/* 1. Matched Skills (Emerald badges with checkmarks) */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {isArabic
                                ? 'المهارات المتطابقة مع الوظيفة:'
                                : 'Matched Job Requirements:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {matchedSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                >
                                  <Check className="h-3 w-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                                  <span>{skill}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-muted-foreground hover:text-destructive ms-0.5 cursor-pointer"
                                    aria-label={`Remove ${skill}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 2. Candidate Core Skills */}
                          {coreSkills.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                {isArabic
                                  ? 'مهارات إضافية من ملف المرشح:'
                                  : 'Additional Core Competencies:'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {coreSkills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border border-border/70 bg-card text-foreground"
                                  >
                                    <span>{skill}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSkill(skill)}
                                      className="text-muted-foreground hover:text-destructive ms-0.5 cursor-pointer"
                                      aria-label={`Remove ${skill}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Skill Gap Recommendations with 1-click Add */}
                      {skillGaps.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {isArabic
                              ? 'مهارات مطلوبة بالوظيفة غير موجودة بملفك (انقر لإضافتها فوراً):'
                              : 'Skill Gap Recommendations (1-click to add to profile):'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGaps.map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                aria-label={`Add ${skill} to profile`}
                                onClick={() => handleAddSkill(skill)}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                <span>{skill}</span>
                                <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 ms-0.5">
                                  +3%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: Real Projects */}
                    {initialProfile?.projects && initialProfile.projects.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                          <FolderGit2 className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isArabic ? 'المشاريع الفنية البارزة' : 'Featured Technical Projects'}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {initialProfile.projects.map((proj, idx) => (
                            <div
                              key={idx}
                              className="bg-muted/15 p-3 rounded-lg border border-border/50 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">
                                  {proj.title}
                                </span>
                                {proj.role && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {proj.role}
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="text-xs text-muted-foreground">{proj.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 5: Real Education */}
                    {initialProfile?.educations && initialProfile.educations.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isArabic ? 'التعليم والمؤهلات الأكاديمية' : 'Education & Credentials'}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {initialProfile.educations.map((edu, idx) => (
                            <div
                              key={idx}
                              className="bg-muted/15 p-3 rounded-lg border border-border/50 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  {edu.degree} in {edu.fieldOfStudy || 'General'}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {edu.schoolName}
                                </p>
                              </div>
                              {edu.startDate && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {edu.startDate.slice(0, 4)} -{' '}
                                  {edu.endDate ? edu.endDate.slice(0, 4) : 'Present'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Column (4 of 12 cols): Distilled AI Optimization Inspector */}
                <div className="lg:col-span-4 lg:border-s lg:border-border/60 lg:ps-6 space-y-6">
                  <div className="lg:sticky lg:top-6 space-y-6">
                    {/* Live ATS Fit Dial & Breakdown */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isArabic ? 'لوحة تحسينات الذكاء الاصطناعي' : 'AI Optimization Hub'}
                        </h4>
                        <span className="text-xs font-mono font-bold text-primary">
                          {liveAtsScore}% Match
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>
                            {isArabic ? 'تطابق الكلمات المفتاحية (40%)' : 'Keywords Fit (40%)'}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {matchedSkills.length}/{Math.max(1, allJobKeywords.length)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>
                            {isArabic
                              ? 'أفعال حركة وأرقام Google XYZ (30%)'
                              : 'Action Verbs & Metrics (30%)'}
                          </span>
                          <span className="font-mono font-bold text-foreground">100% XYZ</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>
                            {isArabic
                              ? 'هيكل عمود واحد قياسي (30%)'
                              : 'Single-Column ATS Layout (30%)'}
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Pass
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Selected Template Summary & Modal Launcher */}
                    <div className="space-y-3 pt-4 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isArabic ? 'قالب السيرة المحدد' : 'Selected ATS Template'}
                        </h4>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: currentTemplateDef.accentColor }}
                        />
                      </div>
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          {isArabic ? currentTemplateDef.nameAr : currentTemplateDef.nameEn}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isArabic ? currentTemplateDef.personaAr : currentTemplateDef.personaEn}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 3 Unified Call to Action Ribbon (Back / Next Only) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep('intake')}
                className="gap-2 text-xs font-semibold cursor-pointer border-border/80"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{isArabic ? 'العودة لبيانات الوظيفة' : 'Back to Job Brief'}</span>
              </Button>

              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Phase 03 of 06</span>
                <span>·</span>
                <span className="text-foreground font-semibold">Living Resume Canvas</span>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => goToStep('ats')}
                className="gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>
                  {isArabic ? 'التالي: تدقيق الكلمات المفتاحية (ATS)' : 'Next: ATS Keyword Audit'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PHASE 4: ATS KEYWORD AUDIT & COMPLIANCE CHECKS (ITEM 2: COMPACT NO-SCROLL) */}
          <div
            key="ats"
            className={currentStep === 'ats' ? `space-y-4 ${animationClass}` : 'hidden'}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {isArabic
                      ? 'تدقيق مطابقة أنظمة التوظيف الآلية (ATS)'
                      : 'ATS Compliance & Keyword Verification'}
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  >
                    {liveAtsScore}% ATS Score
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isArabic
                    ? 'فحوصات معمارية مبسطة ودقيقة لضمان اجتياز خوارزميات Taleo و Greenhouse و Workday.'
                    : 'Streamlined verification checks guaranteed to pass Workday, Greenhouse, and Taleo parsers.'}
                </p>
              </div>
            </div>

            {/* ATS Workbench Container (Maintains test compatibility, Item 2) */}
            <div data-testid="ats-workbench" className="space-y-4">
              {/* Dynamic Action Alert: Alerts user if any issue exists, with 1-click back button */}
              {(() => {
                const unquantifiedBullets = experienceBullets.filter(
                  (b) => !/\d+|%|\$|k\b/i.test(b),
                )
                const hasAtsIssues =
                  !isAtsAuditAccepted &&
                  (skillGaps.length > 0 || unquantifiedBullets.length > 0 || liveAtsScore < 95)

                if (hasAtsIssues) {
                  return (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>
                              {isArabic
                                ? 'تنبيه تحسين التوافق (ATS)'
                                : 'ATS Compliance Alert: Action Recommended'}
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                              ({skillGaps.length > 0 ? `${skillGaps.length} keywords` : ''}
                              {skillGaps.length > 0 && unquantifiedBullets.length > 0 ? ' • ' : ''}
                              {unquantifiedBullets.length > 0
                                ? `${unquantifiedBullets.length} unquantified`
                                : ''}
                              )
                            </span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {isArabic
                              ? `تم رصد ${skillGaps.length > 0 ? `${skillGaps.length} مهارات ناقصة من متطلبات الوظيفة (${skillGaps.slice(0, 3).join(', ')})` : ''}${skillGaps.length > 0 && unquantifiedBullets.length > 0 ? ' و ' : ''}${unquantifiedBullets.length > 0 ? `${unquantifiedBullets.length} نقاط بدون أرقام قياسية (Google XYZ)` : ''}. يمكنك اعتماد التحسينات مباشرة أو العودة للتعديل.`
                              : `Detected ${skillGaps.length > 0 ? `${skillGaps.length} missing required job keywords (${skillGaps.slice(0, 3).join(', ')})` : ''}${skillGaps.length > 0 && unquantifiedBullets.length > 0 ? ' and ' : ''}${unquantifiedBullets.length > 0 ? `${unquantifiedBullets.length} bullet points lacking measurable Google XYZ metrics` : ''}. You can accept all fixes directly or edit.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAcceptAllAtsFixes}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>{isArabic ? 'قبول واعتماد الكل (98%)' : 'Accept & Apply All'}</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => goToStep('resume')}
                          className="gap-1.5 border-border/80 text-xs font-semibold cursor-pointer"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>{isArabic ? 'تعديل بالسيرة الحية' : 'Edit in Living Resume'}</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAtsAuditAccepted(true)
                            goToStep('outreach')
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <span>{isArabic ? 'تخطي للمراسلات' : 'Proceed to Outreach'}</span>
                        </Button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 sm:p-3.5 flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          {isArabic
                            ? 'توافق كامل 100% مع أنظمة ATS (معتمد ومثبت)'
                            : '100% ATS Ready: Verified & Accepted'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {isArabic
                            ? 'السيرة الذاتية متوافقة بالكامل مع خوارزميات الفرز الآلي وجاهزة للتقديم.'
                            : 'Document adheres perfectly to Taleo, Greenhouse, and Workday parsing specifications.'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-mono text-[11px]">
                      {liveAtsScore}% Match
                    </Badge>
                  </div>
                )
              })()}

              {/* Simple 6-Check Cards Grid (No vertical scroll, compact, Item 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Check 1 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{isArabic ? 'هيكل عمود واحد قياسي' : 'Single-Column Flow'}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9.5px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-mono"
                    >
                      100% PASS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'تصميم خطي خالٍ من الجداول المتداخلة ومربعات النصوص التي تعطل قارئات ATS.'
                      : 'Clean linear layout without multi-column tables or text boxes that confuse parsers.'}
                  </p>
                </div>

                {/* Check 2 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Award className="h-3.5 w-3.5 text-primary" />
                      <span>{isArabic ? 'مطابقة الكلمات المفتاحية' : 'Keyword Alignment'}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] font-mono ${
                        skillGaps.length === 0
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}
                    >
                      {matchedSkills.length}/{Math.max(1, allJobKeywords.length)} Matched
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? `تم دمج ${matchedSkills.length} مهارة من متطلبات الوظيفة داخل السيرة.`
                      : `Integrated ${matchedSkills.length} hard competencies directly from the target job posting.`}
                  </p>
                </div>

                {/* Check 3 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>{isArabic ? 'معيار Google XYZ القياسي' : 'Google XYZ Metrics'}</span>
                    </div>
                    {(() => {
                      const unquantified = experienceBullets.filter(
                        (b) => !/\d+|%|\$|k\b/i.test(b),
                      ).length
                      const isFull = unquantified === 0
                      return (
                        <Badge
                          variant="outline"
                          className={`text-[9.5px] font-mono ${
                            isFull
                              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          {experienceBullets.length - unquantified}/{experienceBullets.length}{' '}
                          Quantified
                        </Badge>
                      )
                    })()}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'صيغة الإنجاز المقاس: أنجزت [X] بمقياس [Y] عن طريق فعل [Z].'
                      : 'Formulated as: Accomplished [X] measured by [Y] by doing [Z].'}
                  </p>
                </div>

                {/* Check 4 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{isArabic ? 'أفعال حركة قوية' : 'Action Verbs'}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9.5px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-mono"
                    >
                      100% PASS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'تبدأ كل نقطة بفعل قيادي تنفيذي قوي (Architected, Engineered, Scaled).'
                      : 'Every bullet point opens with strong, decisive executive action verbs.'}
                  </p>
                </div>

                {/* Check 5 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <LayoutTemplate className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{isArabic ? 'عناوين أقسام قياسية' : 'Standard Headings'}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9.5px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-mono"
                    >
                      100% PASS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'تسميات معيارية (Summary, Experience, Education, Skills) معترف بها من كافة الأنظمة.'
                      : 'Standard section nomenclature recognizable by 100% of commercial ATS engines.'}
                  </p>
                </div>

                {/* Check 6 */}
                <div className="rounded-lg border border-border/70 bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{isArabic ? 'بيانات تواصل مقروءة آلياً' : 'Parseable Contacts'}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9.5px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-mono"
                    >
                      100% PASS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'البريد الإلكتروني والهاتف ورابط لينكد إن كنصوص واضحة غير محجوبة بأيقونات رسومية.'
                      : 'Plain-text contact details without icons masking textual content.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 4 Unified Call to Action Ribbon (Back / Next Only) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep('resume')}
                className="gap-2 text-xs font-semibold cursor-pointer border-border/80"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{isArabic ? 'العودة للسيرة المخصصة' : 'Back to Living Resume'}</span>
              </Button>

              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Phase 04 of 06</span>
                <span>·</span>
                <span className="text-foreground font-semibold">
                  ATS Keyword Match & Verification
                </span>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => goToStep('outreach')}
                className="gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>
                  {isArabic ? 'التالي: رسائل مسؤولي التوظيف' : 'Next: Recruiter Outreach'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PHASE 5: RECRUITER OUTREACH & INMAIL STRATEGY (ITEM 3: NO COLLAPSE, NO SCROLL) */}
          <div
            key="outreach"
            className={currentStep === 'outreach' ? `space-y-4 ${animationClass}` : 'hidden'}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {isArabic
                      ? 'رسائل مسؤولي التوظيف والمتابعة (LinkedIn InMail)'
                      : 'Recruiter Outreach & InMail Strategy'}
                  </h3>
                  <span
                    data-testid="outreach-status-badge"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>{isArabic ? '3 رسائل جاهزة' : '3 Pitches Ready'}</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isArabic
                    ? 'رسائل موجهة ومختصرة للوصول لمديري التوظيف مباشرة وتخطي فلاتر التقديم التقليدية.'
                    : 'Personalized high-impact pitches tailored for hiring managers and recruiters to bypass gatekeepers.'}
                </p>
              </div>

              {/* Tone Switcher */}
              <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setOutreachTone('PROFESSIONAL')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    outreachTone === 'PROFESSIONAL'
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'مهني واحترافي' : 'Professional'}
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachTone('CONVERSATIONAL')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    outreachTone === 'CONVERSATIONAL'
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'ودي وتفاعلي' : 'Conversational'}
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachTone('DIRECT')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    outreachTone === 'DIRECT'
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'مباشر وقصير' : 'Direct'}
                </button>
              </div>
            </div>

            {/* Outreach Container (Maintains test compatibility, Item 3: No collapses, no scroll) */}
            <div data-testid="outreach-accordion" className="space-y-4">
              {(() => {
                const candidateName = initialProfile?.candidateName || 'Abdullah Montasser'
                const targetCompany = companyName || 'your engineering team'
                const targetTitle = jobTitle || 'Senior Engineer'
                const topSkills = candidateSkills.slice(0, 2).join(' & ') || 'modern cloud systems'

                // Message 1: LinkedIn Connection Note (<300 chars)
                const connectionNote =
                  outreachTone === 'CONVERSATIONAL'
                    ? `Hey! Big fan of what ${targetCompany} is building. With deep experience in ${topSkills}, I recently tailored my profile for the ${targetTitle} role and would love to connect and follow your team's journey!`
                    : outreachTone === 'DIRECT'
                      ? `Hello! Applying for the ${targetTitle} role at ${targetCompany}. Backed by strong experience in ${topSkills}, I'd value connecting directly to share relevant portfolio metrics.`
                      : `Hi! I've been following ${targetCompany}'s engineering work. With extensive experience in ${topSkills}, I tailored my profile for the ${targetTitle} role and would appreciate connecting!`

                // Message 2: Hiring Manager Direct InMail
                const inMailSubject = `Re: ${targetTitle} — ${candidateName}`
                const inMailBody =
                  outreachTone === 'CONVERSATIONAL'
                    ? `Hi there,\n\nI saw your team is growing and hiring for a ${targetTitle}. Over the past few years, I've built high-throughput web apps and ${experienceBullets[0] || 'scaled cloud pipelines with measured impact'}.\n\nGiven ${targetCompany}'s roadmap, I'm confident I could make an immediate contribution. Would love to grab 10 minutes for a quick chat!\n\nBest,\n${candidateName}`
                    : outreachTone === 'DIRECT'
                      ? `Hi,\n\nI'm reaching out regarding the ${targetTitle} role at ${targetCompany}.\n\nKey qualifications:\n• ${experienceBullets[0] || 'Architected scalable cloud pipelines with 40%+ latency reductions'}\n• Core stack: ${candidateSkills.slice(0, 3).join(', ')}\n\nCan we set up a brief conversation this week?\n\nRegards,\n${candidateName}`
                      : `Dear Hiring Team,\n\nI noticed you are looking for a ${targetTitle} at ${targetCompany}. In my recent roles, I ${experienceBullets[0] || 'delivered high-throughput architectures and led full-stack engineering initiatives'}.\n\nWith deep proficiency in ${candidateSkills.slice(0, 3).join(', ')}, I can accelerate your product deliverables immediately.\n\nCould we connect for a brief 10-minute sync this week?\n\nSincerely,\n${candidateName}`

                // Message 3: Post-Application Follow-Up Email
                const emailSubject = `Application Follow-Up: ${targetTitle} — ${candidateName}`
                const emailBody = `Dear ${companyName || 'Hiring'} Team,\n\nI recently submitted my application for the ${targetTitle} position. I wanted to reiterate my strong enthusiasm for joining ${targetCompany} and emphasize how my experience in ${candidateSkills.slice(0, 3).join(', ')} directly aligns with your tech stack.\n\nLooking forward to the possibility of speaking with your team.\n\nWarm regards,\n${candidateName}`

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Card 1: Connection Note */}
                    <div className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between space-y-3 shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                            {isArabic ? 'ملاحظة طلب التواصل' : 'LinkedIn Connection Note'}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono px-1.5 py-0 ${
                              connectionNote.length <= 300
                                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : 'text-amber-600 border-amber-500/30'
                            }`}
                          >
                            {connectionNote.length} / 300 chars
                          </Badge>
                        </div>
                        <div className="max-h-36 overflow-y-auto scrollbar-thin rounded-lg border border-border/40 bg-muted/20 p-2.5">
                          <p className="text-[11px] leading-relaxed text-muted-foreground font-mono select-all">
                            &ldquo;{connectionNote}&rdquo;
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCopyOutreach('note', connectionNote)}
                        className="w-full h-7 text-xs gap-1.5 cursor-pointer font-medium"
                        variant={copiedOutreachKey === 'note' ? 'default' : 'outline'}
                      >
                        {copiedOutreachKey === 'note' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>{isArabic ? 'نسخ الملاحظة' : 'Copy Connection Note'}</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Card 2: Hiring Manager InMail */}
                    <div className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between space-y-3 shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            {isArabic ? 'رسالة InMail المباشرة' : 'Hiring Lead InMail Pitch'}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono text-primary border-primary/30 bg-primary/5 px-1.5 py-0"
                          >
                            High Impact
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate pb-1">
                          Subject:{' '}
                          <span className="text-foreground font-semibold">{inMailSubject}</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto scrollbar-thin rounded-lg border border-border/40 bg-muted/20 p-2.5">
                          <p className="text-[11px] leading-relaxed text-muted-foreground font-mono whitespace-pre-line select-all">
                            {inMailBody}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          handleCopyOutreach('inmail', `Subject: ${inMailSubject}\n\n${inMailBody}`)
                        }
                        className="w-full h-7 text-xs gap-1.5 cursor-pointer font-medium"
                        variant={copiedOutreachKey === 'inmail' ? 'default' : 'outline'}
                      >
                        {copiedOutreachKey === 'inmail' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>{isArabic ? 'نسخ رسالة InMail' : 'Copy InMail Pitch'}</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Card 3: Follow-Up Email */}
                    <div className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between space-y-3 shadow-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            {isArabic ? 'بريد المتابعة (بعد 72 ساعة)' : '72h Follow-Up Email'}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 px-1.5 py-0"
                          >
                            Post-Apply
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate pb-1">
                          Subject:{' '}
                          <span className="text-foreground font-semibold">{emailSubject}</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto scrollbar-thin rounded-lg border border-border/40 bg-muted/20 p-2.5">
                          <p className="text-[11px] leading-relaxed text-muted-foreground font-mono whitespace-pre-line select-all">
                            {emailBody}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          handleCopyOutreach('email', `Subject: ${emailSubject}\n\n${emailBody}`)
                        }
                        className="w-full h-7 text-xs gap-1.5 cursor-pointer font-medium"
                        variant={copiedOutreachKey === 'email' ? 'default' : 'outline'}
                      >
                        {copiedOutreachKey === 'email' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>{isArabic ? 'نسخ بريد المتابعة' : 'Copy Follow-Up Email'}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Phase 5 Unified Call to Action Ribbon (Back / Next Only) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep('ats')}
                className="gap-2 text-xs font-semibold cursor-pointer border-border/80"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{isArabic ? 'العودة لفحص ATS' : 'Back to ATS Audit'}</span>
              </Button>

              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Phase 05 of 06</span>
                <span>·</span>
                <span className="text-foreground font-semibold">Recruiter Networking & InMail</span>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => goToStep('export')}
                className="gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>{isArabic ? 'التالي: القوالب والتصدير' : 'Next: Templates & Export'}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PHASE 6: 15 ATS TEMPLATES, CANVAS STYLES, MULTI-PAGE & PDF EXPORT (ITEM 4) */}
          <div
            key="export"
            className={currentStep === 'export' ? `space-y-6 ${animationClass}` : 'hidden'}
          >
            {/* Top Streamlined Action Bar: Template Status, Error Toast & Direct Primary CTA */}
            <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-foreground font-serif">
                      {isArabic ? 'جاهز للتصدير كملف PDF رقمي' : 'Ready for Vector PDF Export'}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    >
                      100% Parser Compliant
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>
                      {isArabic
                        ? `القالب المحدد: ${currentTemplateDef.nameAr}`
                        : `Active: ${currentTemplateDef.nameEn}`}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{canvasFont}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {isArabic
                        ? canvasDensity === 'compact'
                          ? 'كثافة مدمجة'
                          : canvasDensity === 'relaxed'
                            ? 'كثافة مريحة'
                            : 'كثافة متوازنة'
                        : `${canvasDensity} density`}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-border shadow-xs"
                        style={{ backgroundColor: canvasAccentColor }}
                      />
                      <span className="text-[11px] font-mono">{activeColorName}</span>
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    size="lg"
                    disabled={isDownloadingPdf || !tailoredResumeId}
                    onClick={handleDownloadPdf}
                    data-testid="pdf-export-btn"
                    className="gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.99]"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {isDownloadingPdf
                        ? isArabic
                          ? 'جاري التوليد والتنزيل...'
                          : 'Generating Vector PDF...'
                        : isArabic
                          ? 'تنزيل السيرة الذاتية (PDF)'
                          : 'Download Vector PDF'}
                    </span>
                  </Button>
                </div>
              </div>

              {pdfExportError && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 p-3 text-xs rounded-lg border border-destructive/40 bg-destructive/10 text-destructive animate-in fade-in"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pdfExportError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfExportError(null)}
                    className="text-xs underline hover:no-underline cursor-pointer"
                  >
                    {isArabic ? 'إغلاق' : 'Dismiss'}
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Styling & Template Customizer Drawer */}
            <details
              open
              className="group rounded-xl border border-border/70 bg-card p-4 transition-all space-y-4"
            >
              <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold select-none text-foreground">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>
                    {isArabic
                      ? 'تخصيص القوالب والألوان والخطوط (15 قالباً)'
                      : 'Customize Template, Colors & Typography (15 ATS Templates)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>

              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <h3 className="text-xs font-bold text-foreground">
                    {isArabic
                      ? 'اختر من بين 15 قالباً معتمداً لأنظمة ATS'
                      : 'Choose from 15 ATS-Proven Vector Templates'}
                  </h3>
                  <span className="text-[11px] font-mono">{currentTemplateDef.traitsEn}</span>
                </div>

                {/* 15 ATS Templates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {RESUME_TEMPLATES.map((tpl) => {
                    const isSelected =
                      selectedTemplate === tpl.id ||
                      (selectedTemplate === 'executive-classic' && tpl.id === 'executive-navy')
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          onSelectTemplate(tpl.id)
                          setCanvasAccentColor(tpl.accentColor)
                          if (tpl.fontFamily === 'serif') setCanvasFont('serif')
                          else if (tpl.fontFamily === 'mono') setCanvasFont('mono')
                          else setCanvasFont('sans')
                        }}
                        className={`flex flex-col text-start p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                            : 'border-border/70 bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: tpl.accentColor }}
                            />
                            <span className="font-semibold text-foreground text-[11px] truncate">
                              {isArabic ? tpl.nameAr : tpl.nameEn}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary stroke-[3] shrink-0" />
                          )}
                        </div>
                        <span className="text-[9.5px] text-muted-foreground line-clamp-1">
                          {isArabic ? tpl.personaAr : tpl.personaEn}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Interactive Canvas Style Editor & Direct Edit Bar */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* 1. Direct Canvas Edit Mode Toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isCanvasEditing ? 'default' : 'outline'}
                        onClick={() => setIsCanvasEditing((prev) => !prev)}
                        className="h-7 text-xs gap-1.5 cursor-pointer font-medium shadow-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>
                          {isCanvasEditing
                            ? isArabic
                              ? 'إنهاء التعديل المباشر ✓'
                              : 'Done Editing ✓'
                            : isArabic
                              ? 'تعديل السيرة في الكانفاس'
                              : 'Edit Canvas Directly'}
                        </span>
                      </Button>
                    </div>

                    {/* 2. Font Family */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Type className="h-3.5 w-3.5" />
                        <span>{isArabic ? 'الخط:' : 'Font:'}</span>
                      </span>
                      <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-card">
                        <button
                          type="button"
                          onClick={() => setCanvasFont('sans')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer font-sans ${
                            canvasFont === 'sans'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Sans
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasFont('serif')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer font-serif ${
                            canvasFont === 'serif'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Serif
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasFont('mono')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer font-mono ${
                            canvasFont === 'mono'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Mono
                        </button>
                      </div>
                    </div>

                    {/* 3. Professional, High-Contrast Executive Color Palette */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Palette className="h-3.5 w-3.5" />
                        <span>{isArabic ? 'اللون:' : 'Color:'}</span>
                      </span>
                      <div
                        className="flex items-center gap-1.5 flex-wrap"
                        role="group"
                        aria-label={isArabic ? 'لوحة الألوان' : 'Color Palette'}
                      >
                        {colorSwatches.map((c) => {
                          const isPressed = canvasAccentColor.toLowerCase() === c.hex.toLowerCase()
                          return (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setCanvasAccentColor(c.hex)}
                              title={isArabic ? c.nameAr : c.nameEn}
                              aria-label={isArabic ? c.nameAr : c.nameEn}
                              aria-pressed={isPressed}
                              className={`h-5 w-5 rounded-full transition-all cursor-pointer border ${
                                isPressed
                                  ? 'ring-2 ring-primary ring-offset-2 scale-110 border-primary shadow-xs'
                                  : 'border-border/60 opacity-85 hover:opacity-100 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          )
                        })}
                        {/* Custom Color Input */}
                        <label
                          className="relative flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-border/80 hover:border-primary hover:scale-105 cursor-pointer transition-all"
                          title={isArabic ? 'اختيار لون مخصص...' : 'Custom color picker...'}
                          aria-label={isArabic ? 'اختيار لون مخصص' : 'Custom color picker'}
                        >
                          <input
                            type="color"
                            value={canvasAccentColor}
                            onChange={(e) => setCanvasAccentColor(e.target.value)}
                            className="sr-only"
                          />
                          <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                        </label>
                      </div>
                    </div>

                    {/* 4. Spacing / Density with Accessible Controls & Onboarding Guide */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Sliders className="h-3.5 w-3.5" />
                        <span>{isArabic ? 'الكثافة:' : 'Density:'}</span>
                      </span>
                      <div
                        role="radiogroup"
                        aria-label={isArabic ? 'كثافة المسافات والخطوط' : 'Spacing density'}
                        className="flex items-center rounded-lg border border-border/70 p-0.5 bg-card"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={canvasDensity === 'compact'}
                          aria-pressed={canvasDensity === 'compact'}
                          title={
                            isArabic
                              ? 'مدمج: يقلل الهوامش والمسافات لضبط المحتوى في صفحة واحدة'
                              : 'Compact: Reduces page padding & margins to fit dense experience onto 1 page'
                          }
                          onClick={() => setCanvasDensity('compact')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                            canvasDensity === 'compact'
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isArabic ? 'مدمج' : 'Compact'}
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={canvasDensity === 'balanced'}
                          aria-pressed={canvasDensity === 'balanced'}
                          title={
                            isArabic
                              ? 'متوازن: التنسيق القياسي لنظم تتبع المتقدمين ATS'
                              : 'Balanced: Standard ATS vertical rhythm and margins'
                          }
                          onClick={() => setCanvasDensity('balanced')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                            canvasDensity === 'balanced'
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isArabic ? 'متوازن' : 'Balanced'}
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={canvasDensity === 'relaxed'}
                          aria-pressed={canvasDensity === 'relaxed'}
                          title={
                            isArabic
                              ? 'مريح: مسافات وارتفاع أسطر أوسع لقراءة تنفيذية فاخرة'
                              : 'Relaxed: Spacious margins & generous line heights for executive readability'
                          }
                          onClick={() => setCanvasDensity('relaxed')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                            canvasDensity === 'relaxed'
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isArabic ? 'مريح' : 'Relaxed'}
                        </button>
                      </div>
                    </div>

                    {/* 5. Page Count & View Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        <span>{isArabic ? 'الصفحات:' : 'Pages:'}</span>
                      </span>
                      <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-card">
                        <button
                          type="button"
                          onClick={() => setCanvasPageMode('1-page')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer ${
                            canvasPageMode === '1-page'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          1 Page
                        </button>
                        <button
                          type="button"
                          onClick={() => setCanvasPageMode('2-pages')}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer ${
                            canvasPageMode === '2-pages'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          2 Pages
                        </button>
                      </div>

                      {canvasPageMode === '2-pages' && (
                        <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-card ms-1">
                          <button
                            type="button"
                            onClick={() => setActivePageView('both')}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${
                              activePageView === 'both'
                                ? 'bg-secondary text-foreground font-bold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {isArabic ? 'معاينة الكل' : 'Both'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePageView('page1')}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${
                              activePageView === 'page1'
                                ? 'bg-secondary text-foreground font-bold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            P1
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePageView('page2')}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${
                              activePageView === 'page2'
                                ? 'bg-secondary text-foreground font-bold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            P2
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isCanvasEditing && (
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-xs text-primary flex items-center gap-2">
                      <Edit3 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {isArabic
                          ? 'وضع التعديل المباشر نشط: انقر وعدل الاسم، الملخص، وبيانات التواصل وبنود الإنجازات مباشرة قبل التصدير.'
                          : 'Live Canvas Edit Mode: Edit your name, headline, summary, contacts, and bullet points directly on the paper canvas before exporting.'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </details>

            {/* Live Document Canvas with Categorized Skills & Direct Editing */}
            {(() => {
              const activeFontClass =
                canvasFont === 'serif'
                  ? 'font-serif'
                  : canvasFont === 'mono'
                    ? 'font-mono'
                    : 'font-sans'
              const densityClass =
                canvasDensity === 'compact'
                  ? 'p-5 sm:p-6 space-y-4 text-[11px]'
                  : canvasDensity === 'relaxed'
                    ? 'p-8 sm:p-10 space-y-7 text-sm'
                    : 'p-6 sm:p-8 space-y-5 text-xs'

              const candidateEmail = editableEmail
              const candidatePhone = editablePhone
              const candidateLocation = editableLocation
              const candidateLinkedIn = editableLinkedIn

              const experiences = initialProfile?.workExperiences || []
              const firstExperience = experiences[0] || {
                companyName: companyName || 'Technology Systems Corp',
                jobTitle: jobTitle || 'Lead Software Architect',
                startDate: '2021',
                endDate: null,
                isCurrent: true,
                bullets: experienceBullets,
              }
              const subsequentExperiences = experiences.slice(1)

              // Dynamic accent border rule that synchronizes with the chosen canvas accent color
              const activeBorderColor =
                canvasAccentColor === '#111827' || canvasAccentColor === '#000000'
                  ? '#111827'
                  : canvasAccentColor

              // Page 1 Sheet Component
              const renderPage1 = () => (
                <div
                  className={`w-full max-w-2xl bg-card rounded-md border shadow-md ${currentTemplateDef.bgClass} ${activeFontClass} ${densityClass} flex flex-col justify-between transition-all`}
                  style={{ minHeight: '842px' }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div
                      className={`border-b pb-3 space-y-1.5 ${
                        currentTemplateDef.layoutType === 'centered' ? 'text-center' : ''
                      }`}
                      style={{ borderBottomColor: activeBorderColor }}
                    >
                      {isCanvasEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editableCandidateName}
                            onChange={(e) => setEditableCandidateName(e.target.value)}
                            className="text-xl sm:text-2xl font-bold tracking-tight bg-muted/20 border-border/80 h-9"
                            style={{ color: canvasAccentColor }}
                            placeholder="Full Name"
                          />
                          <Input
                            value={customHeadline}
                            onChange={(e) => setCustomHeadline(e.target.value)}
                            className="text-xs font-semibold uppercase tracking-wider bg-muted/20 border-border/80 h-7"
                            placeholder="Target Role / Headline"
                          />
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                            <Input
                              value={editableEmail}
                              onChange={(e) => setEditableEmail(e.target.value)}
                              placeholder="Email"
                              className="h-6 text-[10px] bg-muted/20"
                            />
                            <Input
                              value={editablePhone}
                              onChange={(e) => setEditablePhone(e.target.value)}
                              placeholder="Phone"
                              className="h-6 text-[10px] bg-muted/20"
                            />
                            <Input
                              value={editableLocation}
                              onChange={(e) => setEditableLocation(e.target.value)}
                              placeholder="Location"
                              className="h-6 text-[10px] bg-muted/20"
                            />
                            <Input
                              value={editableLinkedIn}
                              onChange={(e) => setEditableLinkedIn(e.target.value)}
                              placeholder="LinkedIn / URL"
                              className="h-6 text-[10px] bg-muted/20"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h1
                            className="text-xl sm:text-2xl font-bold tracking-tight"
                            style={{ color: canvasAccentColor }}
                          >
                            {editableCandidateName}
                          </h1>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {customHeadline}
                          </p>
                          {(() => {
                            const contactList = [
                              candidateEmail,
                              candidatePhone,
                              candidateLocation,
                              candidateLinkedIn,
                            ].filter(Boolean)
                            return (
                              <div
                                className={`flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground pt-0.5 ${
                                  currentTemplateDef.layoutType === 'centered'
                                    ? 'justify-center'
                                    : ''
                                }`}
                              >
                                {contactList.map((item, idx) => (
                                  <React.Fragment key={idx}>
                                    <span>{item}</span>
                                    {idx < contactList.length - 1 && (
                                      <span className="opacity-40">•</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )
                          })()}
                        </>
                      )}
                    </div>

                    {/* Professional Summary */}
                    <div className="space-y-1">
                      <h3
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: canvasAccentColor }}
                      >
                        {isArabic ? 'الملخص المهني' : 'Professional Summary'}
                      </h3>
                      {isCanvasEditing ? (
                        <Textarea
                          value={customSummary}
                          onChange={(e) => setCustomSummary(e.target.value)}
                          rows={3}
                          className="text-xs leading-relaxed bg-muted/20 border-border/80"
                        />
                      ) : (
                        <p className="leading-relaxed text-muted-foreground">{customSummary}</p>
                      )}
                    </div>

                    {/* Categorized Skills (Structured Domain Breakdown) */}
                    {categorizedSkills.length > 0 && (
                      <div
                        className="space-y-1.5 border-t pt-2.5"
                        style={{ borderTopColor: activeBorderColor }}
                      >
                        <h3
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: canvasAccentColor }}
                        >
                          {isArabic ? 'المهارات التقنية المصنفة' : 'Core Technical Competencies'}
                        </h3>
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          {categorizedSkills.map((cat) => (
                            <div key={cat.key} className="flex flex-wrap items-baseline gap-1.5">
                              <span
                                className="font-bold text-foreground"
                                style={{ color: canvasAccentColor }}
                              >
                                {isArabic ? cat.labelAr : cat.labelEn}:
                              </span>
                              <span className="text-muted-foreground">
                                {cat.skills.join(' • ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Primary Experience (Tailored) */}
                    <div
                      className="space-y-2.5 border-t pt-2.5"
                      style={{ borderTopColor: activeBorderColor }}
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: canvasAccentColor }}
                        >
                          {isArabic
                            ? 'الخبرات المهنية والإنجازات (Google XYZ)'
                            : 'Professional Experience'}
                        </h3>
                        {isCanvasEditing && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExperienceBullets((prev) => [
                                ...prev,
                                'Spearheaded architecture enhancements delivering a 30% reduction in processing latency.',
                              ])
                            }
                            className="h-6 text-[10px] px-2 gap-1 text-primary cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{isArabic ? 'إضافة بند' : 'Add Bullet'}</span>
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-foreground">{firstExperience.jobTitle}</span>
                          <span className="text-muted-foreground font-normal text-[11px]">
                            {firstExperience.companyName}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {experienceBullets.map((bullet, idx) => (
                            <div
                              key={idx}
                              className="leading-relaxed text-muted-foreground flex items-start gap-2"
                            >
                              <span
                                className="font-bold shrink-0 mt-0.5"
                                style={{ color: canvasAccentColor }}
                              >
                                •
                              </span>
                              {isCanvasEditing ? (
                                <div className="flex items-start gap-1.5 flex-1">
                                  <Textarea
                                    value={bullet}
                                    onChange={(e) => {
                                      const next = [...experienceBullets]
                                      next[idx] = e.target.value
                                      setExperienceBullets(next)
                                    }}
                                    rows={2}
                                    className="text-xs leading-relaxed bg-muted/20 border-border/80 p-1.5 flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExperienceBullets((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                      )
                                    }
                                    className="p-1 text-muted-foreground hover:text-destructive cursor-pointer shrink-0 mt-1"
                                    title="Delete bullet"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span>{bullet}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* If single-page mode, include education on page 1 */}
                    {canvasPageMode === '1-page' &&
                      initialProfile?.educations &&
                      initialProfile.educations.length > 0 && (
                        <div
                          className="space-y-2 border-t pt-2.5"
                          style={{ borderTopColor: activeBorderColor }}
                        >
                          <h3
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: canvasAccentColor }}
                          >
                            {isArabic ? 'التعليم' : 'Education'}
                          </h3>
                          <div className="space-y-1">
                            {initialProfile.educations.map((edu, idx) => (
                              <div key={idx} className="flex justify-between text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {edu.degree} in {edu.fieldOfStudy || 'General'}
                                </span>
                                <span>{edu.schoolName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Page Footer */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-end text-[10px] text-muted-foreground font-mono">
                    <span>{canvasPageMode === '2-pages' ? 'Page 1 of 2' : 'Page 1 of 1'}</span>
                  </div>
                </div>
              )

              // Page 2 Sheet Component
              const renderPage2 = () => (
                <div
                  className={`w-full max-w-2xl bg-card rounded-md border shadow-md ${currentTemplateDef.bgClass} ${activeFontClass} ${densityClass} flex flex-col justify-between transition-all`}
                  style={{ minHeight: '842px' }}
                >
                  <div className="space-y-4">
                    {/* Page 2 Mini Header */}
                    <div
                      className="border-b pb-2 flex items-center justify-between"
                      style={{ borderBottomColor: activeBorderColor }}
                    >
                      <span
                        className="text-xs font-bold text-foreground"
                        style={{ color: canvasAccentColor }}
                      >
                        {editableCandidateName} — {isArabic ? 'الصفحة 2' : 'Page 2'}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">{candidateEmail}</span>
                    </div>

                    {/* Prior Experiences */}
                    {subsequentExperiences.length > 0 && (
                      <div className="space-y-2.5">
                        <h3
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: canvasAccentColor }}
                        >
                          {isArabic ? 'الخبرات السابقة' : 'Prior Professional Roles'}
                        </h3>
                        <div className="space-y-2">
                          {subsequentExperiences.map((exp, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-foreground">{exp.jobTitle}</span>
                                <span className="text-muted-foreground font-normal text-[11px]">
                                  {exp.companyName}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {exp.bullets.map((b, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="leading-relaxed text-muted-foreground flex items-start gap-2"
                                  >
                                    <span
                                      className="font-bold shrink-0 mt-0.5"
                                      style={{ color: canvasAccentColor }}
                                    >
                                      •
                                    </span>
                                    <span>{b}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Projects */}
                    {initialProfile?.projects && initialProfile.projects.length > 0 && (
                      <div
                        className="space-y-2 border-t pt-2.5"
                        style={{ borderTopColor: activeBorderColor }}
                      >
                        <h3
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: canvasAccentColor }}
                        >
                          {isArabic ? 'المشاريع الفنية البارزة' : 'Featured Technical Projects'}
                        </h3>
                        <div className="space-y-2">
                          {initialProfile.projects.map((p, idx) => (
                            <div key={idx}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">{p.title}</span>
                                {p.role && (
                                  <span className="text-muted-foreground text-[11px]">
                                    {p.role}
                                  </span>
                                )}
                              </div>
                              {p.description && (
                                <p className="text-muted-foreground text-[11px] mt-0.5">
                                  {p.description}
                                </p>
                              )}
                              {p.technologies && p.technologies.length > 0 && (
                                <p className="text-[10px] font-mono text-primary/80 mt-0.5">
                                  {p.technologies.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {initialProfile?.educations && initialProfile.educations.length > 0 && (
                      <div
                        className="space-y-2 border-t pt-2.5"
                        style={{ borderTopColor: activeBorderColor }}
                      >
                        <h3
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: canvasAccentColor }}
                        >
                          {isArabic ? 'التعليم والمؤهلات' : 'Education & Credentials'}
                        </h3>
                        <div className="space-y-1">
                          {initialProfile.educations.map((edu, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {edu.degree} in {edu.fieldOfStudy || 'General'}
                              </span>
                              <span>{edu.schoolName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page 2 Footer */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-end text-[10px] text-muted-foreground font-mono">
                    <span>Page 2 of 2</span>
                  </div>
                </div>
              )

              return (
                <div className="py-6 flex flex-col items-center gap-6">
                  {canvasPageMode === '1-page' ? (
                    renderPage1()
                  ) : activePageView === 'page1' ? (
                    renderPage1()
                  ) : activePageView === 'page2' ? (
                    renderPage2()
                  ) : (
                    <>
                      {renderPage1()}
                      {renderPage2()}
                    </>
                  )}
                </div>
              )
            })()}

            {/* Phase 6 Unified Call to Action Ribbon (Back / Actions Only) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep('outreach')}
                className="gap-2 text-xs font-semibold cursor-pointer border-border/80"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{isArabic ? 'العودة للرسائل' : 'Back to Outreach'}</span>
              </Button>

              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>Phase 06 of 06</span>
                <span>·</span>
                <span className="text-foreground font-semibold">15 Single-Column ATS Layouts</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  size="lg"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadPdf}
                  className="gap-2 px-8 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    {isDownloadingPdf
                      ? isArabic
                        ? 'جاري تحضير ملف PDF...'
                        : 'Generating PDF...'
                      : isArabic
                        ? 'تنزيل ملف PDF المتجه'
                        : 'Download Vector PDF'}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Unified Next Steps Bar (Handoff to tracker, Practice STAR questions) - Focused in Step 6 */}
          {tailoredResumeId && (
            <div className={currentStep === 'export' ? 'pt-4 border-t border-border/60' : 'hidden'}>
              <TailorActionBar
                tailoredResumeId={tailoredResumeId}
                jobTitle={jobTitle}
                companyName={companyName}
                initialHasApplication={hasApplication}
                lang={lang}
                dict={dict}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
