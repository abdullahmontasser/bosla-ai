import arabicReshaperPkg from 'arabic-persian-reshaper'
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const ArabicShaper = arabicReshaperPkg.ArabicShaper || arabicReshaperPkg.default?.ArabicShaper

/**
 * Checks if a string contains Arabic characters.
 */
export function hasArabicCharacters(text: string): boolean {
  if (!text) return false
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)
}

/**
 * Shapes Arabic text for PDF rendering by applying cursive letter joining
 * and bidirectional reordering.
 */
export function shapeArabicText(text?: string | null): string {
  if (!text) return ''
  if (!hasArabicCharacters(text)) {
    return text
  }

  try {
    // 1. Reshape cursive letter forms
    const reshaped = ArabicShaper.convertArabic(text)

    // 2. Apply BiDi reordering for visual display in PDF engines
    const levels = bidi.getEmbeddingLevels(reshaped)
    return bidi.getReorderedString(reshaped, levels)
  } catch (err) {
    console.warn('Failed to shape Arabic text, falling back to raw text:', err)
    return text
  }
}
