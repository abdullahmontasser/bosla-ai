// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getLandingCopy, landingCopy } from './content'
import { getShowcaseSample } from './showcase-data'

let Comparison: (typeof import('./Comparison'))['Comparison']
let FinalCta: (typeof import('./FinalCta'))['FinalCta']
let Hero: (typeof import('./Hero'))['Hero']
let HowItWorks: (typeof import('./HowItWorks'))['HowItWorks']
let LandingFooter: (typeof import('./LandingFooter'))['LandingFooter']
let ProductStory: (typeof import('./ProductStory'))['ProductStory']
let TrustStrip: (typeof import('./TrustStrip'))['TrustStrip']
let JobPanel: (typeof import('./StoryPanels'))['JobPanel']
let ResumePanel: (typeof import('./StoryPanels'))['ResumePanel']

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

beforeAll(async () => {
  stubMatchMedia()

  const [comparison, finalCta, hero, howItWorks, footer, productStory, trustStrip, storyPanels] =
    await Promise.all([
      import('./Comparison'),
      import('./FinalCta'),
      import('./Hero'),
      import('./HowItWorks'),
      import('./LandingFooter'),
      import('./ProductStory'),
      import('./TrustStrip'),
      import('./StoryPanels'),
    ])

  Comparison = comparison.Comparison
  FinalCta = finalCta.FinalCta
  Hero = hero.Hero
  HowItWorks = howItWorks.HowItWorks
  LandingFooter = footer.LandingFooter
  ProductStory = productStory.ProductStory
  TrustStrip = trustStrip.TrustStrip
  JobPanel = storyPanels.JobPanel
  ResumePanel = storyPanels.ResumePanel
})

beforeEach(() => {
  stubMatchMedia()
})

describe('landing content', () => {
  it('provides complete English and Arabic copy', () => {
    for (const locale of ['en', 'ar'] as const) {
      const copy = getLandingCopy(locale)
      expect(copy.nav.links).toHaveLength(4)
      expect(copy.showcase.stages).toHaveLength(5)
      expect(copy.how.steps).toHaveLength(3)
      expect(copy.comparison.rows).toHaveLength(5)
      expect(copy.features.foundation).toHaveLength(4)
      expect(copy.footer.columns).toHaveLength(3)
      expect(copy.cta.notes.length).toBeGreaterThan(0)
    }
  })

  it('does not ship unsupported hiring or speed claims', () => {
    const serialized = JSON.stringify(landingCopy)

    expect(serialized).not.toMatch(/guaranteed ATS|3\.8x|3\.4x|double your interviews/i)
    expect(serialized).not.toMatch(/in 30 seconds|beat ATS|100% safe/i)
    expect(serialized).not.toMatch(/مضمون|مضمونة|مضاعفة المقابلات|خلال 30 ثانية/)
  })

  it('frames ATS coverage as a drafting signal', () => {
    const sample = getShowcaseSample('en')

    expect(sample.ats.caveat).toMatch(/drafting signal|not a prediction/i)
    expect(sample.achievement.caveat).toMatch(/only from the details you provide/i)
    expect(getLandingCopy('en').trust.footnote).toMatch(/does not apply to jobs for you/i)
  })
})

describe('landing sections', () => {
  it('renders the hero headline, primary action, and sample label', () => {
    render(<Hero lang="en" copy={getLandingCopy('en')} />)

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(screen.getByText('A sharper resume')).toBeDefined()
    expect(screen.getByRole('link', { name: /tailor a resume free/i })).toBeDefined()
    expect(screen.getByText('Illustrative workspace')).toBeDefined()
  })

  it('keeps Arabic hamza and tashkeel inside the animated line masks', () => {
    render(<Hero lang="ar" copy={getLandingCopy('ar')} />)

    const heading = screen.getByRole('heading', { level: 1 })

    expect(screen.getByText('سيرةٌ أدقّ')).toBeDefined()
    expect(screen.getByText(/حقاً/)).toBeDefined()
    // The reveal clips each line vertically; every line must use the mask that
    // leaves room for marks that sit above and below the Arabic line box.
    expect(heading.querySelectorAll('.line-mask')).toHaveLength(3)
  })

  it('renders the trust strip and its limitation note', () => {
    render(<TrustStrip copy={getLandingCopy('en')} />)

    expect(screen.getByText('Your keys, your models')).toBeDefined()
    expect(screen.getByText(/does not apply to jobs for you/i)).toBeDefined()
  })

  it('renders the three-step orientation with localized links', () => {
    render(<HowItWorks lang="ar" copy={getLandingCopy('ar')} />)

    expect(screen.getByText('ابدأ بخبرتك.')).toBeDefined()
    expect(screen.getByRole('link', { name: /أضف خبرتك/ }).getAttribute('href')).toBe('/ar/resume')
  })

  it('renders the workflow rail and the stacked fallback', () => {
    render(<ProductStory lang="en" copy={getLandingCopy('en')} sample={getShowcaseSample('en')} />)

    expect(screen.getAllByText('The job description').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Your next move').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /the job description/i })).toHaveLength(1)
  })

  it('renders the comparison matrix and its limitation note', () => {
    render(<Comparison copy={getLandingCopy('en')} />)

    expect(screen.getByText('Same effort.')).toBeDefined()
    expect(screen.getByText('Different direction.')).toBeDefined()
    expect(screen.getAllByText('Evidence').length).toBeGreaterThan(0)
    expect(screen.getByText(/does not apply to jobs for you/i)).toBeDefined()
  })

  it('renders the closing action and privacy notes', () => {
    render(<FinalCta lang="en" copy={getLandingCopy('en')} />)

    expect(screen.getByText('Make the next application')).toBeDefined()
    expect(screen.getByRole('link', { name: /tailor a resume free/i })).toBeDefined()
    expect(screen.getByText('Bring your own AI provider')).toBeDefined()
  })

  it('renders footer links with locale and external safety', () => {
    render(<LandingFooter lang="ar" copy={getLandingCopy('ar')} />)

    const github = screen.getByRole('link', { name: /github/i })
    expect(github.getAttribute('target')).toBe('_blank')
    expect(github.getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.getByRole('link', { name: 'استوديو التخصيص' }).getAttribute('href')).toBe(
      '/ar/tailor',
    )
  })
})

describe('sample workflow panels', () => {
  it('marks the job description and resume as illustrative', () => {
    const sample = getShowcaseSample('en')

    render(
      <div>
        <JobPanel sample={sample} lang="en" />
        <ResumePanel sample={sample} lang="en" />
      </div>,
    )

    expect(screen.getAllByText(/illustrative/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Senior Product Engineer').length).toBeGreaterThan(0)
    expect(screen.getByText('Tarek Mansour')).toBeDefined()
    expect(screen.getByText(/You approve every line/i)).toBeDefined()
  })
})
