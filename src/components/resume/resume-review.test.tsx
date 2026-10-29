// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResumeUploadDropzone } from './ResumeUploadDropzone'
import { ResumeReviewWorkbench } from './ResumeReviewWorkbench'
import { ResumeIngestionContainer } from './ResumeIngestionContainer'
import {
  ParsedResumePayloadSchema,
  type ParsedResumePayload,
} from '@/lib/validations/parsed-resume'

const mockDict = {
  common: { brand: 'Bosla AI' },
  resume: {
    title: 'Resume Ingestion & Parsing',
    dropzoneTitle: 'Upload Your Resume',
    dropzoneHint: 'Drag & drop your PDF or DOCX file here',
    dropzoneConstraints: 'PDF up to 10 pages, DOCX up to 50k chars (max 10MB)',
    reviewTitle: 'Review & Ingest Candidate Profile',
    personalInfo: 'Personal Information',
    experiences: 'Work Experience',
    educations: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    commitButton: 'Commit to Master Profile',
    replace: 'Replace',
    append: 'Append',
    skip: 'Skip',
    retryAiButton: 'Retry AI Extraction',
    extractionFailedTitle: 'Text Extraction Failed',
    aiErrorTitle: 'AI Parsing Failed',
  },
}

const mockParsedEnglish: ParsedResumePayload = ParsedResumePayloadSchema.parse({
  language: 'EN',
  fullName: 'Tariq Al-Mansoor',
  email: 'tariq@example.com',
  phone: '+971 50 123 4567',
  location: 'Dubai, UAE',
  headline: 'Lead Cloud Infrastructure Architect',
  summary: '10+ years specializing in distributed systems and AWS architectures.',
  websiteUrl: 'https://tariq.cloud',
  linkedinUrl: 'https://linkedin.com/in/tariq',
  githubUrl: 'https://github.com/tariq',
  experiences: [
    {
      companyName: 'FinTech Emirates',
      jobTitle: 'Principal Cloud Architect',
      location: 'Dubai',
      startDate: '2021-03',
      endDate: '',
      isCurrent: true,
      bullets: ['Built zero-downtime PCI-DSS compliant payment pipelines.'],
    },
  ],
  educations: [
    {
      institution: 'American University of Sharjah',
      degree: 'BSc Computer Engineering',
      fieldOfStudy: 'Computer Engineering',
      startDate: '2010',
      endDate: '2014',
      grade: '3.85',
    },
  ],
  skills: ['AWS', 'Kubernetes', 'Terraform', 'TypeScript'],
  projects: [
    {
      name: 'OpenATS',
      description: 'Open source resume audit engine',
      role: 'Core Maintainer',
      technologies: ['Next.js', 'Go', 'PostgreSQL'],
      url: 'https://github.com/tariq/openats',
    },
  ],
})

const mockParsedArabic: ParsedResumePayload = ParsedResumePayloadSchema.parse({
  language: 'AR',
  fullName: 'عبدالله منتصر',
  email: 'abdullah@example.com',
  phone: '+20 100 123 4567',
  location: 'القاهرة، مصر',
  headline: 'مهندس برمجيات أول',
  summary: 'مطور برمجيات ذو خبرة في بناء الأنظمة السحابية والذكاء الاصطناعي.',
  experiences: [
    {
      companyName: 'شركة التقنية المتقدمة',
      jobTitle: 'مهندس برمجيات أول',
      location: 'القاهرة',
      startDate: '2022-01',
      endDate: '',
      isCurrent: true,
      bullets: ['تطوير بنية تحتية سريعة وموثوقة.'],
    },
  ],
  educations: [],
  skills: ['بايثون', 'رياكت', 'دوكر'],
  projects: [],
})

