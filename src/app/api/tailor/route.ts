import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProfileById } from '@/lib/db/profiles'
import { upsertJobPosting } from '@/lib/db/job-postings'
import { TailorPayloadSchema } from '@/lib/validations/tailor'
import {
  buildTailoringSystemPrompt,
  buildTailoringUserPrompt,
  createTailoredSnapshot,
} from '@/lib/ai/tailor-prompt'
import { getProviderModel } from '@/lib/ai/provider-client'
import { streamText } from 'ai'

async function markResumeFailed(id: string) {
  try {
    await prisma.tailoredResume.update({
      where: { id },
      data: { status: 'FAILED' },
    })
  } catch {
    // Ignore cleanup failure
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = TailorPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    )
  }

  const payload = parsed.data

  const activeSettings = await getActiveProviderSettings(session.user.id)
  if (!activeSettings.length) {
    return NextResponse.json(
      {
        error: 'No active AI provider configured. Please configure an active provider in settings.',
      },
      { status: 400 },
    )
  }

  const activeSetting = activeSettings[0]

  const profile = await getProfileById(session.user.id, payload.profileId)
  if (!profile) {
    return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
  }

  let model
  try {
    model = getProviderModel(activeSetting)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid provider configuration'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  let jobPosting
  let tailoredResume
  try {
    const normalizedTitle = payload.jobTitle.trim()
    const normalizedCompany = payload.companyName.trim()

    // Deduplicate job posting by userId, title, and companyName
    jobPosting = await upsertJobPosting(session.user.id, {
      title: normalizedTitle,
      companyName: normalizedCompany,
      rawDescription: payload.rawJobDescription,
    })

    tailoredResume = await prisma.tailoredResume.create({
      data: {
        userId: session.user.id,
        profileId: profile.id,
        jobPostingId: jobPosting.id,
        language: payload.language,
        title: `${normalizedCompany} - ${normalizedTitle}`,
        status: 'GENERATING',
        tailoredContent: {},
      },
    })
  } catch (err) {
    console.error('Failed to initialize database records for tailoring:', err)
    return NextResponse.json({ error: 'Failed to create resume records' }, { status: 500 })
  }

  const systemPrompt = buildTailoringSystemPrompt(payload.language)
  const userPrompt = buildTailoringUserPrompt({
    jobTitle: payload.jobTitle,
    companyName: payload.companyName,
    rawJobDescription: payload.rawJobDescription,
    candidateHeadline: profile.headline,
    candidateSummary: profile.summary,
    candidateExperiences: profile.workExperiences.map((w) => ({
      companyName: w.companyName,
      jobTitle: w.jobTitle,
      bullets: w.bullets,
    })),
    candidateProjects: (profile.projects || []).map((p) => ({
      title: p.name,
      role: p.role,
      description: p.description,
      bullets: p.technologies,
    })),
    candidateEducation: (profile.educations || []).map((e) => ({
      schoolName: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
    })),
    language: payload.language,
    customInstructions: payload.customInstructions,
    excludedSkills: payload.excludedSkills,
  })

  // Handle client abort
  req.signal.addEventListener('abort', async () => {
    try {
      const current = await prisma.tailoredResume.findUnique({
        where: { id: tailoredResume.id },
      })
      if (current && current.status === 'GENERATING') {
        await markResumeFailed(tailoredResume.id)
      }
    } catch {
      // ignore cleanup error
    }
  })

  try {
    const result = streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      abortSignal: req.signal,
      onFinish: async ({ text }) => {
        try {
          const snapshot = createTailoredSnapshot(
            payload.jobTitle,
            profile.workExperiences.map((w) => ({
              companyName: w.companyName,
              jobTitle: w.jobTitle,
              bullets: w.bullets,
            })),
            text,
          )

          await prisma.tailoredResume.update({
            where: { id: tailoredResume.id },
            data: {
              status: 'COMPLETED',
              tailoredSummary: snapshot.tailoredSummary,
              tailoredContent: snapshot as unknown as Prisma.InputJsonValue,
            },
          })
        } catch (finishErr) {
          console.error('Failed to finalize tailored resume record:', finishErr)
          await markResumeFailed(tailoredResume.id)
        }
      },
      onError: async (error) => {
        console.error('AI streaming error:', error)
        await markResumeFailed(tailoredResume.id)
      },
    })

    return result.toTextStreamResponse({
      headers: {
        'x-tailored-resume-id': tailoredResume.id,
        'x-job-posting-id': jobPosting.id,
      },
    })
  } catch (err) {
    console.error('Failed to initiate AI stream:', err)
    await markResumeFailed(tailoredResume.id)

    return NextResponse.json({ error: 'Failed to start AI generation stream' }, { status: 502 })
  }
}
