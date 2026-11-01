'use server'

import { auth } from '@/auth'
import { getCareerPrepSelectorRows } from '@/lib/db/career-prep'

export async function getCareerPrepSelectorRowsAction(offset: number = 0) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const data = await getCareerPrepSelectorRows(session.user.id, {
      offset,
      limit: 50,
    })
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load selector rows'
    return { success: false, error: message }
  }
}
