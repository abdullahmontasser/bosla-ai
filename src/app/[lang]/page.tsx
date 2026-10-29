import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { isSupportedLocale } from '@/lib/i18n/config'
import { Comparison } from '@/components/landing/Comparison'
import { Features } from '@/components/landing/Features'
import { FinalCta } from '@/components/landing/FinalCta'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingNavWithSession } from '@/components/landing/LandingNavWithSession'
import { ProductStory } from '@/components/landing/ProductStory'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { getLandingCopy } from '@/components/landing/content'
import { getShowcaseSample } from '@/components/landing/showcase-data'

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params
  const isAr = lang === 'ar'

  const title = isAr
    ? 'بوصلة AI — سيرة مخصّصة لكل وظيفة، وتحضير أهدأ للمقابلة'
    : 'Bosla AI — A sharper resume for the role you actually want'
  const description = isAr
    ? 'الصق وصف الوظيفة، ووائم متطلباتها مع خبرتك الحقيقية. راجع تغطية الكلمات المفتاحية، وقوِّ نقاط إنجازك، وصدّر سيرة نظيفة، واستعد للمقابلة—بمفاتيحك الخاصة.'
    : 'Paste a job description, map it to your real experience, inspect requirement coverage, strengthen your achievements, export a clean resume, and prepare for the conversation—with your own AI provider.'

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

  const copy = getLandingCopy(lang)
  const sample = getShowcaseSample(lang)
  const isAr = lang === 'ar'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: isAr ? 'بوصلة AI' : 'Bosla AI',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (Web Application)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: copy.hero.lead,
    featureList: [
      isAr ? 'تخصيص السيرة الذاتية حسب الوظيفة' : 'Role-specific resume tailoring',
      isAr ? 'تحليل تغطية متطلبات ATS' : 'ATS requirement coverage analysis',
      isAr ? 'تحضير المقابلات بصيغة STAR' : 'STAR interview preparation',
      isAr ? 'دعم العربية والإنجليزية' : 'Arabic and English support',
    ],
  }

  return (
    <div className="landing-shell flex min-h-svh flex-col bg-background text-foreground antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a
        href="#main"
        className="sr-only z-[60] rounded-[6px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4 focus:ring-offset-background"
      >
        {isAr ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>

      <Suspense fallback={<LandingNav lang={lang} copy={copy} />}>
        <LandingNavWithSession lang={lang} copy={copy} />
      </Suspense>

      <main id="main" className="flex-1">
        <Hero lang={lang} copy={copy} />
        <TrustStrip copy={copy} />
        <HowItWorks lang={lang} copy={copy} />
        <ProductStory lang={lang} copy={copy} sample={sample} />
        <Features lang={lang} copy={copy} />
        <Comparison copy={copy} />
        <FinalCta lang={lang} copy={copy} />
      </main>

      <LandingFooter lang={lang} copy={copy} />
    </div>
  )
}
