// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthForm } from './AuthForm'
import { signUpWithCredentials } from '@/app/actions/auth'

const mockReplace = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/app/actions/auth', () => ({
  signInCredentials: vi.fn(),
  signUpWithCredentials: vi.fn(),
  signInWithOAuth: vi.fn(),
}))

describe('AuthForm Component (covers: Hardening Zod Password & Email UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email, password, and demo card', () => {
    render(<AuthForm lang="en" mode="login" callbackUrl="/en/tailor" providers={['github']} />)

    expect(screen.getByLabelText(/^Email/i)).toBeDefined()
    expect(screen.getByLabelText(/^Password/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /^Sign in/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Use the demo account/i })).toBeDefined()
    expect(screen.queryByLabelText(/^Full name/i)).toBeNull()
    expect(screen.queryByRole('region', { name: /Password strength/i })).toBeNull()
  })

  it('renders signup form with name, email, password strength meter and criteria checklist', () => {
    render(<AuthForm lang="en" mode="signup" callbackUrl="/en/tailor" providers={[]} />)

    expect(screen.getByLabelText(/^Full name/i)).toBeDefined()
    expect(screen.getByLabelText(/^Email/i)).toBeDefined()
    expect(screen.getByLabelText(/^Password$/i)).toBeDefined()
    expect(screen.getByText(/Password strength/i)).toBeDefined()
    expect(screen.getByText(/At least 8 characters/i)).toBeDefined()
    expect(screen.getByText(/Uppercase and lowercase letters/i)).toBeDefined()
    expect(screen.getByText(/At least one number/i)).toBeDefined()
    expect(screen.getByText(/At least one special character/i)).toBeDefined()
  })

  it('updates password strength indicator dynamically as user types', () => {
    render(<AuthForm lang="en" mode="signup" callbackUrl="/en/tailor" providers={[]} />)

    const passwordInput = screen.getByLabelText(/^Password$/i)

    // Type weak password
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    expect(screen.getByText(/^Weak$/i)).toBeDefined()

    // Type fair password (>=8 chars, lowercase, numbers)
    fireEvent.change(passwordInput, { target: { value: 'lowercase123' } })
    expect(screen.getByText(/^Fair$/i)).toBeDefined()

    // Type strong password (>=10 chars with lower, upper, number, special)
    fireEvent.change(passwordInput, { target: { value: 'V3ry$ecureP@ssword' } })
    expect(screen.getByText(/^Strong$/i)).toBeDefined()
  })

  it('provides real-time email validation feedback for disposable domains', () => {
    render(<AuthForm lang="en" mode="signup" callbackUrl="/en/tailor" providers={[]} />)

    const emailInput = screen.getByLabelText(/^Email/i)

    // Enter disposable email and blur
    fireEvent.change(emailInput, { target: { value: 'user@mailinator.com' } })
    fireEvent.blur(emailInput)

    expect(screen.getByText(/Disposable or temporary email/i)).toBeDefined()

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'valid.user@careercraft.ai' } })
    expect(screen.getByText(/Valid email address/i)).toBeDefined()
  })

  it('blocks signup submission client-side when password does not meet requirements', async () => {
    render(<AuthForm lang="en" mode="signup" callbackUrl="/en/tailor" providers={[]} />)

    const nameInput = screen.getByLabelText(/^Full name/i)
    const emailInput = screen.getByLabelText(/^Email/i)
    const passwordInput = screen.getByLabelText(/^Password$/i)
    const submitBtn = screen.getByRole('button', { name: /Create account/i })

    fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } })
    fireEvent.change(emailInput, { target: { value: 'alex@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'short' } })

    fireEvent.click(submitBtn)

    expect(signUpWithCredentials).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('renders localized Arabic labels and strength states when lang is ar', () => {
    render(<AuthForm lang="ar" mode="signup" callbackUrl="/ar/tailor" providers={[]} />)

    expect(screen.getByLabelText(/^الاسم الكامل/i)).toBeDefined()
    expect(screen.getByLabelText(/^البريد الإلكتروني/i)).toBeDefined()
    expect(screen.getByLabelText(/^كلمة المرور/i)).toBeDefined()
    expect(screen.getByText(/قوة كلمة المرور/i)).toBeDefined()
    expect(screen.getByText(/٨ أحرف على الأقل/i)).toBeDefined()
    expect(screen.getByText(/أحرف كبيرة وصغيرة/i)).toBeDefined()
    expect(screen.getByText(/رقم واحد على الأقل/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /إنشاء حساب/i })).toBeDefined()
  })
})
