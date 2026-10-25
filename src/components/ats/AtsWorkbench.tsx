'use client'

import * as React from 'react'
import { AtsScoreCard } from './AtsScoreCard'
import { SkillsGapCard } from './SkillsGapCard'
import { XyzBulletList, type ExperienceItem } from './XyzBulletList'
import { PdfExportButton } from './PdfExportButton'
import {
  calculateAtsScoreAction,
  addMissingSkillAction,
  dismissMissingSkillAction,
  rewriteBulletWithXyzAction,
} from '@/app/actions/ats-engine'
import type { AtsBreakdown } from '@/lib/validations/tailored-resume'
import type { Dictionary } from '@/lib/i18n/types'
import { AlertCircle } from 'lucide-react'

export interface AtsWorkbenchProps {
  tailoredResumeId: string
  initialAtsScore?: number | null
  initialBreakdown?: AtsBreakdown | null
  initialExperiences?: ExperienceItem[]
  lastExportedAt?: string | Date | null
  lang: 'en' | 'ar'
  dict: Partial<Dictionary>
}

export function AtsWorkbench({
  tailoredResumeId,
  initialAtsScore = null,
  initialBreakdown = null,
  initialExperiences = [],
  lastExportedAt: initialExportedAt = null,
  lang,
  dict,
}: AtsWorkbenchProps) {
  const [atsScore, setAtsScore] = React.useState<number>(initialAtsScore ?? 0)
  const [breakdown, setBreakdown] = React.useState<AtsBreakdown | null>(initialBreakdown)
  const [experiences, setExperiences] = React.useState<ExperienceItem[]>(initialExperiences)
  const [lastExportedAt] = React.useState<string | Date | null>(initialExportedAt)
  const [isScanning, setIsScanning] = React.useState(false)
  const [isUpdatingSkills, setIsUpdatingSkills] = React.useState(false)
  const [optimizingKey, setOptimizingKey] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Fetch or calculate score if not present
  React.useEffect(() => {
    if (!breakdown && tailoredResumeId) {
      calculateAtsScoreAction(tailoredResumeId, false).then((res) => {
        if (res.success && res.breakdown) {
          setAtsScore(res.atsScore ?? 0)
          setBreakdown(res.breakdown)
        }
      })
    }
  }, [breakdown, tailoredResumeId])

  // Handler: Run AI Deep Scan
  const handleDeepScan = async () => {
    setIsScanning(true)
    setErrorMessage(null)

    try {
      const res = await calculateAtsScoreAction(tailoredResumeId, true)
      if (res.success && res.breakdown) {
        setAtsScore(res.atsScore ?? 0)
        setBreakdown(res.breakdown)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(
        lang === 'ar' ? 'حدث خطأ أثناء إجراء الفحص العميق.' : 'Failed to complete AI deep scan.',
      )
    } finally {
      setIsScanning(false)
    }
  }

  // Handler: Recalculate deterministic score
  const handleRecalculate = async () => {
    setIsScanning(true)
    setErrorMessage(null)

    try {
      const res = await calculateAtsScoreAction(tailoredResumeId, false)
      if (res.success && res.breakdown) {
        setAtsScore(res.atsScore ?? 0)
        setBreakdown(res.breakdown)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(lang === 'ar' ? 'فشل إعادة حساب النتيجة.' : 'Failed to recalculate score.')
    } finally {
      setIsScanning(false)
    }
  }

  // Handler: Add missing skill
  const handleAddSkill = async (skillName: string) => {
    setIsUpdatingSkills(true)
    setErrorMessage(null)

    try {
      const res = await addMissingSkillAction(tailoredResumeId, skillName)
      if (res.success && res.breakdown) {
        setAtsScore(res.atsScore ?? 0)
        setBreakdown(res.breakdown)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(lang === 'ar' ? 'فشل إضافة المهارة.' : 'Failed to add missing skill.')
    } finally {
      setIsUpdatingSkills(false)
    }
  }

  // Handler: Dismiss missing skill
  const handleDismissSkill = async (skillName: string) => {
    setIsUpdatingSkills(true)
    setErrorMessage(null)

    try {
      const res = await dismissMissingSkillAction(tailoredResumeId, skillName)
      if (res.success && res.breakdown) {
        setAtsScore(res.atsScore ?? 0)
        setBreakdown(res.breakdown)
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(lang === 'ar' ? 'فشل استبعاد المهارة.' : 'Failed to dismiss missing skill.')
    } finally {
      setIsUpdatingSkills(false)
    }
  }

  // Handler: Optimize bullet with Google XYZ
  const handleRewriteBullet = async (expIndex: number, bulletIndex: number) => {
    const key = `${expIndex}-${bulletIndex}`
    setOptimizingKey(key)
    setErrorMessage(null)

    try {
      const res = await rewriteBulletWithXyzAction(tailoredResumeId, expIndex, bulletIndex)
      if (res.success && res.rewrittenBullet) {
        setExperiences((prev) => {
          const next = [...prev]
          if (next[expIndex] && next[expIndex].bullets[bulletIndex]) {
            const current = next[expIndex].bullets[bulletIndex]
            next[expIndex].bullets[bulletIndex] = {
              ...current,
              original: current.original || current.rewritten || current.tailored,
              rewritten: res.rewrittenBullet,
            }
          }
          return next
        })

        // Flag breakdown as stale
        if (breakdown) {
          setBreakdown({
            ...breakdown,
            isStale: true,
          })
        }
      } else if (res.error) {
        setErrorMessage(res.error)
      }
    } catch {
      setErrorMessage(lang === 'ar' ? 'فشل تحسين صياغة الإنجاز.' : 'Failed to rewrite bullet.')
    } finally {
      setOptimizingKey(null)
    }
  }

  return (
    <div className="space-y-6" data-testid="ats-workbench">
      {/* Workbench Header & PDF Export Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {dict.ats?.title || 'ATS Optimization Workbench'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dict.ats?.subtitle ||
              'Real-time keyword scoring, Google XYZ bullet restructuring, and vector PDF export.'}
          </p>
        </div>

        <PdfExportButton
          tailoredResumeId={tailoredResumeId}
          lang={lang}
          dict={dict}
          lastExportedAt={lastExportedAt}
        />
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: ATS Score & Skills Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          {breakdown ? (
            <AtsScoreCard
              score={atsScore}
              breakdown={breakdown}
              dict={dict}
              lang={lang}
              isScanning={isScanning}
              onDeepScan={handleDeepScan}
              onRecalculate={handleRecalculate}
            />
          ) : (
            <div className="p-8 rounded-lg border border-border bg-card text-center text-xs text-muted-foreground animate-pulse">
              {lang === 'ar'
                ? 'جارٍ تحليل التوافق مع أنظمة التوظيف...'
                : 'Evaluating ATS match score...'}
            </div>
          )}
        </div>

        <div className="lg:col-span-6">
          {breakdown && (
            <SkillsGapCard
              matchedSkills={breakdown.matchedSkills}
              missingSkills={breakdown.missingSkills}
              dismissedSkills={breakdown.dismissedSkills}
              dict={dict}
              lang={lang}
              onAddSkill={handleAddSkill}
              onDismissSkill={handleDismissSkill}
              isUpdating={isUpdatingSkills}
            />
          )}
        </div>
      </div>

      {/* Experience Bullet Rewriting Section */}
      {experiences && experiences.length > 0 && (
        <XyzBulletList
          experiences={experiences}
          dict={dict}
          lang={lang}
          optimizingKey={optimizingKey}
          onRewriteBullet={handleRewriteBullet}
        />
      )}
    </div>
  )
}
