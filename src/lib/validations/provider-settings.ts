import { z } from 'zod'

export const AiProviderEnum = z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'GROQ', 'OLLAMA'])

export type AiProvider = z.infer<typeof AiProviderEnum>

export const UpsertProviderSettingSchema = z
  .object({
    provider: AiProviderEnum,
    rawApiKey: z.string().trim().optional(),
    defaultModel: z.string().trim().min(1, 'Default model name is required'),
    endpointUrl: z.string().url('Invalid endpoint URL').nullish().or(z.literal('')),
    isActive: z.boolean().default(true),
    hasExistingKey: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Local Ollama does not require an API key, but commercial providers do unless existing key is present
      if (data.provider === 'OLLAMA') {
        return true
      }
      if (!data.rawApiKey && !data.hasExistingKey) {
        return false
      }
      return true
    },
    {
      message: 'API key is required for commercial AI providers',
      path: ['rawApiKey'],
    },
  )

export type UpsertProviderSettingInput = z.infer<typeof UpsertProviderSettingSchema>
