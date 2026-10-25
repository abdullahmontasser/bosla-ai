import type { AtsBreakdown } from '@/lib/validations/tailored-resume'

export interface XyzBulletRewriteParams {
  originalBullet: string
  companyName: string
  jobTitle: string
  targetJobTitle: string
  targetJobSkills?: string[]
  language?: 'EN' | 'AR'
}

export interface AiDeepScanParams {
  targetJobTitle: string
  targetJobDescription: string
  candidateSummary?: string | null
  candidateSkills?: string[]
  experiences: Array<{
    companyName: string
    jobTitle: string
    bullets: string[]
  }>
  language?: 'EN' | 'AR'
}

export interface BulletSanitizationResult {
  isValid: boolean
  sanitized: string
  hadFabricatedNumbers: boolean
}

/**
 * Builds the prompt for rewriting a single bullet point using the Google XYZ formula.
 */
export function buildXyzBulletRewritePrompt(params: XyzBulletRewriteParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'
  const targetSkills = params.targetJobSkills?.join(', ') || ''

  if (language === 'AR') {
    return {
      system: `أنت خبير صياغة سير ذاتية متميز متخصص في صياغة الإنجازات وفق معادلة Google XYZ ("حقق [س] من خلال القيام بـ [ص]، مما أدى إلى [الأثر والنتيجة]").

القواعد الإلزامية الصارمة:
1. منع التلفيق والاختلاق منعاً باتاً (ZERO HALLUCINATION):
   - يحظر تماماً اختلاق أو افتراض أي أرقام أو نسب مئوية أو مبالغ مالية لم ترد صراحة في نقطة المرشح الأصلية.
   - إذا تضمنت النقطة الأصلية أرقاماً أو قياسات حقيقية، احتفظ بها وأبرزها بدقة.
   - إذا لم تتضمن النقطة الأصلية أي أرقام، ركز على الأثر النوعي والنتائج العملية الملموسة (مثل: تحسين استقرار النظام، تسريع دورة التطوير، رفع جودة البرمجيات) دون توليد أي أرقام وهمية.
2. ابدأ بفعل حركة عربي قوي ودقيق (مثل: طور، قاد، صمم، أتمت، حسن، أنجز).
3. أخرج النقطة المصاغة فقط في سطر واحد دون علامات تنصيص أو شروح أو مقدمات.`,
      prompt: `الشركة: ${params.companyName}
المسمى الوظيفي: ${params.jobTitle}
الوظيفة المستهدفة: ${params.targetJobTitle}
${targetSkills ? `المهارات والكلمات المفتاحية المستهدفة: ${targetSkills}` : ''}

النقطة الأصلية للمرشح:
"${params.originalBullet}"

أعد صياغة هذه النقطة الآن بدقة وفق صيغة Google XYZ دون اختلاق أي أرقام.`,
    }
  }

  return {
    system: `You are an elite executive resume writer specializing in the Google XYZ formula: "Accomplished [X] by doing [Z], resulting in [impact / outcome]".

STRICT INVARIANTS:
1. ZERO HALLUCINATION POLICY:
   - NEVER invent numbers, assume, or fabricate numerical metrics, percentages, dollar values, or team sizes that do NOT exist in the candidate's original bullet.
   - If the candidate's original bullet already includes authentic numbers or percentages, preserve and highlight them prominently.
   - If the original bullet has NO numbers, highlight genuine qualitative business outcomes (e.g. enhanced system reliability, eliminated deployment bottlenecks, improved user satisfaction, streamlined team workflows) WITHOUT inventing artificial numbers.
2. Start with a strong, high-impact action verb (e.g., Architected, Spearheaded, Engineered, Streamlined, Delivered).
3. Output ONLY the single rewritten bullet statement. Do not add quotes, introductory phrases, or markdown bullet dashes.`,
    prompt: `Company: ${params.companyName}
Job Title: ${params.jobTitle}
Target Role: ${params.targetJobTitle}
${targetSkills ? `Target Job Keywords: ${targetSkills}` : ''}

Candidate's Original Bullet:
"${params.originalBullet}"

Rewrite this single bullet into the Google XYZ formula now with zero hallucinated numbers.`,
  }
}

/**
 * Validates and sanitizes a rewritten bullet to ensure no hallucinated metrics were introduced.
 */
