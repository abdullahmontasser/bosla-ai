import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProfileById } from '@/lib/db/profiles'
import { streamText } from 'ai'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobPosting: {
      create: vi.fn(),
    },
    tailoredResume: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/provider-settings', () => ({
  getActiveProviderSettings: vi.fn(),
}))

vi.mock('@/lib/db/profiles', () => ({
  getProfileById: vi.fn(),
}))

vi.mock('@/lib/ai/provider-client', () => ({
  getProviderModel: vi.fn(() => ({})),
}))

vi.mock('ai', () => ({
  streamText: vi.fn(),
}))

const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('POST /api/tailor route handler (covers: AC-4, AC-5, AC-6, AC-7, AC-8)', () => {
  const validPayload = {
    profileId: 'prof_123',
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'TechVanguard Systems',
    rawJobDescription:
      'We are looking for a Senior Full Stack Engineer with strong experience in Next.js App Router, TypeScript, and PostgreSQL database optimization.',
    language: 'EN',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when request is unauthenticated (covers: AC-4)', async () => {
    mockAuth.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when job description is less than 50 characters (covers: AC-4)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test' },
      expires: '2099-01-01',
    })

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify({
        ...validPayload,
        rawJobDescription: 'Short desc',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('at least 50 characters')
  })

  it('returns 400 when user has no active AI provider configured (covers: AC-5, AC-9)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test' },
      expires: '2099-01-01',
    })
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No active AI provider configured')
  })

  it('returns 404 when profile is not found or belongs to another user (covers: AC-4)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test' },
      expires: '2099-01-01',
    })
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
      {
        id: 'set_1',
        provider: 'OPENAI',
        apiKey: 'sk-test',
        defaultModel: 'gpt-4o',
        endpointUrl: null,
        isActive: true,
        updatedAt: new Date(),
      },
    ])
    vi.mocked(getProfileById).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Candidate profile not found')
  })

  it('streams response and persists completed snapshot on stream finish (covers: AC-5, AC-6, AC-7)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test' },
      expires: '2099-01-01',
    })
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
      {
        id: 'set_1',
        provider: 'OPENAI',
        apiKey: 'sk-test',
        defaultModel: 'gpt-4o',
        endpointUrl: null,
        isActive: true,
        updatedAt: new Date(),
      },
    ])
    vi.mocked(getProfileById).mockResolvedValueOnce({
      id: 'prof_123',
      userId: 'usr_test',
      language: 'EN',
      fullName: 'Tarek Mansour',
      headline: 'Senior Full Stack Engineer',
      summary: 'Experienced cloud engineer',
      workExperiences: [
        {
          id: 'exp_1',
          profileId: 'prof_123',
          companyName: 'TechVanguard',
          jobTitle: 'Senior Full Stack Engineer',
          bullets: ['Engineered AI pipelines', 'Scaled database queries'],
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

    vi.mocked(prisma.jobPosting.create).mockResolvedValueOnce({
      id: 'job_post_99',
    } as never)

    vi.mocked(prisma.tailoredResume.create).mockResolvedValueOnce({
      id: 'tailored_res_99',
    } as never)

    let capturedOnFinish: ((event: { text: string }) => Promise<void>) | null = null

    vi.mocked(streamText).mockImplementationOnce(((options: {
      onFinish?: (event: { text: string }) => Promise<void>
    }) => {
      capturedOnFinish = options.onFinish || null
      return {
        toTextStreamResponse: vi.fn(
          () =>
            new Response('### SUMMARY\nTailored summary\n### BULLETS\n- Tailored bullet', {
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            }),
        ),
      } as unknown as ReturnType<typeof streamText>
    }) as never)

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Trigger onFinish
    expect(capturedOnFinish).toBeDefined()
    if (capturedOnFinish) {
      await (capturedOnFinish as (event: { text: string }) => Promise<void>)({
        text: '### SUMMARY\nTailored summary for TechVanguard role.\n### BULLETS\n- Enhanced AI response streaming with Next.js App Router.',
      })

      expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tailored_res_99' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            tailoredSummary: 'Tailored summary for TechVanguard role.',
          }),
        }),
      )
    }
  })

  it('marks record as FAILED when streaming error occurs (covers: AC-8)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'usr_test' },
      expires: '2099-01-01',
    })
    vi.mocked(getActiveProviderSettings).mockResolvedValueOnce([
      {
        id: 'set_1',
        provider: 'OPENAI',
        apiKey: 'sk-test',
        defaultModel: 'gpt-4o',
        endpointUrl: null,
        isActive: true,
        updatedAt: new Date(),
      },
    ])
    vi.mocked(getProfileById).mockResolvedValueOnce({
      id: 'prof_123',
      userId: 'usr_test',
      language: 'EN',
      fullName: 'Tarek Mansour',
      headline: 'Senior Full Stack Engineer',
      summary: 'Experienced cloud engineer',
      workExperiences: [],
    } as never)

    vi.mocked(prisma.jobPosting.create).mockResolvedValueOnce({
      id: 'job_post_99',
    } as never)

    vi.mocked(prisma.tailoredResume.create).mockResolvedValueOnce({
      id: 'tailored_res_99',
    } as never)

    vi.mocked(streamText).mockImplementationOnce(() => {
      throw new Error('AI upstream rate limit exceeded')
    })

    const req = new NextRequest('http://localhost:3000/api/tailor', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain('Failed to start AI generation stream')

    expect(prisma.tailoredResume.update).toHaveBeenCalledWith({
      where: { id: 'tailored_res_99' },
      data: { status: 'FAILED' },
    })
  })
})
