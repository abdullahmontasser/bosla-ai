/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProviderModel } from './provider-client'
import type { DecryptedProviderSetting } from '@/lib/db/provider-settings'

const mockOpenAIModel = vi.fn()
const mockAnthropicModel = vi.fn()
const mockGoogleModel = vi.fn()
const mockGroqModel = vi.fn()
const mockOllamaModel = vi.fn()

const mockCreateOpenAI = vi.fn((..._args: unknown[]) => mockOpenAIModel)
const mockCreateAnthropic = vi.fn((..._args: unknown[]) => mockAnthropicModel)
const mockCreateGoogle = vi.fn((..._args: unknown[]) => mockGoogleModel)
const mockCreateGroq = vi.fn((..._args: unknown[]) => mockGroqModel)
const mockCreateOllama = vi.fn((..._args: unknown[]) => mockOllamaModel)

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: (args: unknown) => mockCreateOpenAI(args),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: (args: unknown) => mockCreateAnthropic(args),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: (args: unknown) => mockCreateGoogle(args),
}))

vi.mock('@ai-sdk/groq', () => ({
  createGroq: (args: unknown) => mockCreateGroq(args),
}))

vi.mock('ollama-ai-provider', () => ({
  createOllama: (args: unknown) => mockCreateOllama(args),
}))

describe('getProviderModel (covers: AC-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates OpenAI model with decrypted key and default fallback model', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_1',
      provider: 'OPENAI',
      isActive: true,
      apiKey: 'sk-test-openai',
      endpointUrl: null,
      defaultModel: '',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test-openai' })
    expect(mockOpenAIModel).toHaveBeenCalledWith('gpt-4o')
  })

  it('instantiates Anthropic model with custom model override', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_2',
      provider: 'ANTHROPIC',
      isActive: true,
      apiKey: 'sk-ant-test',
      endpointUrl: null,
      defaultModel: 'claude-3-5-sonnet-20241022',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test' })
    expect(mockAnthropicModel).toHaveBeenCalledWith('claude-3-5-sonnet-20241022')
  })

  it('instantiates Gemini model with google provider', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_3',
      provider: 'GEMINI',
      isActive: true,
      apiKey: 'AIzaSyTest',
      endpointUrl: null,
      defaultModel: '',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateGoogle).toHaveBeenCalledWith({ apiKey: 'AIzaSyTest' })
    expect(mockGoogleModel).toHaveBeenCalledWith('gemini-2.0-flash')
  })

  it('instantiates Groq model with custom model', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_4',
      provider: 'GROQ',
      isActive: true,
      apiKey: 'gsk-test',
      endpointUrl: null,
      defaultModel: 'llama-3.3-70b-versatile',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateGroq).toHaveBeenCalledWith({ apiKey: 'gsk-test' })
    expect(mockGroqModel).toHaveBeenCalledWith('llama-3.3-70b-versatile')
  })

  it('instantiates Ollama with custom baseUrl stripping trailing slash', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_5',
      provider: 'OLLAMA',
      isActive: true,
      apiKey: null,
      endpointUrl: 'http://my-ollama:11434/api/',
      defaultModel: 'llama3:latest',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateOllama).toHaveBeenCalledWith({ baseURL: 'http://my-ollama:11434/api' })
    expect(mockOllamaModel).toHaveBeenCalledWith('llama3:latest')
  })

  it('falls back to default ollama baseUrl when none provided', () => {
    const setting: DecryptedProviderSetting = {
      id: 'set_6',
      provider: 'OLLAMA',
      isActive: true,
      apiKey: null,
      endpointUrl: null,
      defaultModel: '',
      updatedAt: new Date(),
    }

    getProviderModel(setting)

    expect(mockCreateOllama).toHaveBeenCalledWith({ baseURL: 'http://localhost:11434/api' })
    expect(mockOllamaModel).toHaveBeenCalledWith('llama3.2')
  })

  it('throws for an unsupported provider', () => {
    const setting = {
      provider: 'UNKNOWN_PROVIDER',
    } as unknown as DecryptedProviderSetting

    expect(() => getProviderModel(setting)).toThrow(/Unsupported AI provider/)
  })
})
