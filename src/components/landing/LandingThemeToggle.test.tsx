// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LandingThemeToggle } from './LandingThemeToggle'

const theme = vi.hoisted(() => ({
  setTheme: vi.fn(),
  useTheme: vi.fn(),
}))

vi.mock('next-themes', () => ({ useTheme: theme.useTheme }))

const labels = {
  label: 'Appearance',
  toLight: 'Switch to light theme',
  toDark: 'Switch to dark theme',
}

describe('LandingThemeToggle', () => {
  beforeEach(() => {
    theme.setTheme.mockClear()
    theme.useTheme.mockReturnValue({ resolvedTheme: 'dark', setTheme: theme.setTheme })
  })

  it('switches to light from the dark theme', () => {
    render(<LandingThemeToggle labels={labels} />)

    fireEvent.click(screen.getByRole('button', { name: labels.toLight }))

    expect(theme.setTheme).toHaveBeenCalledWith('light')
  })

  it('switches to dark from the light theme', () => {
    theme.useTheme.mockReturnValue({ resolvedTheme: 'light', setTheme: theme.setTheme })
    render(<LandingThemeToggle labels={labels} />)

    fireEvent.click(screen.getByRole('button', { name: labels.toDark }))

    expect(theme.setTheme).toHaveBeenCalledWith('dark')
  })
})
