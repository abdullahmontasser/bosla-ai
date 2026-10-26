'use server'

import { auth } from '@/auth'
import type { ApplicationStatus } from '@prisma/client'
import {
  CreateApplicationSchema,
  UpdateApplicationDetailsSchema,
  UpdateApplicationStatusAndOrderSchema,
  type CreateApplicationInput,
  type UpdateApplicationDetailsInput,
} from '@/lib/validations/application'
import {
  getApplications as dbGetApplications,
  createApplication as dbCreateApplication,
  updateApplicationStatusAndOrder as dbUpdateApplicationStatusAndOrder,
  updateApplicationDetails as dbUpdateApplicationDetails,
  deleteApplication as dbDeleteApplication,
  type ApplicationWithRelations,
} from '@/lib/db/applications'

export async function getApplications(): Promise<{
  success: boolean
  applications: ApplicationWithRelations[]
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', applications: [] }
  }

  try {
    const applications = await dbGetApplications(session.user.id)
    return { success: true, applications }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch applications',
      applications: [],
    }
  }
}

export async function updateApplicationStatusAndOrder(
  applicationId: string,
  status: ApplicationStatus,
  sortOrder: number,
): Promise<{
  success: boolean
  application?: ApplicationWithRelations
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = UpdateApplicationStatusAndOrderSchema.safeParse({
    applicationId,
    status,
    sortOrder,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const application = await dbUpdateApplicationStatusAndOrder(
      session.user.id,
      parsed.data.applicationId,
      parsed.data.status as ApplicationStatus,
      parsed.data.sortOrder,
    )
    return { success: true, application }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update application status and order',
    }
  }
}

export async function createApplication(payload: CreateApplicationInput): Promise<{
  success: boolean
  application?: ApplicationWithRelations
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = CreateApplicationSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const application = await dbCreateApplication(session.user.id, parsed.data)
    return { success: true, application }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create application',
    }
  }
}

export async function updateApplicationDetails(payload: UpdateApplicationDetailsInput): Promise<{
  success: boolean
  application?: ApplicationWithRelations
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = UpdateApplicationDetailsSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  try {
    const application = await dbUpdateApplicationDetails(session.user.id, parsed.data)
    return { success: true, application }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update application details',
    }
  }
}

export async function deleteApplication(applicationId: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!applicationId) {
    return { success: false, error: 'Application ID is required' }
  }

  try {
    const success = await dbDeleteApplication(session.user.id, applicationId)
    return { success }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete application',
    }
  }
}
