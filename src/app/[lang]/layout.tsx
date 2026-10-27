import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DirectionProvider } from '@radix-ui/react-direction'
import { ThemeProvider } from '@/components/theme-provider'
import { geistSans, ibmPlexArabic, newsreader, alexandria, amiri } from '@/lib/fonts'
import { isSupportedLocale, getDirection, supportedLocales } from '@/lib/i18n/config'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Bosla AI',
  description: 'Autonomous career compass for resumes, outreach, and interview prep',
}

export function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dir = getDirection(lang)

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${geistSans.variable} ${ibmPlexArabic.variable} ${newsreader.variable} ${alexandria.variable} ${amiri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-full flex flex-col bg-background text-foreground ${lang === 'ar' ? 'font-arabic leading-relaxed' : 'font-sans'}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
