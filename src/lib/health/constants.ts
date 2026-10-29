/**
 * Constants for the base resume health audit (spec 0014).
 */

export const HEALTH_RULE_SET_VERSION = '1'

export const CATEGORY_WEIGHTS = {
  IMPACT_METRICS: 30,
  ACTION_VERBS: 20,
  ATS_COMPLETENESS: 25,
  CONTENT_DEPTH: 25,
} as const

// The share of quantified bullets at which the impact category reaches 100.
export const IMPACT_FULL_RATIO = 0.6

export const COMPLETENESS_CHECK_WEIGHTS = {
  contact_block: 30,
  summary_present: 20,
  role_block: 25,
  skills: 15,
  education: 10,
} as const

export const DEPTH_CHECK_WEIGHTS = {
  role_coverage: 25,
  avg_bullet_length: 25,
  no_duplicates: 25,
  summary_words: 25,
} as const

export const MIN_SUMMARY_WORDS = 30
export const MIN_AVG_BULLET_WORDS = 8
export const MIN_BULLET_WORDS = 8
export const MIN_SKILLS_COUNT = 5
export const MIN_ROLE_BULLETS = 2

export const SCORE_BANDS = { fair: 50, strong: 75, excellent: 90 } as const

export type HealthScoreBand = 'needs_work' | 'fair' | 'strong' | 'excellent'

/** Bands at 50 (fair), 75 (strong), and 90 (excellent) per spec 0014 AC-2. */
export function healthBand(score: number): HealthScoreBand {
  if (score >= SCORE_BANDS.excellent) return 'excellent'
  if (score >= SCORE_BANDS.strong) return 'strong'
  if (score >= SCORE_BANDS.fair) return 'fair'
  return 'needs_work'
}

export const AI_REWRITE_LIMIT = 10
export const AI_REWRITE_WINDOW_MS = 600000
export const AI_REWRITE_TIMEOUT_MS = 30000
export const UNDO_WINDOW_MS = 10000
