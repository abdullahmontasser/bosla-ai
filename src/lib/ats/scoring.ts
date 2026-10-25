import type { AtsBreakdown } from '@/lib/validations/tailored-resume'

export interface CandidateHeaderInput {
  fullName?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  websiteUrl?: string | null
}

export interface CandidateExperienceInput {
  companyName: string
  jobTitle: string
  location?: string | null
  bullets: string[]
}

export interface AtsScoringInput {
  jobTitle: string
  jobDescription: string
  parsedJobSkills?: string[]
  language?: 'EN' | 'AR'
  candidateHeader?: CandidateHeaderInput
  candidateSummary?: string | null
  candidateSkills?: string[]
  experiences?: CandidateExperienceInput[]
  dismissedSkills?: string[]
}

export interface FormattingComplianceResult {
  formattingScore: number
  summaryScore: number
  contactScore: number
  actionVerbScore: number
  feedback: string[]
}

const ENGLISH_ACTION_VERBS = new Set([
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
])

const ARABIC_ACTION_VERBS = new Set([
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
])

const COMMON_STOP_WORDS = new Set([
  'and',
  'or',
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'by',
  'of',
  'as',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'under',
  'between',
  'such',
  'like',
  'this',
  'that',
  'these',
  'those',
  'we',
  'you',
  'our',
  'your',
  'their',
  'they',
  'team',
  'role',
  'job',
  'work',
  'looking',
  'required',
  'experience',
  'candidate',
  'skills',
  'years',
  'responsibilities',
  'requirements',
  // Arabic stop words
  'في',
  'من',
  'إلى',
  'على',
  'عن',
  'مع',
  'هذا',
  'هذه',
  'ذلك',
  'تلك',
  'التي',
  'الذي',
  'الذين',
  'أن',
  'إن',
  'كان',
  'كانت',
  'يكون',
  'سوف',
  'قد',
  'كل',
  'نحن',
  'هم',
  'هو',
  'هي',
  'أو',
  'ثم',
  'حيث',
  'بين',
  'خلال',
  'حول',
  'وظيفة',
  'فريق',
  'خبرة',
  'مهارات',
  'سنة',
  'سنوات',
])

/**
 * Normalizes a keyword string for comparison.
 */
export function normalizeToken(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF.#+-]/g, '')
}

/**
 * Checks whether text contains a given keyword respecting word boundaries and variations.
 */
export function textContainsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false

  const normalizedText = text.toLowerCase()
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (normalizedText.includes(normalizedKeyword)) {
    return true
  }

  // Handle common variations like Next.js -> nextjs or React.js -> react
  const strippedText = normalizedText.replace(/[.\s-]/g, '')
  const strippedKeyword = normalizedKeyword.replace(/[.\s-]/g, '')
  if (strippedKeyword.length >= 3 && strippedText.includes(strippedKeyword)) {
    return true
  }

  return false
}

/**
 * Extracts fallback keywords from job description when parsedSkills is empty.
 */
export function extractKeywords(text: string, providedSkills: string[] = []): string[] {
  if (providedSkills.length > 0) {
    return Array.from(new Set(providedSkills.map((s) => s.trim()).filter(Boolean)))
  }

  const tokens = text
    .split(/[\s,;()/\\:\n]+/)
    .map((w) => normalizeToken(w))
    .filter((w) => w.length >= 3 && !COMMON_STOP_WORDS.has(w))

  const frequency = new Map<string, number>()
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1)
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([token]) => token)
}

/**
 * Evaluates deterministic formatting compliance (20% of ATS score).
 */
export function checkFormattingCompliance(
  candidateSummary?: string | null,
  candidateHeader?: CandidateHeaderInput,
  experienceBullets: string[] = [],
  language: 'EN' | 'AR' = 'EN',
): FormattingComplianceResult {
  const feedback: string[] = []

  // 1. Summary score (max 30 points)
  let summaryScore = 0
  const trimmedSummary = candidateSummary?.trim() || ''
  if (trimmedSummary.length >= 30) {
    summaryScore = 30
  } else if (trimmedSummary.length > 0) {
    summaryScore = 15
    feedback.push(
      language === 'AR'
        ? 'الملخص المهني قصير؛ يفضل توسيعه إلى 2-4 جمل تبرز قيمتك المهنية.'
        : 'Professional summary is too brief. Expand to 2-4 impactful sentences.',
    )
  } else {
    summaryScore = 0
    feedback.push(
      language === 'AR'
        ? 'يرجى إضافة ملخص مهني يستعرض أبرز إنجازاتك وقدراتك.'
        : 'Add a tailored professional summary to showcase your core qualifications.',
    )
  }

  // 2. Contact info score (max 30 points)
  let contactScore = 0
  const hasEmail = Boolean(candidateHeader?.email && candidateHeader.email.includes('@'))
  const hasPhoneOrLocation = Boolean(
    (candidateHeader?.phone && candidateHeader.phone.trim().length > 3) ||
    (candidateHeader?.location && candidateHeader.location.trim().length > 3),
  )

  if (hasEmail) {
    contactScore += 15
  } else {
    feedback.push(
      language === 'AR'
        ? 'البريد الإلكتروني مفقود في ترويسة الاتصال.'
        : 'Missing professional email address in contact header.',
    )
  }

  if (hasPhoneOrLocation) {
    contactScore += 15
  } else {
    feedback.push(
      language === 'AR'
        ? 'يرجى إضافة رقم الهاتف أو موقع الإقامة لتسهيل تواصل مسؤولي التوظيف.'
        : 'Add a phone number or geographic location for recruiter outreach.',
    )
  }

  // 3. Action verbs in bullets (max 40 points)
  let actionVerbScore = 0
  if (experienceBullets.length === 0) {
    actionVerbScore = 0
    feedback.push(
      language === 'AR'
        ? 'لا توجد نقاط خبرة مهنية مسجلة؛ أضف نقاط خبرة مفصلة.'
        : 'No experience bullets recorded. Add accomplishment bullets to demonstrate impact.',
    )
  } else {
    const verbsSet = language === 'AR' ? ARABIC_ACTION_VERBS : ENGLISH_ACTION_VERBS
    let actionCount = 0

    for (const bullet of experienceBullets) {
      const firstWord = bullet
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^\w\u0600-\u06FF]/g, '')
      if (firstWord && verbsSet.has(firstWord)) {
        actionCount++
      }
    }

    const ratio = actionCount / experienceBullets.length
    actionVerbScore = Math.min(40, Math.round(ratio * 40))

    if (ratio < 0.6) {
      feedback.push(
        language === 'AR'
          ? 'ابدأ نقاط الخبرة بأفعال حركة قوية (مثل: طور، قاد، صمم، حقق) لتعزيز انطباع الإنجاز.'
          : 'Start more experience bullets with strong action verbs (e.g. Developed, Led, Architected, Spearheaded).',
      )
    }
  }

  const formattingScore = Math.min(100, Math.max(0, summaryScore + contactScore + actionVerbScore))

  return {
    formattingScore,
    summaryScore,
    contactScore,
    actionVerbScore,
    feedback,
  }
}

