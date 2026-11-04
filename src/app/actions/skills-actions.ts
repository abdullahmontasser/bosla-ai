'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'
import { classifySkillFallback, CATEGORIES_EN, CATEGORIES_AR } from '@/lib/skills/classifier'
import { generateObject } from 'ai'
import { z } from 'zod'

export interface CategorizeSkillsInput {
  profileId?: string
  skills: string[]
  lang?: 'EN' | 'AR'
}

export interface CategorizedSkillResult {
  name: string
  category: string
}

const CategorizeSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
    }),
  ),
})

/**
 * Categorizes a list of skills using AI with deterministic fallback.
 * If profileId is passed, persists the new category to the database.
 */
export async function categorizeSkillsAction(input: CategorizeSkillsInput): Promise<{
  success: boolean
  categorized: CategorizedSkillResult[]
  error?: string
}> {
  const session = await auth()
  const userId = session?.user?.id

  const rawSkills = input.skills.filter((s) => s && s.trim().length > 0)
  if (rawSkills.length === 0) {
    return { success: true, categorized: [] }
  }

  const isAr = input.lang === 'AR'

  // Attempt AI categorization if active provider is configured
  let categorizedResults: CategorizedSkillResult[] | null = null

  if (userId) {
    try {
      const activeSettings = await getActiveProviderSettings(userId)
      if (activeSettings.length > 0) {
        const model = getProviderModel(activeSettings[0]!)
        const targetCats = isAr ? Object.values(CATEGORIES_AR) : Object.values(CATEGORIES_EN)

        const systemPrompt = `You are an expert technical talent taxonomist.
Categorize each given skill into exactly one of these standardized domains:
${targetCats.map((c) => `- "${c}"`).join('\n')}

Guidelines:
1. Always map every input skill to the closest matching category from the list.
2. Return strictly valid structured data conforming to the schema.`

        const { object } = await generateObject({
          model,
          schema: CategorizeSchema,
          system: systemPrompt,
          prompt: `Categorize the following skills:\n${rawSkills.join(', ')}`,
          abortSignal: AbortSignal.timeout(15000), // 15s timeout
        })

        if (object?.skills?.length) {
          const aiMap = new Map(
            object.skills.map((item) => [item.name.toLowerCase().trim(), item.category]),
          )
          categorizedResults = rawSkills.map((name) => ({
            name,
            category: aiMap.get(name.toLowerCase().trim()) || classifySkillFallback(name, isAr),
          }))
        }
      }
    } catch (err) {
      console.warn('AI skill categorization failed, using deterministic fallback:', err)
    }
  }

  // Fallback if AI not available or failed
  if (!categorizedResults) {
    categorizedResults = rawSkills.map((name) => ({
      name,
      category: classifySkillFallback(name, isAr),
    }))
  }

  // If profileId is provided, persist updates directly to the database
  if (input.profileId && userId) {
    try {
      const profile = await prisma.profile.findFirst({
        where: { id: input.profileId, userId },
      })

      if (profile) {
        await prisma.$transaction(
          categorizedResults.map((item) =>
            prisma.skill.updateMany({
              where: {
                profileId: profile.id,
                name: { equals: item.name, mode: 'insensitive' },
              },
              data: {
                category: item.category,
              },
            }),
          ),
        )
      }
    } catch (dbErr) {
      console.error('Failed to persist categorized skills to database:', dbErr)
    }
  }

  return {
    success: true,
    categorized: categorizedResults,
  }
}
