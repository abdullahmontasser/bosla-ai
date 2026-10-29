import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireSession } from './require-session'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/server', () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

describe('requireSession Page Guard (covers: AC-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated visitor to login with callback URL', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)

    await expect(requireSession('en', '/en/tailor')).rejects.toThrow(
      'NEXT_REDIRECT:/en/login?callbackUrl=%2Fen%2Ftailor',
    )
    expect(redirect).toHaveBeenCalledWith('/en/login?callbackUrl=%2Fen%2Ftailor')
  })

  it('redirects when session has user without an id', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: {} } as never)

    await expect(requireSession('ar', '/ar/tracker')).rejects.toThrow(
      'NEXT_REDIRECT:/ar/login?callbackUrl=%2Far%2Ftracker',
    )
    expect(redirect).toHaveBeenCalledWith('/ar/login?callbackUrl=%2Far%2Ftracker')
  })

  it('returns valid session when user is authenticated', async () => {
    const mockSession = { user: { id: 'usr_123', email: 'user@example.com' } }
    vi.mocked(auth).mockResolvedValueOnce(mockSession as never)

    const result = await requireSession('en', '/en/settings/providers')
    expect(result).toEqual(mockSession)
    expect(redirect).not.toHaveBeenCalled()
  })
})
