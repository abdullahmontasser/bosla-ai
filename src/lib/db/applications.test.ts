import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createApplication,
  updateApplicationStage,
  getKanbanBoard,
  deleteApplication,
  type KanbanCardItem,
} from './applications'
import { prisma } from '@/lib/prisma'
import type { Application } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

describe('Applications Kanban Repository (covers: AC-7, AC-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects creating duplicate application for same job posting (covers: AC-7)', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      id: 'app_existing',
      userId: 'user_1',
      jobPostingId: 'job_1',
    } as unknown as Application)

    await expect(createApplication('user_1', { jobPostingId: 'job_1' })).rejects.toThrow(
      /An application card already exists for this job posting/,
    )
  })

  it('calculates sortOrder as highest + 1.0 in SAVED column (covers: AC-7)', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.application.findFirst).mockResolvedValueOnce({
      sortOrder: 2.5,
    } as unknown as Application)
    vi.mocked(prisma.application.create).mockResolvedValueOnce({
      id: 'app_new',
      userId: 'user_1',
      jobPostingId: 'job_2',
      status: 'SAVED',
      sortOrder: 3.5,
    } as unknown as Application)

    const result = await createApplication('user_1', { jobPostingId: 'job_2' })

    expect(prisma.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_1',
          jobPostingId: 'job_2',
          status: 'SAVED',
          sortOrder: 3.5,
        }),
      }),
    )
    expect(result.id).toBe('app_new')
  })

  it('sets appliedAt timestamp when transitioning to APPLIED stage (covers: AC-7)', async () => {
    vi.mocked(prisma.application.findFirst).mockResolvedValueOnce({
      id: 'app_1',
      userId: 'user_1',
      status: 'SAVED',
      appliedAt: null,
    } as unknown as Application)
    vi.mocked(prisma.application.update).mockResolvedValueOnce({
      id: 'app_1',
      status: 'APPLIED',
      appliedAt: new Date(),
    } as unknown as Application)

    await updateApplicationStage('user_1', 'app_1', {
      status: 'APPLIED',
    })

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app_1' },
        data: expect.objectContaining({
          status: 'APPLIED',
          appliedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('clears appliedAt timestamp when moving back to SAVED (covers: AC-7)', async () => {
    vi.mocked(prisma.application.findFirst).mockResolvedValueOnce({
      id: 'app_1',
      userId: 'user_1',
      status: 'APPLIED',
      appliedAt: new Date(),
    } as unknown as Application)
    vi.mocked(prisma.application.update).mockResolvedValueOnce({
      id: 'app_1',
      status: 'SAVED',
      appliedAt: null,
    } as unknown as Application)

    await updateApplicationStage('user_1', 'app_1', {
      status: 'SAVED',
    })

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app_1' },
        data: expect.objectContaining({
          status: 'SAVED',
          appliedAt: null,
        }),
      }),
    )
  })

  it('groups applications by kanban status column (covers: AC-7)', async () => {
    vi.mocked(prisma.application.findMany).mockResolvedValueOnce([
      {
        id: 'card_1',
        status: 'SAVED',
        sortOrder: 1.0,
      } as unknown as KanbanCardItem,
      {
        id: 'card_2',
        status: 'INTERVIEWING',
        sortOrder: 1.0,
      } as unknown as KanbanCardItem,
    ])

    const board = await getKanbanBoard('user_1')
    expect(board.SAVED).toHaveLength(1)
    expect(board.INTERVIEWING).toHaveLength(1)
    expect(board.APPLIED).toHaveLength(0)
    expect(board.OFFER).toHaveLength(0)
    expect(board.REJECTED).toHaveLength(0)
  })

  it('deletes application card scoped to userId (covers: AC-8)', async () => {
    vi.mocked(prisma.application.deleteMany).mockResolvedValueOnce({ count: 1 })

    const deleted = await deleteApplication('user_1', 'app_target')
    expect(prisma.application.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'app_target',
        userId: 'user_1',
      },
    })
    expect(deleted).toBe(true)
  })
})
