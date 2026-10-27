'use client'

import { useState } from 'react'
import { Database, Shield, Cpu, Layers, Terminal, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ArchitectureCardProps {
  lang: string
}

interface LayerItem {
  id: string
  title: { en: string; ar: string }
  badge: string
  icon: typeof Database
  description: { en: string; ar: string }
  technologies: string[]
  codeHint: string
}

const LAYERS: LayerItem[] = [
  {
    id: 'ai-engine',
    title: { en: 'AI Orchestration & Streaming', ar: 'تنسيق وبث الذكاء الاصطناعي' },
    badge: 'Core Engine',
    icon: Cpu,
    description: {
      en: 'Multi-provider streaming pipeline using Vercel AI SDK v7 with strict Zod structured schemas, Google XYZ prompt engineering, and local Ollama compatibility.',
      ar: 'بنية بث متعددة المزودات باستخدام Vercel AI SDK v7 مع تدقيق Zod ومطابقة صيغة Google XYZ ودعم Ollama المحلي.',
    },
    technologies: [
      'Vercel AI SDK v7',
      'Zod Schemas',
      'BYOK Encrypted Keys',
      'Streaming Route Handlers',
    ],
    codeHint: 'src/lib/ai/provider-client.ts',
  },
  {
    id: 'data-layer',
    title: { en: 'PostgreSQL & Prisma Singleton', ar: 'قاعدة البيانات وPrisma ORM' },
    badge: 'Data Layer',
    icon: Database,
    description: {
      en: 'PostgreSQL 16 relational database with Prisma ORM singleton pattern, fractional indexing for Kanban reordering, and relational integrity cascades.',
      ar: 'قاعدة بيانات PostgreSQL 16 بنمط Prisma المفرد وفهرسة كسرية لترتيب كانبان وعلاقات متسلسلة محمية.',
    },
    technologies: ['PostgreSQL 16', 'Prisma ORM', 'Fractional Indexing', 'AES-256-GCM Encryption'],
    codeHint: 'src/lib/prisma.ts',
  },
  {
    id: 'pdf-ats',
    title: { en: 'Vector PDF & Arabic Shaping', ar: 'تصدير PDF وتشكيل الحروف العربية' },
    badge: 'Export Engine',
    icon: Layers,
    description: {
      en: 'High-fidelity vector PDF generation powered by React PDF with custom bidirectional Arabic text reshaping, font embedding, and single-column ATS templates.',
      ar: 'توليد ملفات PDF متجهية دقيقة عبر React PDF مع تشكيل الحروف العربية وضبط الاتجاهات ونماذج متوافقة مع ATS.',
    },
    technologies: [
      '@react-pdf/renderer',
      'bidi-js',
      'arabic-persian-reshaper',
      'Single-Column Template',
    ],
    codeHint: 'src/lib/pdf/render.ts',
  },
  {
    id: 'ui-design',
    title: { en: 'Bilingual Design & Next.js 16', ar: 'نظام التصميم وNext.js 16' },
    badge: 'User Interface',
    icon: Shield,
    description: {
      en: 'Next.js 16 App Router Server Components, Tailwind CSS v4 inline tokens, Radix UI headless accessibility, and seamless English/Arabic directionality.',
      ar: 'مكونات خادم Next.js 16 مع متغيرات Tailwind CSS v4 المباشرة ومكتبة Radix UI وإمكانية وصول كاملة لكلا اللغتين.',
    },
    technologies: [
      'Next.js 16 App Router',
      'Tailwind CSS v4',
      'Radix UI Primitives',
      'Geist & IBM Plex Arabic',
    ],
    codeHint: 'src/components/ui/',
  },
]

export function ArchitectureCard({ lang }: ArchitectureCardProps) {
  const isAr = lang === 'ar'
  const [activeLayer, setActiveLayer] = useState<string>('ai-engine')

  const current = LAYERS.find((l) => l.id === activeLayer) || LAYERS[0]
  const IconComponent = current.icon

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-sm shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 gap-1.5 border-primary/30 text-primary mb-2"
          >
            <Terminal className="h-3 w-3" />
            <span>{isAr ? 'البنية التقنية المفتوحة' : 'Open-Source Architecture'}</span>
          </Badge>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {isAr ? 'طبقات النظام وتكامل البرمجيات' : 'Modular Tracer Bullet Architecture'}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Bosla AI v0.1.0 · Next.js 16 · React 19
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Layer Selection Tabs (4 Cols) */}
        <div
          role="tablist"
          aria-label={isAr ? 'طبقات البنية التقنية' : 'Architecture Layers'}
          className="lg:col-span-5 space-y-2"
        >
          {LAYERS.map((layer) => {
            const isSelected = layer.id === activeLayer
            const LayerIcon = layer.icon
            return (
              <button
                key={layer.id}
                role="tab"
                id={`arch-tab-${layer.id}`}
                aria-selected={isSelected}
                aria-controls="arch-panel-details"
                onClick={() => setActiveLayer(layer.id)}
                type="button"
                className={cn(
                  'w-full flex items-center justify-between p-3.5 rounded-lg border text-start transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 shadow-2xs'
                    : 'border-border/80 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-xs',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    <LayerIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      {isAr ? layer.title.ar : layer.title.en}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{layer.badge}</span>
                  </div>
                </div>
                {isSelected && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Selected Layer Details (7 Cols) */}
        <div
          role="tabpanel"
          id="arch-panel-details"
          aria-labelledby={`arch-tab-${activeLayer}`}
          className="lg:col-span-7 rounded-lg border border-border bg-background p-6 shadow-2xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? current.title.ar : current.title.en}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {current.codeHint}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {current.badge}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr ? current.description.ar : current.description.en}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'التقنيات والركائز المعتمدة' : 'Proven Technical Capabilities'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.technologies.map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center gap-2 text-xs font-medium text-foreground bg-secondary/50 rounded-md px-2.5 py-1.5 border border-border/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>
              {isAr
                ? 'تصميم معياري خالي من التبعيات غير الضرورية'
                : 'Modular architecture · Zero redundant dependencies'}
            </span>
            <span className="text-primary font-semibold">100% Type-Safe</span>
          </div>
        </div>
      </div>
    </div>
  )
}
