import { Badge } from '@/components/ui/badge'
import type { HealthSuggestionDTO } from '@/lib/health/queries'
import type { Dictionary, HealthDictionary } from '@/lib/i18n/types'

export interface HealthSuggestionCardProps {
  card: HealthSuggestionDTO
  dict: Dictionary
}

/** Names the line or field the card anchors to, from dictionary labels. */
function resolveTargetLabel(
  card: HealthSuggestionDTO,
  t: Partial<HealthDictionary>,
  localeDigits: (value: number) => string,
): string | null {
  const fieldLabels: Record<string, string> = {
    email: t.fieldEmail || 'Email',
    phone: t.fieldPhone || 'Phone',
    location: t.fieldLocation || 'Location',
    linkedinUrl: t.fieldLinkedin || 'LinkedIn',
    websiteUrl: t.fieldWebsite || 'Website',
    githubUrl: t.fieldGithub || 'GitHub',
  }

  switch (card.targetKind) {
    case 'WORK_EXPERIENCE_BULLET':
      return card.targetIndex === null
        ? t.fieldBullet || 'Bullet'
        : `${t.fieldBullet || 'Bullet'} · ${localeDigits(card.targetIndex + 1)}`
    case 'WORK_EXPERIENCE':
      return t.fieldRole || 'Role'
    case 'PROFILE_SUMMARY':
      return t.fieldSummary || 'Professional summary'
    case 'PROFILE_CONTACT':
      return card.targetField ? fieldLabels[card.targetField] || card.targetField : null
    case 'PROFILE_SKILLS':
      return t.fieldSkills || 'Skills'
    case 'PROFILE_EDUCATION':
      return t.fieldEducation || 'Education'
    case 'PROFILE_GENERAL':
      return null
  }
}

export function HealthSuggestionCard({ card, dict }: HealthSuggestionCardProps) {
  const t = (dict.health || {}) as Partial<HealthDictionary>
  const targetLabel = resolveTargetLabel(card, t, (value) => String(value))
  const originalText = card.originalText.trim().length > 0 ? card.originalText : t.notSet || ''

  return (
    <div
      className="rounded-lg border border-border/60 bg-muted/20 p-3"
      data-target-kind={card.targetKind}
      data-target-id={card.targetId ?? undefined}
      data-fingerprint={card.fingerprint}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{card.title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {card.isAiStale && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
            >
              {t.aiStaleBadge || 'Text changed'}
            </Badge>
          )}
          {card.isAiGenerated && !card.isAiStale && (
            <Badge variant="secondary" className="text-[10px]">
              {t.aiBadge || 'AI generated'}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {targetLabel && (
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {targetLabel}
          </span>
        )}
        <p className="text-xs whitespace-pre-wrap text-muted-foreground">{originalText}</p>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-foreground/90">{card.rationale}</p>
    </div>
  )
}
