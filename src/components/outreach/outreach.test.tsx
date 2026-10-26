// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConnectionNoteEditor } from './ConnectionNoteEditor'
import { OutreachCard } from './OutreachCard'
import { OutreachWorkbench } from './OutreachWorkbench'
import { mockOutreachPayloadEn } from '@/lib/validations/career-prep'
import * as outreachActions from '@/app/actions/outreach-actions'

vi.mock('@/app/actions/outreach-actions', () => ({
  generateOutreachAction: vi.fn(),
  saveOutreachAction: vi.fn(),
  regenerateOutreachVariantAction: vi.fn(),
}))

describe('Outreach Studio Components (covers: AC-1, AC-4, AC-CO-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  describe('ConnectionNoteEditor', () => {
    it('renders character count and warns when exceeding 300 characters', () => {
      const handleChange = vi.fn()
      const handleRegenerate = vi.fn().mockResolvedValue(undefined)

      const { rerender } = render(
        <ConnectionNoteEditor
          value="Short connection note"
          onChange={handleChange}
          onRegenerate={handleRegenerate}
          lang="en"
        />,
      )

      expect(screen.getByText('21')).toBeDefined()
      expect(screen.getByText('/ 300')).toBeDefined()

      // Exceed 300 characters
      const longNote = 'a'.repeat(305)
      rerender(
        <ConnectionNoteEditor
          value={longNote}
          onChange={handleChange}
          onRegenerate={handleRegenerate}
          lang="en"
        />,
      )

      expect(screen.getByText('305')).toBeDefined()
      expect(screen.getByText(/Exceeds LinkedIn limit by 5 characters/i)).toBeDefined()
    })

    it('invokes copy to clipboard when copy button is clicked', async () => {
      render(
        <ConnectionNoteEditor
          value="Test note content"
          onChange={vi.fn()}
          onRegenerate={vi.fn().mockResolvedValue(undefined)}
          lang="en"
        />,
      )

      const copyBtn = screen.getByRole('button', { name: /Copy Note/i })
      fireEvent.click(copyBtn)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test note content')
    })
  })

  describe('OutreachCard', () => {
    it('renders subject and body inputs and triggers update callbacks', () => {
      const handleSubjectChange = vi.fn()
      const handleBodyChange = vi.fn()

      render(
        <OutreachCard
          type="inMail"
          subject="Initial Subject"
          body="Initial Body"
          onSubjectChange={handleSubjectChange}
          onBodyChange={handleBodyChange}
          onRegenerate={vi.fn().mockResolvedValue(undefined)}
          lang="en"
        />,
      )

      expect(screen.getByText(/LinkedIn InMail Pitch/i)).toBeDefined()

      const subjectInput = screen.getByDisplayValue('Initial Subject')
      fireEvent.change(subjectInput, { target: { value: 'Updated Subject' } })
      expect(handleSubjectChange).toHaveBeenCalledWith('Updated Subject')

      const bodyInput = screen.getByDisplayValue('Initial Body')
      fireEvent.change(bodyInput, { target: { value: 'Updated Body' } })
      expect(handleBodyChange).toHaveBeenCalledWith('Updated Body')
    })
  })

  describe('OutreachWorkbench', () => {
    it('renders empty placeholder when initial outreach is null', () => {
      render(<OutreachWorkbench tailoredResumeId="res_1" initialOutreach={null} lang="en" />)

      expect(screen.getByText(/No outreach messages generated yet/i)).toBeDefined()
    })

    it('renders cards and triggers autosave after debounced text change', async () => {
      vi.mocked(outreachActions.saveOutreachAction).mockResolvedValue({
        success: true,
        data: mockOutreachPayloadEn,
      })

      render(
        <OutreachWorkbench
          tailoredResumeId="res_1"
          initialOutreach={mockOutreachPayloadEn}
          lang="en"
        />,
      )

      expect(screen.getByDisplayValue(mockOutreachPayloadEn.connectionNote.text)).toBeDefined()
      expect(screen.getByDisplayValue(mockOutreachPayloadEn.inMail.subject)).toBeDefined()

      const noteTextarea = screen.getByDisplayValue(mockOutreachPayloadEn.connectionNote.text)
      fireEvent.change(noteTextarea, { target: { value: 'New edited text for connection note.' } })

      // Wait for 1000ms debounce
      await waitFor(
        () => {
          expect(outreachActions.saveOutreachAction).toHaveBeenCalledWith(
            'res_1',
            expect.objectContaining({
              connectionNote: expect.objectContaining({
                text: 'New edited text for connection note.',
              }),
            }),
          )
        },
        { timeout: 2000 },
      )
    })
  })
})
