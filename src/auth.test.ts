import { describe, it, expect, vi, beforeAll } from 'vitest'

interface MockNextAuthConfig {
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
  prisma: {},
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
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

describe('Auth.js v5 configuration (covers: AC-8)', () => {
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
})
