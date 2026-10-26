import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { TelemetryEventInput } from '@/lib/validations/telemetry'

export async function recordAnalyticsEvent(input: TelemetryEventInput) {
  return prisma.analyticsEvent.create({
    data: {
      name: input.name,
      locale: input.locale,
      path: input.path,
      anonymousId: input.anonymousId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })
}

export async function pruneOldAnalyticsEvents(retentionDays = 30): Promise<{ count: number }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const result = await prisma.analyticsEvent.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  return { count: result.count }
}

export async function getAnalyticsEventCount(name?: string): Promise<number> {
  return prisma.analyticsEvent.count({
    where: name ? { name } : undefined,
  })
}
