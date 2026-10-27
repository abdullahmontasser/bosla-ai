// @vitest-environment jsdom
import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ApplicationWithRelations } from '@/lib/db/applications'
import type { Dictionary } from '@/lib/i18n/types'
import { KanbanCard } from './KanbanCard'
import { KanbanToolbar } from './KanbanToolbar'
import { QuickAddApplicationModal } from './QuickAddApplicationModal'
import { ApplicationDetailsDrawer } from './ApplicationDetailsDrawer'
import { KanbanContainer } from './KanbanContainer'

vi.mock('@/app/actions/application-actions', () => ({
  updateApplicationStatusAndOrder: vi.fn(),
  createApplication: vi.fn(),
  updateApplicationDetails: vi.fn(),
  deleteApplication: vi.fn(),
}))

const mockDict: Dictionary = {
  common: {
    brand: 'Bosla AI',
    tagline: 'Autonomous career agent',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    loading: 'Loading...',
    search: 'Search...',
  },
  designSystem: {} as unknown as Dictionary['designSystem'],
  providerSettings: {} as unknown as Dictionary['providerSettings'],
  tracker: {
    title: 'Job Application Tracker',
    subtitle: 'Track and organize your applications',
    saved: 'Saved',
    applied: 'Applied',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
    emptySaved: 'No saved applications yet.',
    emptyApplied: 'No active applications submitted yet.',
    emptyInterviewing: 'No interviews scheduled.',
    emptyOffer: 'No offers received yet.',
    emptyRejected: 'No rejected applications.',
    searchPlaceholder: 'Search by company or role...',
    minAtsScore: 'Min ATS Score',
    allScores: 'All ATS',
    filterFollowUp: 'Needs Follow-up',
    filterFollowUpActive: 'Follow-up Filter Active',
    dragDisabledNotice: 'Drag and drop reordering is paused while filters or search are active.',
    addApplication: 'Add Application',
    modalTitle: 'Quick Add Application',
    modalDescription: 'Track a new job posting on your kanban board.',
    jobTitle: 'Job Title',
    jobTitlePlaceholder: 'e.g. Senior Frontend Engineer',
    companyName: 'Company Name',
    companyNamePlaceholder: 'e.g. Acme Tech',
    jobUrl: 'Job URL (Optional)',
    jobUrlPlaceholder: 'https://...',
    initialStatus: 'Initial Stage',
    saving: 'Adding...',
    followUpBadge: 'Follow up',
    daysAgo: 'days ago',
    today: 'Today',
    copyOutreach: 'Copy Note',
    copied: 'Copied!',
    noOutreach: 'No outreach note',
    atsNotCalculated: 'No ATS score',
    viewDetails: 'View Details',
    changeStatus: 'Move stage',
    deleteCard: 'Delete Application',
    deleteConfirm: 'Are you sure?',
    drawerTitle: 'Application Details',
    drawerSubtitle: 'Inspect and update tracking metadata',
    jobDetailsSection: 'Job Information',
    trackingSection: 'Application Tracking',
    compensationLabel: 'Compensation',
    compensationPlaceholder: 'e.g. $120k - $140k',
    locationLabel: 'Location',
    locationPlaceholder: 'e.g. Remote, Cairo',
    interviewDateLabel: 'Interview Date & Time',
    recruiterSection: 'Contact & Recruiter',
    contactNameLabel: 'Contact Name',
    contactEmailLabel: 'Contact Email',
    notesLabel: 'Personal Notes',
    notesPlaceholder: 'Notes...',
    attachedResume: 'Attached Tailored Resume',
    noResumeAttached: 'No tailored resume attached.',
    tailorResumeNow: 'Tailor Resume in Studio',
    saveChanges: 'Save Changes',
    savedChanges: 'Saved!',
    visitJobPosting: 'Visit Posting',
    rawJobDescription: 'Job Description',
    appliedAtLabel: 'Applied on',
    addToTracker: 'Add to Tracker',
    addedToTracker: 'Added to Tracker',
    inTrackerNotice: 'Tracked on board.',
    viewInTracker: 'View in Tracker',
  },
}

