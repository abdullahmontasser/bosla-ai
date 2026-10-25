// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AtsWorkbench } from './AtsWorkbench'
import * as atsActions from '@/app/actions/ats-engine'
import type { Dictionary } from '@/lib/i18n/types'

vi.mock('@/app/actions/ats-engine', () => ({
  calculateAtsScoreAction: vi.fn(),
  addMissingSkillAction: vi.fn(),
  dismissMissingSkillAction: vi.fn(),
  rewriteBulletWithXyzAction: vi.fn(),
}))

describe('AtsWorkbench Component (covers: AC-3, AC-4, AC-5)', () => {
  const mockBreakdown = {
    overallScore: 82,
    categorySubscores: {
      keywordMatch: 80,
      experienceRelevance: 85,
      formattingCompliance: 90,
    },
    matchedSkills: ['React', 'TypeScript', 'PostgreSQL'],
    missingSkills: ['Docker', 'AWS'],
    dismissedSkills: ['Java'],
    actionableFeedback: ['Incorporate Docker in your deployment experience'],
    isStale: false,
    evaluatedAt: '2026-10-25T12:00:00Z',
  }

  const mockExperiences = [
    {
      companyName: 'Acme Corp',
      jobTitle: 'Software Engineer',
      bullets: [
        {
          original: 'Built React web components and handled state.',
          rewritten: 'Built React web components and handled state.',
        },
      ],
    },
  ]

  const mockDict = {
    ats: {
      title: 'ATS Optimization Workbench',
      overallMatch: 'ATS Match Score',
      keywordMatch: 'Keyword Match (50%)',
      matchedSkills: 'Matched Skills',
      missingSkills: 'Missing Skills',
      exportPdf: 'Export ATS PDF',
      optimizeBulletXyz: 'Google XYZ',
      deepScanWithAi: 'AI Deep Scan',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders overall score, subscores, matched and missing skills (covers: AC-3)', () => {
    render(
      <AtsWorkbench
        tailoredResumeId="res_bench_1"
        initialAtsScore={82}
        initialBreakdown={mockBreakdown}
        initialExperiences={mockExperiences}
        lang="en"
        dict={mockDict as unknown as Partial<Dictionary>}
      />,
    )

    expect(screen.getByText('ATS Match Score')).toBeDefined()
    expect(screen.getByText('82')).toBeDefined()
    expect(screen.getByText('Keyword Match (50%)')).toBeDefined()
    expect(screen.getByText('React')).toBeDefined()
    expect(screen.getByText('Docker')).toBeDefined()
    expect(screen.getByText('Export ATS PDF')).toBeDefined()
  })

  it('adds missing skill to profile when add button is clicked (covers: AC-3, AC-4)', async () => {
    vi.mocked(atsActions.addMissingSkillAction).mockResolvedValueOnce({
      success: true,
      updatedSkills: ['React', 'TypeScript', 'PostgreSQL', 'Docker'],
      atsScore: 88,
      breakdown: {
        ...mockBreakdown,
        overallScore: 88,
        matchedSkills: [...mockBreakdown.matchedSkills, 'Docker'],
        missingSkills: ['AWS'],
      },
    })

    render(
      <AtsWorkbench
        tailoredResumeId="res_bench_1"
        initialAtsScore={82}
        initialBreakdown={mockBreakdown}
        initialExperiences={mockExperiences}
        lang="en"
        dict={mockDict as unknown as Partial<Dictionary>}
      />,
    )

    const addButton = screen.getByLabelText('Add Docker')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(atsActions.addMissingSkillAction).toHaveBeenCalledWith('res_bench_1', 'Docker')
    })
  })

  it('dismisses missing skill when dismiss button is clicked (covers: AC-3, AC-4)', async () => {
    vi.mocked(atsActions.dismissMissingSkillAction).mockResolvedValueOnce({
      success: true,
      dismissedSkills: ['Java', 'AWS'],
      atsScore: 84,
      breakdown: {
        ...mockBreakdown,
        overallScore: 84,
        missingSkills: ['Docker'],
        dismissedSkills: ['Java', 'AWS'],
      },
    })

    render(
      <AtsWorkbench
        tailoredResumeId="res_bench_1"
        initialAtsScore={82}
        initialBreakdown={mockBreakdown}
        initialExperiences={mockExperiences}
        lang="en"
        dict={mockDict as unknown as Partial<Dictionary>}
      />,
    )

    const dismissButton = screen.getByLabelText('Dismiss AWS')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(atsActions.dismissMissingSkillAction).toHaveBeenCalledWith('res_bench_1', 'AWS')
    })
  })

  it('triggers Google XYZ single bullet rewrite action (covers: AC-2, AC-3)', async () => {
    vi.mocked(atsActions.rewriteBulletWithXyzAction).mockResolvedValueOnce({
      success: true,
      rewrittenBullet: 'Engineered high-performance React web components, reducing state overhead.',
      expIndex: 0,
      bulletIndex: 0,
    })

    render(
      <AtsWorkbench
        tailoredResumeId="res_bench_1"
        initialAtsScore={82}
        initialBreakdown={mockBreakdown}
        initialExperiences={mockExperiences}
        lang="en"
        dict={mockDict as unknown as Partial<Dictionary>}
      />,
    )

    const rewriteButton = screen.getByText('Google XYZ')
    fireEvent.click(rewriteButton)

    await waitFor(() => {
      expect(atsActions.rewriteBulletWithXyzAction).toHaveBeenCalledWith('res_bench_1', 0, 0)
    })
  })
})
