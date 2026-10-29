/**
 * Shared action verb sets for the ATS scoring engine and the base resume
 * health audit. Both engines compare the first word of an experience bullet
 * against these sets, so the lists must live in one place (spec 0014).
 */

const ENGLISH_ACTION_VERBS = [
  'led',
  'developed',
  'architected',
  'built',
  'engineered',
  'designed',
  'managed',
  'created',
  'implemented',
  'optimized',
  'scaled',
  'spearheaded',
  'delivered',
  'automated',
  'orchestrated',
  'authored',
  'established',
  'revamped',
  'boosted',
  'accelerated',
  'launched',
  'mentored',
  'reduced',
  'increased',
  'improved',
  'achieved',
  'saved',
  'generated',
  'transformed',
  'formulated',
  'streamlined',
  'directed',
  'executed',
  'drove',
  'integrated',
  'pioneered',
  'produced',
  'resolved',
]

const ARABIC_ACTION_VERBS = [
  'قاد',
  'طور',
  'بنى',
  'هندس',
  'صمم',
  'أدار',
  'أنشأ',
  'نفذ',
  'حسن',
  'أطلق',
  'حقق',
  'وفر',
  'أتمت',
  'أشرف',
  'ابتكر',
  'حدث',
  'عزز',
  'خفض',
  'زاد',
  'نظم',
  'صاغ',
  'أنجز',
  'وسع',
  'مكن',
  'باشر',
  'أسس',
  'قامت',
  'طورت',
  'بنت',
  'صممت',
  'أدارت',
  'نفذت',
  'حققت',
]

// U+064B to U+0652 are the Arabic vowel marks (tashkeel), U+0670 is the
// superscript alef, U+0640 is the tatweel lengthener.
const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g

function stripArabicDiacritics(word: string): string {
  return word.replace(ARABIC_DIACRITICS, '')
}

function normalizeAlef(word: string): string {
  // U+0623 (alef hamza above), U+0625 (alef hamza below), U+0622 (alef madda)
  // and U+0671 (alef wasla) all collapse to the bare alef U+0627.
  return word.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
}

/**
 * Returns the normalized first word of a bullet for verb comparison:
 * lowercase, punctuation stripped, Arabic diacritics removed, and alef
 * variants collapsed so hamza spellings match the bare form.
 */
export function getActionWord(bullet: string): string {
  const tokens = bullet.trim().split(/\s+/)
  // Skip leading tokens that carry no letters or digits (bullet markers,
  // dashes, or brackets) so the semantic first word is compared.
  for (const token of tokens) {
    const cleaned = token.toLowerCase().replace(/[^\w\u0600-\u06FF]/g, '')
    if (cleaned) {
      return normalizeAlef(stripArabicDiacritics(cleaned))
    }
  }
  return ''
}

const normalizedEnglishVerbs = new Set(ENGLISH_ACTION_VERBS.map((verb) => getActionWord(verb)))

const normalizedArabicVerbs = new Set(ARABIC_ACTION_VERBS.map((verb) => getActionWord(verb)))

/**
 * Checks whether a bullet starts with a strong action verb for the given
 * language. The English and Arabic sets are independent: an Arabic line is
 * judged against the Arabic verbs only.
 */
export function startsWithActionVerb(bullet: string, language: 'EN' | 'AR'): boolean {
  const word = getActionWord(bullet)
  if (!word) return false
  const verbs = language === 'AR' ? normalizedArabicVerbs : normalizedEnglishVerbs
  return verbs.has(word)
}

export const ENGLISH_ACTION_VERBS_SET: ReadonlySet<string> = normalizedEnglishVerbs
export const ARABIC_ACTION_VERBS_SET: ReadonlySet<string> = normalizedArabicVerbs
