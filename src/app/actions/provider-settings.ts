'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { decryptSecret } from '@/lib/crypto'
import type { AiProvider } from '@prisma/client'
import {
  upsertProviderSetting,
  deleteProviderSetting as dbDeleteProviderSetting,
} from '@/lib/db/provider-settings'
import {
  validateEndpointUrl,
  filterOpenAiModels,
  filterAnthropicModels,
  filterGeminiModels,
  filterGroqModels,
  filterOllamaModels,
  PROVIDER_FALLBACK_MODELS,
} from '@/lib/ai/provider-models'

export interface ProviderCardState {
  provider: AiProvider
  isConfigured: boolean
  maskedKey: string | null
  defaultModel: string | null
  endpointUrl: string | null
  isActive: boolean
  isCorrupted?: boolean
}

export type ActionResponse<T = void> =
  ({ success: true } & (T extends void ? object : { data: T })) | { success: false; error: string }

const ALL_PROVIDERS: AiProvider[] = ['OPENAI', 'ANTHROPIC', 'GEMINI', 'GROQ', 'OLLAMA']

function maskKey(key: string): string {
  if (!key) return ''
  const trimmed = key.trim()
  const lastFour = trimmed.slice(-4)
  return `••••••••${lastFour}`
}

/**
 * Returns configuration state for all five AI providers.
 * Catches decryption errors to flag corrupted credentials without crashing.
 */
export async function getProviderConfigurations(): Promise<
  ProviderCardState[] | { error: string }
> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  const existing = await prisma.userProviderSetting.findMany({
    where: { userId },
  })

  const settingsMap = new Map<AiProvider, (typeof existing)[number]>()
  for (const item of existing) {
    settingsMap.set(item.provider, item)
  }

  const cards: ProviderCardState[] = ALL_PROVIDERS.map((provider) => {
    const record = settingsMap.get(provider)
    if (!record) {
      return {
        provider,
        isConfigured: false,
        maskedKey: null,
        defaultModel: null,
        endpointUrl: null,
        isActive: false,
      }
    }

    if (provider === 'OLLAMA') {
      return {
        provider,
        isConfigured: true,
        maskedKey: null,
        defaultModel: record.defaultModel,
        endpointUrl: record.endpointUrl,
        isActive: record.isActive,
      }
    }

    let maskedKey: string | null = null
    let isCorrupted = false

    if (record.encryptedKey && record.iv && record.authTag) {
      try {
        const decrypted = decryptSecret(record.encryptedKey, record.iv, record.authTag)
        maskedKey = maskKey(decrypted)
      } catch {
        isCorrupted = true
      }
    } else {
      isCorrupted = true
    }

    return {
      provider,
      isConfigured: true,
      maskedKey: isCorrupted ? null : maskedKey,
      defaultModel: record.defaultModel,
      endpointUrl: record.endpointUrl,
      isActive: record.isActive,
      ...(isCorrupted ? { isCorrupted: true } : {}),
    }
  })

  return cards
}

/**
 * Validates credentials and fetches live chat models from provider endpoints.
 * Aborts after 8 seconds and avoids writing to the database on failure.
 */
