import { describe, it, expect, vi, beforeEach } from 'vitest'
import { categorizeSkillsAction } from './skills-actions'
import { classifySkillFallback } from '@/lib/skills/classifier'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findFirst: vi.fn(),
    },
    skill: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
}))

vi.mock('@/lib/ai/provider-client', () => ({
  getProviderModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

describe('skills-actions (AI & Deterministic Classification)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('classifySkillFallback', () => {
    it('classifies database technologies correctly in English and Arabic', () => {
      expect(classifySkillFallback('PostgreSQL', false)).toBe('Databases & Storage')
      expect(classifySkillFallback('MongoDB', true)).toBe('قواعد البيانات والتخزين')
      expect(classifySkillFallback('Redis Caching', false)).toBe('Databases & Storage')
    })

    it('classifies cloud and DevOps technologies accurately', () => {
      expect(classifySkillFallback('Docker', false)).toBe('Cloud & DevOps')
      expect(classifySkillFallback('Kubernetes', true)).toBe('الحوسبة السحابية والديف أوبس')
      expect(classifySkillFallback('AWS', false)).toBe('Cloud & DevOps')
      expect(classifySkillFallback('CI/CD Pipeline', false)).toBe('Cloud & DevOps')
    })

    it('classifies developer tools & testing systems', () => {
      expect(classifySkillFallback('Git', false)).toBe('Developer Tools & Systems')
      expect(classifySkillFallback('Vitest', false)).toBe('Developer Tools & Systems')
      expect(classifySkillFallback('Postman', true)).toBe('أدوات التطوير والأنظمة')
    })

    it('classifies architecture and design concepts', () => {
      expect(classifySkillFallback('Microservices', false)).toBe('Architecture & Concepts')
      expect(classifySkillFallback('System Design', true)).toBe('المعمارية والمفاهيم الهندسية')
      expect(classifySkillFallback('Clean Architecture', false)).toBe('Architecture & Concepts')
    })

    it('classifies leadership and soft competencies', () => {
      expect(classifySkillFallback('Agile Scrum', false)).toBe('Professional & Leadership')
      expect(classifySkillFallback('Team Leadership', true)).toBe('المهارات المهنية والقيادية')
    })

    it('defaults standard tech stacks to Languages & Frameworks', () => {
      expect(classifySkillFallback('TypeScript', false)).toBe('Languages & Frameworks')
      expect(classifySkillFallback('Next.js', true)).toBe('لغات البرمجة وأطر العمل')
    })
  })

  describe('categorizeSkillsAction', () => {
    it('returns empty array cleanly when no skills are provided', async () => {
      const res = await categorizeSkillsAction({ skills: [] })
      expect(res.success).toBe(true)
      expect(res.categorized).toEqual([])
    })

    it('uses fallback classifier and persists to DB if profileId is provided', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user-1' },
      } as never)
      vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([])
      vi.mocked(prisma.profile.findFirst).mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'user-1',
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValueOnce([])

      const res = await categorizeSkillsAction({
        profileId: 'prof-1',
        skills: ['PostgreSQL', 'Docker', 'TypeScript'],
        lang: 'EN',
      })

      expect(res.success).toBe(true)
      expect(res.categorized).toEqual([
        { name: 'PostgreSQL', category: 'Databases & Storage' },
        { name: 'Docker', category: 'Cloud & DevOps' },
        { name: 'TypeScript', category: 'Languages & Frameworks' },
      ])
      expect(prisma.profile.findFirst).toHaveBeenCalledWith({
        where: { id: 'prof-1', userId: 'user-1' },
      })
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
