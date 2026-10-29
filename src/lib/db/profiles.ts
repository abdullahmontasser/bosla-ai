import { prisma } from '@/lib/prisma'
import type { Language } from '@prisma/client'
import {
  CreateProfileInputSchema,
  type CreateProfileInput,
  type IdentityUpdateInput,
  type WorkExperienceCreateInput,
  type WorkExperienceUpdateInput,
  type EducationCreateInput,
  type EducationUpdateInput,
  type SkillCreateInput,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '@/lib/validations/profile'

/**
 * Creates a master profile with related work experiences, educations, skills, and projects.
 * Runs in a transaction to guarantee relational consistency and enforce default profile uniqueness per language.
 */
export async function createProfileWithDetails(userId: string, input: CreateProfileInput) {
  const validated = CreateProfileInputSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    // If setting as default, unset default on other profiles for the same user and language
    if (validated.isDefault) {
      await tx.profile.updateMany({
        where: {
          userId,
          language: validated.language as Language,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    return tx.profile.create({
      data: {
        userId,
        language: validated.language as Language,
        fullName: validated.fullName,
        headline: validated.headline || null,
        summary: validated.summary || null,
        email: validated.email || null,
        phone: validated.phone || null,
        location: validated.location || null,
        websiteUrl: validated.websiteUrl || null,
        linkedinUrl: validated.linkedinUrl || null,
        githubUrl: validated.githubUrl || null,
        isDefault: validated.isDefault,
        workExperiences: {
          create: validated.workExperiences.map((exp, idx) => ({
            companyName: exp.companyName,
            jobTitle: exp.jobTitle,
            location: exp.location || null,
            startDate: exp.startDate,
            endDate: exp.isCurrent ? null : exp.endDate || null,
            isCurrent: exp.isCurrent,
            bullets: exp.bullets,
            sortOrder: exp.sortOrder ?? idx,
          })),
        },
        educations: {
          create: validated.educations.map((edu, idx) => ({
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || null,
            startDate: edu.startDate || null,
            endDate: edu.endDate || null,
            grade: edu.grade || null,
            sortOrder: edu.sortOrder ?? idx,
          })),
        },
        skills: {
          create: validated.skills.map((skill, idx) => ({
            name: skill.name,
            category: skill.category || null,
            proficiency: skill.proficiency || null,
            sortOrder: skill.sortOrder ?? idx,
          })),
        },
        projects: {
          create: validated.projects.map((proj, idx) => ({
            name: proj.name,
            description: proj.description,
            role: proj.role || null,
            technologies: proj.technologies,
            url: proj.url || null,
            sortOrder: proj.sortOrder ?? idx,
          })),
        },
      },
      include: {
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
      },
    })
  })
}

/**
 * Retrieves all profiles for a given user, optionally filtered by language.
 */
export async function getProfilesByUser(userId: string, language?: Language) {
  return prisma.profile.findMany({
    where: {
      userId,
      ...(language && { language }),
    },
    include: {
      _count: {
        select: {
          workExperiences: true,
          educations: true,
          skills: true,
          projects: true,
          tailoredResumes: true,
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  })
}

/**
 * Retrieves a single profile with all its child relations, strictly scoped to userId.
 */
export async function getProfileById(userId: string, profileId: string) {
  return prisma.profile.findFirst({
    where: {
      id: profileId,
      userId,
    },
    include: {
      workExperiences: { orderBy: { sortOrder: 'asc' } },
      educations: { orderBy: { sortOrder: 'asc' } },
      skills: { orderBy: { sortOrder: 'asc' } },
      projects: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

/**
 * Deletes a profile, strictly scoped to userId.
 */
export async function deleteProfile(userId: string, profileId: string) {
  // Use deleteMany with userId to guarantee multi-tenant safety
  const result = await prisma.profile.deleteMany({
    where: {
      id: profileId,
      userId,
    },
  })

  return result.count > 0
}

/**
 * Retrieves the default profile for a user and language with work experiences.
 */
export async function getDefaultProfile(userId: string, language: Language = 'EN') {
  return prisma.profile.findFirst({
    where: {
      userId,
      language,
    },
    include: {
      workExperiences: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  })
}

/**
 * Upserts candidate profile headline, summary, and work experiences for studio tailoring.
 */
export async function upsertTailoringCandidateProfile(
  userId: string,
  input: {
    profileId?: string
    language?: Language
    headline: string
    summary: string
    experiences: Array<{
      id?: string
      companyName: string
      jobTitle: string
      bullets: string[]
    }>
  },
) {
  const language = input.language || 'EN'

  return prisma.$transaction(async (tx) => {
    let targetProfileId = input.profileId

    if (targetProfileId) {
      const existing = await tx.profile.findFirst({
        where: { id: targetProfileId, userId },
      })
      if (!existing) {
        throw new Error('Profile not found')
      }

      await tx.profile.update({
        where: { id: targetProfileId },
        data: {
          headline: input.headline,
          summary: input.summary,
        },
      })

      await tx.workExperience.deleteMany({
        where: { profileId: targetProfileId },
      })
    } else {
      const existingDefault = await tx.profile.findFirst({
        where: { userId, language },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      })

      if (existingDefault) {
        targetProfileId = existingDefault.id
        await tx.profile.update({
          where: { id: targetProfileId },
          data: {
            headline: input.headline,
            summary: input.summary,
          },
        })
        await tx.workExperience.deleteMany({
          where: { profileId: targetProfileId },
        })
      } else {
        const user = await tx.user.findUnique({ where: { id: userId } })
        const newProfile = await tx.profile.create({
          data: {
            userId,
            language,
            fullName: user?.name || 'Candidate',
            headline: input.headline,
            summary: input.summary,
            isDefault: true,
          },
        })
        targetProfileId = newProfile.id
      }
    }

    if (input.experiences.length > 0) {
      await tx.workExperience.createMany({
        data: input.experiences.map((exp, idx) => ({
          profileId: targetProfileId!,
          companyName: exp.companyName,
          jobTitle: exp.jobTitle,
          bullets: exp.bullets,
          startDate: new Date('2022-01-01'),
          isCurrent: idx === 0,
          sortOrder: idx,
        })),
      })
    }

    return { profileId: targetProfileId! }
  })
}

/**
 * Retrieves the profile for a user and language, or seeds a default one if it doesn't exist yet.
 * Includes all child entities (work experiences, educations, skills, projects) ordered by sortOrder.
 */
export async function getOrCreateDefaultProfile(
  userId: string,
  language: Language = 'EN',
  userDetails?: { name?: string | null; email?: string | null },
) {
  const existing = await prisma.profile.findFirst({
    where: { userId, language },
    include: {
      workExperiences: { orderBy: { sortOrder: 'asc' } },
      educations: { orderBy: { sortOrder: 'asc' } },
      skills: { orderBy: { sortOrder: 'asc' } },
      projects: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  })

  if (existing) {
    return existing
  }

  // Seed initial profile for the requested language
  const user = userDetails
    ? userDetails
    : await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })

  return prisma.profile.create({
    data: {
      userId,
      language,
      fullName: user?.name || (language === 'AR' ? 'المرشح' : 'Candidate'),
      email: user?.email || null,
      isDefault: true,
    },
    include: {
      workExperiences: { orderBy: { sortOrder: 'asc' } },
      educations: { orderBy: { sortOrder: 'asc' } },
      skills: { orderBy: { sortOrder: 'asc' } },
      projects: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

/**
 * Updates candidate core identity fields strictly scoped to the user.
 */
export async function updateProfileIdentity(userId: string, input: IdentityUpdateInput) {
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId },
  })

  if (!profile) {
    throw new Error('Profile not found')
  }

  return prisma.profile.update({
    where: { id: input.profileId },
    data: {
      fullName: input.fullName,
      headline: input.headline || null,
      summary: input.summary || null,
      email: input.email || null,
      phone: input.phone || null,
      location: input.location || null,
      websiteUrl: input.websiteUrl || null,
      linkedinUrl: input.linkedinUrl || null,
      githubUrl: input.githubUrl || null,
    },
  })
}

/**
 * Updates a user's avatar image strictly scoped to userId.
 */
export async function updateUserAvatar(userId: string, image: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: { image },
    select: { id: true, image: true },
  })
}

/**
 * Work Experience CRUD operations strictly scoped to the user's profile.
 */
export async function createWorkExperience(userId: string, input: WorkExperienceCreateInput) {
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId },
  })
  if (!profile) throw new Error('Profile not found')

  const count = await prisma.workExperience.count({ where: { profileId: input.profileId } })

  return prisma.workExperience.create({
    data: {
      profileId: input.profileId,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      location: input.location || null,
      startDate: input.startDate,
      endDate: input.isCurrent ? null : input.endDate || null,
      isCurrent: input.isCurrent,
      bullets: input.bullets,
      sortOrder: input.sortOrder ?? count,
    },
  })
}

export async function updateWorkExperience(
  userId: string,
  id: string,
  input: WorkExperienceUpdateInput,
) {
  const existing = await prisma.workExperience.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Work experience not found')

  return prisma.workExperience.update({
    where: { id },
    data: {
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      location: input.location || null,
      startDate: input.startDate,
      endDate: input.isCurrent ? null : input.endDate || null,
      isCurrent: input.isCurrent,
      bullets: input.bullets,
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteWorkExperience(userId: string, id: string) {
  const existing = await prisma.workExperience.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Work experience not found')

  return prisma.workExperience.delete({
    where: { id },
  })
}

/**
 * Education CRUD operations strictly scoped to the user's profile.
 */
export async function createEducation(userId: string, input: EducationCreateInput) {
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId },
  })
  if (!profile) throw new Error('Profile not found')

  const count = await prisma.education.count({ where: { profileId: input.profileId } })

  return prisma.education.create({
    data: {
      profileId: input.profileId,
      institution: input.institution,
      degree: input.degree,
      fieldOfStudy: input.fieldOfStudy || null,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      grade: input.grade || null,
      sortOrder: input.sortOrder ?? count,
    },
  })
}

export async function updateEducation(userId: string, id: string, input: EducationUpdateInput) {
  const existing = await prisma.education.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Education not found')

  return prisma.education.update({
    where: { id },
    data: {
      institution: input.institution,
      degree: input.degree,
      fieldOfStudy: input.fieldOfStudy || null,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      grade: input.grade || null,
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteEducation(userId: string, id: string) {
  const existing = await prisma.education.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Education not found')

  return prisma.education.delete({
    where: { id },
  })
}

/**
 * Skill CRUD operations strictly scoped to the user's profile.
 */
export async function createSkill(userId: string, input: SkillCreateInput) {
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId },
  })
  if (!profile) throw new Error('Profile not found')

  const count = await prisma.skill.count({ where: { profileId: input.profileId } })

  return prisma.skill.create({
    data: {
      profileId: input.profileId,
      name: input.name,
      category: input.category || null,
      proficiency: input.proficiency || null,
      sortOrder: input.sortOrder ?? count,
    },
  })
}

export async function deleteSkill(userId: string, id: string) {
  const existing = await prisma.skill.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Skill not found')

  return prisma.skill.delete({
    where: { id },
  })
}

/**
 * Project CRUD operations strictly scoped to the user's profile.
 */
export async function createProject(userId: string, input: ProjectCreateInput) {
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId },
  })
  if (!profile) throw new Error('Profile not found')

  const count = await prisma.project.count({ where: { profileId: input.profileId } })

  return prisma.project.create({
    data: {
      profileId: input.profileId,
      name: input.name,
      description: input.description,
      role: input.role || null,
      technologies: input.technologies,
      url: input.url || null,
      sortOrder: input.sortOrder ?? count,
    },
  })
}

export async function updateProject(userId: string, id: string, input: ProjectUpdateInput) {
  const existing = await prisma.project.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Project not found')

  return prisma.project.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      role: input.role || null,
      technologies: input.technologies,
      url: input.url || null,
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteProject(userId: string, id: string) {
  const existing = await prisma.project.findFirst({
    where: { id, profile: { userId } },
  })
  if (!existing) throw new Error('Project not found')

  return prisma.project.delete({
    where: { id },
  })
}

/**
 * Reorders items in a given section atomically in a single transaction.
 */
export async function reorderProfileItems(
  userId: string,
  section: 'experiences' | 'educations' | 'skills' | 'projects',
  itemIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    for (let i = 0; i < itemIds.length; i++) {
      const id = itemIds[i]
      if (section === 'experiences') {
        const item = await tx.workExperience.findFirst({ where: { id, profile: { userId } } })
        if (!item) throw new Error(`Unauthorized or missing experience ${id}`)
        await tx.workExperience.update({ where: { id }, data: { sortOrder: i } })
      } else if (section === 'educations') {
        const item = await tx.education.findFirst({ where: { id, profile: { userId } } })
        if (!item) throw new Error(`Unauthorized or missing education ${id}`)
        await tx.education.update({ where: { id }, data: { sortOrder: i } })
      } else if (section === 'skills') {
        const item = await tx.skill.findFirst({ where: { id, profile: { userId } } })
        if (!item) throw new Error(`Unauthorized or missing skill ${id}`)
        await tx.skill.update({ where: { id }, data: { sortOrder: i } })
      } else if (section === 'projects') {
        const item = await tx.project.findFirst({ where: { id, profile: { userId } } })
        if (!item) throw new Error(`Unauthorized or missing project ${id}`)
        await tx.project.update({ where: { id }, data: { sortOrder: i } })
      }
    }
    return { success: true }
  })
}
