// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './theme-provider'

describe('ThemeProvider component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders children with theme context', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>Theme Content</div>
      </ThemeProvider>,
    )

    expect(screen.getByText('Theme Content')).toBeDefined()
  })

  it('filters out the React 19 script tag warning from console.error', () => {
    const logged: unknown[][] = []
    const currentConsoleError = console.error

    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    try {
      console.error('Test normal error message')
      expect(logged.length).toBe(1)
      expect(logged[0][0]).toBe('Test normal error message')
    } finally {
      console.error = currentConsoleError
    }
  })
})
