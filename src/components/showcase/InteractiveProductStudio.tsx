'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react'
import { gsap } from 'gsap'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductStudioProps {
  lang: string
}

type StudioTab = 'tailor' | 'ats' | 'outreach' | 'interview'

interface RoleData {
  id: string
  label: { en: string; ar: string }
  targetCompany: string
  targetRole: { en: string; ar: string }
  initialScore: number
  optimizedScore: number
  matchedSkills: string[]
  missingSkills: string[]
  beforeBullet: { en: string; ar: string }
  afterBullet: { en: string; ar: string }
  metricImprovement: { en: string; ar: string }
  outreachNote: { en: string; ar: string }
  starSituation: { en: string; ar: string }
  starTask: { en: string; ar: string }
  starAction: { en: string; ar: string }
  starResult: { en: string; ar: string }
}

const ROLES: RoleData[] = [
  {
    id: 'swe',
    label: { en: 'Software Engineering', ar: 'هندسة البرمجيات' },
    targetCompany: 'Stripe · Core Infrastructure',
    targetRole: { en: 'Staff Infrastructure Engineer', ar: 'مهندس أول للبنية التحتية' },
    initialScore: 68,
    optimizedScore: 96,
    matchedSkills: [
      'Distributed Systems',
      'Go',
      'Next.js 16',
      'PostgreSQL',
      'Kafka',
      'High Concurrency',
    ],
    missingSkills: ['eBPF Observability', 'Multi-Region Raft'],
    beforeBullet: {
      en: 'Built web applications and managed database servers for the company payments team.',
      ar: 'عملت على تطوير تطبيقات الويب وإدارة خوادم قواعد البيانات لفريق المدفوعات بالشركة.',
    },
    afterBullet: {
      en: 'Engineered multi-region distributed payment queue handling 18,000 req/sec with 99.995% uptime, reducing P99 latency by 44% during peak traffic.',
      ar: 'صممت وطورت نظام طوابير مدفوعات موزع متعدد المناطق يعالج 18,000 طلب/ثانية بنسبة توفر 99.995%، مما قلل زمن الاستجابة P99 بنسبة 44% في أوقات الذروة.',
    },
    metricImprovement: {
      en: '+44% P99 Latency (Google XYZ)',
      ar: 'خفض زمن الاستجابة 44% (صيغة جوجل XYZ)',
    },
    outreachNote: {
      en: 'Hi Sarah, noticed Stripe is expanding its Core Ledger team. At my last company, I cut payment queue P99 latency by 44% at 18k req/sec scale. Would love to share quick insights on distributed consensus patterns if you have 5 mins next week.',
      ar: 'مرحباً سارة، لاحظت توسع فريق البنية التحتية في Stripe. في دوري السابق، خفضت زمن استجابة طوابير المدفوعات بنسبة 44% بمعدل 18 ألف طلب/ثانية. يسعدني تبادل الرؤى حول أنظمة التوافق الموزعة في وقت يناسبك.',
    },
    starSituation: {
      en: 'During peak traffic, payment queue stalled from database lock contention.',
      ar: 'أثناء موسم الذروة، توقف طابور العمليات نتيجة تزاحم أقفال قاعدة البيانات.',
    },
    starTask: {
      en: 'On-call lead tasked with restoring throughput in under 15 minutes with zero lost orders.',
      ar: 'قائد الفريق المسؤول عن استعادة سرعة المعالجة في أقل من 15 دقيقة دون فقدان أي طلب.',
    },
    starAction: {
      en: 'Shed non-critical analytics webhooks and partitioned write buffers into memory.',
      ar: 'قمت بتقنين العمليات غير الحرجة وفصل جداول الكتابة إلى مخازن ذاكرة مؤقتة.',
    },
    starResult: {
      en: 'Cleared 80,000 order backlog in 8 minutes with 0 duplicate charges and 100% data integrity.',
      ar: 'معالجة تراكم 80,000 طلب في 8 دقائق بدون أي تكرار وبدقة بيانات 100%.',
    },
  },
  {
    id: 'pm',
    label: { en: 'Product Management', ar: 'إدارة المنتجات' },
    targetCompany: 'Linear · Product Team',
    targetRole: { en: 'Principal Product Manager', ar: 'مدير منتج رئيسي' },
    initialScore: 62,
    optimizedScore: 94,
    matchedSkills: [
      'Product Strategy',
      'Roadmap Execution',
      'B2B SaaS Metrics',
      'User Research',
      'SQL Analytics',
    ],
    missingSkills: ['PLG Activation Loops', 'Pricing Migration'],
    beforeBullet: {
      en: 'Led product meetings and created weekly sprint task backlogs for the product engineers.',
      ar: 'أدرت اجتماعات المنتجات وكتبت المهام الأسبوعية لفريق هندسة المنتجات بالشركة.',
    },
    afterBullet: {
      en: 'Spearheaded self-serve workspace activation redesign across 120,000 active users, driving onboarding conversion from 11.2% to 29.4% in Q3.',
      ar: 'قدت إعادة تصميم مسار تفعيل مساحات العمل لـ 120,000 مستخدم نشط، مما رفع معدل التحويل الأولي من 11.2% إلى 29.4% في الربع الثالث.',
    },
    metricImprovement: {
      en: '+18.2% Activation Rate (Google XYZ)',
      ar: 'رفع معدل التفعيل 18.2% (صيغة جوجل XYZ)',
    },
    outreachNote: {
      en: 'Hi Alex, loved Linear’s latest roadmap release. Scaled self-serve activation by 18.2% at my last SaaS product. If you have 5 minutes next week, would love to compare notes on high-velocity product delivery.',
      ar: 'مرحباً أليكس، تابعت تحديثات Linear الأخيرة باهتمام. نجحت في رفع معدل تفعيل المنتجات الذاتية بنسبة 18.2% في منصتي السابقة. يسعدني مشاركة بعض الدروس السريعة في وقت يناسبك.',
    },
    starSituation: {
      en: 'User drop-off after signup reached 68% due to complex team workspace configuration.',
      ar: 'ارتفعت نسبة تسرب المستخدمين الجدد بعد التسجيل إلى 68% بسبب تعقيد إعداد مساحة العمل.',
    },
    starTask: {
      en: 'Mandated to simplify time-to-first-task under 90 seconds without losing enterprise security.',
      ar: 'تم تكليفي بتقليص وقت إنجاز أول مهمة إلى أقل من 90 ثانية مع الحفاظ على معايير الأمان المؤسسية.',
    },
    starAction: {
      en: 'Introduced 1-click workspace templates and deferred organization permissions until day 7.',
      ar: 'أطلقت قوالب جاهزة بنقرة واحدة وأجلت إعدادات الصلاحيات المتقدمة إلى اليوم السابع.',
    },
    starResult: {
      en: 'Cut time-to-first-task by 65% and grew Day-30 workspace retention from 34% to 58%.',
      ar: 'تقليص وقت أول إنجاز بنسبة 65% ورفع نسبة استبقاء المستخدمين بعد 30 يوماً من 34% إلى 58%.',
    },
  },
  {
    id: 'design',
    label: { en: 'Product Design', ar: 'تصميم واجهات المستخدم' },
    targetCompany: 'Vercel · Design Systems',
    targetRole: { en: 'Senior Staff Design Technologist', ar: 'مصمم واجهات ونظم رقمية أول' },
    initialScore: 65,
    optimizedScore: 98,
    matchedSkills: [
      'Design Systems',
      'Figma Tokens',
      'Accessible UI (WCAG AAA)',
      'Motion Choreography',
      'Next.js 16 UI',
    ],
    missingSkills: ['Multi-Brand Token Architecture', 'Fluid Typography Systems'],
    beforeBullet: {
      en: 'Designed components in Figma and gave handoff notes to developers.',
      ar: 'صممت مكونات الواجهات على Figma وقدمت ملفات التصميم للمطورين للتنفيذ.',
    },
    afterBullet: {
      en: 'Architected accessible design system token pipeline supporting 68 components across 4 platforms, reducing frontend rework cycles by 52%.',
      ar: 'بنيت منظومة توكنز رقمية موحدة تدعم 68 مكوناً برمجياً عبر 4 منصات، مما خفض فترات إعادة كتابة واجهات الويب بنسبة 52%.',
    },
    metricImprovement: {
      en: '-52% Dev Handoff Rework (Google XYZ)',
      ar: 'خفض وقت تسليم الواجهات 52% (صيغة جوجل XYZ)',
    },
    outreachNote: {
      en: 'Hi Michael, huge fan of Vercel’s design precision. At my last role, I built an automated token pipeline that halved design debt across 68 components. Would love to share insights on zero-jank design systems.',
      ar: 'مرحباً مايكل، أتابع دقة التصميم في Vercel بإعجاب. في فريقي السابق بنيت منظومة توكنز خفضت الديون التصميمية بنسبة 52% عبر 68 مكوناً. يسعدني تبادل الأفكار متى ناسبك الوقت.',
    },
    starSituation: {
      en: 'Design discrepancies across web, iOS, and Android caused 40% of QA tickets.',
      ar: 'أدى تباين التصاميم بين الويب وتطبيقات الجوال إلى 40% من بلاغات اختبار الجودة.',
    },
    starTask: {
      en: 'Lead design-eng liaison tasked with creating single source of truth across all codebases.',
      ar: 'تكليفي كحلقة وصل بين التصميم والبرمجة لتوحيد مرجعية التصميم في كافة المنصات.',
    },
    starAction: {
      en: 'Created automated GitHub Actions sync between Figma Variables and CSS/Tailwind tokens.',
      ar: 'أنشأت مسار تزامن تلقائي عبر GitHub Actions يربط متغيرات Figma بتوكنز Tailwind CSS.',
    },
    starResult: {
      en: 'Zero visual regression tickets across 3 major product releases, speeding release cadence 2x.',
      ar: 'صفر أخطاء بصرية في 3 إطلاقات كبرى ومضاعفة وتيرة تحديث المنتجات إلى الضعف.',
    },
  },
]