export function validateAndSanitizeXyzBullet(
  originalBullet: string,
  rewrittenBullet: string,
): BulletSanitizationResult {
  let cleaned = rewrittenBullet.replace(/^[-*•]\s+/, '').trim()
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim()
  }

  // Extract all numeric patterns from original: numbers, percentages, currencies
  const numberRegex = /(?:\$|€|£)?\b\d+(?:[.,]\d+)?(?:%|k|M|B)?\b/gi
  const originalNumbers = new Set(
    (originalBullet.match(numberRegex) || []).map((n) => n.toLowerCase()),
  )
  const rewrittenNumbers = (cleaned.match(numberRegex) || []).map((n) => n.toLowerCase())

  let hadFabricatedNumbers = false

  for (const num of rewrittenNumbers) {
    if (!originalNumbers.has(num)) {
      hadFabricatedNumbers = true
      break
    }
  }

  if (hadFabricatedNumbers) {
    // Sanitize by replacing common fabricated metric phrases with qualitative equivalents
    cleaned = cleaned
      // e.g. "cutting latency by 45%" -> "cutting latency significantly"
      .replace(/by \d+(?:\.\d+)?%/gi, 'substantially')
      .replace(/by \d+(?:\.\d+)?\s*(?:hours|days|weeks|months)/gi, 'measurably')
      // e.g. "and saving $50,000 annually" -> "and optimizing infrastructure costs"
      .replace(
        /saving (?:\$|€|£)?\d+(?:[.,]\d+)?(?:k|M)?(?:\s*annually)?/gi,
        'optimizing operational costs',
      )
      // e.g. "serving 2M users" -> "serving high-scale users"
      .replace(/serving \d+(?:[.,]\d+)?(?:k|M|B)?\s*users/gi, 'serving production users')
      // e.g. "increasing engagement by 30%" -> "increasing user engagement"
      .replace(/increasing ([\w\s]+) by \d+(?:\.\d+)?%/gi, 'increasing $1')
      .replace(/improving ([\w\s]+) by \d+(?:\.\d+)?%/gi, 'improving $1')
      .replace(/reducing ([\w\s]+) by \d+(?:\.\d+)?%/gi, 'reducing $1')
      // standalone percentages not in original
      .replace(/\b\d+(?:\.\d+)?%\b/g, '')
      // clean double spaces and awkward commas
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\s+\./g, '.')
      .trim()
  }

  return {
    isValid: cleaned.length > 10,
    sanitized: cleaned,
    hadFabricatedNumbers,
  }
}

/**
 * Builds the prompt for an AI deep scan of resume alignment.
 */
