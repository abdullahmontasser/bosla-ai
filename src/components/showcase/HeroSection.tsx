'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Play, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react'
import { RtlIcon } from '@/components/ui'

interface HeroSectionProps {
  lang: string
  dict: {
    badge?: string
    heroTitle1?: string
    heroHighlight?: string
    heroTitle2?: string
    heroSubtitle?: string
    openStudio?: string
  }
}

export function HeroSection({ lang, dict }: HeroSectionProps) {
  const isAr = lang === 'ar'
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.45,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  const content = {
    title1: dict.heroTitle1 || (isAr ? 'توقف عن التشتت.' : 'Cut the Distraction.'),
    highlight: dict.heroHighlight || (isAr ? 'اقتنص الوظيفة أسرع' : 'Land the job Faster'),
    title2: dict.heroTitle2 || (isAr ? 'مع بوصلة AI' : 'with Bosla AI'),
    subtitle:
      dict.heroSubtitle ||
      (isAr
        ? 'بوصلة AI ترشدك بدون تشتيت: تخصيص سيرتك الذاتية في 30 ثانية بصيغة Google XYZ، واجتياز فلاتر ATS، ومضاعفة المقابلات الوظيفية بالذكاء الاصطناعي.'
        : 'Bosla AI directs your job search with zero distraction: tailor resumes in 30 seconds with Google XYZ metrics, beat ATS screenings, and double your interviews.'),
    openStudio: dict.openStudio || (isAr ? 'ابدأ التجربة مجاناً' : 'Start Free Trial'),
    demo: isAr ? 'شاهد الاستوديو الحي' : 'Watch Demo',
  }

  const proof = [
    { icon: CheckCircle2, label: isAr ? 'بدون اختلاق أو هلوسة' : 'Zero Hallucinations' },
    { icon: ShieldCheck, label: isAr ? 'أمان تام وتشفير AES-256' : 'Private BYOK (AES-256)' },
    { icon: FileCheck, label: isAr ? 'تصدير متجهي معتمد لـ ATS' : 'ATS-Engineered Vector PDF' },
  ]

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center py-6 text-center sm:py-10 md:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center space-y-6 text-center sm:space-y-7">
          <motion.h1 variants={itemVariants} className="text-balance text-center">
            <span
              className={
                isAr
                  ? 'mb-2 block text-4xl font-arabic font-extrabold leading-[1.2] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:text-7xl'
                  : 'mb-2 block text-5xl font-sans font-black leading-[1.2] tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl'
              }
            >
              {content.title1}
            </span>

            <span
              className={
                isAr
                  ? 'block text-3xl font-arabic font-extrabold leading-[1.3] sm:text-4xl md:text-5xl lg:text-6xl'
                  : 'block text-4xl font-sans font-black leading-[1.3] tracking-[-0.035em] sm:text-5xl md:text-6xl lg:text-7xl'
              }
            >
              <span className="block text-foreground">{content.highlight}</span>
              <span className="block font-semibold text-muted-foreground">{content.title2}</span>
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className={
              isAr
                ? 'mx-auto max-w-2xl text-center font-arabic text-base font-normal leading-[1.8] text-muted-foreground sm:text-lg md:text-xl'
                : 'mx-auto max-w-2xl text-center text-base font-normal leading-relaxed text-muted-foreground sm:text-lg md:text-xl'
            }
          >
            {content.subtitle}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:gap-4"
          >
            <Link
              href={`/${lang}/tailor`}
              className="group inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-foreground px-7 py-4 text-sm font-bold text-background shadow-sm transition-all duration-150 hover:scale-[1.02] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span>{content.openStudio}</span>
              <RtlIcon
                icon={ArrowRight}
                className={
                  isAr
                    ? 'h-4 w-4'
                    : 'h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5'
                }
              />
            </Link>

            <a
              href="#interactive-studio"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-4 text-sm font-medium text-foreground shadow-2xs transition-all duration-150 hover:scale-[1.01] hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5 fill-muted-foreground text-muted-foreground transition-colors group-hover:fill-foreground group-hover:text-foreground" />
              <span>{content.demo}</span>
            </a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-4 text-xs text-muted-foreground"
          >
            {proof.map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-1.5 font-medium">
                <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
