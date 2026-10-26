import { describe, it, expect } from 'vitest'
import {
  calculateSortOrder,
  needsRebalance,
  generateRebalancedOrders,
  isFollowUpRequired,
  DEFAULT_SORT_SPACING,
} from './kanban-utils'

describe('Kanban Math and Staleness Utilities (AC-3, AC-8)', () => {
  describe('calculateSortOrder', () => {
    it('returns default sort spacing when column is empty', () => {
      const order = calculateSortOrder(null, null)
      expect(order).toBe(DEFAULT_SORT_SPACING)
    })

    it('returns half of nextSortOrder when inserting before first positive card', () => {
      const order = calculateSortOrder(null, 1000.0)
      expect(order).toBe(500.0)
    })

    it('returns nextSortOrder minus default spacing when inserting before non-positive card', () => {
      const order = calculateSortOrder(null, 0)
      expect(order).toBe(-1000.0)
    })

    it('returns prevSortOrder plus default spacing when inserting after last card', () => {
      const order = calculateSortOrder(2000.0, null)
      expect(order).toBe(3000.0)
    })

    it('returns midpoint when inserting between two cards', () => {
      const order = calculateSortOrder(1000.0, 2000.0)
      expect(order).toBe(1500.0)
    })
  })

  describe('needsRebalance', () => {
    it('returns false if less than 2 cards', () => {
      expect(needsRebalance([])).toBe(false)
      expect(needsRebalance([1000.0])).toBe(false)
    })

    it('returns false if spacing is above threshold', () => {
      expect(needsRebalance([1000.0, 1001.0, 2000.0])).toBe(false)
    })

    it('returns true if any adjacent delta is below threshold', () => {
      expect(needsRebalance([1000.0, 1000.00005, 2000.0])).toBe(true)
    })
  })

  describe('generateRebalancedOrders', () => {
    it('generates spaced values starting at 1000', () => {
      const orders = generateRebalancedOrders(3)
      expect(orders).toEqual([1000.0, 2000.0, 3000.0])
    })
  })

  describe('isFollowUpRequired (AC-8)', () => {
    const referenceDate = new Date('2026-10-26T12:00:00Z')

    it('returns false for APPLIED if appliedAt is null', () => {
      expect(isFollowUpRequired('APPLIED', null, null, referenceDate)).toBe(false)
    })

    it('returns false for APPLIED if applied within 7 days', () => {
      const recent = new Date('2026-10-22T12:00:00Z') // 4 days ago
      expect(isFollowUpRequired('APPLIED', recent, null, referenceDate)).toBe(false)
    })

    it('returns true for APPLIED if applied more than 7 days ago', () => {
      const old = new Date('2026-10-15T12:00:00Z') // 11 days ago
      expect(isFollowUpRequired('APPLIED', old, null, referenceDate)).toBe(true)
    })

    it('returns false for INTERVIEWING if interviewDate is null', () => {
      expect(isFollowUpRequired('INTERVIEWING', null, null, referenceDate)).toBe(false)
    })

    it('returns false for INTERVIEWING if interviewDate is in the future', () => {
      const future = new Date('2026-10-28T12:00:00Z')
      expect(isFollowUpRequired('INTERVIEWING', null, future, referenceDate)).toBe(false)
    })

    it('returns true for INTERVIEWING if interviewDate has passed', () => {
      const past = new Date('2026-10-24T12:00:00Z')
      expect(isFollowUpRequired('INTERVIEWING', null, past, referenceDate)).toBe(true)
    })

    it('returns false for SAVED, OFFER, REJECTED even with past dates', () => {
      const past = new Date('2026-10-10T12:00:00Z')
      expect(isFollowUpRequired('SAVED', past, past, referenceDate)).toBe(false)
      expect(isFollowUpRequired('OFFER', past, past, referenceDate)).toBe(false)
      expect(isFollowUpRequired('REJECTED', past, past, referenceDate)).toBe(false)
    })
  })
})
