// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfilePage from './page'
import { prisma } from '@/lib/prisma'
import * as profileDb from '@/lib/db/profiles'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  notFound: vi.fn(),
}))

vi.mock('@/lib/auth/require-session', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'usr_test_1', name: 'Alex' } }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/profiles', () => ({
  getOrCreateDefaultProfile: vi.fn(),
}))

vi.mock('@/lib/auth/account-linking', () => ({
  getUserLinkedAccounts: vi.fn().mockResolvedValue({
    email: 'alex@example.com',
    hasPassword: true,
    linkedProviders: ['github'],
    canUnlink: true,
  }),
  unlinkAccount: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/app/actions/account-linking-actions', () => ({
  getLinkedAccountsAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      email: 'alex@example.com',
      hasPassword: true,
      linkedProviders: ['github'],
      canUnlink: true,
    },
  }),
  unlinkAccountAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/components/workspace', () => ({
  WorkspaceHeader: ({ section }: { section: string }) => (
    <header data-testid="workspace-header">{section}</header>
  ),
}))

vi.mock('@/components/health/HealthProfileCard', () => ({
  HealthProfileCard: ({ lang }: { lang: string }) => (
    <section data-testid="health-profile-card" data-lang={lang} />
  ),
}))

describe('ProfilePage (covers: AC-1, AC-3, AC-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders English profile page with all master cards (AC-1, AC-3)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'usr_test_1',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      image: null,
    } as never)

    vi.mocked(profileDb.getOrCreateDefaultProfile).mockResolvedValueOnce({
      id: 'prof_en',
      userId: 'usr_test_1',
      language: 'EN',
      fullName: 'Alex Morgan',
      headline: 'Senior Full-Stack Engineer',
      summary: 'Passionate builder of performant web applications.',
      email: 'alex@example.com',
      phone: '+1 555-0100',
      location: 'San Francisco, CA',
      websiteUrl: 'https://alex.dev',
      linkedinUrl: 'https://linkedin.com/in/alex',
      githubUrl: 'https://github.com/alex',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      workExperiences: [
        {
          id: 'exp_1',
          profileId: 'prof_en',
          companyName: 'Acme Cloud',
          jobTitle: 'Lead Architect',
          location: 'San Francisco',
          startDate: new Date('2022-01-01'),
          endDate: null,
          isCurrent: true,
          bullets: ['Engineered high-throughput event pipeline'],
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      educations: [
        {
          id: 'edu_1',
          profileId: 'prof_en',
          institution: 'UC Berkeley',
          degree: 'B.S. Electrical Engineering & CS',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2017-09-01'),
          endDate: new Date('2021-05-01'),
          grade: '3.9 GPA',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skills: [
        {
          id: 'skill_1',
          profileId: 'prof_en',
          name: 'Next.js',
          category: 'Frontend',
          proficiency: 'Expert',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      projects: [
        {
          id: 'proj_1',
          profileId: 'prof_en',
          name: 'AI Agent Studio',
          description: 'Autonomous workflows engine',
          role: 'Creator',
          technologies: ['TypeScript', 'Tailwind'],
          url: 'https://github.com/alex/agent-studio',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as never)

    const jsx = await ProfilePage({
      params: Promise.resolve({ lang: 'en' }),
    })

    render(jsx)

    // Heading & Title
    expect(screen.getByText('Candidate Profile & Identity')).toBeDefined()
    expect(screen.getByText('Alex Morgan')).toBeDefined()
    expect(screen.getByText('Senior Full-Stack Engineer')).toBeDefined()

    // Compact health score card above the profile hub (AC-1)
    expect(screen.getByTestId('health-profile-card').getAttribute('data-lang')).toBe('en')

    // Monogram fallback initials (AM for Alex Morgan)
    expect(screen.getByText('AM')).toBeDefined()

    // Sections rendered
    expect(screen.getByText('Work Experience')).toBeDefined()
    expect(screen.getByText('Lead Architect')).toBeDefined()
    expect(screen.getByText('@ Acme Cloud')).toBeDefined()

    expect(screen.getByText('Education')).toBeDefined()
    expect(screen.getByText('UC Berkeley')).toBeDefined()

    expect(screen.getByText('Skills & Competencies')).toBeDefined()
    expect(screen.getByText('Next.js')).toBeDefined()

    expect(screen.getByText('Featured Projects')).toBeDefined()
    expect(screen.getByText('AI Agent Studio')).toBeDefined()
  })

  it('renders Arabic profile page with Arabic layout and headings (AC-1, AC-6)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'usr_test_1',
      name: 'عبد الله أحمد',
      email: 'abdullah@example.com',
      image: null,
    } as never)

    vi.mocked(profileDb.getOrCreateDefaultProfile).mockResolvedValueOnce({
      id: 'prof_ar',
      userId: 'usr_test_1',
      language: 'AR',
      fullName: 'عبد الله أحمد',
      headline: 'مهندس برمجيات رئيسي',
      summary: 'مطور برمجيات متكاملة ومصمم أنظمة.',
      email: 'abdullah@example.com',
      phone: '+966 50 000 0000',
      location: 'الرياض، المملكة العربية السعودية',
      websiteUrl: null,
      linkedinUrl: null,
      githubUrl: null,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      workExperiences: [],
      educations: [],
      skills: [],
      projects: [],
    } as never)

    const jsx = await ProfilePage({
      params: Promise.resolve({ lang: 'ar' }),
    })

    render(jsx)

    expect(screen.getByText('الملف المهني والصورة الشخصية')).toBeDefined()
    expect(screen.getByTestId('health-profile-card').getAttribute('data-lang')).toBe('ar')
    expect(screen.getByText('عبد الله أحمد')).toBeDefined()
    expect(screen.getByText('البيانات الشخصية والمهنية')).toBeDefined()
    expect(screen.getByText('الخبرات المهنية')).toBeDefined()
    expect(screen.getByText('التعليم والمؤهلات')).toBeDefined()
  })

  it('respects profileLang from searchParams (covers profile language switch)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'usr_test_1',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      image: null,
    } as never)

    vi.mocked(profileDb.getOrCreateDefaultProfile).mockResolvedValueOnce({
      id: 'prof_ar',
      userId: 'usr_test_1',
      language: 'AR',
      fullName: 'أليكس مورغان',
      headline: null,
      summary: null,
      email: 'alex@example.com',
      phone: null,
      location: null,
      websiteUrl: null,
      linkedinUrl: null,
      githubUrl: null,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      workExperiences: [],
      educations: [],
      skills: [],
      projects: [],
    } as never)

    const jsx = await ProfilePage({
      params: Promise.resolve({ lang: 'en' }),
      searchParams: Promise.resolve({ profileLang: 'ar' }),
    })
    render(jsx)

    expect(profileDb.getOrCreateDefaultProfile).toHaveBeenCalledWith(
      'usr_test_1',
      'AR',
      expect.anything(),
    )
  })
})
