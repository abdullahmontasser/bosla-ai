import { prisma } from '@/lib/prisma'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import type { AiProvider } from '@prisma/client'
import {
  UpsertProviderSettingSchema,
  type UpsertProviderSettingInput,
} from '@/lib/validations/provider-settings'

export interface DecryptedProviderSetting {
  id: string
  provider: AiProvider
  apiKey: string | null
  defaultModel: string
  endpointUrl: string | null
  isActive: boolean
  updatedAt: Date
}

/**
 * Saves or updates an AI provider configuration for a user.
 * Commercial API keys are encrypted at rest using AES-256-GCM.
 * When rawApiKey is omitted on an update, existing encrypted credentials remain intact.
 */
export async function upsertProviderSetting(userId: string, input: UpsertProviderSettingInput) {
  const validatedInput = { ...input }

  if (
    !validatedInput.hasExistingKey &&
    !validatedInput.rawApiKey &&
    validatedInput.provider !== 'OLLAMA'
  ) {
    const existing = await prisma.userProviderSetting.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: validatedInput.provider as AiProvider,
        },
      },
    })
    if (existing?.encryptedKey) {
      validatedInput.hasExistingKey = true
    }
  }

  const validated = UpsertProviderSettingSchema.parse(validatedInput)

  let encryptedKey: string | null = null
  let iv: string | null = null
  let authTag: string | null = null

  if (validated.rawApiKey) {
    const encrypted = encryptSecret(validated.rawApiKey)
    encryptedKey = encrypted.encryptedKey
    iv = encrypted.iv
    authTag = encrypted.authTag
  }

  return prisma.userProviderSetting.upsert({
    where: {
      userId_provider: {
        userId,
        provider: validated.provider as AiProvider,
      },
    },
    update: {
      defaultModel: validated.defaultModel,
      endpointUrl: validated.endpointUrl || null,
      isActive: validated.isActive,
      ...(encryptedKey !== null && {
        encryptedKey,
        iv,
        authTag,
      }),
    },
    create: {
      userId,
      provider: validated.provider as AiProvider,
      defaultModel: validated.defaultModel,
      endpointUrl: validated.endpointUrl || null,
      isActive: validated.isActive,
      encryptedKey,
      iv,
      authTag,
    },
  })
}

/**
 * Retrieves all active provider settings for a user with decrypted API keys.
 */
export async function getActiveProviderSettings(
  userId: string,
): Promise<DecryptedProviderSetting[]> {
  const settings = await prisma.userProviderSetting.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return settings.map((setting) => {
    let apiKey: string | null = null

    if (setting.encryptedKey && setting.iv && setting.authTag) {
      try {
        apiKey = decryptSecret(setting.encryptedKey, setting.iv, setting.authTag)
      } catch {
        throw new Error(
          `Failed to decrypt credentials for provider ${setting.provider}. The encryption key may have changed or credentials are corrupted.`,
        )
      }
    }

    return {
      id: setting.id,
      provider: setting.provider,
      apiKey,
      defaultModel: setting.defaultModel,
      endpointUrl: setting.endpointUrl,
      isActive: setting.isActive,
      updatedAt: setting.updatedAt,
    }
  })
}

/**
 * Retrieves a single provider setting by user and provider.
 */
export async function getProviderSetting(
  userId: string,
  provider: AiProvider,
): Promise<DecryptedProviderSetting | null> {
  const setting = await prisma.userProviderSetting.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  })

  if (!setting) return null

  let apiKey: string | null = null
  if (setting.encryptedKey && setting.iv && setting.authTag) {
    try {
      apiKey = decryptSecret(setting.encryptedKey, setting.iv, setting.authTag)
    } catch {
      throw new Error(`Failed to decrypt credentials for provider ${setting.provider}.`)
    }
  }

  return {
    id: setting.id,
    provider: setting.provider,
    apiKey,
    defaultModel: setting.defaultModel,
    endpointUrl: setting.endpointUrl,
    isActive: setting.isActive,
    updatedAt: setting.updatedAt,
  }
}

/**
 * Deletes a provider setting.
 */
export async function deleteProviderSetting(userId: string, provider: AiProvider) {
  return prisma.userProviderSetting.deleteMany({
    where: {
      userId,
      provider,
    },
  })
}
