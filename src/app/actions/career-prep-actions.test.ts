import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCareerPrepSelectorRowsAction } from './career-prep-actions'
import { auth } from '@/auth'
import { getCareerPrepSelectorRows } from '@/lib/db/career-prep'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/career-prep', () => ({
  getCareerPrepSelectorRows: vi.fn(),
}))

describe('Career Prep Server Actions (covers: AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated request with Unauthorized error', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)

    const res = await getCareerPrepSelectorRowsAction(0)
    expect(res.success).toBe(false)
    expect(res.error).toBe('Unauthorized')
  })

  it('returns selector rows for authenticated user (AC-10)', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user-1' },
    } as never)

    const mockResult = {
      rows: [
        {
          jobPostingId: 'job-1',
          tailoredResumeId: 'resume-1',
          companyName: 'CloudScale',
          roleTitle: 'Senior Engineer',
          hasInterviewPrep: true,
          createdAt: '2026-10-30T10:00:00.000Z',
        },
      ],
      hasMore: false,
      nextOffset: 1,
    }

    vi.mocked(getCareerPrepSelectorRows).mockResolvedValueOnce(mockResult)

    const res = await getCareerPrepSelectorRowsAction(0)
    expect(res.success).toBe(true)
    expect(res.data).toEqual(mockResult)
    expect(getCareerPrepSelectorRows).toHaveBeenCalledWith('user-1', {
      offset: 0,
      limit: 50,
    })
  })
})
