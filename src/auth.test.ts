import { describe, it, expect, vi, beforeAll } from 'vitest'
import bcrypt from 'bcryptjs'

interface MockNextAuthConfig {
  providers?: Array<{
    id?: string
    name?: string
    authorize?: (credentials: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  }>
  callbacks?: {
    jwt?: (params: {
      token: Record<string, unknown>
      user?: { id?: string }
    }) => Promise<Record<string, unknown>>
    session?: (params: {
      session: { user: { email?: string; id?: string }; expires: string }
      token: { sub?: string }
    }) => Promise<{ user: { email?: string; id?: string }; expires: string }>
  }
}

let capturedConfig: MockNextAuthConfig | null = null

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((options) => options),
}))

vi.mock('next-auth', () => ({
  default: vi.fn((config) => {
    capturedConfig = config
    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    }
  }),
}))

describe('Auth.js v5 credentials configuration (covers: AC-1)', () => {
  beforeAll(async () => {
    await import('./auth')
  })

  it('exports auth, handlers, signIn, and signOut', async () => {
    const authModule = await import('./auth')
    expect(authModule.auth).toBeDefined()
    expect(authModule.handlers).toBeDefined()
    expect(authModule.signIn).toBeDefined()
    expect(authModule.signOut).toBeDefined()
  })

  it('correctly maps user id in jwt callback', async () => {
    expect(capturedConfig).toBeDefined()
    const jwtCallback = capturedConfig?.callbacks?.jwt
    expect(jwtCallback).toBeDefined()
    if (!jwtCallback) throw new Error('jwtCallback undefined')

    const token = await jwtCallback({
      token: {},
      user: { id: 'usr_test_999' },
    })

    expect(token.sub).toBe('usr_test_999')
  })

  it('populates session.user.id from token.sub in session callback', async () => {
    expect(capturedConfig).toBeDefined()
    const sessionCallback = capturedConfig?.callbacks?.session
    expect(sessionCallback).toBeDefined()
    if (!sessionCallback) throw new Error('sessionCallback undefined')

    const session = await sessionCallback({
      session: { user: { email: 'user@example.com' }, expires: '2099-01-01' },
      token: { sub: 'usr_test_999' },
    })

    expect(session.user.id).toBe('usr_test_999')
  })

  describe('credentials authorize function', () => {
    const getAuthorize = () => {
      const provider = capturedConfig?.providers?.[0]
      if (!provider?.authorize) {
        throw new Error('Authorize function not found on provider')
      }
      return provider.authorize
    }

    it('returns null when credentials are empty or incomplete', async () => {
      const authorize = getAuthorize()
      expect(await authorize({})).toBeNull()
      expect(await authorize({ email: 'demo@careercraft.ai' })).toBeNull()
      expect(await authorize({ password: 'password123' })).toBeNull()
    })

    it('returns null when user is not found in database', async () => {
      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const authorize = getAuthorize()
      const result = await authorize({
        email: 'missing@careercraft.ai',
        password: 'password123',
      })
      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'missing@careercraft.ai' },
      })
    })

    it('returns null when user has no passwordHash', async () => {
      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u1',
        email: 'nopass@careercraft.ai',
        name: 'No Pass',
        image: null,
        passwordHash: null,
      } as never)

      const authorize = getAuthorize()
      const result = await authorize({
        email: 'nopass@careercraft.ai',
        password: 'password123',
      })
      expect(result).toBeNull()
    })

    it('returns null when password does not match hash', async () => {
      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u1',
        email: 'demo@careercraft.ai',
        name: 'Demo User',
        image: null,
        passwordHash: '$2a$10$realhash',
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)

      const authorize = getAuthorize()
      const result = await authorize({
        email: 'demo@careercraft.ai',
        password: 'wrongpassword',
      })
      expect(result).toBeNull()
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2a$10$realhash')
    })

    it('returns user object when credentials are valid', async () => {
      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u1',
        email: 'demo@careercraft.ai',
        name: 'Demo User',
        image: 'https://example.com/avatar.png',
        passwordHash: '$2a$10$realhash',
      } as never)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)

      const authorize = getAuthorize()
      const result = await authorize({
        email: 'DEMO@careercraft.ai ',
        password: 'password123',
      })
      expect(result).toEqual({
        id: 'u1',
        email: 'demo@careercraft.ai',
        name: 'Demo User',
        image: 'https://example.com/avatar.png',
      })
    })
  })
})
