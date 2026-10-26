import { z } from 'zod'

export const ALLOWED_EVENT_NAMES = [
  'page_view',
  'benchmark_preset_selected',
  'studio_cta_clicked',
  'github_outbound_clicked',
] as const

export const TelemetryEventSchema = z.object({
  name: z
    .string()
    .min(1, 'Event name cannot be empty')
    .max(64, 'Event name cannot exceed 64 characters')
    .regex(
      /^[a-z0-9_]{1,64}$/,
      'Event name must contain only lowercase alphanumeric characters and underscores',
    ),
  locale: z.string().min(1, 'Locale cannot be empty').max(8, 'Locale cannot exceed 8 characters'),
  path: z.string().min(1, 'Path cannot be empty').max(255, 'Path cannot exceed 255 characters'),
  anonymousId: z.string().max(64, 'Anonymous ID cannot exceed 64 characters').optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type TelemetryEventInput = z.infer<typeof TelemetryEventSchema>
