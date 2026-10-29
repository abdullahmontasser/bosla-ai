import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { ProjectUpdateSchema } from '@/lib/validations/profile'
import { updateProject, deleteProject } from '@/lib/db/profiles'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const json = await request.json()
    const parsed = ProjectUpdateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid project data' },
        { status: 400 },
      )
    }

    const project = await updateProject(session.user.id, id, parsed.data)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true, project })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project'
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
    await deleteProject(session.user.id, id)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete project'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
