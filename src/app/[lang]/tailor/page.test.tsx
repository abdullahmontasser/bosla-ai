// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TailorStudioPage from './page'
import { TailorStudioContent } from '@/components/tailor'
import { auth } from '@/auth'
import { getDefaultProfile } from '@/lib/db/profiles'
import { getDictionary } from '@/lib/i18n/get-dictionary'

const mockNotFound = vi.fn()
vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/tailor',
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/profiles', () => ({
  getDefaultProfile: vi.fn(),
}))

vi.mock('@/app/actions/provider-settings', () => ({
  getProviderConfigurations: vi.fn().mockResolvedValue([
    {
      provider: 'OPENAI',
      isConfigured: true,
      maskedKey: '••••••••1234',
      defaultModel: 'gpt-4o',
      endpointUrl: null,
      isActive: true,
    },
  ]),
  setActiveProvider: vi.fn(),
}))

const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('TailorStudioPage component (covers: AC-1, AC-2, AC-9, AC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in card when user is not authenticated (covers: AC-1)', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const dict = await getDictionary('en')

    const content = await TailorStudioContent({
      lang: 'en',
      dict,
    })

    render(content)

    expect(screen.getByText('Sign In to Tailoring Studio')).toBeDefined()
    expect(screen.getByPlaceholderText('demo@careercraft.ai')).toBeDefined()
    expect(screen.getByText('One-Click Demo Account (demo@careercraft.ai)')).toBeDefined()
  })

  it('renders English tailoring studio when authenticated (covers: AC-2, AC-9)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test_123', email: 'demo@careercraft.ai' },
      expires: '2099-01-01',
    })
    vi.mocked(getDefaultProfile).mockResolvedValueOnce({
      id: 'prof_en_1',
      userId: 'usr_test_123',
      language: 'EN',
      fullName: 'Tarek Mansour',
      headline: 'Senior Full Stack Engineer',
      summary: 'Specializing in Next.js and distributed databases',
      workExperiences: [
        {
          id: 'exp_1',
          profileId: 'prof_en_1',
          companyName: 'TechVanguard',
          jobTitle: 'Lead Dev',
          bullets: ['Streamed AI responses with Vercel AI SDK'],
          startDate: new Date(),
          endDate: null,
          isCurrent: true,
          location: 'Remote',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as never)

    const dict = await getDictionary('en')
    const content = await TailorStudioContent({
      lang: 'en',
      dict,
    })

    render(content)

    expect(screen.getByText('Resume Tailoring Studio')).toBeDefined()
    expect(screen.getByText('Candidate Experience')).toBeDefined()
    expect(screen.getByText('Target Job Posting')).toBeDefined()
    expect(screen.getByText('Live Tailoring Output')).toBeDefined()
    expect(screen.getByText('Generate Tailored Resume')).toBeDefined()
  })

  it('renders Arabic tailoring studio with localized copy when authenticated (covers: AC-10)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test_123', email: 'demo@careercraft.ai' },
      expires: '2099-01-01',
    })
    vi.mocked(getDefaultProfile).mockResolvedValueOnce({
      id: 'prof_ar_1',
      userId: 'usr_test_123',
      language: 'AR',
      fullName: 'طارق منصور',
      headline: 'مهندس برمجيات أول',
      summary: 'خبير في بناء وتطوير الأنظمة السحابية',
      workExperiences: [],
    } as never)

    const dict = await getDictionary('ar')
    const content = await TailorStudioContent({
      lang: 'ar',
      dict,
    })

    render(content)

    expect(screen.getByText('استوديو تخصيص السيرة الذاتية')).toBeDefined()
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
