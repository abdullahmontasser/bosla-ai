import { describe, expect, it } from 'vitest'

import { getActionWord, startsWithActionVerb } from './action-verbs'

describe('getActionWord (covers: AC-2, AC-10)', () => {
  it('lowercases and strips punctuation from the first word', () => {
    expect(getActionWord('Developed the platform.')).toBe('developed')
    expect(getActionWord('— Led a team')).toBe('led')
    expect(getActionWord('(Authored) three guides')).toBe('authored')
  })

  it('removes Arabic diacritics and tatweel from the first word', () => {
    expect(getActionWord('قَادَ فريق هندسة')).toBe('قاد')
    expect(getActionWord('طوّرت الأنظمة')).toBe('طورت')
  })

  it('collapses alef variants to the bare alef', () => {
    expect(getActionWord('أنشأت بوابة الخدمة')).toBe('انشات')
    expect(getActionWord('اطلقت المنتج')).toBe('اطلقت')
    expect(getActionWord('أطلقت المنتج')).toBe('اطلقت')
  })

  it('returns an empty string for an empty bullet', () => {
    expect(getActionWord('   ')).toBe('')
  })
})

describe('startsWithActionVerb (covers: AC-2, AC-10)', () => {
  it('recognizes English verbs regardless of case', () => {
    expect(startsWithActionVerb('Led the migration', 'EN')).toBe(true)
    expect(startsWithActionVerb('engineered a service', 'EN')).toBe(true)
    expect(startsWithActionVerb('Was responsible for', 'EN')).toBe(false)
    expect(startsWithActionVerb('Working on the pipeline', 'EN')).toBe(false)
  })

  it('recognizes Arabic verbs including feminine forms', () => {
    expect(startsWithActionVerb('طور نظام الفاتورة', 'AR')).toBe(true)
    expect(startsWithActionVerb('قامت الفرق بمراجعة المعايير', 'AR')).toBe(true)
    expect(startsWithActionVerb('صممت الهوية البصرية', 'AR')).toBe(true)
  })

  it('matches Arabic verbs when hamza spellings differ', () => {
    // The set records 'أدارت'; a bullet spelled with alef hamza below matches.
    expect(startsWithActionVerb('إدارت عملية الترحيل', 'AR')).toBe(true)
    expect(startsWithActionVerb('أدارت عملية الترحيل', 'AR')).toBe(true)
  })

  it('scores English bullets against the English verbs only', () => {
    // 'قاد' is an Arabic verb; an English profile bullet starting with it is
    // not judged as a strong start.
    expect(startsWithActionVerb('قاد the migration', 'EN')).toBe(false)
  })

  it('rejects bullets that start with no word', () => {
    expect(startsWithActionVerb('***', 'EN')).toBe(false)
    expect(startsWithActionVerb('', 'AR')).toBe(false)
  })
})
