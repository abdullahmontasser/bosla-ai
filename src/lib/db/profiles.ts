import { prisma } from '@/lib/prisma'
import type { Language } from '@prisma/client'
import { CreateProfileInputSchema, type CreateProfileInput } from '@/lib/validations/profile'

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
