import { notFound } from 'next/navigation'
import {
  ArrowRight,
  ChevronRight,
  Send,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  FileText,
  Briefcase,
  Terminal,
  Code2,
  Droplets,
  Star,
  Activity,
} from 'lucide-react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale, getDirection } from '@/lib/i18n/config'
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  LanguageSwitcher,
  ThemeSwitcher,
  RtlIcon,
} from '@/components/ui'

export default async function DesignSystemPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dict = await getDictionary(lang)
  const dir = getDirection(lang)

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#3e7ff0]/20 selection:text-foreground">
      {/* Top Announcement Bar */}
      <div className="border-b border-border bg-card py-2 text-center text-xs text-[#444444] dark:text-muted-foreground">
        <span>Drizzle ORM Style Reference · Rainwater terminal on graph paper</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-[#f6f6f7] dark:bg-[#151821] text-[#3e7ff0]">
              <Droplets className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
                {dict.common.brand}
              </span>
              <span className="text-xs text-[#909090] font-mono hidden sm:inline">v1.0.0</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* GitHub Star Badge Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-2.5 py-1 text-xs text-[#282b3b] dark:text-foreground">
              <Star className="h-3.5 w-3.5 fill-[#3e7ff0] text-[#3e7ff0]" />
              <span className="font-mono text-[11px] font-medium">33k+</span>
            </div>
            <LanguageSwitcher currentLang={lang} />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-16">
        {/* Hero Workbench Section */}
        <div className="relative rounded-[8px] border border-border bg-card p-6 sm:p-10">
          {/* Cobalt handwritten annotation badge */}
          <div className="inline-flex items-center gap-1.5 mb-3 rounded-[2px] bg-[#3e7ff0]/10 border border-[#3e7ff0]/30 px-2 py-0.5 text-xs font-mono font-semibold text-[#3e7ff0]">
            <span># workbench</span>
            <span className="opacity-60">·</span>
            <span>{dir.toUpperCase()}</span>
            <span className="opacity-60">·</span>
            <span>{lang}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#222222] dark:text-[#f3f4f6]">
            {dict.designSystem.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-[#444444] dark:text-muted-foreground leading-relaxed">
            Quiet developer workbench with ink text, crisp 1px borders, and electric cobalt accents
            without heavy drop shadows.
          </p>

          {/* 2x2 Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Get Started', icon: Terminal, code: 'init' },
              { label: 'Schema Engine', icon: Code2, code: 'schema' },
              { label: 'ATS Benchmarks', icon: Activity, code: '99.4%' },
              { label: 'Outreach Prep', icon: Briefcase, code: 'live' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <div
                  key={action.label}
                  className="flex items-center justify-between p-3.5 rounded-[8px] border border-border bg-card hover:bg-[#f6f6f7] dark:hover:bg-[#1e222e] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#4b5563]" />
                    <span className="text-xs font-medium text-[#222222] dark:text-[#f3f4f6]">
                      {action.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#909090]">{action.code}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Drizzle Color Tokens */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              Drizzle Tokens — Color Scale
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Rationed palette: one electric blue accent, two near-grays for text, one border gray,
              and white space.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: 'Electric Cobalt', hex: '#3e7ff0', bg: 'bg-[#3e7ff0]', text: 'text-white' },
              { name: 'Signal Blue', hex: '#006be6', bg: 'bg-[#006be6]', text: 'text-white' },
              { name: 'Ink (Primary)', hex: '#222222', bg: 'bg-[#222222]', text: 'text-white' },
              { name: 'Slate (Chrome)', hex: '#282b3b', bg: 'bg-[#282b3b]', text: 'text-white' },
              { name: 'Graphite (Body)', hex: '#444444', bg: 'bg-[#444444]', text: 'text-white' },
              { name: 'Stone', hex: '#334155', bg: 'bg-[#334155]', text: 'text-white' },
              { name: 'Steel', hex: '#4b5563', bg: 'bg-[#4b5563]', text: 'text-white' },
              {
                name: 'Cloud (Canvas)',
                hex: '#f6f6f7',
                bg: 'bg-[#f6f6f7]',
                text: 'text-[#222222]',
              },
              { name: 'Chalk (Badge)', hex: '#f0f0f0', bg: 'bg-[#f0f0f0]', text: 'text-[#222222]' },
              {
                name: 'Pebble (Border)',
                hex: '#e5e7eb',
                bg: 'bg-[#e5e7eb]',
                text: 'text-[#222222]',
              },
            ].map((token) => (
              <div
                key={token.name}
                className="flex flex-col justify-between rounded-[8px] border border-border bg-card p-3 min-h-[84px]"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-[4px] border border-black/10 ${token.bg}`} />
                  <span className="text-xs font-semibold text-foreground">{token.name}</span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{token.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Code / Terminal Block */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              Terminal / Code Panel
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Cloud background (#f6f6f7), 8px radius, 1px Pebble border (#e5e7eb) with 16px padding.
            </p>
          </div>

          <div className="rounded-[8px] border border-border bg-[#f6f6f7] dark:bg-[#12141c] p-4 font-mono text-xs text-[#222222] dark:text-[#f3f4f6] space-y-1.5 leading-relaxed overflow-x-auto text-start">
            <div className="text-[#909090]">&apos;// Bosla AI resume tailoring worker&apos;</div>
            <div>
              <span className="text-[#3e7ff0] font-semibold">import</span> &#123; tailorResume
              &#125; <span className="text-[#3e7ff0] font-semibold">from</span>{' '}
              <span className="text-[#006be6]">&apos;@/lib/ai/tailor&apos;</span>
            </div>
            <div>
              <span className="text-[#3e7ff0] font-semibold">export const</span>{' '}
              <span className="text-[#282b3b] dark:text-white font-medium">result</span> ={' '}
              <span className="text-[#3e7ff0] font-semibold">await</span> tailorResume(&#123;
            </div>
            <div className="ps-4">
              jobId: <span className="text-[#006be6]">&apos;job_senior_fullstack&apos;</span>,
            </div>
            <div className="ps-4">
              language: <span className="text-[#006be6]">&apos;{lang}&apos;</span>,
            </div>
            <div className="ps-4">
              formula: <span className="text-[#006be6]">&apos;google_xyz&apos;</span>
            </div>
            <div>&#125;)</div>
          </div>
        </section>

        {/* Buttons & Triggers */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              {dict.designSystem.buttons}
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Border driven controls with 8px radius, Electric Cobalt primary, and Chalk secondary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Electric Cobalt</Button>
            <Button variant="secondary">Chalk Secondary</Button>
            <Button variant="outline">Pebble Outline</Button>
            <Button variant="ghost">Ghost Link</Button>
            <Button variant="destructive">{dict.common.delete}</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="sm">Small (sm)</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large (lg)</Button>
            <Button size="icon" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Performance Benchmark Comparison Card */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              Benchmark & Comparison Cards
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              White Paper cards, 8px radius, 1px Pebble border, 2px badge radius, and clear metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="default">Bosla AI</Badge>
                  <span className="font-mono text-xs text-[#909090]">v1.0.0</span>
                </div>
                <CardTitle className="pt-2 text-base">ATS Compatibility Index</CardTitle>
                <CardDescription>Tailored experience bullet matching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-[#222222] dark:text-white">
                    99.4%
                  </span>
                  <span className="text-xs text-[#15803d] font-semibold">+18.2% vs baseline</span>
                </div>
                <div className="h-2 w-full rounded-[4px] bg-[#f0f0f0] dark:bg-[#1e222e] overflow-hidden">
                  <div className="h-full bg-[#3e7ff0] rounded-[4px]" style={{ width: '99.4%' }} />
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Latency: 0.8s</span>
                <Button size="sm" variant="outline">
                  {dict.designSystem.cardAction}
                  <RtlIcon icon={ChevronRight} className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Generic Resume</Badge>
                  <span className="font-mono text-xs text-[#909090]">Untailored</span>
                </div>
                <CardTitle className="pt-2 text-base">Standard Keyword Density</CardTitle>
                <CardDescription>Raw unprocessed PDF application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-[#222222] dark:text-white">
                    64.1%
                  </span>
                  <span className="text-xs text-[#dc2626] font-semibold">Missing 7 keywords</span>
                </div>
                <div className="h-2 w-full rounded-[4px] bg-[#f0f0f0] dark:bg-[#1e222e] overflow-hidden">
                  <div className="h-full bg-[#909090] rounded-[4px]" style={{ width: '64.1%' }} />
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Review needed</span>
                <Button size="sm" variant="outline">
                  Audit Gaps
                  <RtlIcon icon={ArrowRight} className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Inputs & Textarea */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              {dict.designSystem.inputs}
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Form controls with 8px radius, 1px Pebble outline, and Electric Cobalt focus rings.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#222222] dark:text-[#f3f4f6]">
                Target Job Title
              </label>
              <Input placeholder={dict.designSystem.inputPlaceholder} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#222222] dark:text-[#f3f4f6]">
                Disabled Field
              </label>
              <Input disabled defaultValue="Locked system identifier" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-[#222222] dark:text-[#f3f4f6]">
                Job Description
              </label>
              <Textarea placeholder={dict.designSystem.textareaPlaceholder} rows={3} />
            </div>
          </div>
        </section>

        {/* Modals & Dropdown Controls */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              {dict.designSystem.dialogs} & {dict.designSystem.dropdowns}
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Accessible headless components with keyboard trap and logical edge alignment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4" />
                  {dict.designSystem.openDialog}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dict.designSystem.dialogTitle}</DialogTitle>
                  <DialogDescription>{dict.designSystem.dialogDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <label className="text-xs font-medium text-foreground">Role Title</label>
                  <Input defaultValue="Lead Full-Stack Engineer" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{dict.common.cancel}</Button>
                  </DialogClose>
                  <Button>{dict.common.save}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4" />
                  {dict.designSystem.openMenu}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Briefcase className="me-2 h-4 w-4" />
                  <span>{dict.designSystem.editItem}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="me-2 h-4 w-4" />
                  <span>{dict.designSystem.duplicateItem}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <span>{dict.designSystem.deleteItem}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Directional Icon Mirroring */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#222222] dark:text-[#f3f4f6] tracking-tight">
              {dict.designSystem.icons}
            </h2>
            <p className="text-xs text-[#444444] dark:text-muted-foreground">
              Directional icons automatically mirror with{' '}
              <code className="rounded-[2px] bg-[#f0f0f0] dark:bg-[#1e222e] px-1.5 py-0.5 text-xs font-mono">
                rtl:rotate-180
              </code>{' '}
              in Arabic mode.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[8px] border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground font-mono">
                Directional (Mirrored in RTL)
              </span>
              <div className="flex items-center gap-4 text-[#3e7ff0]">
                <div className="flex items-center gap-1.5 text-xs">
                  <RtlIcon icon={ChevronRight} className="h-5 w-5" />
                  <span>ChevronRight</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <RtlIcon icon={ArrowRight} className="h-5 w-5" />
                  <span>ArrowRight</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <RtlIcon icon={Send} className="h-5 w-5" />
                  <span>Send</span>
                </div>
              </div>
            </div>

            <div className="rounded-[8px] border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground font-mono">
                Symmetric (Never Mirrored)
              </span>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-5 w-5 text-[#15803d]" />
                  <span>Checkmark</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Search className="h-5 w-5" />
                  <span>Search</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Droplets className="h-5 w-5 text-[#3e7ff0]" />
                  <span>Raindrop</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