export function InteractiveProductStudio({ lang }: ProductStudioProps) {
  const isAr = lang === 'ar'
  const shouldReduceMotion = useReducedMotion()

  // Studio state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('swe')
  const [activeTab, setActiveTab] = useState<StudioTab>('tailor')
  const [addedSkills, setAddedSkills] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [displayScore, setDisplayScore] = useState<number>(ROLES[0].initialScore)
  const [bumpKey, setBumpKey] = useState<number>(0)
  const [scanKey, setScanKey] = useState<number>(0)

  // GSAP Context Ref
  const studioRootRef = useRef<HTMLDivElement>(null)
  const scoreCounterRef = useRef({ val: ROLES[0].initialScore })
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const hasAutoScannedRef = useRef(false)
  const isStudioInView = useInView(studioRootRef, { once: true, amount: 0.25 })

  const currentRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0]

  // Animate Score Counter with GSAP
  const animateScore = useCallback((targetScore: number, duration = 1.2) => {
    if (tweenRef.current) tweenRef.current.kill()
    setIsScanning(true)
    setScanKey((key) => key + 1)

    tweenRef.current = gsap.to(scoreCounterRef.current, {
      val: targetScore,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayScore(Math.round(scoreCounterRef.current.val))
      },
      onComplete: () => {
        setIsScanning(false)
      },
    })
  }, [])

  // Signature Re-scan Trigger
  const triggerScan = useCallback(
    (newRoleId?: string) => {
      const targetRoleId = newRoleId || selectedRoleId
      const targetRole = ROLES.find((r) => r.id === targetRoleId) || ROLES[0]
      scoreCounterRef.current.val = targetRole.initialScore
      setDisplayScore(targetRole.initialScore)
      animateScore(targetRole.optimizedScore, shouldReduceMotion ? 0.4 : 1.4)
    },
    [selectedRoleId, animateScore, shouldReduceMotion],
  )

  // First view verifies the resume once: the score climbs from the role's
  // baseline to the tailored result, with the sweep following the same tween.
  const autoScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerScanRef = useRef(triggerScan)

  useEffect(() => {
    triggerScanRef.current = triggerScan
  }, [triggerScan])

  useEffect(() => {
    if (!isStudioInView || hasAutoScannedRef.current) return
    hasAutoScannedRef.current = true
    autoScanTimerRef.current = setTimeout(
      () => triggerScanRef.current(),
      shouldReduceMotion ? 0 : 350,
    )
  }, [isStudioInView, shouldReduceMotion])

  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current)
      tweenRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    if (bumpKey === 0) return
    const timer = setTimeout(() => setBumpKey(0), 900)
    return () => clearTimeout(timer)
  }, [bumpKey])

  // Role Selection
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId)
    setAddedSkills([])
    const targetRole = ROLES.find((r) => r.id === roleId) || ROLES[0]
    scoreCounterRef.current.val = targetRole.initialScore
    setDisplayScore(targetRole.initialScore)
    animateScore(targetRole.optimizedScore, shouldReduceMotion ? 0.4 : 1.4)
  }

  // Add Missing Skill
  const handleAddSkill = (skill: string) => {
    if (addedSkills.includes(skill)) return
    setAddedSkills((prev) => [...prev, skill])
    const base = Math.max(Math.round(scoreCounterRef.current.val), currentRole.optimizedScore)
    animateScore(Math.min(100, base + 2), shouldReduceMotion ? 0.2 : 0.5)
    setBumpKey((key) => key + 1)
  }

  // Copy Outreach Pitch
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Circle stroke offset calculation
  const circleRadius = 42
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circleCircumference - (displayScore / 100) * circleCircumference
  const hasPassed = displayScore >= 80
  const afterScore = Math.min(100, currentRole.optimizedScore + addedSkills.length * 2)
  const scoreDelta = currentRole.optimizedScore - currentRole.initialScore
  const panelMotion = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 4 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0.01 : 0.18,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }

  return (
    <div ref={studioRootRef} className="w-full space-y-8">
      {/* 1. Header: Editorial masthead */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-10">
        <h2
          className={cn(
            'text-balance text-start text-3xl text-foreground sm:text-4xl md:text-5xl',
            isAr
              ? 'font-arabic font-extrabold tracking-normal leading-[1.25]'
              : 'font-sans font-black tracking-tight leading-[1.08]',
          )}
        >
          {isAr
            ? 'شاهد كيف يحول الذكاء الاصطناعي سيرتك الذاتية'
            : 'Experience the AI Transformation in Real Time'}
        </h2>
        <p
          className={cn(
            'max-w-md text-start text-sm font-normal text-muted-foreground sm:text-base lg:justify-self-end lg:text-end',
            isAr ? 'font-arabic leading-[1.8]' : 'leading-relaxed',
          )}
        >
          {isAr
            ? 'اختر مسارك المهني وشاهد إعادة الصياغة الفورية واختبار التوافق الحقيقي مع أنظمة التوظيف.'
            : 'Select a career track to test instant Google XYZ bullet tailoring, live ATS score matching, and recruiter pitches.'}
        </p>
      </div>

      {/* 2. Role Selector Pills */}
      <div
        className="flex flex-wrap items-center justify-start gap-2"
        role="group"
        aria-label={isAr ? 'المسارات المهنية' : 'Career Tracks'}
      >
        {ROLES.map((role) => {
          const isActive = role.id === selectedRoleId
          return (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              aria-pressed={isActive}
              className={cn(
                'relative isolate cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition-colors duration-200 sm:text-sm',
                isAr && 'font-arabic',
                isActive
                  ? 'text-background shadow-md'
                  : 'border border-border bg-card/70 text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="studio-active-role"
                  className="absolute inset-0 bg-foreground rounded-xl -z-10"
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
              <span className="relative z-10">{role.label[isAr ? 'ar' : 'en']}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Main Interactive Studio Canvas */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
        {/* Signature ATS Laser Scanner Sweep Effect */}
        {isScanning && !shouldReduceMotion && (
          <div
            key={scanKey}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-30 h-1 animate-laser-sweep bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.9)]"
          />
        )}

        {/* Studio Top Control Bar */}
        <div className="flex flex-col gap-4 border-b border-border/80 bg-primary/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:bg-primary/[0.05]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-black text-foreground">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">
                {currentRole.targetRole[isAr ? 'ar' : 'en']}
              </div>
              <div className="text-2xs font-mono text-muted-foreground">
                {currentRole.targetCompany}
              </div>
            </div>
          </div>

          {/* Action Trigger: Re-Scan */}
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            <button
              onClick={() => triggerScan()}
              disabled={isScanning}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all duration-150 hover:bg-secondary active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5 text-foreground', isScanning && 'animate-spin')}
              />
              <span>{isAr ? 'إعادة الفحص والمسح' : 'Re-Scan Match'}</span>
            </button>

            {/* ATS Score Indicator */}
            <div className="relative shrink-0">
              <motion.div
                key={hasPassed ? 'pass' : 'risk'}
                initial={shouldReduceMotion ? false : { scale: 0.94 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-xl border px-3.5 py-1.5 font-mono transition-colors duration-300',
                  hasPassed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                )}
              >
                {hasPassed ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-black tabular-nums">{displayScore}%</span>
                <span className="text-2xs font-semibold uppercase tracking-wider">
                  {hasPassed
                    ? isAr
                      ? 'اجتياز ATS'
                      : 'ATS Pass'
                    : isAr
                      ? 'خطر الفرز'
                      : 'Screening Risk'}
                </span>
              </motion.div>

              {bumpKey > 0 && (
                <motion.span
                  key={bumpKey}
                  aria-hidden
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 0], y: -18, scale: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="pointer-events-none absolute -top-2 end-2 font-mono text-xs font-bold text-emerald-500"
                >
                  +2
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Studio Feature Tabs */}
        <div
          role="tablist"
          aria-label={isAr ? 'أدوات الاستوديو التفاعلي' : 'Interactive Studio Feature Tabs'}
          className="relative grid grid-cols-2 gap-px border-b border-border bg-border/60 lg:flex lg:gap-0 lg:bg-card/40 lg:px-8"
        >
          {[
            {
              id: 'tailor' as const,
              icon: Sparkles,
              label: isAr ? 'صياغة Google XYZ' : 'Google XYZ Bullet Tailor',
            },
            {
              id: 'ats' as const,
              icon: FileCheck,
              label: isAr ? 'فحص كلمات ATS' : 'ATS Keyword Match',
            },
            {
              id: 'outreach' as const,
              icon: Send,
              label: isAr ? 'رسالة مسؤول التوظيف' : 'Recruiter Pitch',
            },
            {
              id: 'interview' as const,
              icon: HelpCircle,
              label: isAr ? 'إجابات المقابلة STAR' : 'STAR Interview Prep',
            },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                id={`studio-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`studio-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex min-h-12 cursor-pointer items-center justify-center gap-2 bg-card px-3 py-3 text-start text-xs font-bold transition-colors sm:text-sm lg:justify-start lg:whitespace-nowrap lg:bg-transparent lg:px-5',
                  isAr && 'font-arabic',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="studio-active-tab"
                    className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-foreground"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab 1: Google XYZ Tailor (Crisp Before/After Diff) */}
        {activeTab === 'tailor' && (
          <motion.div
            key={`tailor-${selectedRoleId}`}
            {...panelMotion}
            role="tabpanel"
            id="studio-panel-tailor"
            aria-labelledby="studio-tab-tailor"
            className="space-y-6 p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Before: Weak & Generic */}
              <div className="p-5 sm:p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    {isAr ? 'قبل: صياغة روتينية باهتة' : 'Before: Generic Duty Statement'}
                  </span>
                  <span className="text-2xs px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-mono">
                    {isAr ? 'النتيجة' : 'Score'}: {currentRole.initialScore}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{currentRole.beforeBullet[isAr ? 'ar' : 'en']}&rdquo;
                </p>
                <div className="text-2xs text-muted-foreground/80 flex items-center gap-1.5 pt-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span>
                    {isAr
                      ? 'تفتقر للأرقام والمقاييس المحددة'
                      : 'Lacks quantified metrics & business impact'}
                  </span>
                </div>
              </div>

              {/* After: Quantified Google XYZ Power Bullet */}
              <div className="p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {isAr ? 'بعد: صيغة Google XYZ القياسية' : 'After: Google XYZ Formula'}
                  </span>
                  <motion.span
                    key={afterScore}
                    initial={shouldReduceMotion ? false : { scale: 0.92, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-2xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    {isAr ? 'النتيجة' : 'Score'}: {afterScore}%
                  </motion.span>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  &ldquo;{currentRole.afterBullet[isAr ? 'ar' : 'en']}&rdquo;
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-2xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{currentRole.metricImprovement[isAr ? 'ar' : 'en']}</span>
                  </span>
                  <span className="text-2xs text-muted-foreground">
                    {isAr ? 'تم استخراجها من خبرتك الواقعية' : 'Zero Hallucinations'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: ATS Keyword Match Dial */}
        {activeTab === 'ats' && (
          <motion.div
            key={`ats-${selectedRoleId}`}
            {...panelMotion}
            role="tabpanel"
            id="studio-panel-ats"
            aria-labelledby="studio-tab-ats"
            className="space-y-6 p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Circular SVG Score Dial */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-muted/20 space-y-3.5 transition-all duration-200">
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r={circleRadius}
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-border/40"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r={circleRadius}
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={cn(
                        'transition-colors duration-300',
                        hasPassed ? 'text-emerald-500' : 'text-amber-500',
                      )}
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-mono text-foreground tracking-tight">
                      {displayScore}%
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider">
                      {isAr ? 'درجة ATS' : 'ATS Score'}
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span>
                      {`+${scoreDelta}%`} {isAr ? 'مقابل الأساس' : 'vs Baseline'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground block">
                    {isAr ? 'اجتياز مؤكد للفرز الأولي' : 'Guaranteed ATS Interview Threshold'}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-3xs text-muted-foreground font-mono">
                    <span>Greenhouse</span>
                    <span>·</span>
                    <span>Workday</span>
                    <span>·</span>
                    <span>Lever</span>
                  </div>
                </div>
              </div>

              {/* Matched & Missing Keywords */}
              <div className="md:col-span-8 space-y-5">
                <div className="space-y-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {isAr
                      ? 'الكلمات المتطابقة في سيرتك'
                      : 'Matched Critical Keywords (Found in Resume)'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRole.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                      >
                        <Check className="h-3 w-3" />
                        <span>{skill}</span>
                      </span>
                    ))}
                    {addedSkills.map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold shadow-2xs"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{skill} (Added)</span>
                      </motion.span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    {isAr
                      ? 'فجوات مهاراتية مقترحة (انقر لإضافتها وتعديل النتيجة)'
                      : 'Suggested Gaps (Click to Auto-Insert & Boost Score)'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentRole.missingSkills.map((skill) => {
                      const isAdded = addedSkills.includes(skill)
                      return (
                        <button
                          key={skill}
                          disabled={isAdded}
                          onClick={() => handleAddSkill(skill)}
                          className={cn(
                            'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs active:scale-95',
                            isAdded
                              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-transparent'
                              : 'bg-card border border-amber-500/30 text-foreground hover:bg-amber-500/10 hover:border-amber-500/60',
                          )}
                        >
                          {isAdded ? (
                            <Check className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Plus className="h-3 w-3 text-amber-500 transition-transform duration-200 group-hover:rotate-90" />
                          )}
                          <span>{skill}</span>
                          {!isAdded && (
                            <span className="text-2xs text-amber-500 font-mono">+2%</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Recruiter Outreach Message */}
        {activeTab === 'outreach' && (
          <motion.div
            key={`outreach-${selectedRoleId}`}
            {...panelMotion}
            role="tabpanel"
            id="studio-panel-outreach"
            aria-labelledby="studio-tab-outreach"
            className="space-y-4 p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                {isAr
                  ? 'رسالة تواصل فورية عبر LinkedIn (أقل من 300 حرف)'
                  : 'Punchy 280-Character Recruiter InMail Note'}
              </span>
              <span className="text-2xs font-mono text-muted-foreground">
                {currentRole.outreachNote[isAr ? 'ar' : 'en'].length} / 300 {isAr ? 'حرف' : 'chars'}
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-3 relative group">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                &ldquo;{currentRole.outreachNote[isAr ? 'ar' : 'en']}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-2xs text-muted-foreground">
                  {isAr
                    ? 'معدل ردود مضاعف 3.8x مقارنة بالرسائل الجاهزة'
                    : 'Delivers 3.8x response rate compared to template notes'}
                </span>
                <button
                  onClick={() => handleCopy(currentRole.outreachNote[isAr ? 'ar' : 'en'])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="inline-flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="inline-flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{isAr ? 'نسخ الرسالة' : 'Copy Pitch'}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: STAR Interview Prep (Concise, zero text-walls) */}
        {activeTab === 'interview' && (
          <motion.div
            key={`interview-${selectedRoleId}`}
            {...panelMotion}
            role="tabpanel"
            id="studio-panel-interview"
            aria-labelledby="studio-tab-interview"
            className="space-y-5 p-6 sm:p-8"
          >
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block">
              {isAr
                ? 'إجابة منظمة بأسلوب STAR استناداً لإنجازاتك'
                : 'Grounded STAR Behavioral Response Matrix'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] space-y-1.5">
                <span className="text-2xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  1. Situation (الموقف)
                </span>
                <p className="text-xs text-foreground leading-snug">
                  {currentRole.starSituation[isAr ? 'ar' : 'en']}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] space-y-1.5">
                <span className="text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  2. Task (المهمة)
                </span>
                <p className="text-xs text-foreground leading-snug">
                  {currentRole.starTask[isAr ? 'ar' : 'en']}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] space-y-1.5">
                <span className="text-2xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  3. Action (الإجراء)
                </span>
                <p className="text-xs text-foreground leading-snug">
                  {currentRole.starAction[isAr ? 'ar' : 'en']}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-1.5">
                <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  4. Result (النتيجة)
                </span>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 leading-snug">
                  {currentRole.starResult[isAr ? 'ar' : 'en']}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