describe('Resume Upload Dropzone (AC-1, AC-2, AC-6)', () => {
  it('renders dropzone with format restrictions and constraints (AC-1)', () => {
    render(
      <ResumeUploadDropzone
        lang="en"
        dict={mockDict}
        onParsingSuccess={vi.fn()}
        onParseAction={vi.fn()}
      />,
    )

    expect(screen.getByText('Upload Your Resume')).toBeDefined()
    expect(screen.getByText(/PDF up to 10 pages/i)).toBeDefined()
    expect(screen.getByTestId('resume-file-input')).toBeDefined()
  })

  it('rejects unsupported file extension immediately on client side (AC-1)', () => {
    render(
      <ResumeUploadDropzone
        lang="en"
        dict={mockDict}
        onParsingSuccess={vi.fn()}
        onParseAction={vi.fn()}
      />,
    )

    const input = screen.getByTestId('resume-file-input')
    const invalidFile = new File(['mock content'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [invalidFile] } })

    expect(screen.getByTestId('extraction-error-banner')).toBeDefined()
    expect(screen.getByText(/Unsupported file format/i)).toBeDefined()
  })

  it('rejects file larger than 10MB immediately on client side (AC-1)', () => {
    render(
      <ResumeUploadDropzone
        lang="en"
        dict={mockDict}
        onParsingSuccess={vi.fn()}
        onParseAction={vi.fn()}
      />,
    )

    const input = screen.getByTestId('resume-file-input')
    const oversizedBuffer = new Uint8Array(10 * 1024 * 1024 + 50)
    const largeFile = new File([oversizedBuffer], 'huge-cv.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(input, { target: { files: [largeFile] } })

    expect(screen.getByTestId('extraction-error-banner')).toBeDefined()
    expect(screen.getByText(/exceeds the 10MB limit/i)).toBeDefined()
  })

  it('displays guidance and disables retry when text extraction fails (AC-2, AC-6)', async () => {
    const mockParseAction = vi.fn().mockResolvedValue({
      success: false,
      parsedResumeId: 'rec-err-1',
      errorCode: 'EXTRACTION_FAILED',
      error: 'The document may be a scanned image or empty.',
    })

    render(
      <ResumeUploadDropzone
        lang="en"
        dict={mockDict}
        onParsingSuccess={vi.fn()}
        onParseAction={mockParseAction}
      />,
    )

    const input = screen.getByTestId('resume-file-input')
    const file = new File(['%PDF-1.4 dummy'], 'scanned.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(input, { target: { files: [file] } })

    const submitBtn = screen.getByTestId('parse-submit-button')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('extraction-error-banner')).toBeDefined()
      expect(screen.getByText(/Text Extraction Failed/i)).toBeDefined()
      expect(screen.getByText(/The document may be a scanned image or empty/i)).toBeDefined()
    })
    // Verify retry button is NOT present for unselectable text failures
    expect(screen.queryByTestId('retry-ai-button')).toBeNull()
  })

  it('displays inline retry action when AI provider times out or fails (AC-6)', async () => {
    const mockParseAction = vi.fn().mockResolvedValue({
      success: false,
      parsedResumeId: 'rec-ai-timeout',
      errorCode: 'AI_PROVIDER_ERROR',
      error: 'AI extraction timed out after 60 seconds.',
    })
    const mockRetryAction = vi.fn().mockResolvedValue({
      success: true,
      data: mockParsedEnglish,
    })
    const onParsingSuccess = vi.fn()

    render(
      <ResumeUploadDropzone
        lang="en"
        dict={mockDict}
        onParsingSuccess={onParsingSuccess}
        onParseAction={mockParseAction}
        onRetryAction={mockRetryAction}
      />,
    )

    const input = screen.getByTestId('resume-file-input')
    const file = new File(['%PDF valid text'], 'resume.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(input, { target: { files: [file] } })

    fireEvent.click(screen.getByTestId('parse-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('extraction-error-banner')).toBeDefined()
      expect(screen.getByTestId('retry-ai-button')).toBeDefined()
    })

    // Click retry
    fireEvent.click(screen.getByTestId('retry-ai-button'))

    await waitFor(() => {
      expect(mockRetryAction).toHaveBeenCalledWith('rec-ai-timeout')
      expect(onParsingSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          parsedResumeId: 'rec-ai-timeout',
          parsedPayload: mockParsedEnglish,
        }),
      )
    })
  })
})

