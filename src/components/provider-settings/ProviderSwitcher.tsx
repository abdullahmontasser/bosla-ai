'use client'

import * as React from 'react'
import type { AiProvider } from '@prisma/client'
import { setActiveProvider } from '@/app/actions/provider-settings'
import { PROVIDER_FALLBACK_MODELS } from '@/lib/ai/provider-models'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Cpu, ChevronDown, Check, Settings, Server } from 'lucide-react'
import Link from 'next/link'

export interface ProviderSwitcherProps {
  initialActiveProvider?: AiProvider | null
  initialDefaultModel?: string | null
  configuredProviders?: AiProvider[]
  onProviderChange?: (provider: AiProvider, model: string) => void
  lang?: string
  className?: string
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GEMINI: 'Google Gemini',
  GROQ: 'Groq',
  OLLAMA: 'Ollama',
}

export function ProviderSwitcher({
  initialActiveProvider = null,
  initialDefaultModel = null,
  configuredProviders = ['OPENAI', 'ANTHROPIC', 'GEMINI', 'GROQ', 'OLLAMA'],
  onProviderChange,
  lang = 'en',
  className = '',
}: ProviderSwitcherProps) {
  const [activeProvider, setActiveProviderState] = React.useState<AiProvider | null>(
    initialActiveProvider,
  )
  const [activeModel, setActiveModelState] = React.useState<string | null>(
    initialDefaultModel ||
      (initialActiveProvider ? PROVIDER_FALLBACK_MODELS[initialActiveProvider][0] : null),
  )
  const [isPending, setIsPending] = React.useState(false)

  async function handleSelect(provider: AiProvider, model?: string) {
    const targetModel = model || PROVIDER_FALLBACK_MODELS[provider][0]
    setIsPending(true)

    try {
      const res = await setActiveProvider(provider, targetModel)
      if ('success' in res && res.success) {
        setActiveProviderState(provider)
        setActiveModelState(targetModel)
        onProviderChange?.(provider, targetModel)
      }
    } finally {
      setIsPending(false)
    }
  }

  if (!activeProvider) {
    return (
      <Link href={`/${lang}/settings/providers`} className={className}>
        <Button variant="outline" size="sm" className="gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          <span>Configure AI Provider</span>
        </Button>
      </Link>
    )
  }

  const isOllama = activeProvider === 'OLLAMA'
  const models = PROVIDER_FALLBACK_MODELS[activeProvider]

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className="h-8 gap-2 px-2.5 text-xs font-medium"
            data-testid="provider-switcher-trigger"
          >
            {isOllama ? (
              <Server className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Cpu className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            )}
            <span className="font-semibold">{PROVIDER_LABELS[activeProvider]}</span>
            {activeModel && (
              <span className="text-muted-foreground font-mono text-[11px]">{activeModel}</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 text-start">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch Active Provider
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {configuredProviders.map((prov) => (
              <DropdownMenuItem
                key={prov}
                onClick={() => handleSelect(prov)}
                className="justify-between text-xs"
              >
                <span>{PROVIDER_LABELS[prov]}</span>
                {prov === activeProvider && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {PROVIDER_LABELS[activeProvider]} Models
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {models.map((mod) => (
              <DropdownMenuItem
                key={mod}
                onClick={() => handleSelect(activeProvider, mod)}
                className="justify-between text-xs font-mono"
              >
                <span>{mod}</span>
                {mod === activeModel && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="text-xs">
            <Link href={`/${lang}/settings/providers`} className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Manage API Keys</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
