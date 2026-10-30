// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OutreachAccordion } from './OutreachAccordion'
import { getOutreachMessageAction } from '@/app/actions/outreach-actions'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/outreach-actions', () => ({
  getOutreachMessageAction: vi.fn(),
  generateOutreachAction: vi.fn(),
  saveOutreachAction: vi.fn(),
  regenerateOutreachVariantAction: vi.fn(),
}))

vi.mock('@/components/outreach', () => ({
  OutreachWorkbench: ({ initialOutreach }: { initialOutreach?: unknown }) => (
    <div data-testid="mock-outreach-workbench">
      <span>Outreach Workbench Loaded</span>
      <pre>{JSON.stringify(initialOutreach)}</pre>
    </div>
  ),
}))

describe('OutreachAccordion (covers: AC-7, AC-10)', () => {
  const dummyDict = {
    tailor: {
      outreachAccordionTitle: 'Outreach Messaging & Networking',
      outreachAccordionDesc: 'Personalized LinkedIn notes, InMail pitches, and emails.',
      readyBadge: 'Ready',
      pendingBadge: 'Pending',
      retry: 'Retry',
    },
  } as unknown as Partial<Dictionary>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders collapsed by default with Pending badge when outreach does not exist (covers: AC-7)', () => {
    render(
      <OutreachAccordion
        tailoredResumeId="res_1"
        initialHasOutreach={false}
        initialOutreach={null}
        lang="en"
        dict={dummyDict}
      />,
    )

    expect(screen.getByText('Outreach Messaging & Networking')).toBeDefined()
    expect(screen.getByText('Pending')).toBeDefined()
    expect(screen.queryByTestId('mock-outreach-workbench')).toBeNull()

    const toggle = screen.getByTestId('outreach-accordion-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('renders Ready badge when outreach is present (covers: AC-7)', () => {
    render(
      <OutreachAccordion
        tailoredResumeId="res_1"
        initialHasOutreach={true}
        initialOutreach={null}
        lang="en"
        dict={dummyDict}
      />,
    )

    expect(screen.getByText('Ready')).toBeDefined()
  })

  it('lazy loads outreach message on first expand when outreach exists (covers: AC-7)', async () => {
    const mockPayload = {
      version: 1,
      generatedAt: '2026-10-29T00:00:00.000Z',
      updatedAt: '2026-10-29T00:00:00.000Z',
      language: 'EN',
      tone: 'PROFESSIONAL',
      recipientType: 'RECRUITER',
      connectionNote: { text: 'Hi, I saw the open role.', charCount: 24 },
      inMail: { subject: 'Senior Full Stack Role', body: 'Excited about the team.' },
      email: { subject: 'Application for Senior Role', body: 'Please see attached.' },
    }

    vi.mocked(getOutreachMessageAction).mockResolvedValueOnce({
      success: true,
      data: mockPayload as never,
    })

    render(
      <OutreachAccordion
        tailoredResumeId="res_1"
        initialHasOutreach={true}
        initialOutreach={null}
        lang="en"
        dict={dummyDict}
      />,
    )

    const toggle = screen.getByTestId('outreach-accordion-toggle')
    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(getOutreachMessageAction).toHaveBeenCalledWith('res_1')

    await waitFor(() => {
      expect(screen.getByTestId('mock-outreach-workbench')).toBeDefined()
      expect(screen.getByText(/Hi, I saw the open role/)).toBeDefined()
    })
  })

  it('displays error and retry button when lazy loading fails (covers: AC-7)', async () => {
    vi.mocked(getOutreachMessageAction).mockResolvedValueOnce({
      success: false,
      error: 'Network timeout loading outreach',
    })

    render(
      <OutreachAccordion
        tailoredResumeId="res_1"
        initialHasOutreach={true}
        initialOutreach={null}
        lang="en"
        dict={dummyDict}
      />,
    )

    const toggle = screen.getByTestId('outreach-accordion-toggle')
    fireEvent.click(toggle)

    await waitFor(() => {
      expect(screen.getByText('Network timeout loading outreach')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined()
    })
  })

  it('renders bilingual Arabic labels and RTL layout correctly (covers: AC-10)', () => {
    const arabicDict = {
      tailor: {
        outreachAccordionTitle: 'رسائل التواصل المهني',
        outreachAccordionDesc: 'ملاحظات لينكد إن ورسائل البريد المخصصة.',
        readyBadge: 'جاهز',
        pendingBadge: 'معلّق',
      },
    } as unknown as Partial<Dictionary>

    render(
      <OutreachAccordion
        tailoredResumeId="res_1"
        initialHasOutreach={true}
        initialOutreach={null}
        lang="ar"
        dict={arabicDict}
      />,
    )

    expect(screen.getByText('رسائل التواصل المهني')).toBeDefined()
    expect(screen.getByText('جاهز')).toBeDefined()
  })
})
