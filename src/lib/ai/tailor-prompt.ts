export interface CandidateExperiencePromptItem {
  companyName: string
  jobTitle: string
  bullets: string[]
}

export interface BuildUserPromptParams {
  jobTitle: string
  companyName: string
  rawJobDescription: string
  candidateHeadline?: string | null
  candidateSummary?: string | null
  candidateExperiences: CandidateExperiencePromptItem[]
  language?: 'EN' | 'AR'
}

export interface ParsedTailorOutput {
  summary: string
  bullets: string[]
  rawSummary: string
  rawBullets: string
}

export interface TailoredResumeContentSnapshot {
  targetRole: string
  tailoredSummary: string
  tailoredExperiences: Array<{
    companyName: string
    jobTitle: string
    bullets: Array<{
      tailored: string
      matchedKeywords?: string[]
    }>
  }>
}

export function buildTailoringSystemPrompt(language: 'EN' | 'AR' = 'EN'): string {
  if (language === 'AR') {
    return `أنت مستشار توظيف محترف وكاتب سير ذاتية خبير باللغة العربية.
مهمتك: تخصيص ملخص السيرة الذاتية والنقاط المهنية للمرشح لاستهداف الوظيفة المطلوبة بدقة عالية وأنظمة تتبع المتقدمين (ATS).

القواعد الإلزامية الصارمة:
1. منع التلفيق والاختلاق منعاً باتاً: يحظر تماماً إضافة أي مهارات، شهادات، سنوات خبرة، أو إنجازات لم ترد صراحة في تجربة المرشح الأصلية.
2. استخدام لغة عربية مهنية وفصحى واضحة وعالية التأثير تبدأ بأفعال حركة قوية.
3. التنسيق الدقيق باستخدام العلامات المحددة التالية فقط:
### SUMMARY
[اكتب الملخص المهني المخصص هنا في 2-4 جمل مركزة تبرز التوافق مع متطلبات الوظيفة]
### BULLETS
[اكتب النقاط المخصصة لكل شركة هنا، مبدوءة بـ "- "، مع إعادة صياغة نقاط المرشح الأصلية لتبرز الكلمات المفتاحية للوظيفة دون اختلاق]

لا تضف أي نصوص افتتاحية أو ختامية خارج هذا الهيكل المحدد.`
  }

  return `You are an elite career strategist and ATS resume optimization expert.
Your mission: Tailor the candidate's professional summary and experience bullet points to precisely match the target job description.

STRICT INVARIANTS:
1. ZERO HALLUCINATION POLICY: Under NO circumstances should you invent, assume, or fabricate unearned skills, certifications, metrics, or company responsibilities. All tailored statements MUST be grounded strictly in the candidate's authentic background provided.
2. Use active, punchy, metric-oriented professional English starting with strong action verbs.
3. OUTPUT FORMAT DELIMITERS: You MUST format your response using EXACTLY these structured section delimiters:
### SUMMARY
[Write 2-4 sentences of impactful tailored professional summary targeting the job]
### BULLETS
[List the tailored bullet points, each on a new line starting with "- ", highlighting transferable skills and keywords matching the target role without fabrication]

Do not include greetings, markdown code blocks, conversational filler, or closing remarks. Output only the delimited sections.`
}

export function buildTailoringUserPrompt(params: BuildUserPromptParams): string {
  const {
    jobTitle,
    companyName,
    rawJobDescription,
    candidateHeadline,
    candidateSummary,
    candidateExperiences,
    language = 'EN',
  } = params

  const experienceSections = candidateExperiences
    .map((exp, idx) => {
      const bulletsText = exp.bullets.map((b) => `  * ${b}`).join('\n')
      return `Experience #${idx + 1}: ${exp.jobTitle} at ${exp.companyName}\n${bulletsText}`
    })
    .join('\n\n')

  if (language === 'AR') {
    return `الوظيفة المستهدفة:
المسمى الوظيفي: ${jobTitle}
الشركة: ${companyName}
الوصف الوظيفي:
${rawJobDescription}

--------------------
بيانات المرشح وخبراته الحالية:
المسمى الحالي: ${candidateHeadline || 'غير محدد'}
الملخص الحالي: ${candidateSummary || 'غير محدد'}

الخبرات المهنية الأصلية:
${experienceSections || 'لا توجد خبرات مسجلة'}

قم الآن بصياغة الملخص المخصص والنقاط المهنية المخصصة باتباع محددات التنسيق الموضحة.`
  }

  return `TARGET JOB POSTING:
Role: ${jobTitle}
Company: ${companyName}
Job Description:
${rawJobDescription}

--------------------
CANDIDATE QUALIFICATIONS & EXPERIENCE:
Current Headline: ${candidateHeadline || 'Not specified'}
Current Summary: ${candidateSummary || 'Not specified'}

Work History:
${experienceSections || 'No experiences provided'}

Now tailor the candidate summary and experience bullets strictly following the ### SUMMARY and ### BULLETS structure.`
}

export function parseTailoredStream(text: string): ParsedTailorOutput {
  const summaryMarker = '### SUMMARY'
  const bulletsMarker = '### BULLETS'

  let rawSummary = ''
  let rawBullets = ''

  const summaryIndex = text.indexOf(summaryMarker)
  const bulletsIndex = text.indexOf(bulletsMarker)

  if (summaryIndex !== -1) {
    if (bulletsIndex !== -1 && bulletsIndex > summaryIndex) {
      rawSummary = text.slice(summaryIndex + summaryMarker.length, bulletsIndex).trim()
      rawBullets = text.slice(bulletsIndex + bulletsMarker.length).trim()
    } else {
      rawSummary = text.slice(summaryIndex + summaryMarker.length).trim()
    }
  } else if (bulletsIndex !== -1) {
    rawBullets = text.slice(bulletsIndex + bulletsMarker.length).trim()
  } else {
    rawSummary = text.trim()
  }

  const bullets = rawBullets
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || line.startsWith('* '))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0)

  return {
    summary: rawSummary,
    bullets,
    rawSummary,
    rawBullets,
  }
}

export function createTailoredSnapshot(
  targetRole: string,
  candidateExperiences: CandidateExperiencePromptItem[],
  streamedText: string,
): TailoredResumeContentSnapshot {
  const parsed = parseTailoredStream(streamedText)

  const tailoredBullets = [...parsed.bullets]

  const experiences = candidateExperiences.map((exp) => {
    const expBulletsCount = Math.max(1, exp.bullets.length)
    const assignedBullets = tailoredBullets.splice(0, expBulletsCount)

    return {
      companyName: exp.companyName,
      jobTitle: exp.jobTitle,
      bullets: (assignedBullets.length > 0 ? assignedBullets : exp.bullets).map((b) => ({
        tailored: b,
      })),
    }
  })

  return {
    targetRole,
    tailoredSummary: parsed.summary,
    tailoredExperiences: experiences,
  }
}
