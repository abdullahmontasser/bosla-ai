import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { WorkExperienceUpdateSchema } from '@/lib/validations/profile'
import { updateWorkExperience, deleteWorkExperience } from '@/lib/db/profiles'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const json = await request.json()
    const parsed = WorkExperienceUpdateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid experience data' },
        { status: 400 },
      )
    }

    const experience = await updateWorkExperience(session.user.id, id, parsed.data)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true, experience })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update work experience'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteWorkExperience(session.user.id, id)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete work experience'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
