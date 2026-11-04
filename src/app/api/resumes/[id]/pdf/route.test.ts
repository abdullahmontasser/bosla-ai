import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import type { TailoredResume } from '@prisma/client'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tailoredResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('GET /api/resumes/[id]/pdf Route Handler (covers: AC-5, AC-8)', () => {
  const mockUser = { id: 'user_pdf_1', email: 'user@example.com' }

  const mockResume = {
    id: 'res_pdf_123',
    userId: 'user_pdf_1',
    profileId: 'prof_1',
    jobPostingId: 'job_1',
    language: 'EN',
    title: 'Senior Engineer - Tech Corp',
    atsScore: 85,
    tailoredSummary: 'Proven software architect.',
    tailoredContent: {
      candidateHeader: {
        fullName: 'Jordan Lee',
        email: 'jordan@example.com',
        phone: '+1 555-0188',
        location: 'Seattle, WA',
      },
      tailoredExperiences: [
        {
          companyName: 'Tech Corp',
          jobTitle: 'Senior Engineer',
          bullets: [
            {
              rewritten: 'Engineered cloud native pipelines reducing deployment time by 40%.',
            },
          ],
        },
      ],
      educations: [
        {
          institution: 'University of Washington',
          degree: 'B.S. in Computer Science',
        },
      ],
      skills: [{ name: 'TypeScript' }, { name: 'React' }],
    },
    jobPosting: {
      id: 'job_1',
      title: 'Senior Engineer',
      companyName: 'Tech Corp',
    },
    profile: {
      id: 'prof_1',
      fullName: 'Jordan Lee',
      email: 'jordan@example.com',
      workExperiences: [],
      skills: [],
      educations: [],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      expires: '2099-01-01',
    })
  })

  it('returns 401 Unauthorized when session is missing (covers: AC-8)', async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/resumes/res_pdf_123/pdf')
    const response = await GET(req, { params: Promise.resolve({ id: 'res_pdf_123' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 Not Found when resume does not belong to caller (covers: AC-8)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/resumes/res_foreign/pdf')
    const response = await GET(req, { params: Promise.resolve({ id: 'res_foreign' }) })

    expect(response.status).toBe(404)
  })

  it('streams PDF binary with RFC 5987 Content-Disposition header and updates lastExportedAt (covers: AC-5)', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({
      ...mockResume,
      lastExportedAt: new Date(),
    } as unknown as TailoredResume)

    const req = new NextRequest('http://localhost:3000/api/resumes/res_pdf_123/pdf')
    const response = await GET(req, { params: Promise.resolve({ id: 'res_pdf_123' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, must-revalidate')

    const disposition = response.headers.get('Content-Disposition') || ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain("filename*=UTF-8''")

    // Confirm lastExportedAt update was recorded in DB
    expect(prisma.tailoredResume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'res_pdf_123' },
        data: expect.objectContaining({
          lastExportedAt: expect.any(Date),
        }),
      }),
    )

    const arrayBuffer = await response.arrayBuffer()
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000)
  })

  it('POST /api/resumes/[id]/pdf streams PDF with custom live canvas state', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce({
      ...mockResume,
      lastExportedAt: new Date(),
    } as unknown as TailoredResume)

    const liveCanvasPayload = {
      templateId: 'tech-minimalist',
      language: 'EN',
      fullName: 'Jordan Lee (Edited)',
      headline: 'Principal AI Engineer',
      email: 'jordan.edited@example.com',
      phone: '+1 555-9999',
      location: 'San Francisco, CA',
      linkedinUrl: 'linkedin.com/in/jordanlee',
      summary: 'Distinguished AI architect with specialized expertise in LLM agents.',
      experiences: [
        {
          companyName: 'Tech Corp',
          jobTitle: 'Principal AI Engineer',
          bullets: ['Spearheaded agentic workflow architecture reducing latency by 45%.'],
        },
      ],
      categorizedSkills: [
        {
          category: 'AI / Machine Learning',
          skills: ['PyTorch', 'TensorFlow', 'LangChain'],
        },
      ],
      educations: [
        {
          institution: 'MIT',
          degree: 'M.S. in Computer Science',
        },
      ],
      projects: [
        {
          title: 'Autonomous Agent Platform',
          role: 'Lead Architect',
          description: 'Production system orchestrating multi-agent collaboration.',
          technologies: ['Next.js', 'PostgreSQL', 'TypeScript'],
        },
      ],
      accentColor: '#1e3a8a',
      fontFamily: 'serif',
    }

    const req = new NextRequest('http://localhost:3000/api/resumes/res_pdf_123/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(liveCanvasPayload),
    })

    const response = await POST(req, { params: Promise.resolve({ id: 'res_pdf_123' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')

    const arrayBuffer = await response.arrayBuffer()
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000)

    const disposition = response.headers.get('Content-Disposition') || ''
    expect(disposition).toContain('Jordan_Lee_Edited')
  })

  it('handles custom density parameter in POST payload and GET query string', async () => {
    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )

    const postReq = new NextRequest('http://localhost:3000/api/resumes/res_pdf_123/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jordan Lee',
        density: 'compact',
      }),
    })

    const postResponse = await POST(postReq, { params: Promise.resolve({ id: 'res_pdf_123' }) })
    expect(postResponse.status).toBe(200)

    vi.mocked(prisma.tailoredResume.findFirst).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )
    vi.mocked(prisma.tailoredResume.update).mockResolvedValueOnce(
      mockResume as unknown as TailoredResume,
    )

    const getReq = new NextRequest(
      'http://localhost:3000/api/resumes/res_pdf_123/pdf?density=relaxed',
    )
    const getResponse = await GET(getReq, { params: Promise.resolve({ id: 'res_pdf_123' }) })
    expect(getResponse.status).toBe(200)
  })
})
