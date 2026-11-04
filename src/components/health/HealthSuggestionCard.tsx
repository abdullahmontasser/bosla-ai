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

/**
 * Strips the redundant leading `"${originalText}" ` quote from rationale when
 * originalText is already rendered in the quote block right above it.
 */
function formatConciseRationale(rationale: string, rawOriginal: string): string {
  const trimmedOrig = rawOriginal.trim()
  if (!trimmedOrig) return rationale

  const quotedPrefix = `"${trimmedOrig}"`
  if (rationale.startsWith(quotedPrefix)) {
    const remainder = rationale.slice(quotedPrefix.length).trim()
    if (remainder.length > 0) {
      return remainder.charAt(0).toUpperCase() + remainder.slice(1)
    }
  }
  return rationale
}

export function HealthSuggestionCard({ card, dict }: HealthSuggestionCardProps) {
  const t = (dict.health || {}) as Partial<HealthDictionary>
  const targetLabel = resolveTargetLabel(card, t, (value) => String(value))
  const hasOriginal = card.originalText.trim().length > 0
  const originalText = hasOriginal ? card.originalText : t.notSet || ''
  const conciseRationale = formatConciseRationale(card.rationale, card.originalText)
  const showProposed = Boolean(
    card.proposedText && card.proposedText.trim().length > 0 && !card.isAiStale,
  )

  return (
    <div
      className="rounded-[8px] border border-border/80 bg-card p-4 space-y-3 shadow-xs"
      data-target-kind={card.targetKind}
      data-target-id={card.targetId ?? undefined}
      data-fingerprint={card.fingerprint}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-foreground">{card.title}</p>
          {targetLabel && (
            <span className="rounded-[3px] border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {targetLabel}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {card.isAiStale && (
            <Badge
              variant="outline"
              className="rounded-[3px] border-amber-500/30 bg-amber-500/10 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
            >
              {t.aiStaleBadge || 'Text changed'}
            </Badge>
          )}
          {card.isAiGenerated && !card.isAiStale && (
            <Badge
              variant="secondary"
              className="rounded-[3px] border border-primary/20 bg-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary"
            >
              {t.aiBadge || 'AI generated'}
            </Badge>
          )}
        </div>
      </div>

      {originalText && (
        <div className="rounded-[6px] border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
            {t.originalLabel || 'Before'}
          </span>
          <p className="whitespace-pre-wrap leading-relaxed">{originalText}</p>
        </div>
      )}

      {showProposed && (
        <div className="rounded-[6px] border border-primary/30 border-s-2 border-s-primary bg-primary/[0.06] p-3 text-xs font-medium text-foreground space-y-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
            {t.aiBadge ? `${t.aiBadge} — Rewrite` : 'After — AI Rewrite'}
          </span>
          <p className="whitespace-pre-wrap leading-relaxed font-medium">{card.proposedText}</p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-foreground/85">{conciseRationale}</p>
    </div>
  )
}