export async function validateAndFetchModels(
  provider: AiProvider,
  rawKey?: string,
  endpointUrl?: string,
): Promise<{ models: string[] } | { error: string }> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  let effectiveKey = rawKey?.trim()

  // If raw key was not provided, look for an existing configured key
  if (!effectiveKey && provider !== 'OLLAMA') {
    const existing = await prisma.userProviderSetting.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })

    if (existing?.encryptedKey && existing.iv && existing.authTag) {
      try {
        effectiveKey = decryptSecret(existing.encryptedKey, existing.iv, existing.authTag)
      } catch {
        return { error: 'Failed to decrypt stored credentials. Please re-enter your API key.' }
      }
    } else {
      return { error: 'API key is required for commercial AI providers' }
    }
  }

  const signal = AbortSignal.timeout(8000)

  try {
    switch (provider) {
      case 'OPENAI': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${effectiveKey}`,
          },
          signal,
        })

        if (res.status === 401) {
          return { error: 'Invalid API key' }
        }
        if (!res.ok) {
          return { error: `OpenAI returned status ${res.status}: ${res.statusText}` }
        }

        const data = (await res.json()) as { data?: Array<{ id: string }> }
        const models = filterOpenAiModels(data.data || [])
        return { models }
      }

      case 'ANTHROPIC': {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': effectiveKey || '',
            'anthropic-version': '2023-06-01',
          },
          signal,
        })

        if (res.status === 401) {
          return { error: 'Invalid API key' }
        }
        if (!res.ok) {
          // Anthropic may restrict /v1/models on some keys, fallback to known good Claude models
          return { models: PROVIDER_FALLBACK_MODELS.ANTHROPIC }
        }

        const data = (await res.json()) as { data?: Array<{ id: string }> }
        const models = filterAnthropicModels(data.data || [])
        return { models }
      }

      case 'GEMINI': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`,
          { signal },
        )

        if (res.status === 400 || res.status === 403) {
          return { error: 'Invalid API key' }
        }
        if (!res.ok) {
          return { error: `Gemini returned status ${res.status}: ${res.statusText}` }
        }

        const data = (await res.json()) as {
          models?: Array<{ name: string; supportedGenerationMethods?: string[] }>
        }
        const models = filterGeminiModels(data.models || [])
        return { models }
      }

      case 'GROQ': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            Authorization: `Bearer ${effectiveKey}`,
          },
          signal,
        })

        if (res.status === 401) {
          return { error: 'Invalid API key' }
        }
        if (!res.ok) {
          return { error: `Groq returned status ${res.status}: ${res.statusText}` }
        }

        const data = (await res.json()) as { data?: Array<{ id: string; active?: boolean }> }
        const models = filterGroqModels(data.data || [])
        return { models }
      }

      case 'OLLAMA': {
        const effectiveUrl = endpointUrl?.trim() || 'http://localhost:11434'
        const validation = validateEndpointUrl(effectiveUrl)
        if (!validation.valid) {
          return { error: validation.error || 'Invalid endpoint URL' }
        }

        const cleanUrl = effectiveUrl.replace(/\/+$/, '')
        const res = await fetch(`${cleanUrl}/api/tags`, { signal })

        if (!res.ok) {
          return { error: `Ollama returned status ${res.status}: ${res.statusText}` }
        }

        const data = (await res.json()) as { models?: Array<{ name: string }> }
        const models = filterOllamaModels(data.models || [])
        return { models }
      }

      default:
        return { error: 'Unsupported provider' }
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message.includes('timeout'))
    ) {
      return { error: 'Request timed out after 8 seconds' }
    }
    return {
      error: err instanceof Error ? err.message : 'Failed to connect to provider',
    }
  }
}

/**
 * Saves provider credentials and model choice.
 * Encrypts API keys before storing. Activates newly saved provider if no provider is active.
 */
export async function saveProviderSetting(
  provider: AiProvider,
  rawKey?: string,
  selectedModel?: string,
  endpointUrl?: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  if (!selectedModel || selectedModel.trim().length === 0) {
    return { error: 'Model selection is required' }
  }

  if (provider === 'OLLAMA') {
    const effectiveUrl = endpointUrl?.trim() || 'http://localhost:11434'
    const validation = validateEndpointUrl(effectiveUrl)
    if (!validation.valid) {
      return { error: validation.error || 'Invalid endpoint URL' }
    }
  } else if (!rawKey?.trim()) {
    // Commercial provider with no rawKey: verify an existing setting with key is present
    const existing = await prisma.userProviderSetting.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })
    if (!existing?.encryptedKey) {
      return { error: 'API key is required for commercial AI providers' }
    }
  }

  // Determine if this provider should be active (if user has no active provider yet)
  const activeExisting = await prisma.userProviderSetting.findFirst({
    where: {
      userId,
      isActive: true,
    },
  })

  // If there is no active provider, or if the current provider is already the active one
  const shouldBeActive = !activeExisting || activeExisting.provider === provider

  try {
    await upsertProviderSetting(userId, {
      provider,
      rawApiKey: rawKey?.trim(),
      defaultModel: selectedModel.trim(),
      endpointUrl: provider === 'OLLAMA' ? endpointUrl?.trim() || 'http://localhost:11434' : null,
      isActive: shouldBeActive,
    })

    return { success: true }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to save provider settings',
    }
  }
}

/**
 * Activates one provider across the user account and deactivates all others in a single transaction.
 */
export async function setActiveProvider(
  provider: AiProvider,
  model?: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  const existing = await prisma.userProviderSetting.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  })

  if (!existing) {
    return { error: 'Provider is not configured' }
  }

  try {
    await prisma.$transaction([
      prisma.userProviderSetting.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      prisma.userProviderSetting.update({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
        data: {
          isActive: true,
          ...(model ? { defaultModel: model } : {}),
        },
      }),
    ])

    return { success: true }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to set active provider',
    }
  }
}

/**
 * Deletes a configured provider setting.
 */
export async function deleteProviderSetting(
  provider: AiProvider,
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  try {
    await dbDeleteProviderSetting(userId, provider)
    return { success: true }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Failed to delete provider setting',
    }
  }
}
