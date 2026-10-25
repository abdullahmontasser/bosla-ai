import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateResumePdfBuffer } from '@/lib/pdf/render'
import type { AtsPdfData } from '@/lib/pdf/AtsResumeDocument'

interface SnapshotBullet {
  original?: string
  rewritten?: string
  tailored?: string
}

interface SnapshotExperience {
  companyName?: string
  jobTitle?: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  bullets?: Array<string | SnapshotBullet>
}

interface SnapshotEducation {
  institution?: string
  degree?: string
  fieldOfStudy?: string | null
  startDate?: string | null
  endDate?: string | null
}

interface SnapshotSkill {
  name?: string
  category?: string | null
}

interface SnapshotContent {
  candidateHeader?: {
    fullName?: string
    email?: string
    phone?: string
    location?: string
    linkedinUrl?: string
    githubUrl?: string
    websiteUrl?: string
  }
  tailoredExperiences?: SnapshotExperience[]
  educations?: SnapshotEducation[]
  skills?: SnapshotSkill[]
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const resume = await prisma.tailoredResume.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        jobPosting: true,
        profile: {
          include: {
            skills: true,
            workExperiences: true,
            educations: true,
          },
        },
      },
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Tailored resume not found or access denied' },
        { status: 404 },
      )
    }

    const searchParams = req.nextUrl.searchParams
    const queryLang = searchParams.get('lang')?.toUpperCase()
    const targetLanguage: 'EN' | 'AR' =
      queryLang === 'AR' || queryLang === 'EN' ? queryLang : (resume.language as 'EN' | 'AR')

    const content = (resume.tailoredContent as unknown as SnapshotContent) || {}
    const header = content.candidateHeader || {
      fullName: resume.profile.fullName,
      email: resume.profile.email,
      phone: resume.profile.phone,
      location: resume.profile.location,
      linkedinUrl: resume.profile.linkedinUrl,
      githubUrl: resume.profile.githubUrl,
      websiteUrl: resume.profile.websiteUrl,
    }

    // Format experiences
    const experiences =
      content.tailoredExperiences?.map((e) => ({
        companyName: e.companyName || '',
        jobTitle: e.jobTitle || '',
        location: e.location || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        isCurrent: Boolean(e.isCurrent),
        bullets: (e.bullets || []).map((b) => ({
          rewritten: typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        })),
      })) ||
      resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        location: w.location,
        startDate: w.startDate ? new Date(w.startDate).getFullYear().toString() : null,
        endDate: w.endDate ? new Date(w.endDate).getFullYear().toString() : null,
        isCurrent: w.isCurrent,
        bullets: w.bullets.map((b) => ({ rewritten: b })),
      }))

    // Format educations
    const educations =
      content.educations?.map((edu) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || null,
        startDate: edu.startDate || null,
        endDate: edu.endDate || null,
      })) ||
      resume.profile.educations?.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate ? new Date(edu.startDate).getFullYear().toString() : null,
        endDate: edu.endDate ? new Date(edu.endDate).getFullYear().toString() : null,
      })) ||
      []

    // Format skills
    const skills =
      content.skills?.map((s) => ({
        name: s.name || '',
        category: s.category || null,
      })) ||
      resume.profile.skills?.map((s) => ({
        name: s.name,
        category: s.category,
      })) ||
      []

    const pdfData: AtsPdfData = {
      language: targetLanguage,
      fullName: header.fullName || resume.profile.fullName || 'Candidate',
      email: header.email || resume.profile.email || '',
      phone: header.phone || resume.profile.phone,
      location: header.location || resume.profile.location,
      linkedinUrl: header.linkedinUrl || resume.profile.linkedinUrl,
      githubUrl: header.githubUrl || resume.profile.githubUrl,
      websiteUrl: header.websiteUrl || resume.profile.websiteUrl,
      summary: resume.tailoredSummary || resume.profile.summary,
      experiences,
      educations,
      skills,
    }

    // Synthesize vector PDF in server memory ephemerally
    const pdfBuffer = await generateResumePdfBuffer(pdfData)

    // Update lastExportedAt timestamp in database
    await prisma.tailoredResume.update({
      where: { id },
      data: { lastExportedAt: new Date() },
    })

    // Construct RFC 5987 compliant Content-Disposition header
    const sanitizedAscii = pdfData.fullName.replace(/[^\w\s-]/g, '').trim() || 'Candidate'
    const asciiFilename = `${sanitizedAscii.replace(/\s+/g, '_')}_Resume.pdf`
    const utf8Filename = encodeURIComponent(`${pdfData.fullName}_Resume.pdf`)
    const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, no-store, must-revalidate',
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Failed to generate ATS PDF stream:', err)
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 })
  }
}
