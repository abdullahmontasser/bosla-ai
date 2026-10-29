import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import { auth } from '@/auth'
import { getOrCreateDefaultProfile } from '@/lib/db/profiles'
import { prisma } from '@/lib/prisma'
import type { Language } from '@prisma/client'

export async function GET(request: NextRequest) {
  await connection()
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawLang = searchParams.get('language')?.toUpperCase()
    const language: Language = rawLang === 'AR' ? 'AR' : 'EN'

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    })

    const profile = await getOrCreateDefaultProfile(session.user.id, language, {
      name: user?.name,
      email: user?.email,
    })

    return NextResponse.json({
      user,
      profile: {
        id: profile.id,
        language: profile.language,
        fullName: profile.fullName,
        headline: profile.headline,
        summary: profile.summary,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        websiteUrl: profile.websiteUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        isDefault: profile.isDefault,
      },
      experiences: profile.workExperiences,
      educations: profile.educations,
      skills: profile.skills,
      projects: profile.projects,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
