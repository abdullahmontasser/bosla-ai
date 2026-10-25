// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkillsGapCard } from './SkillsGapCard'
import type { Dictionary } from '@/lib/i18n/types'

describe('SkillsGapCard Component (covers: AC-1, AC-3)', () => {
  const sampleDict = {
    ats: {
      matchedSkills: 'Matched Skills',
      missingSkills: 'Missing Skills',
      dismissedSkills: 'Dismissed Skills',
      addToProfile: 'Add',
      dismiss: 'Dismiss',
      noMissingSkills: 'All key required skills are present!',
    },
  } as unknown as Dictionary

  it('renders matched and missing skills badges', () => {
    render(
      <SkillsGapCard
        matchedSkills={['React', 'TypeScript']}
        missingSkills={['Docker', 'AWS']}
        dismissedSkills={['Kubernetes']}
        dict={sampleDict}
        lang="en"
        onAddSkill={vi.fn()}
        onDismissSkill={vi.fn()}
      />,
    )

    expect(screen.getByText('React')).toBeDefined()
    expect(screen.getByText('TypeScript')).toBeDefined()
    expect(screen.getByText('Docker')).toBeDefined()
    expect(screen.getByText('AWS')).toBeDefined()
    expect(screen.getByText('Kubernetes')).toBeDefined()
  })

  it('triggers onAddSkill when clicking plus button on a missing skill badge', () => {
    const handleAdd = vi.fn()

    render(
      <SkillsGapCard
        matchedSkills={['React']}
        missingSkills={['GraphQL']}
        dict={sampleDict}
        lang="en"
        onAddSkill={handleAdd}
        onDismissSkill={vi.fn()}
      />,
    )

    const addButton = screen.getByRole('button', { name: /Add GraphQL/i })
    fireEvent.click(addButton)

    expect(handleAdd).toHaveBeenCalledWith('GraphQL')
  })

  it('triggers onDismissSkill when clicking dismiss button on a missing skill badge', () => {
    const handleDismiss = vi.fn()

    render(
      <SkillsGapCard
        matchedSkills={['React']}
        missingSkills={['Ruby']}
        dict={sampleDict}
        lang="en"
        onAddSkill={vi.fn()}
        onDismissSkill={handleDismiss}
      />,
    )

    const dismissButton = screen.getByRole('button', { name: /Dismiss Ruby/i })
    fireEvent.click(dismissButton)

    expect(handleDismiss).toHaveBeenCalledWith('Ruby')
  })

  it('displays celebratory message when there are no missing skills', () => {
    render(
      <SkillsGapCard
        matchedSkills={['React', 'TypeScript', 'Next.js']}
        missingSkills={[]}
        dict={sampleDict}
        lang="en"
        onAddSkill={vi.fn()}
        onDismissSkill={vi.fn()}
      />,
    )

    expect(screen.getByText(/All key required skills are present!/i)).toBeDefined()
  })

  it('disables add and dismiss buttons when isUpdating is true', () => {
    render(
      <SkillsGapCard
        matchedSkills={['React']}
        missingSkills={['Docker']}
        dict={sampleDict}
        lang="en"
        isUpdating={true}
        onAddSkill={vi.fn()}
        onDismissSkill={vi.fn()}
      />,
    )

    const addButton = screen.getByRole('button', { name: /Add Docker/i })
    const dismissButton = screen.getByRole('button', { name: /Dismiss Docker/i })

    expect(addButton.getAttribute('disabled')).toBeDefined()
    expect(dismissButton.getAttribute('disabled')).toBeDefined()
  })
})
