import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { ReorderInputSchema } from '@/lib/validations/profile'
import { reorderProfileItems } from '@/lib/db/profiles'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = ReorderInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid reorder payload' },
        { status: 400 },
      )
    }

    await reorderProfileItems(session.user.id, parsed.data.section, parsed.data.itemIds)

    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering items:', error)
    const message = error instanceof Error ? error.message : 'Failed to reorder items'
    const status = message.includes('Unauthorized') || message.includes('missing') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
