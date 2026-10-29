// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileOverviewCard } from './ProfileOverviewCard'
import { LanguageProfileSwitch } from './LanguageProfileSwitch'
import { IdentityCard } from './IdentityCard'
import { ExperienceCard } from './ExperienceCard'
import { EducationCard } from './EducationCard'
import { SkillsCard } from './SkillsCard'
import { ProjectsCard } from './ProjectsCard'
import { AvatarCropModal } from './AvatarCropModal'

describe('Candidate Profile Components', () => {
  const mockUser = {
    id: 'usr_123',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    image: null,
  }

  const mockProfileEn = {
    id: 'prof_en_1',
    fullName: 'Sarah Connor',
    headline: 'Senior Platform Architect',
    summary: 'Building resilient distributed platforms.',
    email: 'sarah@example.com',
    phone: '+1 555-0199',
    location: 'San Francisco, CA',
    websiteUrl: 'https://sarahconnor.dev',
    linkedinUrl: 'https://linkedin.com/in/sarahconnor',
    githubUrl: 'https://github.com/sarahconnor',
    language: 'EN',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ProfileOverviewCard (covers: AC-2, AC-3)', () => {
    it('renders monogram fallback with uppercase initials when no photo is set', () => {
      render(
        <ProfileOverviewCard
          user={mockUser}
          profile={mockProfileEn}
          lang="en"
          onAvatarUpdate={vi.fn()}
        />,
      )

      expect(screen.getByText('SC')).toBeDefined()
      expect(screen.getByText('Sarah Connor')).toBeDefined()
      expect(screen.getByText('Senior Platform Architect')).toBeDefined()
      expect(screen.getByText('San Francisco, CA')).toBeDefined()
      expect(screen.getByText('sarah@example.com')).toBeDefined()
    })

    it('renders avatar image when user.image is set', () => {
      const userWithAvatar = {
        ...mockUser,
        image: 'data:image/webp;base64,validAvatarWebp',
      }

      render(
        <ProfileOverviewCard
          user={userWithAvatar}
          profile={mockProfileEn}
          lang="en"
          onAvatarUpdate={vi.fn()}
        />,
      )

      const img = screen.getByRole('img', { name: 'Sarah Connor' })
      expect(img).toBeDefined()
      expect(img.getAttribute('src')).toBe('data:image/webp;base64,validAvatarWebp')
    })

    it('opens avatar crop modal when edit button is clicked', async () => {
      render(
        <ProfileOverviewCard
          user={mockUser}
          profile={mockProfileEn}
          lang="en"
          onAvatarUpdate={vi.fn()}
        />,
      )

      const editBtn = screen.getByRole('button', { name: /Edit profile photo/i })
      fireEvent.click(editBtn)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined()
      })
    })
  })

  describe('LanguageProfileSwitch (covers: AC-6)', () => {
    it('renders English and Arabic language options', () => {
      render(<LanguageProfileSwitch currentProfileLang="EN" onSelectLanguage={vi.fn()} lang="en" />)

      expect(screen.getByText('English')).toBeDefined()
      expect(screen.getByText('العربية')).toBeDefined()
    })

    it('triggers onSelectLanguage when language pill is selected', () => {
      const onSelectLanguage = vi.fn()

      render(
        <LanguageProfileSwitch
          currentProfileLang="EN"
          onSelectLanguage={onSelectLanguage}
          lang="en"
        />,
      )

      const arButton = screen.getByText('العربية')
      fireEvent.click(arButton)

      expect(onSelectLanguage).toHaveBeenCalledWith('AR')
    })
  })

  describe('IdentityCard (covers: AC-4)', () => {
    it('renders profile fields with default values', () => {
      render(
        <IdentityCard
          profileId={mockProfileEn.id}
          fullName={mockProfileEn.fullName}
          headline={mockProfileEn.headline}
          summary={mockProfileEn.summary}
          email={mockProfileEn.email}
          phone={mockProfileEn.phone}
          location={mockProfileEn.location}
          websiteUrl={mockProfileEn.websiteUrl}
          linkedinUrl={mockProfileEn.linkedinUrl}
          githubUrl={mockProfileEn.githubUrl}
          lang="en"
          onSaveSuccess={vi.fn()}
        />,
      )

      expect(screen.getByDisplayValue('Sarah Connor')).toBeDefined()
      expect(screen.getByDisplayValue('Senior Platform Architect')).toBeDefined()
      expect(screen.getByDisplayValue('Building resilient distributed platforms.')).toBeDefined()
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeDefined()
    })

    it('submits updated values and invokes onSaveSuccess', async () => {
      const onSaveSuccess = vi.fn()
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          profile: {
            ...mockProfileEn,
            headline: 'Principal Infrastructure Architect',
          },
        }),
      })

      render(
        <IdentityCard
          profileId={mockProfileEn.id}
          fullName={mockProfileEn.fullName}
          headline={mockProfileEn.headline}
          summary={mockProfileEn.summary}
          email={mockProfileEn.email}
          phone={mockProfileEn.phone}
          location={mockProfileEn.location}
          websiteUrl={mockProfileEn.websiteUrl}
          linkedinUrl={mockProfileEn.linkedinUrl}
          githubUrl={mockProfileEn.githubUrl}
          lang="en"
          onSaveSuccess={onSaveSuccess}
        />,
      )

      const headlineInput = screen.getByDisplayValue('Senior Platform Architect')
      fireEvent.change(headlineInput, { target: { value: 'Principal Infrastructure Architect' } })

      const saveBtn = screen.getByRole('button', { name: /Save Identity/i })
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profile/identity',
          expect.objectContaining({
            method: 'PUT',
          }),
        )
        expect(onSaveSuccess).toHaveBeenCalled()
      })

      global.fetch = originalFetch
    })
  })

  describe('ExperienceCard (covers: AC-5)', () => {
    const experiences = [
      {
        id: 'exp_1',
        companyName: 'Cyberdyne Systems',
        jobTitle: 'Core Engineer',
        location: 'Los Angeles, CA',
        startDate: '2022-01-01',
        endDate: null,
        isCurrent: true,
        bullets: ['Maintained resilience architectures'],
        sortOrder: 0,
      },
      {
        id: 'exp_2',
        companyName: 'TechCorp',
        jobTitle: 'Junior Developer',
        location: 'Remote',
        startDate: '2020-01-01',
        endDate: '2021-12-31',
        isCurrent: false,
        bullets: ['Built APIs'],
        sortOrder: 1,
      },
    ]

    it('renders empty state when no experiences exist', () => {
      render(
        <ExperienceCard
          profileId="prof_en_1"
          experiences={[]}
          lang="en"
          onExperiencesChange={vi.fn()}
        />,
      )

      expect(screen.getByText(/No work experiences added yet/i)).toBeDefined()
    })

    it('renders work experience items', () => {
      render(
        <ExperienceCard
          profileId="prof_en_1"
          experiences={experiences}
          lang="en"
          onExperiencesChange={vi.fn()}
        />,
      )

      expect(screen.getByText('Core Engineer')).toBeDefined()
      expect(screen.getByText(/Cyberdyne Systems/i)).toBeDefined()
      expect(screen.getByText('Junior Developer')).toBeDefined()
      expect(screen.getByText(/Maintained resilience architectures/i)).toBeDefined()
    })

    it('calls onExperiencesChange when move down arrow is clicked', async () => {
      const onExperiencesChange = vi.fn()
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <ExperienceCard
          profileId="prof_en_1"
          experiences={experiences}
          lang="en"
          onExperiencesChange={onExperiencesChange}
        />,
      )

      const moveDownButtons = screen.getAllByRole('button', { name: 'Move down' })
      fireEvent.click(moveDownButtons[0]!)

      expect(onExperiencesChange).toHaveBeenCalledWith([experiences[1], experiences[0]])
      global.fetch = originalFetch
    })

    it('calls onExperiencesChange when delete is confirmed', async () => {
      const onExperiencesChange = vi.fn()
      const originalConfirm = window.confirm
      window.confirm = vi.fn().mockReturnValue(true)

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <ExperienceCard
          profileId="prof_en_1"
          experiences={experiences}
          lang="en"
          onExperiencesChange={onExperiencesChange}
        />,
      )

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete experience' })
      fireEvent.click(deleteButtons[0]!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/profile/experiences/exp_1', {
          method: 'DELETE',
        })
        expect(onExperiencesChange).toHaveBeenCalledWith([experiences[1]])
      })

      window.confirm = originalConfirm
      global.fetch = originalFetch
    })
  })

  describe('EducationCard (covers: AC-5)', () => {
    const educations = [
      {
        id: 'edu_1',
        institution: 'MIT',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-30',
        grade: '3.9 GPA',
        sortOrder: 0,
      },
    ]

    it('renders education item and field details', () => {
      render(
        <EducationCard
          profileId="prof_en_1"
          educations={educations}
          lang="en"
          onEducationsChange={vi.fn()}
        />,
      )

      expect(screen.getByText('Bachelor of Science')).toBeDefined()
      expect(screen.getByText(/MIT/i)).toBeDefined()
      expect(screen.getByText(/Computer Science/i)).toBeDefined()
    })
  })

  describe('SkillsCard (covers: AC-5)', () => {
    const skills = [
      {
        id: 'sk_1',
        name: 'TypeScript',
        category: 'technical',
        proficiency: 'expert',
        sortOrder: 0,
      },
      {
        id: 'sk_2',
        name: 'PostgreSQL',
        category: 'technical',
        proficiency: 'advanced',
        sortOrder: 1,
      },
    ]

    it('renders skills with proficiency badges and calls delete on click', async () => {
      const onSkillsChange = vi.fn()
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <SkillsCard
          profileId="prof_en_1"
          skills={skills}
          lang="en"
          onSkillsChange={onSkillsChange}
        />,
      )

      expect(screen.getByText('TypeScript')).toBeDefined()
      expect(screen.getByText('PostgreSQL')).toBeDefined()

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete skill' })
      fireEvent.click(deleteButtons[0]!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/profile/skills/sk_1', {
          method: 'DELETE',
        })
        expect(onSkillsChange).toHaveBeenCalledWith([skills[1]])
      })

      global.fetch = originalFetch
    })
  })

  describe('ProjectsCard (covers: AC-5)', () => {
    const projects = [
      {
        id: 'proj_1',
        name: 'CareerCraft ATS',
        description: 'Bilingual ATS Resume Builder with Real-time Scoring',
        role: 'Lead Architect',
        technologies: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
        url: 'https://careercraft.example.com',
        sortOrder: 0,
      },
    ]

    it('renders project name, technologies, and link', () => {
      render(
        <ProjectsCard
          profileId="prof_en_1"
          projects={projects}
          lang="en"
          onProjectsChange={vi.fn()}
        />,
      )

      expect(screen.getByText('CareerCraft ATS')).toBeDefined()
      expect(screen.getByText(/Bilingual ATS Resume Builder/i)).toBeDefined()
      expect(screen.getByText('Next.js')).toBeDefined()
      expect(screen.getByText('PostgreSQL')).toBeDefined()
    })
  })

  describe('AvatarCropModal (covers: AC-2, AC-3)', () => {
    it('renders dialog with accessible controls and photo removal option', async () => {
      const onAvatarSaved = vi.fn()
      const onClose = vi.fn()

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, image: null }),
      })

      render(
        <AvatarCropModal
          isOpen={true}
          onClose={onClose}
          currentImage="data:image/webp;base64,existing"
          userInitials="SC"
          lang="en"
          onAvatarSaved={onAvatarSaved}
        />,
      )

      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByText(/Remove current photo/i)).toBeDefined()

      const removeBtn = screen.getByRole('button', { name: /Remove current photo/i })
      fireEvent.click(removeBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profile/avatar',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ image: null }),
          }),
        )
        expect(onAvatarSaved).toHaveBeenCalledWith(null)
        expect(onClose).toHaveBeenCalled()
      })

      global.fetch = originalFetch
    })
  })
})
