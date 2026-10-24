import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProviderConfigurations,
  validateAndFetchModels,
  saveProviderSetting,
  setActiveProvider,
  deleteProviderSetting,
} from './provider-settings'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { encryptSecret, generateEncryptionKey } from '@/lib/crypto'
import type { UserProviderSetting } from '@prisma/client'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userProviderSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callbacks) => Promise.all(callbacks)),
  },
}))

describe('Provider Settings Server Actions', () => {
  const mockUserId = 'usr_test_123'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENCRYPTION_KEY = generateEncryptionKey()
  })

  describe('Authentication guard (covers: AC-8)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue(null as never)
    })

    it('returns unauthorized error for getProviderConfigurations when unauthenticated', async () => {
      const res = await getProviderConfigurations()
      expect(res).toEqual({ error: 'Unauthorized' })
      expect(prisma.userProviderSetting.findMany).not.toHaveBeenCalled()
    })

    it('returns unauthorized error for validateAndFetchModels when unauthenticated', async () => {
      const res = await validateAndFetchModels('OPENAI', 'sk-test')
      expect(res).toEqual({ error: 'Unauthorized' })
    })

    it('returns unauthorized error for saveProviderSetting when unauthenticated', async () => {
      const res = await saveProviderSetting('OPENAI', 'sk-test', 'gpt-4o')
      expect(res).toEqual({ error: 'Unauthorized' })
      expect(prisma.userProviderSetting.upsert).not.toHaveBeenCalled()
    })

    it('returns unauthorized error for setActiveProvider when unauthenticated', async () => {
      const res = await setActiveProvider('OPENAI')
      expect(res).toEqual({ error: 'Unauthorized' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns unauthorized error for deleteProviderSetting when unauthenticated', async () => {
      const res = await deleteProviderSetting('OPENAI')
      expect(res).toEqual({ error: 'Unauthorized' })
      expect(prisma.userProviderSetting.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('getProviderConfigurations (covers: AC-1, AC-7)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
        expires: '2099-01-01',
      } as never)
    })

    it('returns exactly 5 provider items with unconfigured defaults when no settings exist', async () => {
      vi.mocked(prisma.userProviderSetting.findMany).mockResolvedValueOnce([])

      const res = await getProviderConfigurations()
      expect(Array.isArray(res)).toBe(true)
      if (Array.isArray(res)) {
        expect(res).toHaveLength(5)
        const providers = res.map((r) => r.provider)
        expect(providers).toEqual(['OPENAI', 'ANTHROPIC', 'GEMINI', 'GROQ', 'OLLAMA'])
        expect(res.every((r) => !r.isConfigured)).toBe(true)
      }
    })

    it('masks API keys showing last 4 characters and parses configured settings', async () => {
      const encrypted = encryptSecret('sk-proj-abcdef12345678')
      vi.mocked(prisma.userProviderSetting.findMany).mockResolvedValueOnce([
        {
          id: 'set_openai',
          userId: mockUserId,
          provider: 'OPENAI',
          encryptedKey: encrypted.encryptedKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          defaultModel: 'gpt-4o',
          endpointUrl: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as UserProviderSetting,
        {
          id: 'set_ollama',
          userId: mockUserId,
          provider: 'OLLAMA',
          encryptedKey: null,
          iv: null,
          authTag: null,
          defaultModel: 'llama3.2',
          endpointUrl: 'http://localhost:11434',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as UserProviderSetting,
      ])

      const res = await getProviderConfigurations()
      expect(Array.isArray(res)).toBe(true)
      if (Array.isArray(res)) {
        const openai = res.find((r) => r.provider === 'OPENAI')
        expect(openai?.isConfigured).toBe(true)
        expect(openai?.isActive).toBe(true)
        expect(openai?.defaultModel).toBe('gpt-4o')
        expect(openai?.maskedKey).toBe('••••••••5678')
        expect(openai?.isCorrupted).toBeUndefined()

        const ollama = res.find((r) => r.provider === 'OLLAMA')
        expect(ollama?.isConfigured).toBe(true)
        expect(ollama?.endpointUrl).toBe('http://localhost:11434')
        expect(ollama?.maskedKey).toBeNull()
      }
    })

    it('catches decryption failure and marks card as isCorrupted without throwing (covers: AC-7)', async () => {
      vi.mocked(prisma.userProviderSetting.findMany).mockResolvedValueOnce([
        {
          id: 'set_corrupt',
          userId: mockUserId,
          provider: 'ANTHROPIC',
          encryptedKey: 'corruptCiphertext',
          iv: 'invalidIv',
          authTag: 'invalidAuthTag',
          defaultModel: 'claude-3-5-sonnet-20241022',
          endpointUrl: null,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as UserProviderSetting,
      ])

      const res = await getProviderConfigurations()
      expect(Array.isArray(res)).toBe(true)
      if (Array.isArray(res)) {
        const anthropic = res.find((r) => r.provider === 'ANTHROPIC')
        expect(anthropic?.isConfigured).toBe(true)
        expect(anthropic?.isCorrupted).toBe(true)
        expect(anthropic?.maskedKey).toBeNull()
      }
    })
  })

  describe('validateAndFetchModels (covers: AC-2, AC-3)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId },
        expires: '2099-01-01',
      } as never)
    })

    it('validates OpenAI models and returns filtered model list', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'gpt-4o' }, { id: 'whisper-1' }, { id: 'gpt-4o-mini' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const res = await validateAndFetchModels('OPENAI', 'sk-valid-key')
      expect(res).toEqual({ models: ['gpt-4o', 'gpt-4o-mini'] })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-valid-key' },
        }),
      )
    })

    it('returns error when provider returns 401 Unauthorized', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
      vi.stubGlobal('fetch', mockFetch)

      const res = await validateAndFetchModels('GROQ', 'gsk_invalid')
      expect(res).toEqual({ error: 'Invalid API key' })
    })

    it('blocks SSRF Ollama endpoints before making network requests (covers: AC-3)', async () => {
      const mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)

      const res = await validateAndFetchModels(
        'OLLAMA',
        undefined,
        'http://169.254.169.254/latest/meta-data',
      )
      expect(res).toEqual({
        error: 'Forbidden endpoint host (metadata address blocked)',
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('uses decrypted stored key if rawKey is omitted for a configured provider', async () => {
      const rawStoredKey = 'sk-ant-saved-secret-key'
      const encrypted = encryptSecret(rawStoredKey)

      vi.mocked(prisma.userProviderSetting.findUnique).mockResolvedValueOnce({
        id: 'set_anthropic',
        userId: mockUserId,
        provider: 'ANTHROPIC',
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        defaultModel: 'claude-3-5-sonnet-20241022',
        endpointUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserProviderSetting)

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'claude-3-5-sonnet-20241022' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const res = await validateAndFetchModels('ANTHROPIC')
      expect(res).toEqual({ models: ['claude-3-5-sonnet-20241022'] })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': rawStoredKey,
          }),
        }),
      )
    })
  })

  describe('saveProviderSetting (covers: AC-4, AC-5)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId },
        expires: '2099-01-01',
      } as never)
    })

    it('saves new provider and activates it if no active provider exists', async () => {
      vi.mocked(prisma.userProviderSetting.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.userProviderSetting.upsert).mockResolvedValueOnce(
        {} as unknown as UserProviderSetting,
      )

      const res = await saveProviderSetting('OPENAI', 'sk-test-key-1234', 'gpt-4o')
      expect(res).toEqual({ success: true })
      expect(prisma.userProviderSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_provider: {
              userId: mockUserId,
              provider: 'OPENAI',
            },
          },
          create: expect.objectContaining({
            isActive: true,
            defaultModel: 'gpt-4o',
          }),
        }),
      )
    })

    it('saves new provider as inactive if another provider is already active (covers: AC-5)', async () => {
      vi.mocked(prisma.userProviderSetting.findFirst).mockResolvedValueOnce({
        id: 'active_openai',
        userId: mockUserId,
        provider: 'OPENAI',
        isActive: true,
      } as unknown as UserProviderSetting)
      vi.mocked(prisma.userProviderSetting.upsert).mockResolvedValueOnce(
        {} as unknown as UserProviderSetting,
      )

      const res = await saveProviderSetting(
        'ANTHROPIC',
        'sk-ant-test',
        'claude-3-5-sonnet-20241022',
      )
      expect(res).toEqual({ success: true })
      expect(prisma.userProviderSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isActive: false,
          }),
        }),
      )
    })

    it('rejects SSRF endpoint for Ollama on save (covers: AC-3)', async () => {
      const res = await saveProviderSetting(
        'OLLAMA',
        undefined,
        'llama3.2',
        'http://localhost:5432',
      )
      expect(res).toEqual({
        error: 'Forbidden endpoint port (5432 is a restricted service port)',
      })
      expect(prisma.userProviderSetting.upsert).not.toHaveBeenCalled()
    })
  })

  describe('setActiveProvider (covers: AC-5)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId },
        expires: '2099-01-01',
      } as never)
    })

    it('rejects if the target provider is not configured', async () => {
      vi.mocked(prisma.userProviderSetting.findUnique).mockResolvedValueOnce(null)

      const res = await setActiveProvider('GROQ')
      expect(res).toEqual({ error: 'Provider is not configured' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('activates the chosen provider and deactivates others in a single transaction', async () => {
      vi.mocked(prisma.userProviderSetting.findUnique).mockResolvedValueOnce({
        id: 'set_groq',
        userId: mockUserId,
        provider: 'GROQ',
      } as unknown as UserProviderSetting)

      const res = await setActiveProvider('GROQ', 'llama-3.3-70b-versatile')
      expect(res).toEqual({ success: true })
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userProviderSetting.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { isActive: false },
      })
      expect(prisma.userProviderSetting.update).toHaveBeenCalledWith({
        where: {
          userId_provider: {
            userId: mockUserId,
            provider: 'GROQ',
          },
        },
        data: {
          isActive: true,
          defaultModel: 'llama-3.3-70b-versatile',
        },
      })
    })
  })

  describe('deleteProviderSetting (covers: AC-6)', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId },
        expires: '2099-01-01',
      } as never)
    })

    it('deletes the provider setting scoped to userId', async () => {
      vi.mocked(prisma.userProviderSetting.deleteMany).mockResolvedValueOnce({ count: 1 })

      const res = await deleteProviderSetting('OPENAI')
      expect(res).toEqual({ success: true })
      expect(prisma.userProviderSetting.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          provider: 'OPENAI',
        },
      })
    })
  })
})
