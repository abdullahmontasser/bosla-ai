import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AvatarUpdateInputSchema } from '@/lib/validations/profile'
import { updateUserAvatar } from '@/lib/db/profiles'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('u')
    const session = await auth()
    const targetUserId = queryUserId || session?.user?.id

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { image: true },
    })

    if (!user?.image) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    if (user.image.startsWith('data:')) {
      const commaIndex = user.image.indexOf(',')
      if (commaIndex === -1) {
        return NextResponse.json({ error: 'Invalid data URI' }, { status: 400 })
      }
      const meta = user.image.slice(5, commaIndex)
      const mimeType = meta.split(';')[0] || 'image/webp'
      const base64Data = user.image.slice(commaIndex + 1)
      const buffer = Buffer.from(base64Data, 'base64')

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Content-Length': String(buffer.length),
        },
      })
    }

    return NextResponse.redirect(user.image)
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = AvatarUpdateInputSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid avatar payload' },
        { status: 400 },
      )
    }

    const updatedUser = await updateUserAvatar(session.user.id, parsed.data.image)

    // Revalidate relevant pages so updated avatar reflects immediately
    revalidatePath('/en/profile')
    revalidatePath('/ar/profile')
    revalidatePath('/en/tailor')
    revalidatePath('/ar/tailor')
    revalidatePath('/en/resume')
    revalidatePath('/ar/resume')

    return NextResponse.json({
      success: true,
      image: updatedUser.image,
    })
  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}
