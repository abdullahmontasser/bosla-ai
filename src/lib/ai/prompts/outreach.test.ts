import { describe, it, expect } from 'vitest'
import { trimAtWordBoundary, buildOutreachPrompts, buildSingleVariantPrompt } from './outreach'

describe('Outreach AI Prompts & Helpers (covers: AC-CO-1, AC-CO-2, AC-CO-5)', () => {
  describe('trimAtWordBoundary', () => {
    it('returns original text if length <= maxLen', () => {
      const shortText = 'Short note for connection.'
      expect(trimAtWordBoundary(shortText, 300)).toBe(shortText)
    })

    it('trims cleanly at last word boundary when text exceeds maxLen', () => {
      const text =
        'This is a longer connection request message designed to test the word boundary trimming algorithm safely without truncating in the middle of any word.'
      const trimmed = trimAtWordBoundary(text, 50)
      expect(trimmed.length).toBeLessThanOrEqual(50)
      expect(trimmed).toBe('This is a longer connection request message')
      // Ensure no trailing punctuation or half words
      expect(trimmed.endsWith(' ')).toBe(false)
    })

    it('trims Arabic text at word boundaries properly', () => {
      const arText =
        'مرحباً، يسعدني التواصل معكم لبحث سبل التعاون الهندسي وتطوير الحلول السحابية المتقدمة وفق أعلى المعايير.'
      const trimmed = trimAtWordBoundary(arText, 45)
      expect(trimmed.length).toBeLessThanOrEqual(45)
      expect(trimmed).toBe('مرحباً، يسعدني التواصل معكم لبحث سبل التعاون')
    })

    it('strips trailing punctuation when trimming at boundary', () => {
      const text = 'Engineering systems with high throughput, reliability, and precision.'
      const trimmed = trimAtWordBoundary(text, 42)
      expect(trimmed.length).toBeLessThanOrEqual(42)
      expect(trimmed.endsWith(',')).toBe(false)
    })
  })

  describe('buildOutreachPrompts', () => {
    it('builds English prompts with professional tone and recruiter target', () => {
      const { system, prompt } = buildOutreachPrompts({
        candidateName: 'Alex Chen',
        roleTitle: 'Senior Full Stack Engineer',
        companyName: 'CloudScale',
        jobContext: 'Next.js App Router, TypeScript, PostgreSQL',
        keyAchievements: ['Engineered AI streaming pipeline reducing latency by 60%'],
        tone: 'PROFESSIONAL',
        recipientType: 'RECRUITER',
        language: 'EN',
      })

      expect(system).toContain('280 characters')
      expect(system).toContain('ZERO HALLUCINATIONS')
      expect(system).toContain('Target: Talent Acquisition / Recruiter')
      expect(prompt).toContain('Alex Chen')
      expect(prompt).toContain('CloudScale')
    })

    it('builds Arabic prompts with right tone and recipient context', () => {
      const { system, prompt } = buildOutreachPrompts({
        candidateName: 'أحمد المنصور',
        roleTitle: 'مهندس برمجيات أول',
        companyName: 'كلاود سكيل',
        jobContext: 'تطوير تطبيقات سحابية متقدمة',
        keyAchievements: ['هندسة خطوط معالجة ذكاء اصطناعي تدفقية'],
        tone: 'CONFIDENT',
        recipientType: 'HIRING_MANAGER',
        language: 'AR',
      })

      expect(system).toContain('280 حرفاً')
      expect(system).toContain('المدير الفني أو مدير التوظيف')
      expect(prompt).toContain('أحمد المنصور')
      expect(prompt).toContain('كلاود سكيل')
    })
  })

  describe('buildSingleVariantPrompt', () => {
    it('builds single variant regeneration prompt for InMail', () => {
      const { system, prompt } = buildSingleVariantPrompt({
        candidateName: 'Alex Chen',
        roleTitle: 'Senior Full Stack Engineer',
        companyName: 'CloudScale',
        jobContext: 'Next.js, TypeScript',
        keyAchievements: ['Reduced latency by 60%'],
        tone: 'CONVERSATIONAL',
        recipientType: 'PEER',
        language: 'EN',
        variant: 'inMail',
      })

      expect(system).toContain('LinkedIn InMail pitch')
      expect(prompt).toContain('inMail')
    })
  })
})
