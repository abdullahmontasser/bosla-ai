// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TailorCalibrationModal } from './TailorCalibrationModal'

describe('TailorCalibrationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TailorCalibrationModal isOpen={false} status="GENERATING" onInspect={vi.fn()} lang="en" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders 4 milestones and live indicator when open and generating', () => {
    render(
      <TailorCalibrationModal isOpen={true} status="GENERATING" onInspect={vi.fn()} lang="en" />,
    )

    expect(screen.getByText('Competency & Keyword Extraction')).toBeDefined()
    expect(screen.getByText('Experience & Metric Cross-Referencing')).toBeDefined()
    expect(screen.getByText('Google XYZ Metric Structuring')).toBeDefined()
    expect(screen.getByText('ATS Semantic Resonance & Scoring')).toBeDefined()
    expect(screen.getByText('Calibrating Profile for ATS Dominance')).toBeDefined()
  })

  it('renders inspect CTA immediately when status is COMPLETED without artificial delay', () => {
    const onInspect = vi.fn()
    const { rerender } = render(
      <TailorCalibrationModal isOpen={true} status="GENERATING" onInspect={onInspect} lang="en" />,
    )

    expect(screen.queryByText('Inspect Living Resume')).toBeNull()

    // Status transitions to COMPLETED immediately
    rerender(
      <TailorCalibrationModal isOpen={true} status="COMPLETED" onInspect={onInspect} lang="en" />,
    )

    // Inspect CTA should now be immediately available without waiting 10 seconds
    const ctaButton = screen.getByText('Inspect Living Resume')
    expect(ctaButton).toBeDefined()

    fireEvent.click(ctaButton)
    expect(onInspect).toHaveBeenCalledTimes(1)
  })

  it('supports Arabic RTL rendering with translated milestones', () => {
    render(
      <TailorCalibrationModal isOpen={true} status="GENERATING" onInspect={vi.fn()} lang="ar" />,
    )

    expect(screen.getByText('استخراج المهارات والكلمات المفتاحية')).toBeDefined()
    expect(screen.getByText('صياغة إنجازات Google XYZ المقاسة')).toBeDefined()
    expect(screen.getByText('جاري معايرة السيرة الذاتية لهيمنة ATS')).toBeDefined()
  })

  it('shows error state when status is FAILED', () => {
    render(
      <TailorCalibrationModal
        isOpen={true}
        status="FAILED"
        errorMessage="Custom API key quota exhausted"
        onInspect={vi.fn()}
        lang="en"
      />,
    )

    expect(screen.getByText('Calibration Interrupted')).toBeDefined()
    expect(screen.getByText('Custom API key quota exhausted')).toBeDefined()
  })
})
