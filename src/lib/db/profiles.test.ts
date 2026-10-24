import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createProfileWithDetails,
  getProfilesByUser,
  getProfileById,
  deleteProfile,
} from './profiles'
import { prisma } from '@/lib/prisma'
import type { Profile } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    profile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Profiles Repository (covers: AC-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unsets previous default profiles in same language when creating new default (covers: AC-3)', async () => {
    const mockTx = {
      profile: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({
          id: 'profile_new',
          userId: 'user_1',
          language: 'EN',
          fullName: 'Tarek Mansour',
          isDefault: true,
          workExperiences: [],
          educations: [],
          skills: [],
          projects: [],
        }),
      },
    }

    vi.mocked(prisma.$transaction).mockImplementation((async (
      callback: (tx: unknown) => Promise<unknown>,
    ) => {
      return callback(mockTx)
    }) as never)

    const result = (await createProfileWithDetails('user_1', {
      language: 'EN',
      fullName: 'Tarek Mansour',
      isDefault: true,
      workExperiences: [],
      educations: [],
      skills: [],
      projects: [],
    })) as unknown as { id: string }

    expect(mockTx.profile.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user_1',
        language: 'EN',
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })
    expect(result.id).toBe('profile_new')
  })

  it('retrieves user profiles with language filter (covers: AC-3)', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValueOnce([
      {
        id: 'profile_ar',
        userId: 'user_1',
        language: 'AR',
        fullName: 'طارق منصور',
        isDefault: true,
      } as unknown as Profile,
    ])

    const profiles = await getProfilesByUser('user_1', 'AR')
    expect(prisma.profile.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user_1',
        language: 'AR',
      },
      include: expect.any(Object),
      orderBy: expect.any(Array),
    })
    expect(profiles).toHaveLength(1)
    expect(profiles[0].language).toBe('AR')
  })

  it('scopes getProfileById strictly to userId (covers: AC-3)', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValueOnce(null)

    const profile = await getProfileById('user_1', 'profile_foreign')
    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'profile_foreign',
        userId: 'user_1',
      },
      include: expect.any(Object),
    })
    expect(profile).toBeNull()
  })

  it('scopes deleteProfile to userId preventing cross-user deletions (covers: AC-3, AC-8)', async () => {
    vi.mocked(prisma.profile.deleteMany).mockResolvedValueOnce({ count: 1 })

    const deleted = await deleteProfile('user_1', 'profile_target')
    expect(prisma.profile.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'profile_target',
        userId: 'user_1',
      },
    })
    expect(deleted).toBe(true)
  })
})
