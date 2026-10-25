// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResumePage from './page'

const mockNotFound = vi.fn()
vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/resume',
}))

describe('ResumePage route (AC-1, AC-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders English resume ingestion page with upload dropzone', async () => {
    const jsx = await ResumePage({ params: Promise.resolve({ lang: 'en' }) })
    render(jsx)

    expect(screen.getAllByText('Resume Ingestion & Parsing').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Upload your resume')).toBeDefined()
    expect(screen.getByText(/PDF up to 10 pages/i)).toBeDefined()
  })

  it('renders Arabic resume ingestion page with localized titles', async () => {
    const jsx = await ResumePage({ params: Promise.resolve({ lang: 'ar' }) })
    render(jsx)

    expect(screen.getAllByText('استيراد وتحليل السيرة الذاتية').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('رفع السيرة الذاتية')).toBeDefined()
  })

  it('triggers notFound on unsupported language', async () => {
    await ResumePage({ params: Promise.resolve({ lang: 'es' }) })
    expect(mockNotFound).toHaveBeenCalled()
  })
})
