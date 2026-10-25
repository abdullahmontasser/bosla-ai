'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import { ProviderCard } from './ProviderCard'
import { getProviderConfigurations, type ProviderCardState } from '@/app/actions/provider-settings'
import type { AiProvider } from '@prisma/client'
import type { Dictionary } from '@/lib/i18n/types'

export const DEFAULT_CARDS: ProviderCardState[] = (
  ['OPENAI', 'ANTHROPIC', 'GEMINI', 'GROQ', 'OLLAMA'] as AiProvider[]
).map((provider) => ({
  provider,
  isConfigured: false,
  maskedKey: null,
  defaultModel: null,
  endpointUrl: provider === 'OLLAMA' ? 'http://localhost:11434' : null,
  isActive: false,
}))

export function ProviderCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse"
      data-testid="provider-skeleton"
    >
      {DEFAULT_CARDS.map((card) => (
        <div
          key={card.provider}
          className="h-72 rounded-[8px] border border-border/40 bg-card/40 p-6 space-y-4"
        >
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted/60 rounded" />
          <div className="h-10 w-full bg-muted/40 rounded mt-6" />
        </div>
      ))}
    </div>
  )
}

export function ProviderCardsContainer({
  dict,
  initialConfigs,
}: {
  dict: Dictionary
  initialConfigs?: ProviderCardState[] | null
}) {
  const [configs, setConfigs] = useState<ProviderCardState[] | null>(initialConfigs ?? null)

  const loadConfigs = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await getProviderConfigurations()
        setConfigs(Array.isArray(res) ? res : DEFAULT_CARDS)
      } catch {
        setConfigs(DEFAULT_CARDS)
      }
    })
  }, [])

  useEffect(() => {
    if (initialConfigs === undefined) {
      loadConfigs()
    }
  }, [initialConfigs, loadConfigs])

  if (!configs) {
    return <ProviderCardsSkeleton />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {configs.map((cardState) => (
        <ProviderCard
          key={cardState.provider}
          initialState={cardState}
          dictionary={dict.providerSettings}
        />
      ))}
    </div>
  )
}
