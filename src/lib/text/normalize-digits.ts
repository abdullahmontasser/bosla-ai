/**
 * Shared Arabic digit normalization. The health audit compares numbers
 * between a proposed rewrite and its source, and the ATS and health engines
 * both detect concrete measures. Arabic Indic digits must be readable as
 * Western digits in both languages (spec 0014).
 */

// U+0660 to U+0669 are the Eastern Arabic Indic digits used in Arabic text,
// U+06F0 to U+06F9 are their extended (Persian) counterparts.
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g
const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/g

function mapDigit(character: string, startCode: number): string {
  return String(character.charCodeAt(0) - startCode)
}

/**
 * Converts every Arabic Indic digit in the text to its Western digit so
 * numeric comparison and measure detection work in both languages.
 */
export function normalizeArabicDigits(text: string): string {
  return text
    .replace(ARABIC_INDIC_DIGITS, (character) => mapDigit(character, 0x0660))
    .replace(EXTENDED_ARABIC_INDIC_DIGITS, (character) => mapDigit(character, 0x06f0))
}
