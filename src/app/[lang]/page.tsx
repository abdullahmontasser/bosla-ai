import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles, ArrowRight, Palette, Bot, ShieldCheck } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  LanguageSwitcher,
  ThemeSwitcher,
  RtlIcon,
} from '@/components/ui'

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
              CC
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              {dict.common.brand}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${lang}/design-system`}>
              <Button variant="ghost" size="sm">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Design System</span>
              </Button>
            </Link>
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-16 sm:px-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl space-y-6">
          <div className="flex justify-center">
            <Badge variant="outline" className="px-3 py-1 gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Bilingual Foundation Ready</span>
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {dict.common.brand}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {dict.common.tagline}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href={`/${lang}/design-system`}>
              <Button size="lg" className="gap-2">
                <span>Explore Design System</span>
                <RtlIcon icon={ArrowRight} className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-16 text-start">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <Palette className="h-5 w-5" />
              </div>
              <CardTitle>Bilingual Design System</CardTitle>
              <CardDescription>
                Tailwind CSS v4 tokens, logical layout properties, and native RTL support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Fluid mirroring for Arabic and English with IBM Plex Sans Arabic and Geist Sans.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <Bot className="h-5 w-5" />
              </div>
              <CardTitle>Autonomous Career Agent</CardTitle>
              <CardDescription>
                Resume tailoring, ATS keyword optimization, and interview preparation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                BYOK architecture supporting OpenAI, Anthropic, Gemini, Groq, and local Ollama.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>Accessible Foundation</CardTitle>
              <CardDescription>
                Headless Radix UI primitives with zero theme flicker and keyboard navigation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                WCAG AAA compliant contrast, focus rings, and screen reader announcements.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2026 {dict.common.brand}. Open source career agent foundation.</p>
        </div>
      </footer>
    </div>
  )
}
