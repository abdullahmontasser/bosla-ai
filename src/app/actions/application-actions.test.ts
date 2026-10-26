import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getApplications,
  updateApplicationStatusAndOrder,
  createApplication,
  updateApplicationDetails,
  deleteApplication,
} from './application-actions'
import { auth } from '@/auth'
import * as db from '@/lib/db/applications'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/applications', () => ({
  getApplications: vi.fn(),
  createApplication: vi.fn(),
  updateApplicationStatusAndOrder: vi.fn(),
  updateApplicationDetails: vi.fn(),
  deleteApplication: vi.fn(),
}))

describe('Application Server Actions (AC-3, AC-5, AC-7, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getApplications', () => {
    it('returns error when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)
      const res = await getApplications()
      expect(res.success).toBe(false)
      expect(res.error).toBe('Unauthorized')
    })

    it('returns applications for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)
      vi.mocked(db.getApplications).mockResolvedValueOnce([
        { id: 'app_1', status: 'SAVED', sortOrder: 1000 } as unknown as db.ApplicationWithRelations,
      ])

      const res = await getApplications()
      expect(res.success).toBe(true)
      expect(res.applications).toHaveLength(1)
      expect(db.getApplications).toHaveBeenCalledWith('usr_test')
    })
  })

  describe('createApplication', () => {
    it('returns error when unauthorized', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as never)
      const res = await createApplication({ title: 'Engineer', companyName: 'Acme' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('Unauthorized')
    })

    it('validates schema and calls db.createApplication', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)
      vi.mocked(db.createApplication).mockResolvedValueOnce({
        id: 'app_new',
        status: 'SAVED',
      } as unknown as db.ApplicationWithRelations)

      const res = await createApplication({
        title: 'Full Stack Dev',
        companyName: 'Acme Corp',
        jobUrl: 'https://example.com/job',
      })

      expect(res.success).toBe(true)
      expect(db.createApplication).toHaveBeenCalledWith(
        'usr_test',
        expect.objectContaining({
          title: 'Full Stack Dev',
          companyName: 'Acme Corp',
        }),
      )
    })

    it('rejects invalid URL', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)

      const res = await createApplication({
        title: 'Dev',
        companyName: 'Tech',
        jobUrl: 'not-a-url',
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain('Invalid URL format')
    })
  })

  describe('updateApplicationStatusAndOrder', () => {
    it('updates status and order for user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)
      vi.mocked(db.updateApplicationStatusAndOrder).mockResolvedValueOnce({
        id: 'app_1',
        status: 'APPLIED',
        sortOrder: 1500,
      } as unknown as db.ApplicationWithRelations)

      const res = await updateApplicationStatusAndOrder('app_1', 'APPLIED', 1500)
      expect(res.success).toBe(true)
      expect(db.updateApplicationStatusAndOrder).toHaveBeenCalledWith(
        'usr_test',
        'app_1',
        'APPLIED',
        1500,
      )
    })
  })

  describe('updateApplicationDetails', () => {
    it('updates details through db helper', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)
      vi.mocked(db.updateApplicationDetails).mockResolvedValueOnce({
        id: 'app_1',
        compensation: '$150k',
      } as unknown as db.ApplicationWithRelations)

      const res = await updateApplicationDetails({
        applicationId: 'app_1',
        compensation: '$150k',
        location: 'Remote',
      })

      expect(res.success).toBe(true)
      expect(db.updateApplicationDetails).toHaveBeenCalledWith(
        'usr_test',
        expect.objectContaining({
          applicationId: 'app_1',
          compensation: '$150k',
          location: 'Remote',
        }),
      )
    })
  })

  describe('deleteApplication', () => {
    it('deletes card scoped to user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test' },
      } as unknown as never)
      vi.mocked(db.deleteApplication).mockResolvedValueOnce(true)

      const res = await deleteApplication('app_target')
      expect(res.success).toBe(true)
      expect(db.deleteApplication).toHaveBeenCalledWith('usr_test', 'app_target')
    })
  })
})
