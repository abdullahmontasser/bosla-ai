// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsProvidersPage from './page'

const mockNotFound = vi.fn()
vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/settings/providers',
}))

vi.mock('@/app/actions/provider-settings', () => ({
  getProviderConfigurations: vi.fn().mockResolvedValue([
    {
      provider: 'OPENAI',
      isConfigured: true,
      maskedKey: '••••••••1234',
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: true,
    },
    {
      provider: 'ANTHROPIC',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: null,
      isActive: false,
    },
    {
      provider: 'GEMINI',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: null,
      isActive: false,
    },
    {
      provider: 'GROQ',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: null,
      isActive: false,
    },
    {
      provider: 'OLLAMA',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: 'http://localhost:11434',
      isActive: false,
    },
  ]),
  validateAndFetchModels: vi.fn(),
  saveProviderSetting: vi.fn(),
  setActiveProvider: vi.fn(),
  deleteProviderSetting: vi.fn(),
}))

describe('SettingsProvidersPage component (covers: AC-1, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders English providers settings page with all 5 cards (covers: AC-1)', async () => {
    const pageElement = await SettingsProvidersPage({
      params: Promise.resolve({ lang: 'en' }),
    })

    render(pageElement)

    expect(screen.getByText('AI Provider Settings (BYOK)')).toBeDefined()
    expect(await screen.findByText('OpenAI')).toBeDefined()
    expect(await screen.findByText('Anthropic')).toBeDefined()
    expect(await screen.findByText('Google Gemini')).toBeDefined()
    expect(await screen.findByText('Groq')).toBeDefined()
    expect(await screen.findByText('Ollama')).toBeDefined()
  })

  it('renders Arabic providers settings page with localized titles (covers: AC-10)', async () => {
    const pageElement = await SettingsProvidersPage({
      params: Promise.resolve({ lang: 'ar' }),
    })

    render(pageElement)

    expect(screen.getByText('إعدادات مزودي الذكاء الاصطناعي (BYOK)')).toBeDefined()
  })

  it('calls notFound when an unsupported locale is requested', async () => {
    await SettingsProvidersPage({
      params: Promise.resolve({ lang: 'fr' }),
    })

    expect(mockNotFound).toHaveBeenCalled()
  })
})
