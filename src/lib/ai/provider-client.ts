import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOllama } from 'ollama-ai-provider'
import type { DecryptedProviderSetting } from '@/lib/db/provider-settings'
import type { streamText } from 'ai'
import { DEFAULT_PROVIDER_MODELS } from './provider-models'

export function getProviderModel(
  setting: DecryptedProviderSetting,
): Parameters<typeof streamText>[0]['model'] {
  const modelName = setting.defaultModel || DEFAULT_PROVIDER_MODELS[setting.provider]

  switch (setting.provider) {
    case 'OPENAI': {
      const openai = createOpenAI({
        apiKey: setting.apiKey || '',
      })
      return openai(modelName)
    }

    case 'ANTHROPIC': {
      const anthropic = createAnthropic({
        apiKey: setting.apiKey || '',
      })
      return anthropic(modelName)
    }

    case 'GEMINI': {
      const google = createGoogleGenerativeAI({
        apiKey: setting.apiKey || '',
      })
      return google(modelName)
    }

    case 'GROQ': {
      const groq = createGroq({
        apiKey: setting.apiKey || '',
      })
      return groq(modelName)
    }

    case 'OLLAMA': {
      const baseURL = setting.endpointUrl?.replace(/\/$/, '') || 'http://localhost:11434/api'
      const ollama = createOllama({
        baseURL,
      })
      return ollama(modelName) as unknown as Parameters<typeof streamText>[0]['model']
    }

    default:
      throw new Error(`Unsupported AI provider: ${String(setting.provider)}`)
  }
}
