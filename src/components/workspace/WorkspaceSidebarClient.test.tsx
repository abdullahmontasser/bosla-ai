// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspaceSidebarClient } from './WorkspaceSidebarClient'

let mockPathname = '/en/tailor'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn().mockResolvedValue(undefined),
}))

describe('WorkspaceSidebarClient (Gemini-style Sidebar)', () => {
  const defaultProps = {
    lang: 'en',
    section: 'Tailor Studio',
    resumeLanguage: 'EN' as const,
    labels: {
      profile: 'Profile',
      tailor: 'Tailor Studio',
      resumes: 'Resume Health',
      tracker: 'Job Tracker',
      careerPrep: 'Career Prep',
      providers: 'Providers',
      menu: 'Workspace Menu',
      signOut: 'Sign Out',
    },
    user: {
      name: 'Abdullah Montasser',
      email: 'abdullah@example.com',
      image: null,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockPathname = '/en/tailor'
  })

  it('renders expanded sidebar by default with navigation links and active indicator', () => {
    render(<WorkspaceSidebarClient {...defaultProps} />)

    // Verify main navigation exists
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeDefined()

    // Verify active link is flagged with aria-current="page"
    const activeLink = screen.getByRole('link', { name: /Tailor Studio/i })
    expect(activeLink.getAttribute('aria-current')).toBe('page')

    // Verify Bosla AI home link is visible in expanded mode
    const homeLink = screen.getByRole('link', { name: 'Bosla AI — Home' })
    expect(homeLink).toBeDefined()

    // Verify Collapse Sidebar button is present
    const collapseBtn = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(collapseBtn).toBeDefined()
  })

  it('toggles collapse mode when the sidebar toggle button is clicked', () => {
    render(<WorkspaceSidebarClient {...defaultProps} />)

    // Click collapse button
    const collapseBtn = screen.getByRole('button', { name: 'Collapse sidebar' })
    fireEvent.click(collapseBtn)

    // Now it should show the Expand sidebar button
    const expandBtn = screen.getByRole('button', { name: 'Expand sidebar' })
    expect(expandBtn).toBeDefined()

    // LocalStorage should reflect collapsed state
    expect(localStorage.getItem('bosla_sidebar_collapsed')).toBe('true')

    // Click expand button to restore
    fireEvent.click(expandBtn)
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeDefined()
    expect(localStorage.getItem('bosla_sidebar_collapsed')).toBe('false')
  })

  it('renders dedicated Settings & Preferences button separately from Account Menu', () => {
    render(<WorkspaceSidebarClient {...defaultProps} />)

    // Settings trigger
    const settingsTrigger = screen.getByRole('button', { name: 'Settings and preferences' })
    expect(settingsTrigger).toBeDefined()

    // Account menu trigger
    const accountTrigger = screen.getByRole('button', { name: 'Account menu' })
    expect(accountTrigger).toBeDefined()
    expect(accountTrigger.textContent).toContain('Abdullah Montasser')
  })

  it('renders Arabic labels properly in RTL mode', () => {
    render(
      <WorkspaceSidebarClient
        {...defaultProps}
        lang="ar"
        section="استوديو التخصيص"
        labels={{
          ...defaultProps.labels,
          profile: 'الملف الشخصي',
          tailor: 'استوديو التخصيص',
          resumes: 'صحة السيرة',
          tracker: 'لوحة المتابعة',
          careerPrep: 'التحضير للمقابلات',
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'طي القائمة الجانبية' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'بوصلة AI — الرئيسية' })).toBeDefined()
  })

  it('renders with transparent background and no borders when defaultCollapsed is true', () => {
    const { container } = render(
      <WorkspaceSidebarClient {...defaultProps} defaultCollapsed={true} />,
    )

    const aside = container.querySelector('aside')
    expect(aside).not.toBeNull()
    expect(aside?.className).toContain('bg-transparent')
    expect(aside?.className).toContain('border-transparent')
  })

  it('sets cookie and localStorage when toggle is clicked', () => {
    render(<WorkspaceSidebarClient {...defaultProps} defaultCollapsed={false} />)

    const collapseBtn = screen.getByRole('button', { name: 'Collapse sidebar' })
    fireEvent.click(collapseBtn)

    expect(document.cookie).toContain('bosla_sidebar_collapsed=true')
    expect(localStorage.getItem('bosla_sidebar_collapsed')).toBe('true')
  })
})
