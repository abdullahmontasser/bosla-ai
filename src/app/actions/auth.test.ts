import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInCredentials } from './auth'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
}))

describe('signInCredentials Server Action (covers: AC-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns failure when email or password is missing', async () => {
    const res1 = await signInCredentials('', 'password')
    expect(res1).toEqual({ success: false, error: 'Missing email or password' })

    const res2 = await signInCredentials('demo@careercraft.ai', '')
    expect(res2).toEqual({ success: false, error: 'Missing email or password' })
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
    expect(res).toEqual({ success: false, error: 'Invalid email or password' })
  })

  it('handles generic unknown errors gracefully', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new Error('Connection failed'))

    const res = await signInCredentials('demo@careercraft.ai', 'password123')
    expect(res).toEqual({ success: false, error: 'Authentication failed' })
  })
})
