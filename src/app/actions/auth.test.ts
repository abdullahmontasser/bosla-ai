import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInCredentials, signUpWithCredentials, signInWithOAuth, signOutAction } from './auth'
import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getEnabledOAuthProviders: vi.fn().mockReturnValue(['github']),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_123'),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ 'x-forwarded-for': '127.0.0.1' })),
}))

describe('signInCredentials Server Action (covers: AC-1, AC-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns failure when email or password is missing', async () => {
    const res1 = await signInCredentials('', 'password')
    expect(res1).toEqual({
      success: false,
      error: 'Missing email or password',
      code: 'invalid_input',
    })

    const res2 = await signInCredentials('demo@careercraft.ai', '')
    expect(res2).toEqual({
      success: false,
      error: 'Missing email or password',
      code: 'invalid_input',
    })
  })

  it('calls signIn with credentials and returns success: true on valid login', async () => {
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const res = await signInCredentials('demo@careercraft.ai', 'password123')
    expect(res).toEqual({ success: true })
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'demo@careercraft.ai',
      password: 'password123',
      redirect: false,
    })
  })

  it('handles AuthError CredentialsSignin and returns invalid credentials error', async () => {
    const mockErr = new AuthError('Invalid credentials')
    Object.defineProperty(mockErr, 'type', { value: 'CredentialsSignin' })
    vi.mocked(signIn).mockRejectedValueOnce(mockErr)

    const res = await signInCredentials('demo@careercraft.ai', 'wrongpassword')
    expect(res).toEqual({
      success: false,
      error: 'Invalid email or password',
      code: 'invalid_credentials',
    })
  })

  it('accepts FormData to avoid logging plaintext passwords in server actions', async () => {
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const formData = new FormData()
    formData.append('email', 'demo@careercraft.ai')
    formData.append('password', 'password123')

    const res = await signInCredentials(formData)
    expect(res).toEqual({ success: true })
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'demo@careercraft.ai',
      password: 'password123',
      redirect: false,
    })
  })

  it('handles generic unknown errors gracefully', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new Error('Connection failed'))

    const res = await signInCredentials('demo@careercraft.ai', 'password123')
    expect(res).toEqual({ success: false, error: 'Authentication failed', code: 'unknown' })
  })
})

describe('signUpWithCredentials Server Action (covers: AC-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects passwords shorter than 8 characters with weak_password code', async () => {
    const res = await signUpWithCredentials({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'short',
    })

    expect(res.success).toBe(false)
    expect(res.code).toBe('weak_password')
  })

  it('rejects passwords lacking complexity (uppercase or special characters)', async () => {
    const resNoUpper = await signUpWithCredentials({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'lowercase123!',
    })
    expect(resNoUpper.success).toBe(false)
    expect(resNoUpper.code).toBe('weak_password')

    const resNoSpecial = await signUpWithCredentials({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Uppercase1234',
    })
    expect(resNoSpecial.success).toBe(false)
    expect(resNoSpecial.code).toBe('weak_password')
  })

  it('rejects invalid email addresses with invalid_input code', async () => {
    const res = await signUpWithCredentials({
      name: 'John Doe',
      email: 'not-an-email',
      password: 'ValidSecure123!',
    })

    expect(res.success).toBe(false)
    expect(res.code).toBe('invalid_input')
  })

  it('rejects disposable email addresses with invalid_input code', async () => {
    const res = await signUpWithCredentials({
      name: 'John Doe',
      email: 'burner@tempmail.com',
      password: 'ValidSecure123!',
    })

    expect(res.success).toBe(false)
    expect(res.code).toBe('invalid_input')
    expect(res.error).toContain('Disposable')
  })

  it('rejects duplicate email with email_taken code', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'existing_usr',
    } as never)

    const res = await signUpWithCredentials({
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'ValidSecure123!',
    })

    expect(res.success).toBe(false)
    expect(res.code).toBe('email_taken')
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('hashes password with bcrypt and creates user, then signs in', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'new_usr',
      name: 'John Doe',
      email: 'john@example.com',
    } as never)
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const res = await signUpWithCredentials({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'ValidSecure123!',
    })

    expect(bcrypt.hash).toHaveBeenCalledWith('ValidSecure123!', 12)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password_123',
      },
    })
    expect(res.success).toBe(true)
  })

  it('supports FormData input to keep credentials out of action traces', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'new_usr_2',
      name: 'Jane Doe',
      email: 'jane@example.com',
    } as never)
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const formData = new FormData()
    formData.append('name', 'Jane Doe')
    formData.append('email', 'jane@example.com')
    formData.append('password', 'ValidSecure123!')

    const res = await signUpWithCredentials(formData)
    expect(res.success).toBe(true)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed_password_123',
      },
    })
  })
})

describe('signInWithOAuth and signOutAction (covers: AC-3, AC-4, AC-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects provider that is not configured', async () => {
    const res = await signInWithOAuth('linkedin', '/en/tailor')
    expect(res).toEqual({
      success: false,
      error: 'This sign in method is not configured',
      code: 'provider_disabled',
    })
  })

  it('calls signIn with sanitized callback URL for enabled provider', async () => {
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const res = await signInWithOAuth('github', 'https://evil.com/phish')
    expect(res).toEqual({ success: true })
    expect(signIn).toHaveBeenCalledWith('github', {
      redirectTo: '/en/tailor',
    })
  })

  it('signOutAction calls signOut with localized redirect', async () => {
    vi.mocked(signOut).mockResolvedValueOnce(undefined as never)

    await signOutAction('ar')
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/ar' })

    await signOutAction('en')
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/en' })
  })
})
