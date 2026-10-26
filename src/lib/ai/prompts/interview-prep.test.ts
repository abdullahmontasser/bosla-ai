import { describe, it, expect } from 'vitest'
import { buildInterviewPrepPrompts, buildSingleQuestionPrompt } from './interview-prep'

describe('Interview Prep AI Prompts (covers: AC-IP-1, AC-IP-2, AC-IP-5)', () => {
  describe('buildInterviewPrepPrompts', () => {
    it('builds English interview prep prompt with bounded outputs and anti-hallucination rules', () => {
      const { system, prompt } = buildInterviewPrepPrompts({
        candidateName: 'Alex Chen',
        roleTitle: 'Senior Full Stack Engineer',
        companyName: 'CloudScale',
        jobContext: 'Next.js App Router, TypeScript, PostgreSQL',
        workExperiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Senior Full Stack Engineer',
            bullets: ['Built streaming AI pipeline reducing latency by 60%'],
          },
        ],
        projects: [
          {
            name: 'CareerCraft AI',
            description: 'Autonomous career agent for resumes and interview prep',
            technologies: ['Next.js', 'PostgreSQL'],
          },
        ],
        language: 'EN',
      })

      expect(system).toContain('Exactly 3 categorized interview questions')
      expect(system).toContain('Exactly 1 BEHAVIORAL question')
      expect(system).toContain('Exactly 1 TECHNICAL question')
      expect(system).toContain('Exactly 1 SITUATIONAL question')
      expect(system).toContain('ZERO-HALLUCINATION INVARIANTS')
      expect(system).toContain('[insert latency reduction %]')
      expect(prompt).toContain('TechVanguard')
      expect(prompt).toContain('CareerCraft AI')
    })

    it('builds Arabic interview prep prompt with localized bdi placeholders and STAR structure', () => {
      const { system, prompt } = buildInterviewPrepPrompts({
        candidateName: 'أحمد المنصور',
        roleTitle: 'مهندس برمجيات متكامل',
        companyName: 'كلاود سكيل',
        jobContext: 'تطوير منصات ذكاء اصطناعي تدفقية',
        workExperiences: [
          {
            companyName: 'أنظمة تك فانجارد',
            jobTitle: 'مهندس برمجيات أول',
            bullets: ['هندسة خطوط تدفق البيانات بالذكاء الاصطناعي'],
          },
        ],
        language: 'AR',
      })

      expect(system).toContain('بالضبط 3 أسئلة مقابلة')
      expect(system).toContain('سؤال سلوكي واحد (BEHAVIORAL)')
      expect(system).toContain('سؤال تقني واحد (TECHNICAL)')
      expect(system).toContain('سؤال موقفي واحد (SITUATIONAL)')
      expect(system).toContain('<bdi>[أدخل نسبة تحسين الأداء]</bdi>')
      expect(prompt).toContain('أنظمة تك فانجارد')
    })

    it('handles empty work experiences and projects gracefully with fallback messaging', () => {
      const { prompt } = buildInterviewPrepPrompts({
        candidateName: 'Junior Developer',
        roleTitle: 'Frontend Engineer',
        companyName: 'Startup Inc',
        jobContext: 'React, Tailwind CSS',
        workExperiences: [],
        projects: [],
        language: 'EN',
      })

      expect(prompt).toContain('No previous work experience recorded')
      expect(prompt).toContain('No projects recorded')
    })
  })

  describe('buildSingleQuestionPrompt', () => {
    it('builds single question regeneration prompt for technical category', () => {
      const { system, prompt } = buildSingleQuestionPrompt({
        candidateName: 'Alex Chen',
        roleTitle: 'Senior Full Stack Engineer',
        companyName: 'CloudScale',
        jobContext: 'TypeScript, Next.js',
        category: 'TECHNICAL',
        existingQuestionText: 'How do you prevent memory leaks in streaming?',
        workExperiences: [],
        language: 'EN',
      })

      expect(system).toContain('TECHNICAL')
      expect(prompt).toContain('How do you prevent memory leaks in streaming?')
    })
  })
})
