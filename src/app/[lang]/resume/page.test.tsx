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

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'usr_test' } }),
}))

vi.mock('@/components/workspace', () => ({
  WorkspaceHeader: () => <header data-testid="workspace-header" />,
}))

vi.mock('@/components/health/ResumeHealthPanel', () => ({
  ResumeHealthPanel: ({ auditLang }: { auditLang: 'en' | 'ar' }) => (
    <section data-testid="health-panel" data-audit-lang={auditLang} />
  ),
}))

describe('ResumePage route (AC-1, AC-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders English resume health and ingestion pages with upload dropzone', async () => {
    const jsx = await ResumePage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({}),
    })
    render(jsx)

    expect(screen.getAllByText('Resume Health & Ingestion').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('health-panel').getAttribute('data-audit-lang')).toBe('en')
    expect(screen.getByText('Upload your resume')).toBeDefined()
    expect(screen.getByText(/PDF up to 10 pages/i)).toBeDefined()
    expect(document.getElementById('resume-ingestion')).not.toBeNull()
  })

  it('renders Arabic resume health and ingestion pages with localized titles', async () => {
    const jsx = await ResumePage({
      params: Promise.resolve({ lang: 'ar' }),
      searchParams: Promise.resolve({}),
    })
    render(jsx)

    expect(screen.getAllByText('صحة السيرة الذاتية والاستيراد').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('health-panel').getAttribute('data-audit-lang')).toBe('ar')
    expect(screen.getByText('رفع السيرة الذاتية')).toBeDefined()
  })

  it('passes a validated auditLang override to the health panel (AC-1)', async () => {
    const jsx = await ResumePage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({ auditLang: 'ar' }),
    })
    render(jsx)

    expect(screen.getByTestId('health-panel').getAttribute('data-audit-lang')).toBe('ar')
  })

  it('falls back to the page locale for an invalid auditLang value', async () => {
    const jsx = await ResumePage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({ auditLang: 'fr' }),
    })
    render(jsx)

    expect(screen.getByTestId('health-panel').getAttribute('data-audit-lang')).toBe('en')
  })

  it('triggers notFound on unsupported language', async () => {
    await ResumePage({
      params: Promise.resolve({ lang: 'es' }),
      searchParams: Promise.resolve({}),
    })
    expect(mockNotFound).toHaveBeenCalled()
  })
})
