// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplatePreviewModal } from './TemplatePreviewModal'

describe('TemplatePreviewModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <TemplatePreviewModal
        isOpen={false}
        onClose={vi.fn()}
        selectedTemplate="harvard-classic"
        onSelectTemplate={vi.fn()}
        lang="en"
        onDownload={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders all 15 template titles in selector grid and selects template', () => {
    const onSelectTemplate = vi.fn()
    render(
      <TemplatePreviewModal
        isOpen={true}
        onClose={vi.fn()}
        selectedTemplate="harvard-classic"
        onSelectTemplate={onSelectTemplate}
        lang="en"
        onDownload={vi.fn()}
        candidateName="Test Candidate"
      />,
    )

    expect(screen.getByText('15 ATS-Proven & Recruiter-Preferred Templates')).toBeDefined()
    expect(screen.getAllByText('Harvard Academic Classic').length).toBeGreaterThan(0)
    expect(screen.getByText('Tech Minimalist (High-Density)')).toBeDefined()
    expect(screen.getByText('Modern Editorial')).toBeDefined()

    // Click on another template
    const techTemplate = screen.getByText('Tech Minimalist (High-Density)')
    fireEvent.click(techTemplate)
    expect(onSelectTemplate).toHaveBeenCalledWith('tech-minimalist')
  })

  it('filters templates by category', () => {
    render(
      <TemplatePreviewModal
        isOpen={true}
        onClose={vi.fn()}
        selectedTemplate="harvard-classic"
        onSelectTemplate={vi.fn()}
        lang="en"
        onDownload={vi.fn()}
      />,
    )

    const engFilter = screen.getByText('Engineering & Tech')
    fireEvent.click(engFilter)

    expect(screen.getByText('Tech Minimalist (High-Density)')).toBeDefined()
    expect(screen.getByText('Data Science & AI Specialist')).toBeDefined()
  })

  it('triggers download and closes when download button is clicked', () => {
    const onDownload = vi.fn()
    const onClose = vi.fn()

    render(
      <TemplatePreviewModal
        isOpen={true}
        onClose={onClose}
        selectedTemplate="harvard-classic"
        onSelectTemplate={vi.fn()}
        lang="en"
        onDownload={onDownload}
      />,
    )

    const downloadBtn = screen.getByText('Download Resume PDF')
    fireEvent.click(downloadBtn)

    expect(onDownload).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