/**
 * Computes deterministic ATS score and structured breakdown without external AI latency.
 */
export function calculateDeterministicAtsScore(input: AtsScoringInput): AtsBreakdown {
  const language = input.language || 'EN'
  const dismissedSet = new Set((input.dismissedSkills || []).map((s) => s.trim().toLowerCase()))

  // 1. Identify target skills
  const rawTargetSkills =
    input.parsedJobSkills && input.parsedJobSkills.length > 0
      ? input.parsedJobSkills
      : extractKeywords(`${input.jobTitle} ${input.jobDescription}`, [])

  const targetSkills = Array.from(new Set(rawTargetSkills.map((s) => s.trim()).filter(Boolean)))

  // 2. Aggregate all candidate text for matching
  const candidateSkills = input.candidateSkills || []
  const experiences = input.experiences || []
  const allBullets = experiences.flatMap((e) => e.bullets || [])

  const candidateCorpus = [
    ...candidateSkills,
    input.candidateSummary || '',
    ...experiences.map((e) => `${e.companyName} ${e.jobTitle}`),
    ...allBullets,
  ].join(' ')

  // 3. Calculate Keyword Match (50% weight)
  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  for (const skill of targetSkills) {
    const skillLower = skill.trim().toLowerCase()
    const isDismissed = dismissedSet.has(skillLower)

    // Check direct candidate skill list or text corpus
    const directlyListed = candidateSkills.some((cs) => textContainsKeyword(cs, skill))
    const inCorpus = textContainsKeyword(candidateCorpus, skill)

    if (directlyListed || inCorpus) {
      matchedSkills.push(skill)
    } else if (!isDismissed) {
      missingSkills.push(skill)
    }
  }

  const keywordMatchSubscore =
    targetSkills.length > 0
      ? Math.min(100, Math.round((matchedSkills.length / targetSkills.length) * 100))
      : 80

  // 4. Calculate Experience Relevance (30% weight)
  let experienceRelevanceSubscore = 0
  if (allBullets.length === 0) {
    experienceRelevanceSubscore = experiences.length > 0 ? 30 : 0
  } else {
    // Check how many bullets contain target skills or job title terms
    const relevantBullets = allBullets.filter((bullet) =>
      targetSkills.some((skill) => textContainsKeyword(bullet, skill)),
    )
    const bulletRatio = relevantBullets.length / allBullets.length
    // Base 20 + up to 80 based on relevant bullet coverage
    experienceRelevanceSubscore = Math.min(100, Math.round(20 + bulletRatio * 80))
  }

  // 5. Calculate Formatting Compliance (20% weight)
  const formattingResult = checkFormattingCompliance(
    input.candidateSummary,
    input.candidateHeader,
    allBullets,
    language,
  )
  const formattingSubscore = formattingResult.formattingScore

  // 6. Overall Weighted Score
  // 50% keyword match + 30% experience relevance + 20% formatting compliance
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.5 * keywordMatchSubscore + 0.3 * experienceRelevanceSubscore + 0.2 * formattingSubscore,
      ),
    ),
  )

  // 7. Assemble Actionable Feedback
  const actionableFeedback: string[] = [...formattingResult.feedback]

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 4).join(', ')
    actionableFeedback.unshift(
      language === 'AR'
        ? `أضف المهارات المطلوبة في الإعلان: ${topMissing}`
        : `Include these target job skills in your experience or skills list: ${topMissing}`,
    )
  }

  if (experienceRelevanceSubscore < 60 && allBullets.length > 0) {
    actionableFeedback.push(
      language === 'AR'
        ? 'عزز نقاط الخبرة بذكر التقنيات والأدوات المطلوبة في سياق مهامك اليومية.'
        : 'Incorporate target role keywords directly into your experience bullet points to increase ATS relevance.',
    )
  }

  return {
    overallScore,
    categorySubscores: {
      keywordMatch: keywordMatchSubscore,
      experienceRelevance: experienceRelevanceSubscore,
      formattingCompliance: formattingSubscore,
    },
    matchedSkills,
    missingSkills,
    dismissedSkills: input.dismissedSkills || [],
    actionableFeedback,
    isStale: false,
    evaluatedAt: new Date().toISOString(),
  }
}
