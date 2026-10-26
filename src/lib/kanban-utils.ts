/**
 * Kanban sorting math and staleness derivation utilities
 */

export const DEFAULT_SORT_SPACING = 1000.0
export const MIN_SORT_DELTA = 0.0001

/**
 * Computes fractional index for inserting a card at a given position in an array of sorted orders.
 */
export function calculateSortOrder(
  prevSortOrder: number | null | undefined,
  nextSortOrder: number | null | undefined,
): number {
  // Case 1: Empty column
  if (prevSortOrder == null && nextSortOrder == null) {
    return DEFAULT_SORT_SPACING
  }

  // Case 2: Inserting at top (before first card)
  if (prevSortOrder == null && nextSortOrder != null) {
    return nextSortOrder > 0 ? nextSortOrder / 2 : nextSortOrder - DEFAULT_SORT_SPACING
  }

  // Case 3: Inserting at bottom (after last card)
  if (prevSortOrder != null && nextSortOrder == null) {
    return prevSortOrder + DEFAULT_SORT_SPACING
  }

  // Case 4: Inserting between two cards
  if (prevSortOrder != null && nextSortOrder != null) {
    return (prevSortOrder + nextSortOrder) / 2
  }

  return DEFAULT_SORT_SPACING
}

/**
 * Checks if cards in a column need rebalancing because spacing is too narrow.
 */
export function needsRebalance(sortOrders: number[]): boolean {
  if (sortOrders.length < 2) return false
  for (let i = 1; i < sortOrders.length; i++) {
    if (Math.abs(sortOrders[i] - sortOrders[i - 1]) < MIN_SORT_DELTA) {
      return true
    }
  }
  return false
}

/**
 * Generates rebalanced sort orders starting at 1000.0 with 1000.0 increments.
 */
export function generateRebalancedOrders(count: number): number[] {
  return Array.from({ length: count }, (_, idx) => (idx + 1) * DEFAULT_SORT_SPACING)
}

/**
 * Determines whether an application requires follow up attention (AC-8).
 * - In APPLIED status past 7 days since appliedAt
 * - In INTERVIEWING status with interviewDate in the past
 */
export function isFollowUpRequired(
  status: string,
  appliedAt: Date | string | null | undefined,
  interviewDate: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  const refTime = referenceDate.getTime()

  if (status === 'APPLIED') {
    if (!appliedAt) return false
    const appliedTime = new Date(appliedAt).getTime()
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    return refTime - appliedTime > sevenDaysInMs
  }

  if (status === 'INTERVIEWING') {
    if (!interviewDate) return false
    const intTime = new Date(interviewDate).getTime()
    return intTime < refTime
  }

  return false
}

/**
 * Calculates days elapsed since a given date.
 */
export function calculateDaysAgo(
  date: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  if (!date) return null
  const time = new Date(date).getTime()
  return Math.max(0, Math.floor((referenceDate.getTime() - time) / (1000 * 60 * 60 * 24)))
}
