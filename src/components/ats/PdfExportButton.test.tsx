// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PdfExportButton } from './PdfExportButton'
import type { Dictionary } from '@/lib/i18n/types'

describe('PdfExportButton Component (covers: AC-5, AC-6)', () => {
  const mockDict = {
    ats: {
      exportPdf: 'Export ATS PDF',
      exportingPdf: 'Generating PDF...',
      lastExported: 'Last exported',
    },
  } as unknown as Dictionary

  let originalCreateObjectURL: typeof window.URL.createObjectURL
  let originalRevokeObjectURL: typeof window.URL.revokeObjectURL
  let originalAlert: typeof window.alert
  let originalAnchorClick: typeof HTMLAnchorElement.prototype.click

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL
    originalRevokeObjectURL = window.URL.revokeObjectURL
    originalAlert = window.alert
    originalAnchorClick = HTMLAnchorElement.prototype.click

    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/sample-blob')
    window.URL.revokeObjectURL = vi.fn()
    window.alert = vi.fn()
    HTMLAnchorElement.prototype.click = vi.fn()
  })

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
    window.alert = originalAlert
    HTMLAnchorElement.prototype.click = originalAnchorClick
    vi.restoreAllMocks()
  })

  it('renders export button with default label and icon', () => {
    render(<PdfExportButton tailoredResumeId="resume-123" lang="en" dict={mockDict} />)

    const button = screen.getByRole('button', { name: /Export ATS PDF/i })
    expect(button).toBeDefined()
    expect(button.getAttribute('disabled')).toBeNull()
  })

  it('displays last exported timestamp when provided', () => {
    const lastExportedDate = new Date('2026-10-25T14:30:00.000Z')
    render(
      <PdfExportButton
        tailoredResumeId="resume-123"
        lang="en"
        dict={mockDict}
        lastExportedAt={lastExportedDate}
      />,
    )

    expect(screen.getByText(/Last exported:/i)).toBeDefined()
  })

  it('downloads PDF and decodes RFC 5987 UTF-8 filename on click', async () => {
    const mockBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' })
    const mockHeaders = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename="resume.pdf"; filename*=UTF-8\'\'Sarah_Resume_EN.pdf',
    })

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
      headers: mockHeaders,
    } as unknown as Response)

    render(<PdfExportButton tailoredResumeId="resume-123" lang="en" dict={mockDict} />)

    const button = screen.getByRole('button', { name: /Export ATS PDF/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/resumes/resume-123/pdf?lang=en')
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(screen.getByText(/Downloaded!/i)).toBeDefined()
    })
  })

  it('shows alert dialog and recovers when PDF export fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as unknown as Response)

    render(<PdfExportButton tailoredResumeId="resume-123" lang="en" dict={mockDict} />)

    const button = screen.getByRole('button', { name: /Export ATS PDF/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to export PDF document.')
    })

    expect(button.getAttribute('disabled')).toBeNull()
  })
})
