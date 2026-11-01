// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkspaceNav } from './WorkspaceNav'
import { AccountMenu } from './AccountMenu'
import { WorkspaceMobileMenu } from './WorkspaceMobileMenu'
import { signOutAction } from '@/app/actions/auth'

let mockPathname = '/en/tailor'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn().mockResolvedValue(undefined),
}))

describe('Workspace Shell Components (covers: AC-7, AC-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/en/tailor'
  })

  it('renders workspace navigation links and flags active link with aria-current (AC-7)', () => {
    render(
      <WorkspaceNav
        lang="en"
        labels={{
          profile: 'Profile',
          tailor: 'Tailor',
          resumes: 'Resumes',
          tracker: 'Tracker',
          providers: 'Providers',
        }}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Workspace' })
    expect(nav).toBeDefined()

    const tailorLink = screen.getByRole('link', { name: /Tailor/i })
    expect(tailorLink.getAttribute('aria-current')).toBe('page')

    const resumeLink = screen.getByRole('link', { name: /Resumes/i })
    expect(resumeLink.getAttribute('aria-current')).toBeNull()
  })

  it('renders career prep navigation link and sets active state (AC-11)', () => {
    mockPathname = '/en/career-prep'
    render(
      <WorkspaceNav
        lang="en"
        labels={{
          profile: 'Profile',
          tailor: 'Tailor',
          resumes: 'Resumes',
          tracker: 'Tracker',
          careerPrep: 'Career Prep',
          providers: 'Providers',
        }}
      />,
    )

    const careerPrepLink = screen.getByRole('link', { name: /Career Prep/i })
    expect(careerPrepLink.getAttribute('aria-current')).toBe('page')
  })

  it('renders account menu with initials fallback when image is missing (AC-7)', () => {
    render(<AccountMenu lang="en" name="Abdullah Montasser" email="3bdullah.montasser@gmail.com" />)

    const button = screen.getByRole('button', { name: 'Account menu' })
    expect(button).toBeDefined()
    expect(button.textContent).toBe('AM')
  })

  it('renders account menu with avatar image when provided (AC-7)', () => {
    const { container } = render(
      <AccountMenu
        lang="en"
        name="Abdullah Montasser"
        email="3bdullah.montasser@gmail.com"
        image="/api/profile/avatar?u=usr_123"
      />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/api/profile/avatar?u=usr_123')
  })

  it('triggers signOutAction when Sign Out is clicked in WorkspaceMobileMenu (AC-7, AC-9)', async () => {
    render(
      <WorkspaceMobileMenu
        lang="en"
        labels={{
          profile: 'Profile',
          tailor: 'Tailor',
          resumes: 'Resumes',
          tracker: 'Tracker',
          providers: 'Providers',
          menu: 'Workspace menu',
          signOut: 'Sign out',
        }}
      />,
    )

    const signOutBtn = screen.getByRole('button', { name: /Sign out/i })
    fireEvent.click(signOutBtn)

    await waitFor(() => {
      expect(signOutAction).toHaveBeenCalledWith('en')
    })
  })

  it('renders mobile menu trigger with accessible label (AC-9)', () => {
    const { container } = render(
      <WorkspaceMobileMenu
        lang="en"
        labels={{
          profile: 'Profile',
          tailor: 'Tailor',
          resumes: 'Resumes',
          tracker: 'Tracker',
          providers: 'Providers',
          menu: 'Workspace menu',
          signOut: 'Sign out',
        }}
      />,
    )

    const summary = container.querySelector('summary')
    expect(summary?.getAttribute('aria-label')).toBe('Workspace menu')
  })
})