describe('Resume Review Workbench (AC-4, AC-5)', () => {
  it('renders workbench with DirectionProvider dir="ltr" for English document (AC-4)', () => {
    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-en-1"
        initialData={mockParsedEnglish}
        fileName="tariq-cv.pdf"
        fileFormat="PDF"
        onCommitAction={vi.fn()}
      />,
    )

    const workbench = screen.getByTestId('document-direction-workbench')
    expect(workbench.getAttribute('dir')).toBe('ltr')
    expect(screen.getByTestId('doc-language-badge').textContent).toContain('English (EN)')
    expect(screen.getByDisplayValue('Tariq Al-Mansoor')).toBeDefined()
    expect(screen.getByDisplayValue('FinTech Emirates')).toBeDefined()
  })

  it('renders workbench with DirectionProvider dir="rtl" for Arabic document (AC-4)', () => {
    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-ar-1"
        initialData={mockParsedArabic}
        fileName="arabic-cv.pdf"
        fileFormat="PDF"
        onCommitAction={vi.fn()}
      />,
    )

    const workbench = screen.getByTestId('document-direction-workbench')
    expect(workbench.getAttribute('dir')).toBe('rtl')
    expect(screen.getByTestId('doc-language-badge').textContent).toContain('العربية (AR)')
    expect(screen.getByDisplayValue('عبدالله منتصر')).toBeDefined()
    expect(screen.getByDisplayValue('شركة التقنية المتقدمة')).toBeDefined()
  })

  it('allows inline editing of fields and skill chips (AC-4)', () => {
    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-en-1"
        initialData={mockParsedEnglish}
        fileName="tariq-cv.pdf"
        fileFormat="PDF"
        onCommitAction={vi.fn()}
      />,
    )

    const nameInput = screen.getByTestId('input-fullName') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Tariq Al-Mansoor (Updated)' } })
    expect(nameInput.value).toBe('Tariq Al-Mansoor (Updated)')

    // Add a new skill chip
    const skillInput = screen.getByTestId('new-skill-input') as HTMLInputElement
    fireEvent.change(skillInput, { target: { value: 'PostgreSQL' } })
    fireEvent.click(screen.getByTestId('add-skill-button'))

    expect(screen.getByText('PostgreSQL')).toBeDefined()

    // Remove a skill chip
    const removeSkillBtn = screen.getByTestId('remove-skill-btn-0')
    fireEvent.click(removeSkillBtn)
    expect(screen.queryByText('AWS')).toBeNull()
  })

  it('submits commit action with chosen mergeConfig and updated payload (AC-4, AC-5)', async () => {
    const mockCommitAction = vi.fn().mockResolvedValue({
      success: true,
      profileId: 'committed-profile-99',
    })

    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-en-1"
        initialData={mockParsedEnglish}
        fileName="tariq-cv.pdf"
        fileFormat="PDF"
        onCommitAction={mockCommitAction}
      />,
    )

    // Trigger commit
    const commitBtn = screen.getByTestId('commit-profile-button')
    fireEvent.click(commitBtn)

    await waitFor(() => {
      expect(mockCommitAction).toHaveBeenCalledWith({
        parsedResumeId: 'rec-en-1',
        mergeConfig: {
          personalInfo: 'replace',
          experiences: 'replace',
          educations: 'replace',
          skills: 'append',
          projects: 'replace',
        },
        editedData: expect.objectContaining({
          fullName: 'Tariq Al-Mansoor',
          headline: 'Lead Cloud Infrastructure Architect',
        }),
      })
      expect(screen.getByTestId('commit-success-banner')).toBeDefined()
    })
  })

  it('allows toggling section merge strategies before commit (AC-4, AC-5)', async () => {
    const mockCommitAction = vi.fn().mockResolvedValue({
      success: true,
      profileId: 'committed-profile-custom-merge',
    })

    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-en-toggle"
        initialData={mockParsedEnglish}
        fileName="tariq-cv.pdf"
        fileFormat="PDF"
        onCommitAction={mockCommitAction}
      />,
    )

    // Toggle experiences to 'append' (find button with 'Append' inside experiences section or all 'Append' buttons)
    const appendButtons = screen.getAllByRole('button', { name: 'Append' })
    // The first Append button belongs to experiences
    fireEvent.click(appendButtons[0])

    // Toggle educations to 'skip'
    const skipButtons = screen.getAllByRole('button', { name: 'Skip' })
    // Skip buttons: [0] personalInfo, [1] experiences, [2] educations, [3] skills, [4] projects
    if (skipButtons.length >= 3) {
      fireEvent.click(skipButtons[2])
    }

    fireEvent.click(screen.getByTestId('commit-profile-button'))

    await waitFor(() => {
      expect(mockCommitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          parsedResumeId: 'rec-en-toggle',
          mergeConfig: expect.objectContaining({
            experiences: 'append',
            educations: 'skip',
          }),
        }),
      )
    })
  })

  it('allows adding and removing experience bullet points (AC-4)', () => {
    render(
      <ResumeReviewWorkbench
        lang="en"
        dict={mockDict}
        parsedResumeId="rec-en-bullets"
        initialData={mockParsedEnglish}
        fileName="tariq-cv.pdf"
        fileFormat="PDF"
        onCommitAction={vi.fn()}
      />,
    )

    // Add bullet button
    const addBulletBtn = screen.getByRole('button', { name: /Add Bullet/i })
    fireEvent.click(addBulletBtn)

    const bulletInputs = screen.getAllByPlaceholderText(/Achievement bullet point.../i)
    expect(bulletInputs.length).toBeGreaterThan(1)

    // Edit newly added bullet
    fireEvent.change(bulletInputs[bulletInputs.length - 1], {
      target: { value: 'Optimized Docker images for production.' },
    })
    expect((bulletInputs[bulletInputs.length - 1] as HTMLInputElement).value).toBe(
      'Optimized Docker images for production.',
    )
  })
})

describe('Resume Ingestion Container State Flow (AC-1, AC-4)', () => {
  it('switches from upload dropzone to review workbench upon successful parsing', async () => {
    render(
      <ResumeIngestionContainer
        lang="en"
        dict={mockDict}
        initialParsedResumeId="rec-ready-1"
        initialParsedPayload={mockParsedEnglish}
        initialFileName="uploaded-resume.pdf"
      />,
    )

    expect(screen.getByTestId('document-direction-workbench')).toBeDefined()
    expect(screen.getByDisplayValue('Tariq Al-Mansoor')).toBeDefined()
  })
})
