import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('prisma singleton client (covers: AC-2)', () => {
  const globalRef = globalThis as unknown as { prisma: unknown }

  beforeEach(() => {
    vi.resetModules()
    delete globalRef.prisma
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete globalRef.prisma
  })

  it('exports an instantiated prisma client instance (covers: AC-2)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { prisma } = await import('./prisma')

    expect(prisma).toBeDefined()
    expect(typeof prisma).toBe('object')
  })

  it('attaches client to globalThis in development environment (covers: AC-2)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { prisma } = await import('./prisma')

    expect(globalRef.prisma).toBe(prisma)
  })

  it('reuses existing instance on globalThis if already present (covers: AC-2)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const mockExistingInstance = { isMock: true } as unknown
    globalRef.prisma = mockExistingInstance

    const { prisma } = await import('./prisma')

    expect(prisma).toBe(mockExistingInstance)
    expect(globalRef.prisma).toBe(mockExistingInstance)
  })

  it('does not store instance on globalThis in production environment (covers: AC-2)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { prisma } = await import('./prisma')

    expect(prisma).toBeDefined()
    expect(globalRef.prisma).toBeUndefined()
  })
})
