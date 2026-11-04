// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  SectionHealthRecommendations,
  type SectionHealthRecommendationsProps,
} from './SectionHealthRecommendations'
import type { HealthSuggestionDTO } from '@/lib/health/queries'

function makeSuggestion(overrides: Partial<HealthSuggestionDTO> = {}): HealthSuggestionDTO {
  return {
    id: 'sug_1',
    category: 'IMPACT_METRICS',
    title: 'Quantify leadership impact',
    rationale: 'Adding measurable metrics improves interview callback rates.',
    targetKind: 'WORK_EXPERIENCE_BULLET',
    targetId: 'exp_1',
    targetIndex: 0,
    targetField: 'bullets',
    originalText: 'Led a team of developers to build the app.',
    proposedText:
      'Led a cross-functional team of 6 engineers to build and ship the app 2 weeks ahead of schedule.',
    status: 'PENDING',
    isAiGenerated: true,
    isAiStale: false,
    fingerprint: 'fp_1',
    decidedAt: null,
    ...overrides,
  }
}

describe('SectionHealthRecommendations', () => {
  const defaultProps: SectionHealthRecommendationsProps = {
    sectionTitle: 'Work Experience',
    suggestions: [makeSuggestion()],
    lang: 'en',
    defaultExpanded: false,
    onAccept: vi.fn().mockResolvedValue(undefined),
    onDismiss: vi.fn().mockResolvedValue(undefined),
    onRegenerate: vi.fn().mockResolvedValue(undefined),
    onFixAll: vi.fn().mockResolvedValue(undefined),
    onAddDetails: vi.fn(),
  }

  it('renders nothing when suggestions list is empty', () => {
    const { container } = render(
      <SectionHealthRecommendations {...defaultProps} suggestions={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders minimal small indicator pill by default and expands on click', () => {
    render(<SectionHealthRecommendations {...defaultProps} />)

    // Minimal pill should be visible initially
    const indicator = screen.getByTestId('section-health-recommendations-indicator')
    expect(indicator).toBeDefined()
    expect(screen.getByText(/1 AI Suggestion/i)).toBeDefined()

    // Click indicator pill to expand
    const button = screen.getByRole('button', { name: /View AI suggestions/i })
    fireEvent.click(button)

    // Full recommendations drawer now shown
    expect(screen.getByTestId('section-health-recommendations')).toBeDefined()
    expect(screen.getByText('Quantify leadership impact')).toBeDefined()
  })

  it('renders recommendation header, diff comparison, and action buttons when expanded', () => {
    render(<SectionHealthRecommendations {...defaultProps} defaultExpanded={true} />)

    expect(screen.getByText(/Work Experience/i)).toBeDefined()
    expect(screen.getByText('Quantify leadership impact')).toBeDefined()
    expect(
      screen.getByText('Adding measurable metrics improves interview callback rates.'),
    ).toBeDefined()
    expect(screen.getByText('Led a team of developers to build the app.')).toBeDefined()
    expect(
      screen.getByText(
        'Led a cross-functional team of 6 engineers to build and ship the app 2 weeks ahead of schedule.',
      ),
    ).toBeDefined()

    expect(screen.getByRole('button', { name: /^Apply$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Regenerate$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Discard$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Fix All/i })).toBeDefined()
  })

  it('for missing data items: shows "Add Details", dismiss, but NO "Regenerate with AI"', () => {
    const missingSuggestion = makeSuggestion({
      id: 'sug_contact_1',
      category: 'ATS_COMPLETENESS',
      title: 'Phone number missing',
      rationale: 'Add your phone number so recruiters can reach you quickly.',
      targetKind: 'PROFILE_CONTACT',
      targetField: 'phone',
      originalText: '',
      proposedText: null,
    })

    const onAddDetails = vi.fn()
    render(
      <SectionHealthRecommendations
        {...defaultProps}
        suggestions={[missingSuggestion]}
        defaultExpanded={true}
        onAddDetails={onAddDetails}
      />,
    )

    // Should render "Add Details" button
    const addBtn = screen.getByRole('button', { name: /^Add Details$/i })
    expect(addBtn).toBeDefined()
    fireEvent.click(addBtn)
    expect(onAddDetails).toHaveBeenCalledWith(missingSuggestion)

    // Should NOT render "Regenerate" or "Apply" button
    expect(screen.queryByRole('button', { name: /^Regenerate$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Apply$/i })).toBeNull()

    // Discard should be available
    expect(screen.getByRole('button', { name: /^Discard$/i })).toBeDefined()
  })

  it('calls onAccept and marks as accepted when Apply Fix is clicked on rewritable items', async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined)
    render(
      <SectionHealthRecommendations {...defaultProps} defaultExpanded={true} onAccept={onAccept} />,
    )

    const applyBtn = screen.getByRole('button', { name: /^Apply$/i })
    fireEvent.click(applyBtn)

    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ id: 'sug_1' }))
    })
  })

  it('calls onRegenerate when Regenerate with AI is clicked on rewritable items', async () => {
    const onRegenerate = vi.fn().mockResolvedValue(undefined)
    render(
      <SectionHealthRecommendations
        {...defaultProps}
        defaultExpanded={true}
        onRegenerate={onRegenerate}
      />,
    )

    const regenBtn = screen.getByRole('button', { name: /^Regenerate$/i })
    fireEvent.click(regenBtn)

    await waitFor(() => {
      expect(onRegenerate).toHaveBeenCalledWith(expect.objectContaining({ id: 'sug_1' }))
    })
  })

  it('calls onDismiss when Discard is clicked', async () => {
    const onDismiss = vi.fn().mockResolvedValue(undefined)
    render(
      <SectionHealthRecommendations
        {...defaultProps}
        defaultExpanded={true}
        onDismiss={onDismiss}
      />,
    )

    const discardBtn = screen.getByRole('button', { name: /^Discard$/i })
    fireEvent.click(discardBtn)

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ id: 'sug_1' }))
    })
  })

  it('calls onFixAll when Fix All in Section is clicked', async () => {
    const onFixAll = vi.fn().mockResolvedValue(undefined)
    render(
      <SectionHealthRecommendations {...defaultProps} defaultExpanded={true} onFixAll={onFixAll} />,
    )

    const fixAllBtn = screen.getByRole('button', { name: /Fix All/i })
    fireEvent.click(fixAllBtn)

    await waitFor(() => {
      expect(onFixAll).toHaveBeenCalledWith([expect.objectContaining({ id: 'sug_1' })])
    })
  })

  it('shows "Generate with AI" when experience item has no proposedText yet and calls onRegenerate on click', async () => {
    const ungeneratedExp = makeSuggestion({
      id: 'sug_exp_unrendered',
      targetKind: 'WORK_EXPERIENCE_BULLET',
      title: 'Bullet point lacks metrics',
      rationale: 'Adding measurable outcomes strengthens ATS ranking.',
      originalText: 'Responsible for leading daily standups and sprint planning.',
      proposedText: null,
    })

    const onRegenerate = vi.fn().mockResolvedValue(undefined)
    render(
      <SectionHealthRecommendations
        {...defaultProps}
        suggestions={[ungeneratedExp]}
        defaultExpanded={true}
        onRegenerate={onRegenerate}
      />,
    )

    const genBtn = screen.getByRole('button', { name: /^Generate with AI$/i })
    expect(genBtn).toBeDefined()
    fireEvent.click(genBtn)

    await waitFor(() => {
      expect(onRegenerate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sug_exp_unrendered' }),
      )
    })
  })

  it('renders Arabic labels and RTL when lang="ar"', () => {
    render(
      <SectionHealthRecommendations
        {...defaultProps}
        lang="ar"
        defaultExpanded={true}
        sectionTitle="الخبرات المهنية"
      />,
    )

    expect(screen.getByText(/الخبرات المهنية/)).toBeDefined()
    expect(screen.getByRole('button', { name: /^تطبيق$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^إعادة توليد$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^تجاهل$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /إصلاح الكل/i })).toBeDefined()
  })
})
