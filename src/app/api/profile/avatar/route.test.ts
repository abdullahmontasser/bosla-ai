import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('GET /api/profile/avatar (Safe avatar endpoint)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if unauthorized and no user id query param is present', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)

    const req = new NextRequest('http://localhost:3000/api/profile/avatar')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 404 if user has no avatar image saved', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_no_img' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ image: null } as never)

    const req = new NextRequest('http://localhost:3000/api/profile/avatar')
    const res = await GET(req)

    expect(res.status).toBe(404)
  })

  it('decodes and serves data URI images with cache headers without bloating session cookies', async () => {
    const base64Data = Buffer.from('fake-image-bytes').toString('base64')
    const dataUri = `data:image/webp;base64,${base64Data}`

    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'usr_with_img' } } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ image: dataUri } as never)

    const req = new NextRequest('http://localhost:3000/api/profile/avatar?u=usr_with_img')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/webp')
    expect(res.headers.get('Cache-Control')).toContain('public')
    const body = await res.arrayBuffer()
    expect(Buffer.from(body).toString()).toBe('fake-image-bytes')
  })
})
