export interface CandidateExperiencePromptItem {
  companyName: string
  jobTitle: string
  bullets: string[]
}

export interface CandidateProjectPromptItem {
  title: string
  role?: string | null
  description?: string | null
  bullets?: string[]
}

export interface CandidateEducationPromptItem {
  schoolName: string
  degree: string
  fieldOfStudy?: string | null
}

export interface BuildUserPromptParams {
  jobTitle: string
  companyName: string
  rawJobDescription: string
  candidateHeadline?: string | null
  candidateSummary?: string | null
  candidateExperiences: CandidateExperiencePromptItem[]
  candidateProjects?: CandidateProjectPromptItem[]
  candidateEducation?: CandidateEducationPromptItem[]
  language?: 'EN' | 'AR'
  customInstructions?: string | null
  excludedSkills?: string[]
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
    candidateProjects = [],
    candidateEducation = [],
    language = 'EN',
    customInstructions,
    excludedSkills,
  } = params

  const experienceSections = candidateExperiences
    .map((exp, idx) => {
      const bulletsText = exp.bullets.map((b) => `  * ${b}`).join('\n')
      return `Experience #${idx + 1}: ${exp.jobTitle} at ${exp.companyName}\n${bulletsText}`
    })
    .join('\n\n')

  const projectsSections = candidateProjects
    .map((p, idx) => {
      const bullets =
        p.bullets && p.bullets.length > 0 ? p.bullets.map((b) => `  * ${b}`).join('\n') : ''
      return `Project #${idx + 1}: ${p.title} (${p.role || 'Contributor'})\n${p.description || ''}\n${bullets}`.trim()
    })
    .join('\n\n')

  const educationSections = candidateEducation
    .map(
      (edu, idx) =>
        `Education #${idx + 1}: ${edu.degree} in ${edu.fieldOfStudy || 'General'} at ${edu.schoolName}`,
    )
    .join('\n')

  const excludedText =
    excludedSkills && excludedSkills.length > 0
      ? language === 'AR'
        ? `\nتنبيه مهارات مستبعدة (لا تقم بإضافتها أو اقتراحها): ${excludedSkills.join(', ')}`
        : `\nEXCLUDED SKILLS (Candidate does not possess these, DO NOT recommend or inject them): ${excludedSkills.join(', ')}`
      : ''

  const instructionsText =
    customInstructions && customInstructions.trim().length > 0
      ? language === 'AR'
        ? `\nتوجيهات وتفضيلات إضافية من المرشح:\n${customInstructions.trim()}`
        : `\nCANDIDATE CUSTOM PREFERENCES & INSTRUCTIONS:\n${customInstructions.trim()}`
      : ''

  if (language === 'AR') {
    return `الوظيفة المستهدفة:
المسمى الوظيفي: ${jobTitle}
الشركة: ${companyName}
الوصف الوظيفي:
${rawJobDescription}
${excludedText}
${instructionsText}

--------------------
بيانات المرشح وخبراته الحالية:
المسمى الحالي: ${candidateHeadline || 'غير محدد'}
الملخص الحالي: ${candidateSummary || 'غير محدد'}

الخبرات المهنية الأصلية:
${experienceSections || 'لا توجد خبرات مسجلة'}

المشاريع البارزة:
${projectsSections || 'لا توجد مشاريع مسجلة'}

المؤهلات الأكاديمية والتعليم:
${educationSections || 'لا يوجد مؤهل مسجل'}

قم الآن بصياغة الملخص المخصص والنقاط المهنية المخصصة باتباع محددات التنسيق الموضحة.`
  }

  return `TARGET JOB POSTING:
Role: ${jobTitle}
Company: ${companyName}
Job Description:
${rawJobDescription}
${excludedText}
${instructionsText}

--------------------
CANDIDATE QUALIFICATIONS & EXPERIENCE:
Current Headline: ${candidateHeadline || 'Not specified'}
Current Summary: ${candidateSummary || 'Not specified'}

Work History:
${experienceSections || 'No experiences provided'}

Projects:
${projectsSections || 'None provided'}

Education:
${educationSections || 'None provided'}

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

/**
 * Formats a tailored resume content snapshot or summary into standard display text.
 */
export function formatSnapshotAsText(
  tailoredSummary?: string | null,
  tailoredContent?: unknown,
): string {
  const snapshot = tailoredContent as TailoredResumeContentSnapshot | null | undefined
  const summary = (tailoredSummary || snapshot?.tailoredSummary || '').trim()
  const bullets: string[] = []

  if (snapshot && Array.isArray(snapshot.tailoredExperiences)) {
    for (const exp of snapshot.tailoredExperiences) {
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          const text = typeof b?.tailored === 'string' ? b.tailored.trim() : ''
          if (text) bullets.push(`- ${text}`)
        }
      }
    }
  }

  if (!summary && bullets.length === 0) {
    return ''
  }

  if (bullets.length === 0) {
    return summary
  }

  return `### SUMMARY\n${summary}\n\n### BULLETS\n${bullets.join('\n')}`
}
