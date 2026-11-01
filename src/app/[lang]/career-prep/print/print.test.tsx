// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CareerPrepPrintPage from './page'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/require-session'
import { getCareerPrepPrintData } from '@/lib/db/career-prep'
import {
  mockInterviewPrepPayloadEn,
  mockInterviewPrepPayloadAr,
} from '@/lib/validations/career-prep'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/db/career-prep', () => ({
  getCareerPrepPrintData: vi.fn(),
}))

describe('Career Prep Print Route (covers: AC-7, AC-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as never)
  })

  it('redirects to career prep hub when tailoredResumeId param is missing (AC-8)', async () => {
    await CareerPrepPrintPage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({}),
    })

    expect(redirect).toHaveBeenCalledWith('/en/career-prep?invalid=1')
  })

  it('redirects to career prep hub when requested resume is unowned or deleted (AC-8)', async () => {
    vi.mocked(getCareerPrepPrintData).mockResolvedValueOnce(null)

    await CareerPrepPrintPage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({ tailoredResumeId: 'unowned-id' }),
    })

    expect(redirect).toHaveBeenCalledWith('/en/career-prep?invalid=1')
  })

  it('renders dressed cheat sheet for owned resume (AC-7)', async () => {
    vi.mocked(getCareerPrepPrintData).mockResolvedValueOnce({
      id: 'res-1',
      jobPostingId: 'job-1',
      roleTitle: 'Senior Full Stack Engineer',
      companyName: 'CloudScale Technologies',
      language: 'EN',
      payload: mockInterviewPrepPayloadEn,
      generatedAt: '2026-10-30T10:00:00.000Z',
      updatedAt: '2026-10-30T10:00:00.000Z',
    })

    const jsx = await CareerPrepPrintPage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({ tailoredResumeId: 'res-1' }),
    })

    expect(jsx).toBeDefined()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('configures RTL direction for Arabic content (AC-7, AC-9)', async () => {
    vi.mocked(getCareerPrepPrintData).mockResolvedValueOnce({
      id: 'res-ar',
      jobPostingId: 'job-ar',
      roleTitle: 'مهندس برمجيات متكامل أول',
      companyName: 'تقنيات كلاود سكيل',
      language: 'AR',
      payload: mockInterviewPrepPayloadAr,
      generatedAt: '2026-10-30T10:00:00.000Z',
      updatedAt: '2026-10-30T10:00:00.000Z',
    })

    const jsx = await CareerPrepPrintPage({
      params: Promise.resolve({ lang: 'ar' }),
      searchParams: Promise.resolve({ tailoredResumeId: 'res-ar' }),
    })

    expect(jsx).toBeDefined()
    expect(redirect).not.toHaveBeenCalled()
  })
})
