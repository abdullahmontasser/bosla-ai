import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getProfile } from './route'
import { PATCH as updateAvatar } from './avatar/route'
import { PUT as updateIdentity } from './identity/route'
import { POST as createExperience } from './experiences/route'
import { PUT as updateExperience, DELETE as deleteExperience } from './experiences/[id]/route'
import { POST as createEducation } from './educations/route'
import { PUT as updateEducation, DELETE as deleteEducation } from './educations/[id]/route'
import { POST as createSkill } from './skills/route'
import { DELETE as deleteSkill } from './skills/[id]/route'
import { POST as createProject } from './projects/route'
import { PUT as updateProject, DELETE as deleteProject } from './projects/[id]/route'
import { POST as reorderItems } from './reorder/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as profileDb from '@/lib/db/profiles'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    connection: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    profile: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/profiles', async (importOriginal) => {
  const actual = await importOriginal<typeof profileDb>()
  return {
    ...actual,
    getOrCreateDefaultProfile: vi.fn(),
    updateUserAvatar: vi.fn(),
    updateProfileIdentity: vi.fn(),
    createWorkExperience: vi.fn(),
    updateWorkExperience: vi.fn(),
    deleteWorkExperience: vi.fn(),
    createEducation: vi.fn(),
    updateEducation: vi.fn(),
    deleteEducation: vi.fn(),
    createSkill: vi.fn(),
    deleteSkill: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    reorderProfileItems: vi.fn(),
  }
})