const mockCard: ApplicationWithRelations = {
  id: 'app_1',
  userId: 'usr_1',
  jobPostingId: 'job_1',
  tailoredResumeId: 'res_1',
  status: 'APPLIED',
  sortOrder: 1000.0,
  appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  interviewDate: null,
  compensation: '$130k',
  location: 'Remote',
  contactName: 'Alice Recruiter',
  contactEmail: 'alice@example.com',
  notes: 'Referred by Bob',
  createdAt: new Date(),
  updatedAt: new Date(),
  jobPosting: {
    id: 'job_1',
    title: 'Senior Frontend Engineer',
    companyName: 'Acme Corp',
    jobUrl: 'https://acme.com/jobs/1',
    rawDescription:
      'Looking for a Senior Frontend Engineer with Next.js and TypeScript experience.',
    parsedSkills: ['React', 'TypeScript', 'Next.js'],
  },
  tailoredResume: {
    id: 'res_1',
    atsScore: 92,
    atsBreakdown: {},
    outreachMessage: {
      connectionNoteText: 'Hi Alice, excited about the Frontend Engineer role at Acme Corp!',
    },
  },
}

describe('Kanban Tracker UI Components (AC-1, AC-2, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  describe('KanbanCard (AC-6, AC-8)', () => {
    it('renders role title, company name, and ATS score badge (AC-6)', () => {
      const onSelect = vi.fn()
      const onStatusChange = vi.fn()

      render(
        <KanbanCard
          card={mockCard}
          lang="en"
          dict={mockDict}
          onSelect={onSelect}
          onStatusChange={onStatusChange}
        />,
      )

      expect(screen.getByText('Senior Frontend Engineer')).toBeDefined()
      expect(screen.getByText('Acme Corp')).toBeDefined()
      expect(screen.getByText('92% ATS')).toBeDefined()
    })

    it('displays follow-up badge when past staleness threshold (AC-8)', () => {
      render(
        <KanbanCard
          card={mockCard}
          lang="en"
          dict={mockDict}
          onSelect={vi.fn()}
          onStatusChange={vi.fn()}
        />,
      )

      expect(screen.getByTestId('follow-up-badge')).toBeDefined()
      expect(screen.getByText(/Follow up/i)).toBeDefined()
    })

    it('copies outreach connection note on one-click copy button (AC-6)', async () => {
      render(
        <KanbanCard
          card={mockCard}
          lang="en"
          dict={mockDict}
          onSelect={vi.fn()}
          onStatusChange={vi.fn()}
        />,
      )

      const copyBtn = screen.getByTestId('copy-outreach-app_1')
      fireEvent.click(copyBtn)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Hi Alice, excited about the Frontend Engineer role at Acme Corp!',
      )
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeDefined()
      })
    })

    it('invokes onSelect when card is clicked (AC-7)', () => {
      const onSelect = vi.fn()
      render(
        <KanbanCard
          card={mockCard}
          lang="en"
          dict={mockDict}
          onSelect={onSelect}
          onStatusChange={vi.fn()}
        />,
      )

      fireEvent.click(screen.getByTestId('kanban-card-app_1'))
      expect(onSelect).toHaveBeenCalledWith(mockCard)
    })
  })

  describe('KanbanToolbar (AC-8, AC-9, AC-10)', () => {
    it('handles search input and ATS score filter selection (AC-9)', () => {
      const onSearchChange = vi.fn()
      const onMinAtsScoreChange = vi.fn()
      const onFollowUpToggle = vi.fn()
      const onAdd = vi.fn()

      render(
        <KanbanToolbar
          searchQuery=""
          onSearchChange={onSearchChange}
          minAtsScore={0}
          onMinAtsScoreChange={onMinAtsScoreChange}
          followUpOnly={false}
          onFollowUpOnlyToggle={onFollowUpToggle}
          onAddApplication={onAdd}
          lang="en"
          dict={mockDict}
        />,
      )

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'Acme' } })
      expect(onSearchChange).toHaveBeenCalledWith('Acme')

      const scoreBtn = screen.getByText('85%+')
      fireEvent.click(scoreBtn)
      expect(onMinAtsScoreChange).toHaveBeenCalledWith(85)

      const followUpBtn = screen.getByTestId('follow-up-filter-btn')
      fireEvent.click(followUpBtn)
      expect(onFollowUpToggle).toHaveBeenCalled()

      const addBtn = screen.getByTestId('add-application-btn')
      fireEvent.click(addBtn)
      expect(onAdd).toHaveBeenCalled()
    })

    it('shows drag disabled banner when search or filter is active (AC-9)', () => {
      const { rerender } = render(
        <KanbanToolbar
          searchQuery=""
          onSearchChange={vi.fn()}
          minAtsScore={0}
          onMinAtsScoreChange={vi.fn()}
          followUpOnly={false}
          onFollowUpOnlyToggle={vi.fn()}
          onAddApplication={vi.fn()}
          lang="en"
          dict={mockDict}
        />,
      )

      expect(screen.queryByTestId('drag-disabled-banner')).toBeNull()

      rerender(
        <KanbanToolbar
          searchQuery="Acme"
          onSearchChange={vi.fn()}
          minAtsScore={0}
          onMinAtsScoreChange={vi.fn()}
          followUpOnly={false}
          onFollowUpOnlyToggle={vi.fn()}
          onAddApplication={vi.fn()}
          lang="en"
          dict={mockDict}
        />,
      )

      expect(screen.getByTestId('drag-disabled-banner')).toBeDefined()
    })
  })

  describe('QuickAddApplicationModal (AC-10)', () => {
    it('submits new application payload when valid (AC-10)', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const onClose = vi.fn()

      render(
        <QuickAddApplicationModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          lang="en"
          dict={mockDict}
        />,
      )

      const titleInput = screen.getByTestId('quick-add-title-input')
      const companyInput = screen.getByTestId('quick-add-company-input')
      const submitBtn = screen.getByTestId('quick-add-submit-btn')

      fireEvent.change(titleInput, { target: { value: 'Staff AI Engineer' } })
      fireEvent.change(companyInput, { target: { value: 'OpenAI Partner' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'Staff AI Engineer',
          companyName: 'OpenAI Partner',
          jobUrl: undefined,
          status: 'SAVED',
        })
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('ApplicationDetailsDrawer (AC-7)', () => {
    it('renders all editable metadata fields and saves changes (AC-7)', async () => {
      const onUpdate = vi.fn().mockResolvedValue(undefined)
      const onClose = vi.fn()

      render(
        <ApplicationDetailsDrawer
          card={mockCard}
          isOpen={true}
          onClose={onClose}
          onUpdateDetails={onUpdate}
          onStatusChange={vi.fn()}
          onDelete={vi.fn()}
          lang="en"
          dict={mockDict}
        />,
      )

      expect(screen.getByTestId('drawer-compensation-input')).toBeDefined()
      expect(screen.getByTestId('drawer-location-input')).toBeDefined()
      expect(screen.getByTestId('drawer-contact-name-input')).toBeDefined()
      expect(screen.getByTestId('drawer-contact-email-input')).toBeDefined()
      expect(screen.getByTestId('drawer-notes-input')).toBeDefined()

      const compInput = screen.getByTestId('drawer-compensation-input')
      fireEvent.change(compInput, { target: { value: '$160k' } })

      const saveBtn = screen.getByTestId('drawer-save-btn')
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            applicationId: 'app_1',
            compensation: '$160k',
          }),
        )
      })
    })

    it('confirms and executes application deletion (AC-7)', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined)

      render(
        <ApplicationDetailsDrawer
          card={mockCard}
          isOpen={true}
          onClose={vi.fn()}
          onUpdateDetails={vi.fn()}
          onStatusChange={vi.fn()}
          onDelete={onDelete}
          lang="en"
          dict={mockDict}
        />,
      )

      const deleteBtn = screen.getByTestId('drawer-delete-btn')
      fireEvent.click(deleteBtn)

      const confirmBtn = screen.getByTestId('drawer-confirm-delete-btn')
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('app_1')
      })
    })
  })

  describe('KanbanContainer (AC-1, AC-4)', () => {
    it('renders 5 columns across hiring stages in Arabic RTL and English LTR (AC-1)', () => {
      const { rerender } = render(
        <KanbanContainer initialApplications={[mockCard]} lang="en" dict={mockDict} />,
      )

      expect(screen.getByTestId('kanban-column-SAVED')).toBeDefined()
      expect(screen.getByTestId('kanban-column-APPLIED')).toBeDefined()
      expect(screen.getByTestId('kanban-column-INTERVIEWING')).toBeDefined()
      expect(screen.getByTestId('kanban-column-OFFER')).toBeDefined()
      expect(screen.getByTestId('kanban-column-REJECTED')).toBeDefined()

      // Renders card inside APPLIED column
      expect(screen.getByTestId('column-count-APPLIED').textContent).toBe('1')
      expect(screen.getByTestId('column-count-SAVED').textContent).toBe('0')

      // Arabic rendering
      const mockArabicDict: Dictionary = {
        ...mockDict,
        tracker: {
          ...mockDict.tracker!,
          applied: 'تم التقديم',
          saved: 'المحفوظات',
        },
      }
      rerender(<KanbanContainer initialApplications={[mockCard]} lang="ar" dict={mockArabicDict} />)
      expect(screen.getByText('تم التقديم')).toBeDefined()
      expect(screen.getByText('المحفوظات')).toBeDefined()
    })
  })
})
