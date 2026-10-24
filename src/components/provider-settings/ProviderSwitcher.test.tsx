// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProviderSwitcher } from './ProviderSwitcher'
import { setActiveProvider } from '@/app/actions/provider-settings'

vi.mock('@/app/actions/provider-settings', () => ({
  setActiveProvider: vi.fn(),
}))

describe('ProviderSwitcher component (covers: AC-9, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders configure link button when no provider is active', () => {
    render(<ProviderSwitcher initialActiveProvider={null} lang="en" />)
    expect(screen.getByText('Configure AI Provider')).toBeDefined()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/en/settings/providers')
  })

  it('renders active provider label and model badge when active (covers: AC-9)', () => {
    render(
      <ProviderSwitcher initialActiveProvider="OPENAI" initialDefaultModel="gpt-4o" lang="en" />,
    )

    expect(screen.getByText('OpenAI')).toBeDefined()
    expect(screen.getByText('gpt-4o')).toBeDefined()
  })

  it('invokes setActiveProvider when user switches provider', async () => {
    vi.mocked(setActiveProvider).mockResolvedValueOnce({ success: true })
    const handleChange = vi.fn()

    render(
      <ProviderSwitcher
        initialActiveProvider="OPENAI"
        initialDefaultModel="gpt-4o"
        onProviderChange={handleChange}
        lang="en"
      />,
    )

    const trigger = screen.getByTestId('provider-switcher-trigger')
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    const groqItem = screen.getByText('Groq')
    fireEvent.click(groqItem)

    await waitFor(() => {
      expect(setActiveProvider).toHaveBeenCalledWith('GROQ', expect.any(String))
      expect(handleChange).toHaveBeenCalledWith('GROQ', expect.any(String))
    })
  })
})
