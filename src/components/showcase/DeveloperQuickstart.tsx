'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandTab {
  id: string
  label: string
  command: string
  description: string
}

const COMMAND_TABS: CommandTab[] = [
  {
    id: 'dev',
    label: 'Local Dev',
    command: 'docker compose up -d && npm install && npm run dev',
    description:
      'Boots PostgreSQL 16, installs dependencies, and launches the Next.js dev server on http://localhost:3000.',
  },
  {
    id: 'test',
    label: 'Test Suite',
    command: 'npm run test',
    description:
      'Runs all 65 Vitest test files covering Server Actions, PDF rendering, ATS scoring, and components.',
  },
  {
    id: 'build',
    label: 'Production Build',
    command: 'npm run build',
    description:
      'Compiles the full Next.js 16 App Router application and validates Server Component caching.',
  },
  {
    id: 'db',
    label: 'Database Seed',
    command: 'npx prisma db push && npm run prisma db seed',
    description:
      'Pushes the Prisma relational schema and seeds sample bilingual profiles and demo candidates.',
  },
]

export function DeveloperQuickstart() {
  const [activeTab, setActiveTab] = useState<string>('dev')
  const [copied, setCopied] = useState<boolean>(false)

  const current = COMMAND_TABS.find((t) => t.id === activeTab) || COMMAND_TABS[0]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-sm shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Developer Quickstart
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Run Locally in Under Two Minutes
          </h2>
        </div>

        <a
          href="https://github.com/abdullahmontasser/careercraft-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
        >
          <span>Explore GitHub Repository</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="pt-6 space-y-4">
        {/* Command Tabs */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-lg overflow-x-auto">
          {COMMAND_TABS.map((tab) => {
            const isSelected = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                  isSelected
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Terminal Box */}
        <div className="rounded-lg border border-border bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-xs sm:text-sm relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-muted-foreground text-2xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ms-2 font-mono opacity-60">zsh — careercraft-ai</span>
            </div>
            <button
              onClick={handleCopy}
              type="button"
              aria-label={copied ? 'Copied code to clipboard' : 'Copy code to clipboard'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[32px] rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-sans">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="font-sans">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 overflow-x-auto py-1">
            <span className="text-emerald-400 select-none">$</span>
            <code className="text-white font-medium select-all whitespace-nowrap">
              {current.command}
            </code>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>
      </div>
    </div>
  )
}
