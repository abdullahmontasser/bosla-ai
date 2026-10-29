import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserLinkedAccounts, unlinkAccount } from './account-linking'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    account: {
      deleteMany: vi.fn(),
    },
  },
}))

describe('OAuth Account Linking & Management (covers: Hardening Item 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects linked providers and password presence', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      passwordHash: 'hashed_pass',
      accounts: [{ provider: 'github' }, { provider: 'google' }],
    } as never)

    const res = await getUserLinkedAccounts('usr_1')
    expect(res.hasPassword).toBe(true)
    expect(res.linkedProviders).toEqual(['github', 'google'])
  })

  it('prevents unlinking if user has no password and only one provider', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      passwordHash: null,
      accounts: [{ provider: 'github' }],
    } as never)

    const res = await unlinkAccount('usr_1', 'github')
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot disconnect your only sign in method')
    expect(prisma.account.deleteMany).not.toHaveBeenCalled()
  })

  it('allows unlinking when user has a password set', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      passwordHash: 'some_password_hash',
      accounts: [{ provider: 'github' }],
    } as never)

    const res = await unlinkAccount('usr_1', 'github')
    expect(res.success).toBe(true)
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'usr_1',
        provider: 'github',
      },
    })
  })
})
