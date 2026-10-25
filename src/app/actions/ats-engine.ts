'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { calculateDeterministicAtsScore } from '@/lib/ats/scoring'
import {
  buildXyzBulletRewritePrompt,
  validateAndSanitizeXyzBullet,
  buildAiDeepScanPrompt,
  parseAiDeepScanOutput,
} from '@/lib/ai/ats-prompt'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'
import { generateText } from 'ai'
import type { AtsBreakdown } from '@/lib/validations/tailored-resume'

interface SnapshotBullet {
  original?: string
  rewritten?: string
  tailored?: string
  matchedKeywords?: string[]
}

interface SnapshotExperience {
  companyName?: string
  jobTitle?: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  bullets?: Array<string | SnapshotBullet>
}

interface SnapshotSkill {
  name?: string
  category?: string | null
}

interface SnapshotContent {
  candidateHeader?: {
    fullName?: string
    email?: string
    phone?: string
    location?: string
    linkedinUrl?: string
    githubUrl?: string
    websiteUrl?: string
  }
  tailoredExperiences?: SnapshotExperience[]
  skills?: SnapshotSkill[]
  educations?: Array<{
    institution?: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
  }>
}

/**
 * Calculates quantitative ATS score and optionally executes an AI deep scan.
 */
export async function calculateAtsScoreAction(
  tailoredResumeId: string,
  runAiDeepScan: boolean = false,
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            skills: true,
            workExperiences: true,
          },
        },
      },
    })

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const content = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const existingBreakdown = (resume.atsBreakdown as unknown as AtsBreakdown) || null

    // Extract skills and experiences from snapshot or profile
    const candidateSkills: string[] =
      content.skills?.map((s) => s.name || '').filter(Boolean) ||
      resume.profile.skills.map((s) => s.name) ||
      []

    const experiences =
      content.tailoredExperiences?.map((e) => ({
        companyName: e.companyName || '',
        jobTitle: e.jobTitle || '',
        bullets: (e.bullets || []).map((b) =>
          typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        ),
      })) ||
      resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        bullets: w.bullets,
      }))

    let breakdown = calculateDeterministicAtsScore({
      jobTitle: resume.jobPosting.title,
      jobDescription: resume.jobPosting.rawDescription,
      parsedJobSkills: resume.jobPosting.parsedSkills,
      language: resume.language as 'EN' | 'AR',
      candidateHeader: content.candidateHeader || {
        fullName: resume.profile.fullName,
        email: resume.profile.email,
        phone: resume.profile.phone,
        location: resume.profile.location,
        linkedinUrl: resume.profile.linkedinUrl,
      },
      candidateSummary: resume.tailoredSummary || resume.profile.summary,
      candidateSkills,
      experiences,
      dismissedSkills: existingBreakdown?.dismissedSkills || [],
    })

    // If AI deep scan is requested, attempt enhancement
    if (runAiDeepScan) {
      try {
        const activeSettings = await getActiveProviderSettings(session.user.id)
        if (activeSettings.length > 0) {
          const model = getProviderModel(activeSettings[0])
          const { system, prompt } = buildAiDeepScanPrompt({
            targetJobTitle: resume.jobPosting.title,
            targetJobDescription: resume.jobPosting.rawDescription,
            candidateSummary: resume.tailoredSummary || resume.profile.summary,
            candidateSkills,
            experiences,
            language: resume.language as 'EN' | 'AR',
          })

          const aiResult = await generateText({
            model,
            system,
            prompt,
          })

          breakdown = parseAiDeepScanOutput(aiResult.text, breakdown)
        }
      } catch (aiErr) {
        // Fall back gracefully to deterministic breakdown on AI failure per AC-8
        console.warn('AI deep scan failed, falling back to deterministic ATS score:', aiErr)
      }
    }

    // Persist calculated score and breakdown
    await prisma.tailoredResume.update({
      where: {
        id: tailoredResumeId,
      },
      data: {
        atsScore: breakdown.overallScore,
        atsBreakdown: breakdown as unknown as Prisma.InputJsonValue,
        missingSkills: breakdown.missingSkills,
      },
    })

    return {
      success: true,
      atsScore: breakdown.overallScore,
      breakdown,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to calculate ATS score'
    return { success: false, error: message }
  }
}

