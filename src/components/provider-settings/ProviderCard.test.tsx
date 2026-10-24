// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProviderCard } from './ProviderCard'
import {
  validateAndFetchModels,
  saveProviderSetting,
  setActiveProvider,
  deleteProviderSetting,
  type ProviderCardState,
} from '@/app/actions/provider-settings'

vi.mock('@/app/actions/provider-settings', () => ({
  validateAndFetchModels: vi.fn(),
  saveProviderSetting: vi.fn(),
  setActiveProvider: vi.fn(),
  deleteProviderSetting: vi.fn(),
}))

const mockDict = {
  title: 'AI Provider Settings (BYOK)',
  description: 'Configure your own API keys.',
  active: 'Active',
  inactive: 'Inactive',
  configured: 'Configured',
  unconfigured: 'Not Configured',
  corrupted: 'Credentials corrupted. Please re-enter your key.',
  apiKey: 'API Key',
  apiKeyPlaceholder: 'Enter API key...',
  endpointUrl: 'Endpoint URL',
  endpointUrlPlaceholder: 'http://localhost:11434',
  validateAndFetch: 'Validate & Fetch Models',
  validating: 'Validating...',
  selectModel: 'Select Default Model',
  modelPlaceholder: 'Choose a model...',
  saveSettings: 'Save Configuration',
  saving: 'Saving...',
  setActive: 'Set as Active Provider',
  settingActive: 'Setting Active...',
  delete: 'Delete Configuration',
  deleteConfirm: 'Are you sure you want to remove this provider configuration?',
  savedSuccess: 'Settings saved successfully',
  deleteSuccess: 'Provider removed',
  activatedSuccess: 'Provider set as active',
  fallbackNotice: 'Could not reach provider models endpoint. Showing recommended models.',
  retry: 'Retry',
  ollamaNote: 'Requires a local Ollama server running. No API key needed.',
  switcherTitle: 'Active Provider',
  noActiveProvider: 'No active AI provider',
  configureNow: 'Configure in Settings',
}

describe('ProviderCard component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders unconfigured commercial provider card (covers: AC-1)', () => {
    const state: ProviderCardState = {
      provider: 'OPENAI',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: null,
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    expect(screen.getByText('OpenAI')).toBeDefined()
    expect(screen.getByText('Not Configured')).toBeDefined()
    expect(screen.getByLabelText('API Key')).toBeDefined()
    expect(screen.getByText('Validate & Fetch Models')).toBeDefined()
    expect(screen.getByText('Save Configuration')).toBeDefined()
  })

  it('renders masked API key hint for configured provider (covers: AC-1, AC-7)', () => {
    const state: ProviderCardState = {
      provider: 'OPENAI',
      isConfigured: true,
      maskedKey: '••••••••1234',
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: true,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    expect(screen.getByText('••••••••1234')).toBeDefined()
    expect(screen.getByText('Active')).toBeDefined()
  })

  it('renders Ollama card with endpoint URL input instead of password key input (covers: AC-1)', () => {
    const state: ProviderCardState = {
      provider: 'OLLAMA',
      isConfigured: false,
      maskedKey: null,
      defaultModel: 'llama3.2',
      endpointUrl: 'http://localhost:11434',
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    expect(screen.getByText('Ollama')).toBeDefined()
    expect(screen.getByLabelText('Endpoint URL')).toBeDefined()
    expect(screen.queryByLabelText('API Key')).toBeNull()
  })

  it('renders corruption warning alert when isCorrupted is true (covers: AC-7)', () => {
    const state: ProviderCardState = {
      provider: 'ANTHROPIC',
      isConfigured: true,
      maskedKey: null,
      defaultModel: 'claude-3-5-sonnet-20241022',
      endpointUrl: null,
      isActive: false,
      isCorrupted: true,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText(mockDict.corrupted)).toBeDefined()
  })

  it('shows error and fallback notice when validation fails (covers: AC-2, AC-3)', async () => {
    vi.mocked(validateAndFetchModels).mockResolvedValueOnce({
      error: 'Invalid API key',
    })

    const state: ProviderCardState = {
      provider: 'GROQ',
      isConfigured: false,
      maskedKey: null,
      defaultModel: null,
      endpointUrl: null,
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    const input = screen.getByLabelText('API Key')
    fireEvent.change(input, { target: { value: 'bad-key' } })

    const validateBtn = screen.getByText('Validate & Fetch Models')
    fireEvent.click(validateBtn)

    await waitFor(() => {
      expect(screen.getByText('Invalid API key')).toBeDefined()
      expect(screen.getByText(mockDict.fallbackNotice)).toBeDefined()
    })
  })

  it('saves configuration and displays success message (covers: AC-4)', async () => {
    vi.mocked(saveProviderSetting).mockResolvedValueOnce({ success: true })

    const state: ProviderCardState = {
      provider: 'OPENAI',
      isConfigured: false,
      maskedKey: null,
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    const input = screen.getByLabelText('API Key')
    fireEvent.change(input, { target: { value: 'sk-test-valid-key-9999' } })

    const saveBtn = screen.getByText('Save Configuration')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(saveProviderSetting).toHaveBeenCalledWith(
        'OPENAI',
        'sk-test-valid-key-9999',
        expect.any(String),
        undefined,
      )
      expect(screen.getByText(mockDict.savedSuccess)).toBeDefined()
    })
  })

  it('triggers setActiveProvider when set as active is clicked (covers: AC-5)', async () => {
    vi.mocked(setActiveProvider).mockResolvedValueOnce({ success: true })

    const state: ProviderCardState = {
      provider: 'OPENAI',
      isConfigured: true,
      maskedKey: '••••••••1234',
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    const setActiveBtn = screen.getByText('Set as Active Provider')
    fireEvent.click(setActiveBtn)

    await waitFor(() => {
      expect(setActiveProvider).toHaveBeenCalledWith('OPENAI', 'gpt-4o')
    })
  })

  it('triggers deleteProviderSetting on confirmed delete action (covers: AC-6)', async () => {
    vi.mocked(deleteProviderSetting).mockResolvedValueOnce({ success: true })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const state: ProviderCardState = {
      provider: 'GROQ',
      isConfigured: true,
      maskedKey: '••••••••5678',
      defaultModel: 'llama-3.3-70b-versatile',
      endpointUrl: null,
      isActive: false,
    }

    render(<ProviderCard initialState={state} dictionary={mockDict} />)

    const deleteBtn = screen.getByLabelText('Delete Configuration')
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(deleteProviderSetting).toHaveBeenCalledWith('GROQ')
    })
  })
})
