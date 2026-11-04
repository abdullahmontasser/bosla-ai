import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateResumePdfBuffer } from '@/lib/pdf/render'
import { formatDisplayDate, type AtsPdfData } from '@/lib/pdf/AtsResumeDocument'
import type { ResumeTemplateId } from '@/lib/pdf/templates'

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
            projects: true,
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
    const queryTemplate = (searchParams.get('template') ||
      searchParams.get('templateId')) as ResumeTemplateId | null
    const queryPageMode = searchParams.get('pageMode') as '1-page' | '2-pages' | null
    const queryAccentColor = searchParams.get('accentColor') || undefined
    const queryFontFamily = (searchParams.get('fontFamily') || searchParams.get('font')) as
      'sans' | 'serif' | 'mono' | undefined
    const queryDensity =
      (searchParams.get('density') as 'compact' | 'balanced' | 'relaxed') || undefined

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
        startDate: formatDisplayDate(e.startDate) || null,
        endDate: formatDisplayDate(e.endDate) || null,
        isCurrent: Boolean(e.isCurrent),
        bullets: (e.bullets || []).map((b) => ({
          rewritten: typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        })),
      })) ||
      resume.profile.workExperiences.map((w) => ({
        companyName: w.companyName,
        jobTitle: w.jobTitle,
        location: w.location,
        startDate: formatDisplayDate(w.startDate) || null,
        endDate: formatDisplayDate(w.endDate) || null,
        isCurrent: w.isCurrent,
        bullets: w.bullets.map((b) => ({ rewritten: b })),
      }))

    // Format educations
    const educations =
      content.educations?.map((edu) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || null,
        startDate: formatDisplayDate(edu.startDate) || null,
        endDate: formatDisplayDate(edu.endDate) || null,
      })) ||
      resume.profile.educations?.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: formatDisplayDate(edu.startDate) || null,
        endDate: formatDisplayDate(edu.endDate) || null,
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

    // Format projects
    const projects =
      resume.profile.projects?.map((p) => ({
        title: p.name,
        role: p.role,
        description: p.description,
        technologies: p.technologies,
      })) || []

    const pdfData: AtsPdfData = {
      language: targetLanguage,
      fullName: header.fullName || resume.profile.fullName || 'Candidate',
      headline: resume.profile.headline || null,
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
      projects,
      templateId: queryTemplate || 'harvard-classic',
      accentColor: queryAccentColor,
      fontFamily: queryFontFamily,
      pageMode: queryPageMode || undefined,
      density: queryDensity,
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

interface PdfBulletInput {
  rewritten?: string
  tailored?: string
  original?: string
}

interface PdfExperienceInput {
  companyName?: string
  jobTitle?: string
  location?: string | null
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  bullets?: Array<string | PdfBulletInput>
}

interface PdfEducationInput {
  institution?: string
  schoolName?: string
  degree?: string
  fieldOfStudy?: string | null
  startDate?: string
  endDate?: string
}

interface PdfProjectInput {
  title?: string
  name?: string
  role?: string | null
  description?: string | null
  technologies?: string[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    })

    if (!resume) {
      return NextResponse.json(
        { error: 'Tailored resume not found or access denied' },
        { status: 404 },
      )
    }

    const body = await req.json()

    const pdfData: AtsPdfData = {
      language:
        body.language === 'AR' || body.language === 'EN'
          ? body.language
          : (resume.language as 'EN' | 'AR') || 'EN',
      fullName: body.fullName || 'Candidate',
      headline: body.headline || null,
      email: body.email || '',
      phone: body.phone ?? null,
      location: body.location ?? null,
      linkedinUrl: body.linkedinUrl ?? null,
      githubUrl: body.githubUrl ?? null,
      websiteUrl: body.websiteUrl ?? null,
      summary: body.summary || '',
      experiences: (body.experiences || []).map((exp: PdfExperienceInput) => ({
        companyName: exp.companyName || '',
        jobTitle: exp.jobTitle || '',
        location: exp.location || null,
        startDate: formatDisplayDate(exp.startDate) || null,
        endDate: formatDisplayDate(exp.endDate) || null,
        isCurrent: Boolean(exp.isCurrent),
        bullets: (exp.bullets || []).map((b: string | PdfBulletInput) => ({
          rewritten: typeof b === 'string' ? b : b.rewritten || b.tailored || b.original || '',
        })),
      })),
      educations: (body.educations || []).map((edu: PdfEducationInput) => ({
        institution: edu.institution || edu.schoolName || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || null,
        startDate: formatDisplayDate(edu.startDate) || null,
        endDate: formatDisplayDate(edu.endDate) || null,
      })),
      categorizedSkills: body.categorizedSkills || [],
      skills: body.skills || [],
      projects: (body.projects || []).map((proj: PdfProjectInput) => ({
        title: proj.title || proj.name || '',
        role: proj.role || null,
        description: proj.description || null,
        technologies: proj.technologies || [],
      })),
      templateId: (body.templateId as ResumeTemplateId) || 'harvard-classic',
      accentColor: body.accentColor,
      fontFamily: body.fontFamily,
      pageMode: body.pageMode || '1-page',
      density: (body.density as 'compact' | 'balanced' | 'relaxed') || undefined,
    }

    // Synthesize vector PDF in server memory ephemerally
    const pdfBuffer = await generateResumePdfBuffer(pdfData)

    // Update lastExportedAt timestamp in database
    await prisma.tailoredResume.update({
      where: { id },
      data: { lastExportedAt: new Date() },
    })

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
    console.error('Failed to generate ATS PDF stream from canvas payload:', err)
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 })
  }
}