/**
 * Rewrites a single experience bullet using the Google XYZ formula with zero hallucination.
 */
export async function rewriteBulletWithXyzAction(
  tailoredResumeId: string,
  expIndex: number,
  bulletIndex: number,
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
      },
      include: {
        jobPosting: true,
      },
    })

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const content = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const experiences = content.tailoredExperiences || []

    if (!experiences[expIndex] || !experiences[expIndex].bullets?.[bulletIndex]) {
      return { success: false, error: 'Experience bullet not found at specified index.' }
    }

    const bulletObj = experiences[expIndex].bullets[bulletIndex]
    const originalText =
      typeof bulletObj === 'string'
        ? bulletObj
        : bulletObj.original || bulletObj.rewritten || bulletObj.tailored || ''

    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (activeSettings.length === 0) {
      return {
        success: false,
        error: 'No active AI provider configured. Please configure an active provider in settings.',
      }
    }

    const model = getProviderModel(activeSettings[0])
    const { system, prompt } = buildXyzBulletRewritePrompt({
      originalBullet: originalText,
      companyName: experiences[expIndex].companyName || '',
      jobTitle: experiences[expIndex].jobTitle || '',
      targetJobTitle: resume.jobPosting.title,
      targetJobSkills: resume.jobPosting.parsedSkills,
      language: resume.language as 'EN' | 'AR',
    })

    const aiResult = await generateText({
      model,
      system,
      prompt,
    })

    const sanitized = validateAndSanitizeXyzBullet(originalText, aiResult.text)

    // Update bullet in content snapshot
    const prevMatchedKeywords =
      typeof bulletObj === 'object' && bulletObj !== null ? bulletObj.matchedKeywords : []

    experiences[expIndex].bullets[bulletIndex] = {
      original: originalText,
      rewritten: sanitized.sanitized,
      matchedKeywords: prevMatchedKeywords || [],
    }

    const existingBreakdown = (resume.atsBreakdown as unknown as Record<string, unknown>) || {}
    const updatedBreakdown = {
      ...existingBreakdown,
      isStale: true,
    }

    await prisma.tailoredResume.update({
      where: {
        id: tailoredResumeId,
      },
      data: {
        tailoredContent: content as unknown as Prisma.InputJsonValue,
        atsBreakdown: updatedBreakdown as unknown as Prisma.InputJsonValue,
      },
    })

    return {
      success: true,
      rewrittenBullet: sanitized.sanitized,
      expIndex,
      bulletIndex,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to rewrite experience bullet'
    return { success: false, error: message }
  }
}

/**
 * Adds an interactive missing skill to candidate profile and tailored snapshot, updating ATS score.
 */
