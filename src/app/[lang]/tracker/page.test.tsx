// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import TrackerPage from './page'
import { TrackerContent } from '@/components/tracker'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import * as applicationActions from '@/app/actions/application-actions'

vi.mock('@/app/actions/application-actions', () => ({
  getApplications: vi.fn(),
  updateApplicationStatusAndOrder: vi.fn(),
  createApplication: vi.fn(),
  updateApplicationDetails: vi.fn(),
  deleteApplication: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/tracker',
}))

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'usr_test' } }),
}))

vi.mock('@/components/workspace', () => ({
  WorkspaceHeader: () => <header data-testid="workspace-header" />,
}))

describe('TrackerPage and TrackerContent (covers: AC-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tracker page layout and heading (AC-1)', async () => {
    vi.mocked(applicationActions.getApplications).mockResolvedValueOnce({
      success: true,
      applications: [],
    })

    const jsx = await TrackerPage({
      params: Promise.resolve({ lang: 'en' }),
    })

    render(jsx)

    expect(screen.getAllByText('Job Application Tracker').length).toBeGreaterThan(0)
  })

  it('renders sign in prompt when user is unauthorized (AC-1)', async () => {
    vi.mocked(applicationActions.getApplications).mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized',
      applications: [],
    })

    const dict = await getDictionary('en')

    render(<TrackerContent lang="en" dict={dict} />)

    await waitFor(() => {
      expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0)
      expect(screen.getByPlaceholderText('demo@careercraft.ai')).toBeDefined()
    })
  })

  it('renders tracker board when user is authenticated (AC-1)', async () => {
    const mockApp = {
      id: 'app_1',
      userId: 'usr_abc',
      jobPostingId: 'job_1',
      tailoredResumeId: null,
      status: 'SAVED',
      sortOrder: 1000,
      appliedAt: null,
      interviewDate: null,
      compensation: null,
      location: null,
      contactName: null,
      contactEmail: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobPosting: {
        id: 'job_1',
        title: 'Full Stack Engineer',
        companyName: 'Acme Labs',
        jobUrl: null,
        rawDescription: 'Job description text',
        parsedSkills: [],
      },
      tailoredResume: null,
    }

    const dict = await getDictionary('en')

    render(
      <TrackerContent
        lang="en"
        dict={dict}
        initialApplications={[mockApp as unknown as ApplicationWithRelations]}
      />,
    )

    expect(screen.getByText('Full Stack Engineer')).toBeDefined()
    expect(screen.getByText('Acme Labs')).toBeDefined()
  })
})
