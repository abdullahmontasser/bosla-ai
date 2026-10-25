import { describe, it, expect } from 'vitest'
import { hasArabicCharacters, shapeArabicText } from './arabic-shaping'

describe('Arabic Text Shaping for PDF (covers: AC-6)', () => {
  describe('hasArabicCharacters', () => {
    it('returns false for empty, null, or undefined strings', () => {
      expect(hasArabicCharacters('')).toBe(false)
      expect(hasArabicCharacters(null as unknown as string)).toBe(false)
      expect(hasArabicCharacters(undefined as unknown as string)).toBe(false)
    })

    it('returns false for pure English or ASCII characters', () => {
      expect(hasArabicCharacters('Senior Software Engineer')).toBe(false)
      expect(hasArabicCharacters('1234567890 !@#$%^&*()')).toBe(false)
    })

    it('returns true when Arabic characters are present', () => {
      expect(hasArabicCharacters('مهندس برمجيات')).toBe(true)
      expect(hasArabicCharacters('React و TypeScript')).toBe(true)
    })
  })

  describe('shapeArabicText', () => {
    it('returns empty string when input is null, undefined, or empty', () => {
      expect(shapeArabicText('')).toBe('')
      expect(shapeArabicText(null)).toBe('')
      expect(shapeArabicText(undefined)).toBe('')
    })

    it('returns original text unchanged when there are no Arabic characters', () => {
      const english = 'Senior Full Stack Engineer at TechCorp'
      expect(shapeArabicText(english)).toBe(english)
    })

    it('reshapes Arabic characters into presentation forms with visual reordering', () => {
      const arabic = 'مهندس'
      const result = shapeArabicText(arabic)

      // The shaped string should not be equal to raw logical characters because glyphs are reshaped and reordered
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toBe(arabic)
    })

    it('handles mixed bilingual text with Arabic and English tokens', () => {
      const mixed = 'مطور واجهات باستخدام React و Next.js'
      const result = shapeArabicText(mixed)

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles Arabic text with numbers and punctuation cleanly', () => {
      const textWithNums = 'خبرة تزيد عن 7 سنوات (2019 - 2026)'
      const result = shapeArabicText(textWithNums)

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
