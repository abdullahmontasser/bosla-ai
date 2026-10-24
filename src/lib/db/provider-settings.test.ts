import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  upsertProviderSetting,
  getActiveProviderSettings,
  getProviderSetting,
  deleteProviderSetting,
} from './provider-settings'
import { prisma } from '@/lib/prisma'
import { generateEncryptionKey } from '@/lib/crypto'
import type { UserProviderSetting } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userProviderSetting: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Provider Settings Repository (covers: AC-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENCRYPTION_KEY = generateEncryptionKey()
  })

  it('encrypts API key before saving via upsert (covers: AC-2)', async () => {
    vi.mocked(prisma.userProviderSetting.upsert).mockResolvedValueOnce({
      id: 'setting_1',
      userId: 'user_1',
      provider: 'OPENAI',
      encryptedKey: 'mockCipher',
      iv: 'mockIv',
      authTag: 'mockTag',
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as UserProviderSetting)

    const result = await upsertProviderSetting('user_1', {
      provider: 'OPENAI',
      rawApiKey: 'sk-proj-super-secret-12345',
      defaultModel: 'gpt-4o',
      isActive: true,
    })

    expect(prisma.userProviderSetting.upsert).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: 'user_1',
          provider: 'OPENAI',
        },
      },
      update: expect.objectContaining({
        defaultModel: 'gpt-4o',
        isActive: true,
        encryptedKey: expect.any(String),
        iv: expect.any(String),
        authTag: expect.any(String),
      }),
      create: expect.objectContaining({
        userId: 'user_1',
        provider: 'OPENAI',
        defaultModel: 'gpt-4o',
        encryptedKey: expect.any(String),
      }),
    })

    expect(result.id).toBe('setting_1')
  })

  it('decrypts stored active provider settings (covers: AC-2)', async () => {
    const { encryptSecret } = await import('@/lib/crypto')
    const rawKey = 'sk-ant-test-key-999'
    const encrypted = encryptSecret(rawKey)

    vi.mocked(prisma.userProviderSetting.findMany).mockResolvedValueOnce([
      {
        id: 'setting_2',
        userId: 'user_1',
        provider: 'ANTHROPIC',
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        defaultModel: 'claude-3-5-sonnet-20241022',
        endpointUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserProviderSetting,
    ])

    const activeSettings = await getActiveProviderSettings('user_1')
    expect(activeSettings).toHaveLength(1)
    expect(activeSettings[0].provider).toBe('ANTHROPIC')
    expect(activeSettings[0].apiKey).toBe(rawKey)
  })

  it('throws descriptive error when stored key decryption fails (covers: AC-2)', async () => {
    vi.mocked(prisma.userProviderSetting.findMany).mockResolvedValueOnce([
      {
        id: 'setting_corrupt',
        userId: 'user_1',
        provider: 'OPENAI',
        encryptedKey: 'corruptBase64Key===',
        iv: '123456789012345678901234',
        authTag: '12345678901234567890123456789012',
        defaultModel: 'gpt-4o',
        endpointUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserProviderSetting,
    ])

    await expect(getActiveProviderSettings('user_1')).rejects.toThrow(
      /Failed to decrypt credentials for provider OPENAI/,
    )
  })

  it('returns single provider setting by user and provider (covers: AC-2)', async () => {
    vi.mocked(prisma.userProviderSetting.findUnique).mockResolvedValueOnce(null)

    const result = await getProviderSetting('user_1', 'GEMINI')
    expect(result).toBeNull()
  })

  it('deletes provider settings scoped to userId (covers: AC-2)', async () => {
    vi.mocked(prisma.userProviderSetting.deleteMany).mockResolvedValueOnce({
      count: 1,
    })

    const result = await deleteProviderSetting('user_1', 'GROQ')
    expect(prisma.userProviderSetting.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user_1',
        provider: 'GROQ',
      },
    })
    expect(result.count).toBe(1)
  })
})
