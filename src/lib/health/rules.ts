import { createHash } from 'node:crypto'

import {
  CATEGORY_WEIGHTS,
  COMPLETENESS_CHECK_WEIGHTS,
  DEPTH_CHECK_WEIGHTS,
  HEALTH_RULE_SET_VERSION,
  IMPACT_FULL_RATIO,
  MIN_AVG_BULLET_WORDS,
  MIN_BULLET_WORDS,
  MIN_ROLE_BULLETS,
  MIN_SKILLS_COUNT,
  MIN_SUMMARY_WORDS,
} from './constants'
import { getActionWord, startsWithActionVerb } from '@/lib/text/action-verbs'
import { normalizeArabicDigits } from '@/lib/text/normalize-digits'

/**
 * Deterministic rules for the base resume health audit. Every number the
 * audit displays comes from this pure module: profile data in, one score
 * and one issue card per failed check out, with no AI involved (spec 0014,
 * AC-2). A dismissed issue counts as satisfied so dismissals move the score.
 */

export type HealthLanguage = 'EN' | 'AR'
export type HealthCategoryValue =
  'IMPACT_METRICS' | 'ACTION_VERBS' | 'ATS_COMPLETENESS' | 'CONTENT_DEPTH'
export type HealthTargetKindValue =
  | 'WORK_EXPERIENCE_BULLET'
  | 'WORK_EXPERIENCE'
  | 'PROFILE_SUMMARY'
  | 'PROFILE_CONTACT'
  | 'PROFILE_SKILLS'
  | 'PROFILE_EDUCATION'
  | 'PROFILE_GENERAL'

// Bands and the score-to-band mapping live in ./constants so plain UI
// components can import them without dragging node:crypto into the bundle.
export { healthBand } from './constants'
export type { HealthScoreBand } from './constants'

export interface HealthExperienceInput {
  id: string
  companyName: string
  jobTitle: string
  bullets: string[]
}

export interface HealthEducationInput {
  id: string
  institution: string
  degree: string
  startDate: Date | null
  endDate: Date | null
}

export interface HealthProfileInput {
  id: string
  language: HealthLanguage
  fullName: string
  headline: string | null
  summary: string | null
  email: string | null
  phone: string | null
  location: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  workExperiences: HealthExperienceInput[]
  educations: HealthEducationInput[]
  skills: Array<{ id: string; name: string }>
}

export interface HealthIssue {
  category: HealthCategoryValue
  title: string
  rationale: string
  targetKind: HealthTargetKindValue
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
}

export type HealthIssueCard = HealthIssue & { fingerprint: string }

export interface HealthCategoryCheck {
  key: string
  satisfied: boolean
  dismissed: boolean
}

export interface HealthBreakdown {
  overallScore: number
  categories: {
    impactMetrics: {
      score: number
      weight: number
      quantified: number
      total: number
      dismissed: number
    }
    actionVerbs: {
      score: number
      weight: number
      strongStarts: number
      total: number
      dismissed: number
    }
    atsCompleteness: { score: number; weight: number; checks: HealthCategoryCheck[] }
    contentDepth: { score: number; weight: number; checks: HealthCategoryCheck[] }
  }
  excludedCount: number
  evaluatedAt: string
  ruleSetVersion: string
}

export interface HealthEvaluation {
  issues: HealthIssueCard[]
  breakdown: HealthBreakdown
}

const SHA256_HEX_LENGTH = 64

function issueBasis(fields: {
  category: HealthCategoryValue
  targetKind: HealthTargetKindValue
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
}): string {
  const normalizedText = normalizeIssueText(fields.originalText)
  const basis = [
    fields.category,
    fields.targetKind,
    fields.targetId ?? '',
    fields.targetIndex === null ? '' : String(fields.targetIndex),
    fields.targetField ?? '',
    normalizedText,
  ].join('§')
  return createHash('sha256').update(basis, 'utf8').digest('hex').slice(0, SHA256_HEX_LENGTH)
}

/**
 * Stable fingerprint tying an issue card to the exact line or field it
 * targets. Changing the text changes the fingerprint, which drives the
 * recalculation merge, stale AI detection, and dismissal tie breaking
 * (spec 0014, key invariants).
 */
export function fingerprintIssue(issue: HealthIssue): string {
  return issueBasis(issue)
}

