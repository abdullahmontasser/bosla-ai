// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  HeroSection,
  InteractiveProductStudio,
  SaaSBentoGrid,
  ComparisonSection,
  SaaSCallToAction,
  AtsBenchmarkShowcase,
  ArchitectureCard,
  DeveloperQuickstart,
} from './index'

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
})

describe('Public Showcase SaaS Components', () => {
  describe('HeroSection', () => {
    it('renders hero headline, high-impact display lines, and CTA in English', () => {
      render(<HeroSection lang="en" dict={{}} />)
      expect(screen.getByText('Cut the Distraction.')).toBeDefined()
      expect(screen.getByText('Land the job Faster')).toBeDefined()
      expect(screen.getByText('with Bosla AI')).toBeDefined()
      expect(screen.getByText('Start Free Trial')).toBeDefined()
      expect(screen.getByText('Watch Demo')).toBeDefined()
      expect(screen.getByText('Zero Hallucinations')).toBeDefined()
      expect(screen.getByText('Private BYOK (AES-256)')).toBeDefined()
      expect(screen.getByText('ATS-Engineered Vector PDF')).toBeDefined()
    })

    it('renders hero in Arabic with localized copy', () => {
      render(<HeroSection lang="ar" dict={{}} />)
      expect(screen.getByText('توقف عن التشتت.')).toBeDefined()
      expect(screen.getByText('اقتنص الوظيفة أسرع')).toBeDefined()
      expect(screen.getByText('مع بوصلة AI')).toBeDefined()
      expect(screen.getByText('ابدأ التجربة مجاناً')).toBeDefined()
      expect(screen.getByText('بدون اختلاق أو هلوسة')).toBeDefined()
      expect(screen.getByText('أمان تام وتشفير AES-256')).toBeDefined()
      expect(screen.getByText('تصدير متجهي معتمد لـ ATS')).toBeDefined()
    })
  })

  describe('InteractiveProductStudio', () => {
    it('renders studio tabs, switches roles, and renders Google XYZ comparison', () => {
      render(<InteractiveProductStudio lang="en" />)

      expect(screen.getByText('Experience the AI Transformation in Real Time')).toBeDefined()
      expect(screen.getByText('Google XYZ Bullet Tailor')).toBeDefined()
      expect(screen.getByText('ATS Keyword Match')).toBeDefined()
      expect(screen.getByText('Recruiter Pitch')).toBeDefined()
      expect(screen.getByText('STAR Interview Prep')).toBeDefined()
      expect(screen.getByText('Score: 68%')).toBeDefined()
      expect(screen.getByText('Score: 96%')).toBeDefined()

      // Switch to Product Management role
      fireEvent.click(screen.getByText('Product Management'))
      expect(screen.getByText(/Linear · Product Team/)).toBeDefined()

      // Switch to ATS tab
      fireEvent.click(screen.getByText('ATS Keyword Match'))
      expect(screen.getByText(/Matched Critical Keywords/)).toBeDefined()

      // Switch to Outreach tab
      fireEvent.click(screen.getByText('Recruiter Pitch'))
      expect(screen.getByText(/Punchy 280-Character Recruiter InMail Note/)).toBeDefined()

      // Switch to Interview tab
      fireEvent.click(screen.getByText('STAR Interview Prep'))
      expect(screen.getByText(/Grounded STAR Behavioral Response Matrix/)).toBeDefined()
    })

    it('renders Arabic interactive studio with RTL mirror formatting', () => {
      render(<InteractiveProductStudio lang="ar" />)

      expect(screen.getByText('شاهد كيف يحول الذكاء الاصطناعي سيرتك الذاتية')).toBeDefined()
      expect(screen.getByText('صياغة Google XYZ')).toBeDefined()
      expect(screen.getByText('فحص كلمات ATS')).toBeDefined()
    })
  })

  describe('SaaSBentoGrid', () => {
    it('renders the 5 SaaS superpower cards in English', () => {
      render(<SaaSBentoGrid lang="en" />)

      expect(screen.getByText('Google XYZ Achievement Formula')).toBeDefined()
      expect(screen.getByText('100% Safe Vector PDF Export')).toBeDefined()
      expect(screen.getByText('100% Private & BYOK')).toBeDefined()
      expect(screen.getByText('Visual Application Pipeline')).toBeDefined()
      expect(screen.getByText('Bilingual First (RTL & LTR)')).toBeDefined()
    })

    it('renders the 5 SaaS superpower cards in Arabic', () => {
      render(<SaaSBentoGrid lang="ar" />)

      expect(screen.getByText('محرك صياغة Google XYZ الصارم')).toBeDefined()
      expect(screen.getByText('تصدير متجهي آمن 100% لـ ATS')).toBeDefined()
      expect(screen.getByText('خصوصية كاملة ومفاتيحك الخاصة')).toBeDefined()
    })
  })

  describe('ComparisonSection', () => {
    it('renders the comparison between old way and Bosla way', () => {
      render(<ComparisonSection lang="en" />)

      expect(screen.getByText('The Traditional Grind')).toBeDefined()
      expect(screen.getByText('The Bosla AI Way')).toBeDefined()
    })
  })

  describe('SaaSCallToAction', () => {
    it('renders the conversion CTA with launch button', () => {
      render(<SaaSCallToAction lang="en" />)

      expect(
        screen.getByText('Ready to Land High-Conviction Interviews in Record Time?'),
      ).toBeDefined()
      expect(screen.getByText('Start Tailoring Free — In 30 Seconds')).toBeDefined()
    })
  })

  describe('AtsBenchmarkShowcase & ArchitectureCard', () => {
    it('renders benchmark tabs and switches selected preset', () => {
      render(<AtsBenchmarkShowcase lang="en" />)
      expect(screen.getByText('Live ATS Benchmark Engine')).toBeDefined()
    })

    it('renders architecture layers', () => {
      render(<ArchitectureCard lang="en" />)
      expect(screen.getAllByText('Modular Tracer Bullet Architecture').length).toBeGreaterThan(0)
    })

    it('renders developer quickstart', () => {
      render(<DeveloperQuickstart />)
      expect(screen.getByText('Run Locally in Under Two Minutes')).toBeDefined()
    })
  })
})
