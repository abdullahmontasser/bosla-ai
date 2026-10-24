'use client'

import * as React from 'react'
import type { AiProvider } from '@prisma/client'
import {
  type ProviderCardState,
  validateAndFetchModels,
  saveProviderSetting,
  setActiveProvider,
  deleteProviderSetting,
} from '@/app/actions/provider-settings'
import { PROVIDER_FALLBACK_MODELS } from '@/lib/ai/provider-models'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, RefreshCw, Trash2, Power, Server, Cpu } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/types'

export interface ProviderCardProps {
  initialState: ProviderCardState
  dictionary: Dictionary['providerSettings']
  onUpdated?: () => void
}

const PROVIDER_NAMES: Record<AiProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GEMINI: 'Google Gemini',
  GROQ: 'Groq',
  OLLAMA: 'Ollama',
}

export function ProviderCard({ initialState, dictionary, onUpdated }: ProviderCardProps) {
  const provider = initialState.provider
  const isOllama = provider === 'OLLAMA'

  const [isConfigured, setIsConfigured] = React.useState(initialState.isConfigured)
  const [isActive, setIsActive] = React.useState(initialState.isActive)
  const [isCorrupted, setIsCorrupted] = React.useState(Boolean(initialState.isCorrupted))
  const [maskedKey, setMaskedKey] = React.useState(initialState.maskedKey)

  const [apiKey, setApiKey] = React.useState('')
  const [endpointUrl, setEndpointUrl] = React.useState(
    initialState.endpointUrl || (isOllama ? 'http://localhost:11434' : ''),
  )
  const [selectedModel, setSelectedModel] = React.useState(
    initialState.defaultModel || PROVIDER_FALLBACK_MODELS[provider][0],
  )
  const [availableModels, setAvailableModels] = React.useState<string[]>(() => {
    if (initialState.defaultModel) {
      const set = new Set([initialState.defaultModel, ...PROVIDER_FALLBACK_MODELS[provider]])
      return Array.from(set)
    }
    return PROVIDER_FALLBACK_MODELS[provider]
  })

  const [isValidating, setIsValidating] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isActivating, setIsActivating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [showFallbackBanner, setShowFallbackBanner] = React.useState(false)

  // Clear messages after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  async function handleValidateAndFetch() {
    setIsValidating(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowFallbackBanner(false)

    try {
      const result = await validateAndFetchModels(
        provider,
        apiKey || undefined,
        isOllama ? endpointUrl : undefined,
      )

      if ('error' in result && result.error) {
        setErrorMessage(result.error)
        setShowFallbackBanner(true)
      } else if ('models' in result && result.models.length > 0) {
        setAvailableModels(result.models)
        setSelectedModel(result.models[0])
        setSuccessMessage('Models loaded successfully')
      }
    } catch {
      setErrorMessage('Failed to connect to provider')
      setShowFallbackBanner(true)
    } finally {
      setIsValidating(false)
    }
  }

  function handleUseFallbackModels() {
    const fallbacks = PROVIDER_FALLBACK_MODELS[provider]
    setAvailableModels(fallbacks)
    setSelectedModel(fallbacks[0])
    setShowFallbackBanner(false)
    setErrorMessage(null)
  }

  async function handleSave() {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await saveProviderSetting(
        provider,
        apiKey || undefined,
        selectedModel,
        isOllama ? endpointUrl : undefined,
      )

      if ('error' in result && result.error) {
        setErrorMessage(result.error)
      } else {
        setIsConfigured(true)
        setIsCorrupted(false)
        if (apiKey) {
          const visible = apiKey.trim().slice(-4)
          setMaskedKey(`••••••••${visible}`)
        }
        setApiKey('')
        setSuccessMessage(dictionary.savedSuccess)
        onUpdated?.()
      }
    } catch {
      setErrorMessage('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSetActive() {
    setIsActivating(true)
    setErrorMessage(null)

    try {
      const result = await setActiveProvider(provider, selectedModel)
      if ('error' in result && result.error) {
        setErrorMessage(result.error)
      } else {
        setIsActive(true)
        setSuccessMessage(dictionary.activatedSuccess)
        onUpdated?.()
      }
    } catch {
      setErrorMessage('Failed to activate provider')
    } finally {
      setIsActivating(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(dictionary.deleteConfirm)) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const result = await deleteProviderSetting(provider)
      if ('error' in result && result.error) {
        setErrorMessage(result.error)
      } else {
        setIsConfigured(false)
        setIsActive(false)
        setIsCorrupted(false)
        setMaskedKey(null)
        setApiKey('')
        setSuccessMessage(dictionary.deleteSuccess)
        onUpdated?.()
      }
    } catch {
      setErrorMessage('Failed to delete provider setting')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card
      className={`relative transition-all border ${
        isActive
          ? 'border-primary shadow-sm bg-card'
          : isConfigured
            ? 'border-border bg-card'
            : 'border-border/60 bg-card/60'
      }`}
      data-testid={`provider-card-${provider.toLowerCase()}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isOllama ? (
              <Server className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Cpu className="h-5 w-5 text-primary" aria-hidden="true" />
            )}
            <CardTitle className="text-lg font-bold">{PROVIDER_NAMES[provider]}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="text-xs">
                {dictionary.active}
              </Badge>
            )}
            {!isActive && isConfigured && (
              <Badge variant="secondary" className="text-xs">
                {dictionary.configured}
              </Badge>
            )}
            {!isConfigured && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {dictionary.unconfigured}
              </Badge>
            )}
          </div>
        </div>

        {isOllama ? (
          <CardDescription className="text-xs">{dictionary.ollamaNote}</CardDescription>
        ) : (
          maskedKey && (
            <CardDescription className="text-xs font-mono text-muted-foreground">
              {maskedKey}
            </CardDescription>
          )
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Corrupted alert */}
        {isCorrupted && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs rounded border border-destructive/30 bg-destructive/10 text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{dictionary.corrupted}</span>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 p-2.5 text-xs rounded border border-success/30 bg-success/10 text-success"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-2.5 text-xs rounded border border-destructive/30 bg-destructive/10 text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Fallback models notification banner */}
        {showFallbackBanner && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 text-xs rounded border border-secondary bg-secondary/50">
            <span>{dictionary.fallbackNotice}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseFallbackModels}
              className="text-xs h-7 shrink-0"
            >
              <RefreshCw className="h-3 w-3 me-1" />
              {dictionary.retry}
            </Button>
          </div>
        )}

        {/* Input fields */}
        {isOllama ? (
          <div className="space-y-1.5">
            <label
              htmlFor={`endpoint-${provider}`}
              className="text-xs font-medium text-foreground block text-start"
            >
              {dictionary.endpointUrl}
            </label>
            <Input
              id={`endpoint-${provider}`}
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder={dictionary.endpointUrlPlaceholder}
              className="text-sm font-mono"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label
              htmlFor={`apikey-${provider}`}
              className="text-xs font-medium text-foreground block text-start"
            >
              {dictionary.apiKey}
            </label>
            <Input
              id={`apikey-${provider}`}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                maskedKey ? `${maskedKey} (leave empty to keep)` : dictionary.apiKeyPlaceholder
              }
              className="text-sm font-mono"
              autoComplete="off"
            />
          </div>
        )}

        {/* Validate and fetch button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleValidateAndFetch}
            disabled={isValidating || (!isOllama && !apiKey && !isConfigured)}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? dictionary.validating : dictionary.validateAndFetch}
          </Button>
        </div>

        {/* Model selector */}
        <div className="space-y-1.5">
          <label
            htmlFor={`model-${provider}`}
            className="text-xs font-medium text-foreground block text-start"
          >
            {dictionary.selectModel}
          </label>
          <select
            id={`model-${provider}`}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full h-9 px-3 rounded-[8px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          {isConfigured && !isActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetActive}
              disabled={isActivating}
              className="text-xs"
            >
              <Power className="h-3.5 w-3.5 me-1" />
              {isActivating ? dictionary.settingActive : dictionary.setActive}
            </Button>
          )}

          {isConfigured && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-destructive hover:bg-destructive/10"
              aria-label={dictionary.delete}
            >
              <Trash2 className="h-3.5 w-3.5 me-1" />
              {dictionary.delete}
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || (!isOllama && !apiKey && !isConfigured)}
          className="text-xs"
        >
          {isSaving ? dictionary.saving : dictionary.saveSettings}
        </Button>
      </CardFooter>
    </Card>
  )
}