export function buildAiDeepScanPrompt(params: AiDeepScanParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'

  if (language === 'AR') {
    return {
      system: `أنت مستشار توظيف متقدم يقوم بفحص السيرة الذاتية بدقة عالية ومقارنتها بالوصف الوظيفي.
مهمتك: تصنيف المهارات المتطابقة والمهارات الناقصة وتقديم توصيات قابلة للتنفيذ.

يجب إخراج التقرير باستخدام الوسوم الهيكلية التالية فقط:
### MATCHED_SKILLS
- [اسم المهارة المتطابقة]
### MISSING_SKILLS
- [اسم المهارة الناقصة المطلوبة في الوظيفة]
### ACTIONABLE_FEEDBACK
- [توصية عملية محددة لتحسين التوافق مع أنظمة التوظيف ATS]`,
      prompt: `المسمى الوظيفي المستهدف: ${params.targetJobTitle}
الوصف الوظيفي:
${params.targetJobDescription}

بيانات المرشح وخبراته:
الملخص: ${params.candidateSummary || 'غير محدد'}
المهارات: ${(params.candidateSkills || []).join(', ') || 'غير محددة'}
الخبرات المهنية:
${params.experiences
  .map(
    (e, idx) =>
      `خبرة #${idx + 1}: ${e.jobTitle} في ${e.companyName}\n${e.bullets.map((b) => `  * ${b}`).join('\n')}`,
  )
  .join('\n\n')}

قم بإجراء الفحص العميق الآن مستخدماً الأقسام المحددة.`,
    }
  }

  return {
    system: `You are an expert ATS recruitment advisor conducting an in-depth semantic alignment scan between a candidate profile and a target job description.
Identify authentically matched skills, critical missing skills, and actionable ATS improvement advice.

OUTPUT FORMAT INVARIANTS: You MUST format your response using EXACTLY these structured section delimiters:
### MATCHED_SKILLS
- [Matched skill name]
### MISSING_SKILLS
- [Missing required skill name]
### ACTIONABLE_FEEDBACK
- [Concrete, actionable recommendation to improve ATS score and recruiter impression]`,
    prompt: `TARGET ROLE: ${params.targetJobTitle}
JOB DESCRIPTION:
${params.targetJobDescription}

CANDIDATE QUALIFICATIONS:
Summary: ${params.candidateSummary || 'Not provided'}
Skills: ${(params.candidateSkills || []).join(', ') || 'Not provided'}
Work Experience:
${params.experiences
  .map(
    (e, idx) =>
      `Experience #${idx + 1}: ${e.jobTitle} at ${e.companyName}\n${e.bullets.map((b) => `  * ${b}`).join('\n')}`,
  )
  .join('\n\n')}

Analyze alignment now and output only the delimited sections.`,
  }
}

/**
 * Parses structured AI deep scan output and updates the ATS breakdown.
 */
export function parseAiDeepScanOutput(text: string, currentBreakdown: AtsBreakdown): AtsBreakdown {
  const matchedMarker = '### MATCHED_SKILLS'
  const missingMarker = '### MISSING_SKILLS'
  const feedbackMarker = '### ACTIONABLE_FEEDBACK'

  const matchedIndex = text.indexOf(matchedMarker)
  const missingIndex = text.indexOf(missingMarker)
  const feedbackIndex = text.indexOf(feedbackMarker)

  const parseLines = (sectionText: string): string[] => {
    return sectionText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- ') || l.startsWith('* '))
      .map((l) => l.replace(/^[-*]\s+/, '').trim())
      .filter((l) => l.length > 0)
  }

  let matchedSkills = currentBreakdown.matchedSkills
  let missingSkills = currentBreakdown.missingSkills
  let actionableFeedback = currentBreakdown.actionableFeedback

  if (matchedIndex !== -1 && missingIndex !== -1 && missingIndex > matchedIndex) {
    const rawMatched = text.slice(matchedIndex + matchedMarker.length, missingIndex)
    const newMatched = parseLines(rawMatched)
    if (newMatched.length > 0) {
      matchedSkills = Array.from(new Set([...matchedSkills, ...newMatched]))
    }
  }

  if (missingIndex !== -1 && feedbackIndex !== -1 && feedbackIndex > missingIndex) {
    const rawMissing = text.slice(missingIndex + missingMarker.length, feedbackIndex)
    const newMissing = parseLines(rawMissing)
    if (newMissing.length > 0) {
      missingSkills = Array.from(new Set([...missingSkills, ...newMissing]))
    }
  }

  if (feedbackIndex !== -1) {
    const rawFeedback = text.slice(feedbackIndex + feedbackMarker.length)
    const newFeedback = parseLines(rawFeedback)
    if (newFeedback.length > 0) {
      actionableFeedback = newFeedback
    }
  }

  // Remove matched skills from missing skills
  const matchedSet = new Set(matchedSkills.map((s) => s.trim().toLowerCase()))
  const dismissedSet = new Set(
    (currentBreakdown.dismissedSkills || []).map((s) => s.trim().toLowerCase()),
  )

  missingSkills = missingSkills.filter((s) => {
    const lower = s.trim().toLowerCase()
    return !matchedSet.has(lower) && !dismissedSet.has(lower)
  })

  // Recalculate keywordMatch subscore with new skills
  const totalSkills = matchedSkills.length + missingSkills.length
  const newKeywordSubscore =
    totalSkills > 0 ? Math.min(100, Math.round((matchedSkills.length / totalSkills) * 100)) : 75

  const subscores = {
    ...currentBreakdown.categorySubscores,
    keywordMatch: newKeywordSubscore,
  }

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.5 * subscores.keywordMatch +
          0.3 * subscores.experienceRelevance +
          0.2 * subscores.formattingCompliance,
      ),
    ),
  )

  return {
    ...currentBreakdown,
    overallScore,
    categorySubscores: subscores,
    matchedSkills,
    missingSkills,
    actionableFeedback,
    isStale: false,
    evaluatedAt: new Date().toISOString(),
  }
}