function normalizeIssueText(text: string): string {
  return stripArabicMarks(normalizeArabicDigits(text.trim().toLowerCase()))
    .replace(/[^\w\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripArabicMarks(text: string): string {
  return text.replace(/[\u064B-\u0652\u0670\u0640]/g, '')
}

/**
 * Maps a score to one of the four bands: needs work under 50, fair to 74,
 * strong to 89, excellent from 90.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** Concrete measures: digits, percentages, currency, scale, volume or time figures. */
const MEASURE_PATTERNS: RegExp[] = [
  /\d/,
  /[%٪]|\bpercent(?:age)?\b|بالمئة|في المئة/,
  /[$€£¥₹]|\b(?:usd|eur|gbp|sar|aed|egp|kwd|qar|bhd|omr|jod|inr|cad)\b/i,
  /ر\.\s?س|د\.\s?إ|د\.\s?ك|ج\.\s?م|ريال|دينار|جنيه/,
  /\b(?:million|billion|thousand)\b|مليون|مليار|ألف/,
  /\b(?:users|requests|clients|customers|tickets|records|reports|files|pages|accounts|students|projects)\b|مستخدم|عميل|عملاء|طلبات?|تقارير?|ملفات?|صفحات?|طلاب|حسابات?|مشاريع/,
  /\b(?:hours|days|weeks|months|minutes)\b|ساعات?|أيام|أسبوعين?|أسابيع|شهور?|أشهر?|دقائق/,
]

function containsMeasure(text: string): boolean {
  const normalized = normalizeArabicDigits(text)
  return MEASURE_PATTERNS.some((pattern) => pattern.test(normalized))
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function duplicateKey(text: string): string {
  return stripArabicMarks(normalizeArabicDigits(text.toLowerCase()))
    .replace(/[^\w\u0600-\u06FF]+/g, '')
    .trim()
}

// ---------------------------------------------------------------------------
// Bilingual issue copy. Titles and rationales are generated in the profile
// language at audit time and stored on the card (spec 0014, issue generation).
// ---------------------------------------------------------------------------

const COPY = {
  EN: {
    impactNoMeasure: (original: string) => ({
      title: 'Bullet without a concrete measure',
      rationale: `"${original}" carries no number. Add a percentage, an amount of money, or a count of users, requests, hours, or days so the result is measurable.`,
    }),
    weakStart: (word: string) => ({
      title: 'Bullet does not start with an action verb',
      rationale: `It starts with "${word}". Start with a strong verb such as Led, Built, or Optimized.`,
    }),
    contactEmail: function (address: string | null) {
      return address
        ? {
            title: 'Email address is malformed',
            rationale: `"${address}" does not look like a valid address. Correct it in the profile contact block so applications are deliverable.`,
          }
        : {
            title: 'Email address missing',
            rationale:
              'Recruiters need a way to reply. Add your email in the profile contact block.',
          }
    },
    contactPhone: () => ({
      title: 'Phone number missing',
      rationale: 'Add a phone number so hiring teams can reach you quickly.',
    }),
    contactLocation: () => ({
      title: 'Location missing',
      rationale: 'Add a city or region so recruiters can match you to the right market.',
    }),
    contactLink: () => ({
      title: 'No professional link',
      rationale:
        'Add at least one link, a LinkedIn profile, a personal website, or GitHub, in the profile contact block.',
    }),
    summaryEmpty: () => ({
      title: 'Professional summary is empty',
      rationale:
        'Write 2 to 4 sentences that state your role, your strongest skills, and the value you bring.',
    }),
    noCompleteRole: () => ({
      title: 'No complete role entry yet',
      rationale:
        'At least one work entry needs a company, a job title, a start date, and one bullet to anchor the resume.',
    }),
    skillsFew: (count: number) => ({
      title: 'Not enough skills recorded',
      rationale: `${count} ${count === 1 ? 'skill is' : 'skills are'} recorded. List at least ${MIN_SKILLS_COUNT} so keyword matching has material to work with.`,
    }),
    educationIncomplete: (row: string) => ({
      title: 'Education entry is incomplete',
      rationale: `"${row}" needs an institution, a degree, and both dates.`,
    }),
    roleFewBullets: (role: string, count: number) => ({
      title: 'Role has fewer than two bullets',
      rationale: `${role} carries ${count} ${count === 1 ? 'bullet' : 'bullets'}. Add a second accomplishment to show depth.`,
    }),
    bulletShort: (original: string) => ({
      title: 'Bullet is shorter than 8 words',
      rationale: `"${original}" is brief. Expand with what you did, how you did it, and the result.`,
    }),
    bulletDuplicate: (original: string) => ({
      title: 'Duplicate bullet',
      rationale: `"${original}" appears earlier in the profile. Rewrite one of the two copies so each entry carries new evidence.`,
    }),
    summaryShort: (count: number) => ({
      title: 'Professional summary is under 30 words',
      rationale: `The summary has ${count} ${count === 1 ? 'word' : 'words'}. Expand it to at least ${MIN_SUMMARY_WORDS} words covering scope, strengths, and outcomes.`,
    }),
  },
  AR: {
    impactNoMeasure: (original: string) => ({
      title: 'نقطة خبرة بلا مقياس ملموس',
      rationale: `"${original}" لا تحمل أي رقم. أضف نسبة مئوية، أو مبلغاً مالياً، أو عدداً من المستخدمين أو الطلبات أو الساعات أو الأيام ليأخذ أثر النتيجة قياساً واضحاً.`,
    }),
    weakStart: (word: string) => ({
      title: 'النقطة لا تبدأ بفعل قوي',
      rationale: `تبدأ بكلمة "${word}". ابدأ بفعل إنجاز واضح مثل قاد، طوّر، أو حسّن.`,
    }),
    contactEmail: function (address: string | null) {
      return address
        ? {
            title: 'البريد الإلكتروني غير صالح',
            rationale: `"${address}" لا يبدو عنواناً صحيحاً. صححه في معلومات الاتصال بالملف الشخصي حتى تصبح التقديمات قابلة للتسليم.`,
          }
        : {
            title: 'البريد الإلكتروني مفقود',
            rationale:
              'يحتاج مسؤولو التوظيف إلى وسيلة للرد عليك. أضف بريدك الإلكتروني في معلومات الاتصال بالملف الشخصي.',
          }
    },
    contactPhone: () => ({
      title: 'رقم الهاتف مفقود',
      rationale: 'أضف رقم هاتفك ليتمكن فريق التوظيف من الوصول إليك بسرعة.',
    }),
    contactLocation: () => ({
      title: 'الموقع مفقود',
      rationale: 'أضف مدينة أو منطقة ليتسنى لمنسق التوظيف مطابقتك للسوق المناسب.',
    }),
    contactLink: () => ({
      title: 'لا يوجد رابط مهني',
      rationale:
        'أضف رابطاً واحداً على الأقل: ملف لينكد إن، أو موقعاً شخصياً، أو حساب GitHub، في معلومات الاتصال بالملف الشخصي.',
    }),
    summaryEmpty: () => ({
      title: 'الملخص المهني فارغ',
      rationale: 'اكتب من جملتين إلى أربع جمل تبين دورك وأقوى مهاراتك والقيمة التي تضيفها.',
    }),
    noCompleteRole: () => ({
      title: 'لا توجد خبرة مكتملة بعد',
      rationale:
        'يحتاج أحد ملفات الخبرة إلى اسم الشركة، والمسمى الوظيفي، وتاريخ البداية، ونقطة واحدة على الأقل ليقوم عليه السير الذاتية.',
    }),
    skillsFew: (count: number) => ({
      title: 'المهارات المسجلة قليلة',
      rationale: `توجد ${count} مهارة فقط. أدرج ${MIN_SKILLS_COUNT} مهارات على الأقل لتجد مطابقة الكلمات المفتاحية ما تعمل عليه.`,
    }),
    educationIncomplete: (row: string) => ({
      title: 'بيان تعليمي غير مكتمل',
      rationale: `"${row}" يحتاج اسم المؤسسة، والدرجة، وكلا التاريخين.`,
    }),
    roleFewBullets: (role: string, count: number) => ({
      title: 'الخبرة أقل من نقطتي إنجاز',
      rationale: `الخبرة في ${role} تحمل ${count} من نقاط الأنجازات. أضف إنجازاً ثانياً لإظهار العمق.`,
    }),
    bulletShort: (original: string) => ({
      title: 'النقطة أقصر من ٨ كلمات',
      rationale: `"${original}" مختصرة. توسع لتذكر ما فعلته، وكيف فعلته، والنتيجة.`,
    }),
    bulletDuplicate: (original: string) => ({
      title: 'نقطة خبرة مكررة',
      rationale: `"${original}" ظهرت سابقاً في الملف. أعد صياغة إحدى النسختين لتحمل كل نقطة شاهداً جديداً.`,
    }),
    summaryShort: (count: number) => ({
      title: 'الملخص المهني أقل من ٣٠ كلمة',
      rationale: `الملخص يحوي ${count} كلمة. توسعه ليبلغ ${MIN_SUMMARY_WORDS} كلمة على الأقل تغطي النطاق والنقاط القوية والنتائج.`,
    }),
  },
} as const

interface CopyBlock {
  title: string
  rationale: string
}

interface BulletEntry {
  experienceId: string
  experienceIndex: number
  index: number
  text: string
}

interface IssueFields {
  category: HealthCategoryValue
  targetKind: HealthTargetKindValue
  targetId: string | null
  targetIndex: number | null
  targetField: string | null
  originalText: string
}

/**
 * Generates every issue card for the profile in its own language, without
 * consulting dismissal state. The read path needs this for stale
 * resolution: a fresh fingerprint even for cards that already carry
 * decisions.
 */
export function generateIssues(profile: HealthProfileInput): HealthIssueCard[] {
  return evaluateProfileHealth(profile).issues
}

/**
 * Runs the full audit: pure rules over the profile with the set of
 * fingerprints the candidate has dismissed. Dismissed issues count as
 * satisfied across every category and land in excludedCount.
 */
export function evaluateProfileHealth(
  profile: HealthProfileInput,
  dismissedFingerprints: ReadonlySet<string> = new Set(),
): HealthEvaluation {
  const language: HealthLanguage = profile.language === 'AR' ? 'AR' : 'EN'
  const copy = COPY[language]
  const issues: HealthIssueCard[] = []

  const push = (fields: IssueFields, card: CopyBlock): string => {
    const fingerprint = issueBasis(fields)
    issues.push({ ...fields, title: card.title, rationale: card.rationale, fingerprint })
    return fingerprint
  }

  const liveBullets = (experience: HealthExperienceInput): string[] =>
    (experience.bullets ?? []).filter((bullet) => bullet.trim().length > 0)

  const bulletEntries: BulletEntry[] = []
  profile.workExperiences.forEach((experience, experienceIndex) => {
    experience.bullets.forEach((bullet, index) => {
      if (bullet.trim().length === 0) return
      bulletEntries.push({ experienceId: experience.id, experienceIndex, index, text: bullet })
    })
  })
  const totalBullets = bulletEntries.length

  const bulletBasis = (
    entry: {
      experienceId: string
      index: number
      text: string
    },
    category: HealthCategoryValue,
  ): string =>
    issueBasis({
      category,
      targetKind: 'WORK_EXPERIENCE_BULLET',
      targetId: entry.experienceId,
      targetIndex: entry.index,
      targetField: null,
      originalText: entry.text,
    })

  // ------------------------------------------------------------------
  // Impact and metrics (weight 30). Every failed bullet issues one card.
  // ------------------------------------------------------------------
  const impactIssues = bulletEntries.filter((entry) => !containsMeasure(entry.text))
  for (const entry of impactIssues) {
    push(
      {
        category: 'IMPACT_METRICS',
        targetKind: 'WORK_EXPERIENCE_BULLET',
        targetId: entry.experienceId,
        targetIndex: entry.index,
        targetField: null,
        originalText: entry.text,
      },
      copy.impactNoMeasure(entry.text),
    )
  }
  const impactDismissed = impactIssues.filter((entry) =>
    dismissedFingerprints.has(bulletBasis(entry, 'IMPACT_METRICS')),
  ).length
  const quantified = totalBullets - impactIssues.length
  const impactScore =
    totalBullets === 0
      ? 0
      : Math.min(
          100,
          Math.round(((quantified + impactDismissed) / totalBullets / IMPACT_FULL_RATIO) * 100),
        )

  // ------------------------------------------------------------------
  // Action verbs (weight 20)
  // ------------------------------------------------------------------
  const verbIssues = bulletEntries.filter((entry) => !startsWithActionVerb(entry.text, language))
  for (const entry of verbIssues) {
    push(
      {
        category: 'ACTION_VERBS',
        targetKind: 'WORK_EXPERIENCE_BULLET',
        targetId: entry.experienceId,
        targetIndex: entry.index,
        targetField: null,
        originalText: entry.text,
      },
      copy.weakStart(getActionWord(entry.text)),
    )
  }
  const verbDismissed = verbIssues.filter((entry) =>
    dismissedFingerprints.has(bulletBasis(entry, 'ACTION_VERBS')),
  ).length
  const strongStarts = totalBullets - verbIssues.length
  const verbsScore =
    totalBullets === 0
      ? 0
      : Math.min(100, Math.round(((strongStarts + verbDismissed) / totalBullets) * 100))

  // ------------------------------------------------------------------
  // ATS completeness (weight 25). A missing value only satisfies a check
  // through the exact covering cards being dismissed; nothing is waved
  // through implicitly.
  // ------------------------------------------------------------------
  const summaryText = profile.summary?.trim() ?? ''
  const summaryWords = countWords(summaryText)
  const summaryOk = summaryText.length > 0

  const email = profile.email?.trim() ?? ''
  const emailOk = email.length > 0 && isValidEmail(email)
  let emailCardFingerprint: string | null = null
  if (!emailOk) {
    emailCardFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_CONTACT',
        targetId: profile.id,
        targetIndex: null,
        targetField: 'email',
        originalText: email,
      },
      copy.contactEmail(email.length > 0 ? email : null),
    )
  }

  const phone = profile.phone?.trim() ?? ''
  const location = profile.location?.trim() ?? ''
  const reachOk = phone.length > 0 || location.length > 0
  let phoneCardFingerprint: string | null = null
  let locationCardFingerprint: string | null = null
  // Phone and location cover the same condition: cards only exist when the
  // reach condition itself fails, so each card maps to an unsatisfied check.
  if (phone.length === 0 && location.length === 0) {
    phoneCardFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_CONTACT',
        targetId: profile.id,
        targetIndex: null,
        targetField: 'phone',
        originalText: '',
      },
      copy.contactPhone(),
    )
    locationCardFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_CONTACT',
        targetId: profile.id,
        targetIndex: null,
        targetField: 'location',
        originalText: '',
      },
      copy.contactLocation(),
    )
  }
  const reachDismissed =
    !reachOk &&
    (phone.length > 0 ||
      (phoneCardFingerprint !== null && dismissedFingerprints.has(phoneCardFingerprint))) &&
    (location.length > 0 ||
      (locationCardFingerprint !== null && dismissedFingerprints.has(locationCardFingerprint)))

  const linkOk = Boolean(
    profile.linkedinUrl?.trim() || profile.websiteUrl?.trim() || profile.githubUrl?.trim(),
  )
  let linkCardFingerprint: string | null = null
  if (!linkOk) {
    linkCardFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_CONTACT',
        targetId: profile.id,
        targetIndex: null,
        targetField: 'linkedinUrl',
        originalText: '',
      },
      copy.contactLink(),
    )
  }

  const emailSatisfied =
    emailOk || (emailCardFingerprint !== null && dismissedFingerprints.has(emailCardFingerprint))
  const linkSatisfied =
    linkOk || (linkCardFingerprint !== null && dismissedFingerprints.has(linkCardFingerprint))
  const contactDataOk = emailOk && reachOk && linkOk
  const contactSatisfied = emailSatisfied && (reachOk || reachDismissed) && linkSatisfied

  let summaryEmptyFingerprint: string
  if (!summaryOk) {
    summaryEmptyFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_SUMMARY',
        targetId: null,
        targetIndex: null,
        targetField: null,
        originalText: '',
      },
      copy.summaryEmpty(),
    )
  } else {
    // Fingerprint needs no card when the summary exists; it is only a key.
    summaryEmptyFingerprint = issueBasis({
      category: 'ATS_COMPLETENESS',
      targetKind: 'PROFILE_SUMMARY',
      targetId: null,
      targetIndex: null,
      targetField: null,
      originalText: '',
    })
  }
  const summaryPresentSatisfied =
    summaryOk || (!summaryOk && dismissedFingerprints.has(summaryEmptyFingerprint))

  const rolesWithAnyBullet = profile.workExperiences.filter(
    (experience) =>
      experience.companyName.trim().length > 0 &&
      experience.jobTitle.trim().length > 0 &&
      liveBullets(experience).length >= 1,
  )
  const roleBlockOk = rolesWithAnyBullet.length > 0
  let roleBlockFingerprint: string | null = null
  if (!roleBlockOk) {
    roleBlockFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_GENERAL',
        targetId: null,
        targetIndex: null,
        targetField: null,
        originalText: '',
      },
      copy.noCompleteRole(),
    )
  }
  const roleBlockSatisfied =
    roleBlockOk ||
    (roleBlockFingerprint !== null && dismissedFingerprints.has(roleBlockFingerprint))

  const skillsCount = (profile.skills ?? []).length
  const skillsOk = skillsCount >= MIN_SKILLS_COUNT
  let skillsFingerprint: string | null = null
  if (!skillsOk) {
    skillsFingerprint = push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_SKILLS',
        targetId: null,
        targetIndex: null,
        targetField: null,
        originalText: String(skillsCount),
      },
      copy.skillsFew(skillsCount),
    )
  }
  const skillsSatisfied =
    skillsOk || (skillsFingerprint !== null && dismissedFingerprints.has(skillsFingerprint))

  const educationRows = profile.educations ?? []
  const incompleteEducations = educationRows.filter(
    (education) =>
      !(
        education.institution.trim().length > 0 &&
        education.degree.trim().length > 0 &&
        education.startDate !== null &&
        education.endDate !== null
      ),
  )
  const educationApplicable = educationRows.length > 0
  for (const education of incompleteEducations) {
    const row = `${education.institution.trim() || '—'} · ${education.degree.trim() || '—'}`
    push(
      {
        category: 'ATS_COMPLETENESS',
        targetKind: 'PROFILE_EDUCATION',
        targetId: education.id,
        targetIndex: null,
        targetField: null,
        originalText: row,
      },
      copy.educationIncomplete(row),
    )
  }
  const educationDataOk = educationApplicable && incompleteEducations.length === 0
  const educationDismissed =
    !educationDataOk &&
    educationApplicable &&
    incompleteEducations.length > 0 &&
    incompleteEducations.every((education) => {
      const row = `${education.institution.trim() || '—'} · ${education.degree.trim() || '—'}`
      return dismissedFingerprints.has(
        issueBasis({
          category: 'ATS_COMPLETENESS',
          targetKind: 'PROFILE_EDUCATION',
          targetId: education.id,
          targetIndex: null,
          targetField: null,
          originalText: row,
        }),
      )
    })

  const completenessChecks: HealthCategoryCheck[] = [
    {
      key: 'contact_block',
      satisfied: contactSatisfied,
      dismissed: contactSatisfied && !contactDataOk,
    },
    {
      key: 'summary_present',
      satisfied: summaryPresentSatisfied,
      dismissed: summaryPresentSatisfied && !summaryOk,
    },
    {
      key: 'role_block',
      satisfied: roleBlockSatisfied,
      dismissed: roleBlockSatisfied && !roleBlockOk,
    },
    { key: 'skills', satisfied: skillsSatisfied, dismissed: skillsSatisfied && !skillsOk },
  ]
  if (educationApplicable) {
    completenessChecks.push({
      key: 'education',
      satisfied: educationDataOk || educationDismissed,
      dismissed: educationDismissed,
    })
  }
  let completenessWeightSum = 0
  let completenessSatisfiedWeight = 0
  for (const check of completenessChecks) {
    const weight = COMPLETENESS_CHECK_WEIGHTS[check.key as keyof typeof COMPLETENESS_CHECK_WEIGHTS]
    completenessWeightSum += weight
    if (check.satisfied) completenessSatisfiedWeight += weight
  }
  const completenessScore =
    completenessWeightSum === 0
      ? 0
      : Math.min(100, Math.round((completenessSatisfiedWeight / completenessWeightSum) * 100))

  // ------------------------------------------------------------------
  // Content depth (weight 25): four checks of 25 points each.
  // ------------------------------------------------------------------
  const roleLabel = (experience: HealthExperienceInput): string =>
    `${experience.companyName.trim() || '—'} · ${experience.jobTitle.trim() || '—'}`
  const roleBasis = (experience: HealthExperienceInput): string =>
    issueBasis({
      category: 'CONTENT_DEPTH',
      targetKind: 'WORK_EXPERIENCE',
      targetId: experience.id,
      targetIndex: null,
      targetField: null,
      originalText: roleLabel(experience),
    })

  const underFilledRoles = profile.workExperiences.filter(
    (experience) => liveBullets(experience).length < MIN_ROLE_BULLETS,
  )
  const rolesCount = profile.workExperiences.length
  for (const experience of underFilledRoles) {
    const count = liveBullets(experience).length
    push(
      {
        category: 'CONTENT_DEPTH',
        targetKind: 'WORK_EXPERIENCE',
        targetId: experience.id,
        targetIndex: null,
        targetField: null,
        originalText: roleLabel(experience),
      },
      copy.roleFewBullets(roleLabel(experience), count),
    )
  }
  const dismissedRoleCards = underFilledRoles.filter((experience) =>
    dismissedFingerprints.has(roleBasis(experience)),
  ).length
  const effectiveRolesWithTwo =
    profile.workExperiences.filter(
      (experience) => liveBullets(experience).length >= MIN_ROLE_BULLETS,
    ).length + dismissedRoleCards
  const roleCoverageShare = rolesCount > 0 ? effectiveRolesWithTwo / rolesCount : 0
  const roleCoverageDataOk = rolesCount > 0 && effectiveRolesWithTwo === rolesCount
  const roleCoverageSatisfied =
    roleCoverageDataOk ||
    (rolesCount === 0 &&
      roleBlockFingerprint !== null &&
      dismissedFingerprints.has(roleBlockFingerprint))

  const shortBullets = bulletEntries.filter((entry) => countWords(entry.text) < MIN_BULLET_WORDS)
  for (const entry of shortBullets) {
    push(
      {
        category: 'CONTENT_DEPTH',
        targetKind: 'WORK_EXPERIENCE_BULLET',
        targetId: entry.experienceId,
        targetIndex: entry.index,
        targetField: null,
        originalText: entry.text,
      },
      copy.bulletShort(entry.text),
    )
  }
  const totalWords = bulletEntries.reduce((total, entry) => total + countWords(entry.text), 0)
  const avgWords = totalBullets === 0 ? 0 : totalWords / totalBullets
  const avgDataOk = totalBullets > 0 && avgWords >= MIN_AVG_BULLET_WORDS
  const avgCovering: string[] = shortBullets.map((entry) => bulletBasis(entry, 'CONTENT_DEPTH'))
  if (totalBullets === 0) {
    for (const experience of underFilledRoles) avgCovering.push(roleBasis(experience))
    if (rolesCount === 0 && roleBlockFingerprint !== null) avgCovering.push(roleBlockFingerprint)
  }
  const avgDismissed =
    !avgDataOk &&
    avgCovering.length > 0 &&
    avgCovering.every((fingerprint) => dismissedFingerprints.has(fingerprint))
  const avgSatisfied = avgDataOk || avgDismissed

  const duplicateGroups = new Map<string, BulletEntry[]>()
  for (const entry of bulletEntries) {
    const key = duplicateKey(entry.text)
    const group = duplicateGroups.get(key) ?? []
    group.push(entry)
    duplicateGroups.set(key, group)
  }
  const duplicateLaterCopies: BulletEntry[] = []
  for (const group of duplicateGroups.values()) {
    if (group.length < 2) continue
    duplicateLaterCopies.push(...group.slice(1))
  }
  for (const entry of duplicateLaterCopies) {
    push(
      {
        category: 'CONTENT_DEPTH',
        targetKind: 'WORK_EXPERIENCE_BULLET',
        targetId: entry.experienceId,
        targetIndex: entry.index,
        targetField: null,
        originalText: entry.text,
      },
      copy.bulletDuplicate(entry.text),
    )
  }
  // Nothing duplicated only counts when something exists to duplicate; an
  // empty profile has no bullet material and cannot earn this check.
  const duplicatesDataOk = totalBullets > 0 && duplicateLaterCopies.length === 0
  const duplicatesDismissed =
    !duplicatesDataOk &&
    duplicateLaterCopies.length > 0 &&
    duplicateLaterCopies.every((entry) =>
      dismissedFingerprints.has(bulletBasis(entry, 'CONTENT_DEPTH')),
    )
  const duplicatesSatisfied = duplicatesDataOk || duplicatesDismissed

  let summaryShortFingerprint: string | null = null
  if (summaryOk && summaryWords < MIN_SUMMARY_WORDS) {
    summaryShortFingerprint = push(
      {
        category: 'CONTENT_DEPTH',
        targetKind: 'PROFILE_SUMMARY',
        targetId: null,
        targetIndex: null,
        targetField: null,
        originalText: summaryText,
      },
      copy.summaryShort(summaryWords),
    )
  }
  const summaryWordsDataOk = summaryWords >= MIN_SUMMARY_WORDS
  // With no summary the depth check is covered by the same card that covers
  // the empty summary in completeness; dismissing it accepts a short summary.
  const summaryWordsCoveringFingerprint = summaryOk
    ? (summaryShortFingerprint ?? summaryEmptyFingerprint)
    : summaryEmptyFingerprint
  const summaryWordsDismissed =
    !summaryWordsDataOk && dismissedFingerprints.has(summaryWordsCoveringFingerprint)
  const summaryWordsSatisfied = summaryWordsDataOk || summaryWordsDismissed

  const depthChecks: HealthCategoryCheck[] = [
    {
      key: 'role_coverage',
      satisfied: roleCoverageSatisfied,
      dismissed: roleCoverageSatisfied && !roleCoverageDataOk,
    },
    { key: 'avg_bullet_length', satisfied: avgSatisfied, dismissed: avgSatisfied && !avgDataOk },
    {
      key: 'no_duplicates',
      satisfied: duplicatesSatisfied,
      dismissed: duplicatesSatisfied && !duplicatesDataOk,
    },
    {
      key: 'summary_words',
      satisfied: summaryWordsSatisfied,
      dismissed: summaryWordsSatisfied && !summaryWordsDataOk,
    },
  ]
  const depthScore = Math.min(
    100,
    Math.round(
      roleCoverageShare * DEPTH_CHECK_WEIGHTS.role_coverage +
        (avgSatisfied ? DEPTH_CHECK_WEIGHTS.avg_bullet_length : 0) +
        (duplicatesSatisfied ? DEPTH_CHECK_WEIGHTS.no_duplicates : 0) +
        (summaryWordsSatisfied ? DEPTH_CHECK_WEIGHTS.summary_words : 0),
    ),
  )

  // ------------------------------------------------------------------
  // Overall
  // ------------------------------------------------------------------
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (CATEGORY_WEIGHTS.IMPACT_METRICS / 100) * impactScore +
          (CATEGORY_WEIGHTS.ACTION_VERBS / 100) * verbsScore +
          (CATEGORY_WEIGHTS.ATS_COMPLETENESS / 100) * completenessScore +
          (CATEGORY_WEIGHTS.CONTENT_DEPTH / 100) * depthScore,
      ),
    ),
  )

  const excludedCount =
    impactDismissed +
    verbDismissed +
    completenessChecks.filter((check) => check.dismissed).length +
    depthChecks.filter((check) => check.dismissed).length

  const breakdown: HealthBreakdown = {
    overallScore,
    categories: {
      impactMetrics: {
        score: impactScore,
        weight: CATEGORY_WEIGHTS.IMPACT_METRICS,
        quantified,
        total: totalBullets,
        dismissed: impactDismissed,
      },
      actionVerbs: {
        score: verbsScore,
        weight: CATEGORY_WEIGHTS.ACTION_VERBS,
        strongStarts,
        total: totalBullets,
        dismissed: verbDismissed,
      },
      atsCompleteness: {
        score: completenessScore,
        weight: CATEGORY_WEIGHTS.ATS_COMPLETENESS,
        checks: completenessChecks,
      },
      contentDepth: {
        score: depthScore,
        weight: CATEGORY_WEIGHTS.CONTENT_DEPTH,
        checks: depthChecks,
      },
    },
    excludedCount,
    evaluatedAt: new Date().toISOString(),
    ruleSetVersion: HEALTH_RULE_SET_VERSION,
  }

  return { issues, breakdown }
}
