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

vi.mock('@/app/actions/tailor', () => ({
  getTailorStudioInitialData: vi.fn(),
  saveCandidateProfile: vi.fn().mockResolvedValue({ success: true }),
}))

describe('TailorStudioPage component (covers: AC-1, AC-2, AC-9, AC-10)', () => {
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
    })
    const dict = await getDictionary('en')

    render(<TailorStudioContent lang="en" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('Sign In to Tailoring Studio')).toBeDefined()
    })
    expect(screen.getByPlaceholderText('demo@careercraft.ai')).toBeDefined()
    expect(screen.getByText('One-Click Demo Account (demo@careercraft.ai)')).toBeDefined()
  })

  it('renders English tailoring studio when authenticated (covers: AC-2, AC-9)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: { user: { id: 'usr_test_123', email: 'demo@careercraft.ai' } },
      profile: {
        id: 'prof_en_1',
        headline: 'Senior Full Stack Engineer',
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
    })

    const dict = await getDictionary('en')
    render(<TailorStudioContent lang="en" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('Resume Tailoring Studio')).toBeDefined()
    })
    expect(screen.getByText('Candidate Experience')).toBeDefined()
    expect(screen.getByText('Target Job Posting')).toBeDefined()
    expect(screen.getByText('Live Tailoring Output')).toBeDefined()
    expect(screen.getByText('Generate Tailored Resume')).toBeDefined()
  })

  it('renders Arabic tailoring studio with localized copy when authenticated (covers: AC-10)', async () => {
    vi.mocked(getTailorStudioInitialData).mockResolvedValueOnce({
      session: { user: { id: 'usr_test_123', email: 'demo@careercraft.ai' } },
      profile: {
        id: 'prof_ar_1',
        headline: 'مهندس برمجيات أول',
        summary: 'خبير في بناء وتطوير الأنظمة السحابية',
        workExperiences: [],
      },
      activeProvider: 'OPENAI',
      defaultModel: 'gpt-4o',
      configuredProviders: ['OPENAI'],
    })

    const dict = await getDictionary('ar')
    render(<TailorStudioContent lang="ar" dict={dict} />)

    await waitFor(() => {
      expect(screen.getByText('استوديو تخصيص السيرة الذاتية')).toBeDefined()
    })
    expect(screen.getByText('خبرات المرشح المهنية')).toBeDefined()
    expect(screen.getByText('بيانات الوظيفة المستهدفة')).toBeDefined()
    expect(screen.getByText('مخرجات التخصيص الفوري')).toBeDefined()
    expect(screen.getByText('تخصيص السيرة الذاتية الآن')).toBeDefined()
  })

  it('renders page layout shell and calls notFound when an unsupported locale is requested', async () => {
    await TailorStudioPage({
      params: Promise.resolve({ lang: 'es' }),
    })

    expect(mockNotFound).toHaveBeenCalled()
  })
})
