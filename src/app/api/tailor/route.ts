import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProfileById } from '@/lib/db/profiles'
import { TailorPayloadSchema } from '@/lib/validations/tailor'
import {
  buildTailoringSystemPrompt,
  buildTailoringUserPrompt,
  createTailoredSnapshot,
} from '@/lib/ai/tailor-prompt'
import { getProviderModel } from '@/lib/ai/provider-client'
import { streamText } from 'ai'

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
    jobPosting = await prisma.jobPosting.create({
      data: {
        userId: session.user.id,
        title: payload.jobTitle,
        companyName: payload.companyName,
        rawDescription: payload.rawJobDescription,
        parsedSkills: [],
      },
    })

    tailoredResume = await prisma.tailoredResume.create({
      data: {
        userId: session.user.id,
        profileId: profile.id,
        jobPostingId: jobPosting.id,
        language: payload.language,
        title: `${payload.companyName} - ${payload.jobTitle}`,
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
    language: payload.language,
  })

  // Handle client abort
  req.signal.addEventListener('abort', async () => {
    try {
      const current = await prisma.tailoredResume.findUnique({
        where: { id: tailoredResume.id },
      })
      if (current && current.status === 'GENERATING') {
        await prisma.tailoredResume.update({
          where: { id: tailoredResume.id },
          data: { status: 'FAILED' },
        })
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
          try {
            await prisma.tailoredResume.update({
              where: { id: tailoredResume.id },
              data: { status: 'FAILED' },
            })
          } catch {
            // Ignore failure
          }
        }
      },
      onError: async (error) => {
        console.error('AI streaming error:', error)
        try {
          await prisma.tailoredResume.update({
            where: { id: tailoredResume.id },
            data: { status: 'FAILED' },
          })
        } catch {
          // Ignore failure
        }
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
    try {
      await prisma.tailoredResume.update({
        where: { id: tailoredResume.id },
        data: { status: 'FAILED' },
      })
    } catch {
      // Ignore failure
    }

    return NextResponse.json({ error: 'Failed to start AI generation stream' }, { status: 502 })
  }
}