export async function addMissingSkillAction(tailoredResumeId: string, skillName: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const cleanSkill = skillName.trim()
  if (!cleanSkill) {
    return { success: false, error: 'Skill name is required' }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            skills: true,
            workExperiences: true,
          },
        },
      },
    })

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    // Check if skill already exists on profile
    const existingSkill = await prisma.skill.findFirst({
      where: {
        profileId: resume.profileId,
        name: {
          equals: cleanSkill,
          mode: 'insensitive',
        },
      },
    })

    if (!existingSkill) {
      await prisma.skill.create({
        data: {
          profileId: resume.profileId,
          name: cleanSkill,
        },
      })
    }

    // Update snapshot content skills
    const content = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const currentSkills = content.skills || []
    if (!currentSkills.some((s) => s.name?.toLowerCase() === cleanSkill.toLowerCase())) {
      currentSkills.push({ name: cleanSkill })
      content.skills = currentSkills
    }

    const allSkills = Array.from(
      new Set([...currentSkills.map((s) => s.name || '').filter(Boolean), cleanSkill]),
    )

    const existingBreakdown = (resume.atsBreakdown as unknown as AtsBreakdown) || null

    const experiences =
      content.tailoredExperiences?.map((e) => ({
        companyName: e.companyName || '',
        jobTitle: e.jobTitle || '',
        bullets: (e.bullets || []).map((b) =>
          typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        ),
      })) ||
      resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        bullets: w.bullets,
      }))

    const updatedBreakdown = calculateDeterministicAtsScore({
      jobTitle: resume.jobPosting.title,
      jobDescription: resume.jobPosting.rawDescription,
      parsedJobSkills: resume.jobPosting.parsedSkills,
      language: resume.language as 'EN' | 'AR',
      candidateHeader: content.candidateHeader,
      candidateSummary: resume.tailoredSummary || resume.profile.summary,
      candidateSkills: allSkills,
      experiences,
      dismissedSkills: existingBreakdown?.dismissedSkills || [],
    })

    await prisma.tailoredResume.update({
      where: {
        id: tailoredResumeId,
      },
      data: {
        tailoredContent: content as unknown as Prisma.InputJsonValue,
        atsScore: updatedBreakdown.overallScore,
        atsBreakdown: updatedBreakdown as unknown as Prisma.InputJsonValue,
        missingSkills: updatedBreakdown.missingSkills,
      },
    })

    return {
      success: true,
      updatedSkills: allSkills,
      atsScore: updatedBreakdown.overallScore,
      breakdown: updatedBreakdown,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add missing skill'
    return { success: false, error: message }
  }
}

/**
 * Dismisses a missing skill, moving it to dismissedSkills and updating ATS score.
 */
export async function dismissMissingSkillAction(tailoredResumeId: string, skillName: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const cleanSkill = skillName.trim()
  if (!cleanSkill) {
    return { success: false, error: 'Skill name is required' }
  }

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id: tailoredResumeId,
        userId: session.user.id,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            skills: true,
            workExperiences: true,
          },
        },
      },
    })

    if (!resume) {
      return { success: false, error: 'Tailored resume not found or access denied.' }
    }

    const content = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const existingBreakdown = (resume.atsBreakdown as unknown as AtsBreakdown) || null
    const dismissedSkills = Array.from(
      new Set([...(existingBreakdown?.dismissedSkills || []), cleanSkill]),
    )

    const candidateSkills: string[] =
      content.skills?.map((s) => s.name || '').filter(Boolean) ||
      resume.profile.skills.map((s) => s.name) ||
      []

    const experiences =
      content.tailoredExperiences?.map((e) => ({
        companyName: e.companyName || '',
        jobTitle: e.jobTitle || '',
        bullets: (e.bullets || []).map((b) =>
          typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        ),
      })) ||
      resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        bullets: w.bullets,
      }))

    const updatedBreakdown = calculateDeterministicAtsScore({
      jobTitle: resume.jobPosting.title,
      jobDescription: resume.jobPosting.rawDescription,
      parsedJobSkills: resume.jobPosting.parsedSkills,
      language: resume.language as 'EN' | 'AR',
      candidateHeader: content.candidateHeader,
      candidateSummary: resume.tailoredSummary || resume.profile.summary,
      candidateSkills,
      experiences,
      dismissedSkills,
    })

    await prisma.tailoredResume.update({
      where: {
        id: tailoredResumeId,
      },
      data: {
        atsScore: updatedBreakdown.overallScore,
        atsBreakdown: updatedBreakdown as unknown as Prisma.InputJsonValue,
        missingSkills: updatedBreakdown.missingSkills,
      },
    })

    return {
      success: true,
      dismissedSkills,
      atsScore: updatedBreakdown.overallScore,
      breakdown: updatedBreakdown,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to dismiss missing skill'
    return { success: false, error: message }
  }
}
