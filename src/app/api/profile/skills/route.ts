import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { SkillCreateSchema } from '@/lib/validations/profile'
import {
  createSkill,
  deleteAllSkills,
  deleteCategorySkills,
  clearCategorySkills,
  clearAllSkillCategories,
} from '@/lib/db/profiles'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = SkillCreateSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid skill data' },
        { status: 400 },
      )
    }

    const skill = await createSkill(session.user.id, parsed.data)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true, skill }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create skill'
    const status = message === 'Profile not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let body: { profileId?: string; action?: string; category?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Body is optional if parameters are in query string
    }

    const profileId = body.profileId || searchParams.get('profileId')
    const action = body.action || searchParams.get('action') || 'all'
    const category = body.category || searchParams.get('category')

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    if (action === 'clear-all-categories') {
      await clearAllSkillCategories(session.user.id, profileId)
    } else if (action === 'clear-category') {
      if (!category) {
        return NextResponse.json(
          { error: 'Category is required for clear-category' },
          { status: 400 },
        )
      }
      await clearCategorySkills(session.user.id, profileId, category)
    } else if (action === 'category') {
      if (!category) {
        return NextResponse.json(
          { error: 'Category is required for category deletion' },
          { status: 400 },
        )
      }
      await deleteCategorySkills(session.user.id, profileId, category)
    } else {
      // Default: delete all skills for this profile
      await deleteAllSkills(session.user.id, profileId)
    }

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true, action, category })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process skills action'
    const status = message === 'Profile not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
