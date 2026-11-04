import { describe, it, expect, vi } from 'vitest'
import { enhanceProjectDescriptionAction, enhanceProfileSummaryAction } from './profile-ai'

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'usr_ai_test' } }),
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn().mockResolvedValue([]),
}))

describe('profile-ai server actions', () => {
  it('enhances project description in English', async () => {
    const res = await enhanceProjectDescriptionAction({
      name: 'CareerCraft AI',
      role: 'Full Stack Architect',
      technologies: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      currentDescription: 'A platform to help job seekers customize resumes.',
      language: 'EN',
    })

    expect(res.success).toBe(true)
    expect(res.enhancedDescription).toContain('CareerCraft AI')
    expect(res.enhancedDescription?.length).toBeGreaterThan(30)
  })

  it('enhances project description in Arabic', async () => {
    const res = await enhanceProjectDescriptionAction({
      name: 'منصة بوصلة المهنية',
      role: 'مهندس نظم رئيسي',
      technologies: ['Next.js', 'PostgreSQL'],
      currentDescription: 'تطبيق لمساعدة الباحثين عن عمل في تخصيص سيرهم الذاتية.',
      language: 'AR',
    })

    expect(res.success).toBe(true)
    expect(res.enhancedDescription).toContain('منصة بوصلة المهنية')
  })

  it('enhances profile executive summary in English and Arabic', async () => {
    const enRes = await enhanceProfileSummaryAction({
      fullName: 'Sarah Connor',
      headline: 'Senior Cloud Architect',
      currentSummary: 'Experienced architect specializing in AWS and distributed systems.',
      language: 'EN',
    })

    expect(enRes.success).toBe(true)
    expect(enRes.enhancedSummary).toContain('Senior Cloud Architect')

    const arRes = await enhanceProfileSummaryAction({
      fullName: 'سارة أحمد',
      headline: 'كبير مهندسي الحوسبة السحابية',
      currentSummary: 'مهندسة ذات خبرة واسعة في إدارة البنى التحتية السحابية.',
      language: 'AR',
    })

    expect(arRes.success).toBe(true)
    expect(arRes.enhancedSummary).toContain('كبير مهندسي الحوسبة السحابية')
  })
})