describe('Profile API Route Handlers (covers: AC-1, AC-2, AC-4, AC-5, AC-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/profile (AC-1, AC-6)', () => {
    it('returns 401 when session is absent', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never)
      const req = new NextRequest('http://localhost:3000/api/profile?language=EN')
      const res = await getProfile(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns profile data for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1', name: 'Alex' },
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'usr_test_1',
        name: 'Alex',
        email: 'alex@example.com',
        image: 'data:image/webp;base64,abc',
      } as never)

      vi.mocked(profileDb.getOrCreateDefaultProfile).mockResolvedValueOnce({
        id: 'prof_1',
        userId: 'usr_test_1',
        language: 'EN',
        fullName: 'Alex Morgan',
        headline: 'Lead Developer',
        summary: 'Builder',
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

      const req = new NextRequest('http://localhost:3000/api/profile?language=EN')
      const res = await getProfile(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.user.name).toBe('Alex')
      expect(json.profile.fullName).toBe('Alex Morgan')
      expect(json.experiences).toEqual([])
    })
  })

  describe('PATCH /api/profile/avatar (AC-2, AC-7)', () => {
    it('returns 401 when session is absent', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never)
      const req = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ image: null }),
      })
      const res = await updateAvatar(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when avatar image exceeds size or invalid format', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ image: 'data:text/plain;base64,invalid' }),
      })
      const res = await updateAvatar(req)
      expect(res.status).toBe(400)
    })

    it('saves valid avatar and triggers revalidation', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      const validUri =
        'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2wAA'
      vi.mocked(profileDb.updateUserAvatar).mockResolvedValueOnce({
        id: 'usr_test_1',
        image: validUri,
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ image: validUri }),
      })
      const res = await updateAvatar(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.image).toBe(validUri)
      expect(profileDb.updateUserAvatar).toHaveBeenCalledWith('usr_test_1', validUri)
    })

    it('allows removing the avatar photo', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.updateUserAvatar).mockResolvedValueOnce({
        id: 'usr_test_1',
        image: null,
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ image: null }),
      })
      const res = await updateAvatar(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.image).toBeNull()
      expect(profileDb.updateUserAvatar).toHaveBeenCalledWith('usr_test_1', null)
    })
  })

  describe('PUT /api/profile/identity (AC-4, AC-7)', () => {
    it('returns 401 when session is absent', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never)
      const req = new NextRequest('http://localhost:3000/api/profile/identity', {
        method: 'PUT',
        body: JSON.stringify({ profileId: 'prof_1', fullName: 'Jane' }),
      })
      const res = await updateIdentity(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when URLs are invalid', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/identity', {
        method: 'PUT',
        body: JSON.stringify({
          profileId: 'prof_1',
          fullName: 'Jane Doe',
          websiteUrl: 'not-a-url',
        }),
      })

      const res = await updateIdentity(req)
      expect(res.status).toBe(400)
    })

    it('updates profile identity details and triggers revalidation', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.updateProfileIdentity).mockResolvedValueOnce({
        id: 'prof_1',
        fullName: 'Alex Updated',
        headline: 'Staff Engineer',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/identity', {
        method: 'PUT',
        body: JSON.stringify({
          profileId: 'prof_1',
          fullName: 'Alex Updated',
          headline: 'Staff Engineer',
        }),
      })

      const res = await updateIdentity(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.profile.fullName).toBe('Alex Updated')
    })
  })

  describe('Work Experience Endpoints (AC-5, AC-7)', () => {
    it('creates work experience with validation', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.createWorkExperience).mockResolvedValueOnce({
        id: 'exp_1',
        companyName: 'Acme Inc',
        jobTitle: 'Senior Dev',
        bullets: ['Led migration'],
        isCurrent: true,
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/experiences', {
        method: 'POST',
        body: JSON.stringify({
          profileId: 'prof_1',
          companyName: 'Acme Inc',
          jobTitle: 'Senior Dev',
          startDate: '2023-01-01',
          isCurrent: true,
          bullets: ['Led migration'],
        }),
      })

      const res = await createExperience(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.experience.companyName).toBe('Acme Inc')
    })

    it('returns 400 when creating experience with missing fields', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/experiences', {
        method: 'POST',
        body: JSON.stringify({
          profileId: 'prof_1',
          companyName: '',
        }),
      })

      const res = await createExperience(req)
      expect(res.status).toBe(400)
    })

    it('updates existing work experience', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.updateWorkExperience).mockResolvedValueOnce({
        id: 'exp_1',
        companyName: 'Acme Updated',
        jobTitle: 'Principal Dev',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/experiences/exp_1', {
        method: 'PUT',
        body: JSON.stringify({
          companyName: 'Acme Updated',
          jobTitle: 'Principal Dev',
          startDate: '2023-01-01',
          isCurrent: true,
          bullets: ['Led tech strategy'],
        }),
      })

      const res = await updateExperience(req, { params: Promise.resolve({ id: 'exp_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.experience.jobTitle).toBe('Principal Dev')
    })

    it('deletes work experience', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.deleteWorkExperience).mockResolvedValueOnce({
        id: 'exp_1',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/experiences/exp_1', {
        method: 'DELETE',
      })

      const res = await deleteExperience(req, { params: Promise.resolve({ id: 'exp_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(profileDb.deleteWorkExperience).toHaveBeenCalledWith('usr_test_1', 'exp_1')
    })
  })

  describe('Education Endpoints (AC-5, AC-7)', () => {
    it('creates education entry with validation', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.createEducation).mockResolvedValueOnce({
        id: 'edu_1',
        institution: 'Cairo University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/educations', {
        method: 'POST',
        body: JSON.stringify({
          profileId: 'prof_1',
          institution: 'Cairo University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2016-09-01',
          endDate: '2020-06-30',
        }),
      })

      const res = await createEducation(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.education.institution).toBe('Cairo University')
    })

    it('updates education entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.updateEducation).mockResolvedValueOnce({
        id: 'edu_1',
        institution: 'Cairo University',
        degree: 'Master of Science',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/educations/edu_1', {
        method: 'PUT',
        body: JSON.stringify({
          institution: 'Cairo University',
          degree: 'Master of Science',
        }),
      })

      const res = await updateEducation(req, { params: Promise.resolve({ id: 'edu_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.education.degree).toBe('Master of Science')
    })

    it('deletes education entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.deleteEducation).mockResolvedValueOnce({
        id: 'edu_1',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/educations/edu_1', {
        method: 'DELETE',
      })

      const res = await deleteEducation(req, { params: Promise.resolve({ id: 'edu_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(profileDb.deleteEducation).toHaveBeenCalledWith('usr_test_1', 'edu_1')
    })
  })

  describe('Skills Endpoints (AC-5, AC-7)', () => {
    it('creates skill entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.createSkill).mockResolvedValueOnce({
        id: 'sk_1',
        name: 'TypeScript',
        category: 'technical',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/skills', {
        method: 'POST',
        body: JSON.stringify({
          profileId: 'prof_1',
          name: 'TypeScript',
          category: 'technical',
        }),
      })

      const res = await createSkill(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.skill.name).toBe('TypeScript')
    })

    it('deletes skill entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.deleteSkill).mockResolvedValueOnce({
        id: 'sk_1',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/skills/sk_1', {
        method: 'DELETE',
      })

      const res = await deleteSkill(req, { params: Promise.resolve({ id: 'sk_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(profileDb.deleteSkill).toHaveBeenCalledWith('usr_test_1', 'sk_1')
    })
  })

  describe('Projects Endpoints (AC-5, AC-7)', () => {
    it('creates project entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.createProject).mockResolvedValueOnce({
        id: 'proj_1',
        name: 'CareerCraft Portfolio',
        description: 'Bilingual ATS Resume Builder',
        technologies: ['Next.js', 'PostgreSQL'],
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/projects', {
        method: 'POST',
        body: JSON.stringify({
          profileId: 'prof_1',
          name: 'CareerCraft Portfolio',
          description: 'Bilingual ATS Resume Builder',
          technologies: ['Next.js', 'PostgreSQL'],
        }),
      })

      const res = await createProject(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.project.name).toBe('CareerCraft Portfolio')
    })

    it('updates project entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.updateProject).mockResolvedValueOnce({
        id: 'proj_1',
        name: 'CareerCraft 2.0',
        description: 'Refined Bilingual Platform',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/projects/proj_1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'CareerCraft 2.0',
          description: 'Refined Bilingual Platform',
        }),
      })

      const res = await updateProject(req, { params: Promise.resolve({ id: 'proj_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.project.name).toBe('CareerCraft 2.0')
    })

    it('deletes project entry', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.deleteProject).mockResolvedValueOnce({
        id: 'proj_1',
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/projects/proj_1', {
        method: 'DELETE',
      })

      const res = await deleteProject(req, { params: Promise.resolve({ id: 'proj_1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(profileDb.deleteProject).toHaveBeenCalledWith('usr_test_1', 'proj_1')
    })
  })

  describe('POST /api/profile/reorder (AC-5)', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never)
      const req = new NextRequest('http://localhost:3000/api/profile/reorder', {
        method: 'POST',
        body: JSON.stringify({
          section: 'experiences',
          itemIds: ['exp_2', 'exp_1'],
        }),
      })
      const res = await reorderItems(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when section is invalid', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/reorder', {
        method: 'POST',
        body: JSON.stringify({
          section: 'unknown_section',
          itemIds: ['id_1'],
        }),
      })

      const res = await reorderItems(req)
      expect(res.status).toBe(400)
    })

    it('calls atomic reorder function for valid request', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'usr_test_1' },
      } as never)

      vi.mocked(profileDb.reorderProfileItems).mockResolvedValueOnce({
        success: true,
      } as never)

      const req = new NextRequest('http://localhost:3000/api/profile/reorder', {
        method: 'POST',
        body: JSON.stringify({
          section: 'experiences',
          itemIds: ['exp_2', 'exp_1'],
        }),
      })

      const res = await reorderItems(req)
      expect(res.status).toBe(200)
      expect(profileDb.reorderProfileItems).toHaveBeenCalledWith('usr_test_1', 'experiences', [
        'exp_2',
        'exp_1',
      ])
    })
  })
})
