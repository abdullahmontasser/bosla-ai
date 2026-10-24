// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SignInCard } from './SignInCard'
import { signInCredentials } from '@/app/actions/auth'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

vi.mock('@/app/actions/auth', () => ({
  signInCredentials: vi.fn(),
}))

describe('SignInCard (covers: AC-1, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders English sign-in form with default demo email pre-filled', () => {
    render(<SignInCard lang="en" dict={{}} />)

    expect(screen.getByRole('heading', { name: /Sign In to Tailoring Studio/i })).toBeDefined()
    expect(screen.getByDisplayValue('demo@careercraft.ai')).toBeDefined()
    expect(screen.getByDisplayValue('password123')).toBeDefined()
    expect(screen.getByRole('button', { name: /^Sign In/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /One-Click Demo Account/i })).toBeDefined()
  })

  it('renders Arabic localized text when lang is ar (covers: AC-10)', () => {
    render(<SignInCard lang="ar" dict={{}} />)

    expect(screen.getByRole('heading', { name: /تسجيل الدخول إلى الاستوديو/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^تسجيل الدخول/i })).toBeDefined()
    expect(
      screen.getByRole('button', { name: /الدخول المباشر بحساب العرض التجريبي/i }),
    ).toBeDefined()
  })

  it('submits credentials and calls router.refresh on success (covers: AC-1)', async () => {
    vi.mocked(signInCredentials).mockResolvedValueOnce({ success: true })

    render(<SignInCard lang="en" dict={{}} />)

    const submitBtn = screen.getByRole('button', { name: /^Sign In/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(signInCredentials).toHaveBeenCalledWith('demo@careercraft.ai', 'password123')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('displays error banner when authentication fails', async () => {
    vi.mocked(signInCredentials).mockResolvedValueOnce({
      success: false,
      error: 'Invalid email or password',
    })

    render(<SignInCard lang="en" dict={{}} />)

    const submitBtn = screen.getByRole('button', { name: /^Sign In/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeDefined()
    })
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('triggers quick demo sign in when clicking one-click button', async () => {
    vi.mocked(signInCredentials).mockResolvedValueOnce({ success: true })

    render(<SignInCard lang="en" dict={{}} />)

    const demoBtn = screen.getByRole('button', { name: /One-Click Demo Account/i })
    fireEvent.click(demoBtn)

    await waitFor(() => {
      expect(signInCredentials).toHaveBeenCalledWith('demo@careercraft.ai', 'password123')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })
})
