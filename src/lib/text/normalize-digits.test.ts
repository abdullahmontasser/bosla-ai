import { describe, expect, it } from 'vitest'

import { normalizeArabicDigits } from './normalize-digits'

describe('normalizeArabicDigits (covers: AC-10)', () => {
  it('converts Eastern Arabic Indic digits to Western digits', () => {
    expect(normalizeArabicDigits('زيادة الإيراد بنسبة ٤٠٪')).toBe('زيادة الإيراد بنسبة 40٪')
  })

  it('converts extended Persian digits to Western digits', () => {
    expect(normalizeArabicDigits('۴۰')).toBe('40')
  })

  it('leaves Western digits untouched', () => {
    expect(normalizeArabicDigits('40 users')).toBe('40 users')
  })

  it('normalizes text mixing Western and Arabic Indic digits', () => {
    expect(normalizeArabicDigits('خدمت ١٢٠٠ عميل في 40 دولة')).toBe('خدمت 1200 عميل في 40 دولة')
  })

  it('keeps non digit characters intact', () => {
    expect(normalizeArabicDigits('قاد فريقًا ٣ سنوات')).toBe('قاد فريقًا 3 سنوات')
  })
})
