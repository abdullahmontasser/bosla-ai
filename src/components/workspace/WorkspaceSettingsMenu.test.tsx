// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspaceSettingsMenu } from './WorkspaceSettingsMenu'

let mockPathname = '/en/tailor'
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: mockRefresh }),
}))

const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}))

describe('WorkspaceSettingsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/en/tailor'
    document.cookie = ''
  })

  it('renders trigger button in row variant for expanded sidebar', () => {
    render(<WorkspaceSettingsMenu lang="en" variant="row" />)

    const trigger = screen.getByRole('button', { name: 'Settings and preferences' })
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toContain('Settings & Preferences')
  })

  it('renders trigger button in icon variant for collapsed sidebar', () => {
    render(<WorkspaceSettingsMenu lang="en" variant="icon" />)

    const trigger = screen.getByRole('button', { name: 'Settings and preferences' })
    expect(trigger).toBeDefined()
  })

  it('opens menu with Interface, Theme, Active CV, and AI Provider options', () => {
    render(<WorkspaceSettingsMenu lang="en" currentResumeLang="EN" variant="row" />)

    const trigger = screen.getByRole('button', { name: 'Settings and preferences' })
    fireEvent.pointerDown(trigger, { pointerId: 1, button: 0 })

    expect(screen.getByText('Platform Preferences')).toBeDefined()
    expect(screen.getByText('Interface')).toBeDefined()
    expect(screen.getByText('Theme')).toBeDefined()
    expect(screen.getByText('Active CV')).toBeDefined()
    expect(screen.getByText('AI Providers & Models')).toBeDefined()
  })

  it('switches interface language and navigates with updated URL path', () => {
    render(<WorkspaceSettingsMenu lang="en" variant="row" />)

    const trigger = screen.getByRole('button', { name: 'Settings and preferences' })
    fireEvent.pointerDown(trigger, { pointerId: 1, button: 0 })

    const arabicButtons = screen.getAllByRole('button', { name: 'عربي' })
    const interfaceArBtn = arabicButtons[0]!
    fireEvent.click(interfaceArBtn)

    expect(document.cookie).toContain('NEXT_LOCALE=ar')
    expect(mockPush).toHaveBeenCalledWith('/ar/tailor')
  })

  it('switches resume language and dispatches sync event', () => {
    const listener = vi.fn()
    window.addEventListener('resume-language-changed', listener)

    render(<WorkspaceSettingsMenu lang="en" currentResumeLang="EN" variant="row" />)

    const trigger = screen.getByRole('button', { name: 'Settings and preferences' })
    fireEvent.pointerDown(trigger, { pointerId: 1, button: 0 })

    const arabicButtons = screen.getAllByRole('button', { name: 'عربي' })
    const resumeArBtn = arabicButtons[arabicButtons.length - 1]!
    fireEvent.click(resumeArBtn)

    expect(document.cookie).toContain('bosla_resume_language=AR')
    expect(mockRefresh).toHaveBeenCalled()

    window.removeEventListener('resume-language-changed', listener)
  })
})
