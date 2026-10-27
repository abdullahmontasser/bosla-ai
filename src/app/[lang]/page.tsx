import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Sparkles, Bot, FileText, Kanban, Compass, Menu } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { Button, LanguageSwitcher, ThemeSwitcher } from '@/components/ui'
import {
  HeroSection,
  InteractiveProductStudio,
  SaaSBentoGrid,
  ComparisonSection,
  SaaSCallToAction,
  ScrollReveal,
} from '@/components/showcase'

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  const isAr = lang === 'ar'

  const title = isAr
    ? 'بوصلة AI — بوصلتك المهنية الذكية لتخصيص السير واقتناص الوظائف'
    : 'Bosla AI — Smart Resume Platform & Interview Accelerator'
  const description = isAr
    ? 'توقف عن التشتت والتقديم العشوائي. بوصلة AI ترشدك وتخصص سيرتك الذاتية في 30 ثانية بصيغة Google XYZ، وتضمن اجتياز ATS، ومضاعفة المقابلات.'
    : 'Navigate your career without distraction. Bosla AI directs you to tailor resumes in 30 seconds with Google XYZ metrics and guaranteed ATS pass rates.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isAr ? 'ar_AR' : 'en_US',
      url: `https://bosla.ai/${lang}`,
      siteName: isAr ? 'بوصلة AI' : 'Bosla AI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)
  const isAr = lang === 'ar'
  const s = dict.showcase as Record<string, string> | undefined

  const navItems = [
    { href: '/tailor', icon: Sparkles, en: 'AI Tailor', ar: 'استوديو التخصيص' },
    { href: '/resume', icon: FileText, en: 'ATS Scanner', ar: 'فحص ATS' },
    { href: '/tracker', icon: Kanban, en: 'Job Pipeline', ar: 'لوحة التتبع' },
    { href: '/settings/providers', icon: Bot, en: 'BYOK Keys', ar: 'مفتاحك الخاص (BYOK)' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: dict.common.brand,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (Web Application)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: s?.heroSubtitle || dict.common.tagline,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      {/* Structured JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Refined Ambient Top Gradient */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(120,119,198,0.1),transparent)] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2.5 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-xs transition-transform duration-150 group-hover:scale-105">
              <Compass className="h-4 w-4" />
            </div>
            <span className="whitespace-nowrap font-bold text-foreground tracking-tight text-sm sm:text-base">
              {dict.common.brand}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-border/60 bg-secondary/50 p-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg text-xs font-semibold"
                >
                  <Link href={`/${lang}${item.href}`}>
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                    <span>{isAr ? item.ar : item.en}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />

            <details className="relative lg:hidden">
              <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-[8px] border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">{isAr ? 'القائمة' : 'Menu'}</span>
              </summary>
              <div className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={`/${lang}${item.href}`}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-popover-foreground transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{isAr ? item.ar : item.en}</span>
                    </Link>
                  )
                })}
              </div>
            </details>

            <Button
              asChild
              variant="black"
              size="sm"
              className="hidden rounded-lg px-4 py-2 text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] sm:inline-flex"
            >
              <Link href={`/${lang}/tailor`}>
                <span>{s?.openStudio || (isAr ? 'ابدأ الآن مجاناً' : 'Get Started Free')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main SaaS Showcase Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-20 px-4 py-12 sm:px-6 md:space-y-28 md:py-16 lg:px-8">
        {/* 1. Dramatic SaaS Hero Section with Sequenced Motion */}
        <HeroSection lang={lang} dict={s || {}} />

        {/* 2. Interactive Product Studio Centerpiece */}
        <ScrollReveal id="interactive-studio" variant="fade" className="scroll-mt-24">
          <InteractiveProductStudio lang={lang} />
        </ScrollReveal>

        {/* 3. SaaS Pillars */}
        <SaaSBentoGrid lang={lang} />

        {/* 4. Comparison Section: Old Way vs Bosla AI */}
        <ComparisonSection lang={lang} />

        {/* 5. Final SaaS Call to Action */}
        <SaaSCallToAction lang={lang} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-10 bg-card/30 text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span className="whitespace-nowrap font-bold text-foreground">{dict.common.brand}</span>
            <span className="text-balance text-center opacity-60 sm:text-start">
              —{' '}
              {s?.footerNotice ||
                (isAr
                  ? 'بوصلتك المهنية الذكية للمحترفين التقنيين.'
                  : 'Autonomous career compass for ambitious engineers.')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium sm:justify-end">
            <Link href={`/${lang}/tailor`} className="hover:text-foreground transition-colors">
              {isAr ? 'استوديو التخصيص' : 'Tailor Studio'}
            </Link>
            <Link href={`/${lang}/resume`} className="hover:text-foreground transition-colors">
              {isAr ? 'فحص ATS' : 'ATS Engine'}
            </Link>
            <Link href={`/${lang}/tracker`} className="hover:text-foreground transition-colors">
              {isAr ? 'لوحة التتبع' : 'Tracker'}
            </Link>
            <Link
              href={`/${lang}/settings/providers`}
              className="hover:text-foreground transition-colors"
            >
              {isAr ? 'المزودات' : 'Providers'}
            </Link>
            <a
              href="https://github.com/abdullahmontasser/careercraft-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
