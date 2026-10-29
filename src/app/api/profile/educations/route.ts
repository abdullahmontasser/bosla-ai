import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { EducationCreateSchema } from '@/lib/validations/profile'
import { createEducation } from '@/lib/db/profiles'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = EducationCreateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid education data' },
        { status: 400 },
      )
    }

    const education = await createEducation(session.user.id, parsed.data)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true, education }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create education'
    const status = message === 'Profile not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
