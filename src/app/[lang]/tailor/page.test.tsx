// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import TailorStudioPage from './page'
import { TailorStudioContent } from '@/components/tailor'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getTailorStudioInitialData } from '@/app/actions/tailor'

const mockNotFound = vi.fn()
vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/tailor',
}))

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'usr_test' } }),
}))

vi.mock('@/components/workspace', () => ({
  WorkspaceHeader: () => <header data-testid="workspace-header" />,
}))

vi.mock('@/app/actions/tailor', () => ({
  getTailorStudioInitialData: vi.fn(),
  saveCandidateProfile: vi.fn().mockResolvedValue({ success: true }),
  getOutreachMessageAction: vi.fn().mockResolvedValue({ success: true, data: undefined }),
}))

describe('TailorStudioPage component (covers: AC-1, AC-2, AC-3, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in card when user is not authenticated (covers: AC-1)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: null,
      profile: null,
      activeProvider: null,
      defaultModel: null,
      configuredProviders: [],
      latestTailoredResume: null,
    })
    const dict = await getDictionary('en')

    render(<TailorStudioContent lang="en" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('Sign In to Tailoring Studio')).toBeDefined()
    })
    expect(screen.getByPlaceholderText('demo@careercraft.ai')).toBeDefined()
    expect(screen.getByText('One-Click Demo Account (demo@careercraft.ai)')).toBeDefined()
  })

  it('renders English tailoring studio with candidate headline badge and no inline experience form (covers: AC-2, AC-3)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: { user: { id: 'usr_test_123', email: 'demo@careercraft.ai' } },
      profile: {
        id: 'prof_en_1',
        headline: 'Senior Full Stack Engineer',
        candidateName: 'Alex Smith',
        emailVerified: true,
        summary: 'Specializing in Next.js and distributed databases',
        workExperiences: [
          {
            companyName: 'TechVanguard',
            jobTitle: 'Lead Dev',
            bullets: ['Streamed AI responses with Vercel AI SDK'],
          },
        ],
      },
      activeProvider: 'OPENAI',
      defaultModel: 'gpt-4o',
      configuredProviders: ['OPENAI'],
      latestTailoredResume: null,
    })

    const dict = await getDictionary('en')
    render(<TailorStudioContent lang="en" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('Resume Tailoring Studio')).toBeDefined()
    })
    expect(screen.getByText('Senior Full Stack Engineer')).toBeDefined()
    expect(screen.getByTestId('candidate-badge')).toBeDefined()
    expect(screen.getByText('Target Job Posting')).toBeDefined()
    expect(screen.getByText('Live Tailoring Output')).toBeDefined()
    expect(screen.getByRole('button', { name: /Generate Tailored Resume/i })).toBeDefined()
    // Confirm inline experience form is NOT rendered
    expect(screen.queryByText('Candidate Experience')).toBeNull()
  })

  it('renders Arabic tailoring studio with localized copy when authenticated (covers: AC-10)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: { user: { id: 'usr_test_123', email: 'demo@careercraft.ai' } },
      profile: {
        id: 'prof_ar_1',
        headline: 'مهندس برمجيات أول',
        candidateName: 'أحمد علي',
        emailVerified: true,
        summary: 'خبير في بناء وتطوير الأنظمة السحابية',
        workExperiences: [],
      },
      activeProvider: 'OPENAI',
      defaultModel: 'gpt-4o',
      configuredProviders: ['OPENAI'],
      latestTailoredResume: null,
    })

    const dict = await getDictionary('ar')
    render(<TailorStudioContent lang="ar" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('استوديو تخصيص السيرة الذاتية')).toBeDefined()
    })
    expect(screen.getByText('مهندس برمجيات أول')).toBeDefined()
    expect(screen.getByText('بيانات الوظيفة المستهدفة')).toBeDefined()
    expect(screen.getByText('مخرجات التخصيص الفوري')).toBeDefined()
    expect(
      screen.getByRole('button', { name: /تخصيص السيرة الذاتية الآن|Generate Tailored Resume/i }),
    ).toBeDefined()
  })

  it('renders page layout shell and pre-fetches initial data (covers: AC-1)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: { user: { id: 'usr_test_123', email: 'test@example.com' } },
      profile: null,
      activeProvider: 'OPENAI',
      defaultModel: 'gpt-4o',
      configuredProviders: ['OPENAI'],
      latestTailoredResume: null,
    })

    const pageElement = await TailorStudioPage({
      params: Promise.resolve({ lang: 'en' }),
    })

    expect(pageElement).toBeDefined()
    expect(getTailorStudioInitialData).toHaveBeenCalledWith('EN')
  })

  it('calls notFound when an unsupported locale is requested', async () => {
    await TailorStudioPage({
      params: Promise.resolve({ lang: 'es' }),
    })

    expect(mockNotFound).toHaveBeenCalled()
  })
})
