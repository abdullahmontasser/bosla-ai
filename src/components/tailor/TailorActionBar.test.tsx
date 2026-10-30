// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TailorActionBar } from './TailorActionBar'
import { createApplication } from '@/app/actions/application-actions'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/application-actions', () => ({
  createApplication: vi.fn(),
}))

describe('TailorActionBar (covers: AC-8, AC-9, AC-10)', () => {
  const dummyDict = {
    tracker: {
      addToTracker: 'Add to Tracker',
      viewInTracker: 'View in Tracker',
      saving: 'Adding...',
    },
    tailor: {
      practiceStarQuestions: 'Practice STAR Interview Questions',
      applicationSaved: 'Tailored resume ready for tracking and interview practice',
    },
  } as unknown as Partial<Dictionary>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add to Tracker button when application is not yet saved (covers: AC-8)', () => {
    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="Staff Engineer"
        companyName="Stripe"
        initialHasApplication={false}
        lang="en"
        dict={dummyDict}
      />,
    )

    expect(screen.getByText('Staff Engineer · Stripe')).toBeDefined()
    expect(screen.getByTestId('add-to-tracker-btn')).toBeDefined()
    expect(screen.queryByTestId('view-in-tracker-btn')).toBeNull()
  })

  it('saves application on click and updates state to View in Tracker (covers: AC-8)', async () => {
    vi.mocked(createApplication).mockResolvedValueOnce({
      success: true,
      application: { id: 'app_1' } as never,
    })

    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="Staff Engineer"
        companyName="Stripe"
        initialHasApplication={false}
        lang="en"
        dict={dummyDict}
      />,
    )

    const addBtn = screen.getByTestId('add-to-tracker-btn')
    fireEvent.click(addBtn)

    expect(createApplication).toHaveBeenCalledWith({
      title: 'Staff Engineer',
      companyName: 'Stripe',
      status: 'SAVED',
      tailoredResumeId: 'res_123',
    })

    await waitFor(() => {
      expect(screen.getByTestId('view-in-tracker-btn')).toBeDefined()
      expect(screen.getByText('View in Tracker')).toBeDefined()
    })
  })

  it('handles duplicate application gracefully without error (covers: AC-8)', async () => {
    vi.mocked(createApplication).mockResolvedValueOnce({
      success: false,
      error: 'Application already exists for this job posting',
    })

    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="Staff Engineer"
        companyName="Stripe"
        initialHasApplication={false}
        lang="en"
        dict={dummyDict}
      />,
    )

    const addBtn = screen.getByTestId('add-to-tracker-btn')
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByTestId('view-in-tracker-btn')).toBeDefined()
    })
  })

  it('renders View in Tracker directly when initialHasApplication is true (covers: AC-8)', () => {
    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="Staff Engineer"
        companyName="Stripe"
        initialHasApplication={true}
        lang="en"
        dict={dummyDict}
      />,
    )

    const viewBtn = screen.getByTestId('view-in-tracker-btn')
    expect(viewBtn).toBeDefined()
    expect(viewBtn.getAttribute('href')).toBe('/en/tracker')
  })

  it('renders Practice STAR Interview Questions button linking to career-prep with tailoredResumeId (covers: AC-9)', () => {
    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="Staff Engineer"
        companyName="Stripe"
        initialHasApplication={true}
        lang="en"
        dict={dummyDict}
      />,
    )

    const starBtn = screen.getByTestId('practice-star-btn')
    expect(starBtn).toBeDefined()
    expect(starBtn.getAttribute('href')).toBe('/en/career-prep?tailoredResumeId=res_123')
    expect(screen.getByText('Practice STAR Interview Questions')).toBeDefined()
  })

  it('renders Arabic strings correctly (covers: AC-10)', () => {
    const arabicDict = {
      tracker: {
        addToTracker: 'إضافة إلى لوحة المتابعة',
        viewInTracker: 'عرض في لوحة المتابعة',
        saving: 'جارٍ الإضافة...',
      },
      tailor: {
        practiceStarQuestions: 'التدرب على أسئلة STAR',
        applicationSaved: 'السيرة الذاتية المخصصة جاهزة للمتابعة والتحضير',
      },
    } as unknown as Partial<Dictionary>

    render(
      <TailorActionBar
        tailoredResumeId="res_123"
        jobTitle="مهندس برمجيات"
        companyName="أرامكو"
        initialHasApplication={true}
        lang="ar"
        dict={arabicDict}
      />,
    )

    expect(screen.getByText('عرض في لوحة المتابعة')).toBeDefined()
    expect(screen.getByText('التدرب على أسئلة STAR')).toBeDefined()
  })
})
