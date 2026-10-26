import type { OutreachTone, OutreachRecipientType } from '@/lib/validations/career-prep'

export interface BuildOutreachPromptParams {
  candidateName: string
  roleTitle: string
  companyName: string
  jobContext: string
  keyAchievements: string[]
  tone: OutreachTone
  recipientType: OutreachRecipientType
  language?: 'EN' | 'AR'
}

export interface BuildVariantRegeneratePromptParams extends BuildOutreachPromptParams {
  variant: 'connectionNote' | 'inMail' | 'email'
}

/**
 * Trims text at the last complete word boundary before maxLen.
 * Guarantees output text is <= maxLen characters and does not cut words in half.
 */
export function trimAtWordBoundary(text: string, maxLen: number = 300): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) {
    return trimmed
  }

  const slice = trimmed.slice(0, maxLen)
  const lastSpaceIndex = slice.lastIndexOf(' ')
  const lastPunctuationIndex = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf(','),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('؟'),
    slice.lastIndexOf('،'),
    slice.lastIndexOf(';'),
  )

  const boundaryIndex = Math.max(lastSpaceIndex, lastPunctuationIndex)
  if (boundaryIndex > 0) {
    return slice
      .slice(0, boundaryIndex)
      .trim()
      .replace(/[,،;:.!?]+$/, '')
  }

  return slice.trim()
}

export function buildOutreachPrompts(params: BuildOutreachPromptParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'
  const isArabic = language === 'AR'

  const toneGuidelinesEn: Record<OutreachTone, string> = {
    PROFESSIONAL:
      'Tone: Polished, respectful, executive, focusing on strategic alignment and verified competencies.',
    CONFIDENT:
      'Tone: Assertive, impactful, high-energy, highlighting measurable accomplishments and direct leadership.',
    CONVERSATIONAL:
      'Tone: Personable, warm, approachable, collaborative, building rapport while showcasing relevant expertise.',
  }

  const toneGuidelinesAr: Record<OutreachTone, string> = {
    PROFESSIONAL: 'النبرة: رسمية، راقية، تركز على المواءمة الاستراتيجية والكفاءات المهنية المؤكدة.',
    CONFIDENT: 'النبرة: واثقة، مؤثرة، تبرز الإنجازات القابلة للقياس والقدرة العالية على الإنجاز.',
    CONVERSATIONAL: 'النبرة: ودودة، دافئة، تفاعلية، تبني جسور التواصل مع إبراز الخبرات ذات الصلة.',
  }

  const recipientGuidelinesEn: Record<OutreachRecipientType, string> = {
    RECRUITER:
      'Target: Talent Acquisition / Recruiter. Focus on role match, core tech stack keywords, and availability.',
    HIRING_MANAGER:
      'Target: Engineering / Department Manager. Focus on business impact, solving immediate pain points, and architectural value.',
    PEER: 'Target: Senior Peer / Engineer. Focus on shared technical interests, engineering culture, and specific stack problems.',
    ALUMNI:
      'Target: University or Company Alumni. Focus on shared connection background, mutual affinity, and career insights.',
  }

  const recipientGuidelinesAr: Record<OutreachRecipientType, string> = {
    RECRUITER:
      'المستهدف: مسؤول استقطاب المواهب / التوظيف. ركز على التوافق الوظيفي والكلمات المفتاحية والجاهزية.',
    HIRING_MANAGER:
      'المستهدف: المدير الفني أو مدير التوظيف. ركز على القيمة المضافة وحل التحديات الهندسية الحقيقية.',
    PEER: 'المستهدف: زميل مهني أو مهندس. ركز على الاهتمامات التقنية المشتركة وثقافة التطوير وتبادل المعرفة.',
    ALUMNI:
      'المستهدف: خريج نفس الجامعة أو زميل سابق. ركز على الرابط المشترك والاستئناس بالخبرات المتبادلة.',
  }

  const achievementsList =
    params.keyAchievements.length > 0
      ? params.keyAchievements.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : isArabic
        ? 'مهندس برمجيات ذو خبرة في الحلول التقنية الحديثة'
        : 'Experienced software engineer with expertise in modern technologies'

  if (isArabic) {
    return {
      system: `أنت خبير مراسلات مهنية واستقطاب وظيفي متخصص في كتابة رسائل التواصل البارد (Cold Outreach) عالية التحويل في بيئة العمل التقنية.

المطلوب توليد 3 صيغ تواصل متكاملة ومخصصة بناءً على خلفية المرشح والوظيفة المستهدفة:
1. ملاحظة طلب اتصال لينكد إن (connectionNote):
   - يجب ألا تتجاوز 280 حرفاً إطلاقاً حتى تتسع بشكل كامل ودون اقتطاع لحد لينكد إن الأقصى (300 حرف).
   - مختصرة، مركزة، تذكر نقطة اهتمام محددة أو قيمة ملموسة، ودعوة تواصل لطيفة.
2. رسالة لينكد إن إنميل (inMail):
   - عنوان جذاب (subject) ونص متكامل (body) من 120-220 كلمة يشرح القيمة المضافة باقتضاب ورابط السيرة.
3. بريد إلكتروني بارد (email):
   - عنوان واضح واحترافي (subject) ورسالة بريد منظمة (body) ذات مقدمة موجزة، نقاط قوة مبنية على الخبرات الحقيقية، ودعوة لنقاش سريع.

الضوابط الصارمة:
- ${toneGuidelinesAr[params.tone]}
- ${recipientGuidelinesAr[params.recipientType]}
- منع اختلاق أي أرقام أو شركات غير موجودة في بيانات المرشح.
- الصياغة بلغة عربية فصيحة، احترافية، سلسة وخالية من الترجمة الحرفية الركيكة.`,
      prompt: `بيانات المرشح والفرصة المستهدفة:
اسم المرشح: ${params.candidateName || 'مرشح متميز'}
المسمى الوظيفي المستهدف: ${params.roleTitle}
اسم الشركة المستهدفة: ${params.companyName}

سياق الوظيفة ومتطلباتها:
${params.jobContext}

أبرز إنجازات وخبرات المرشح المعتمدة:
${achievementsList}

قم بتوليد كائن JSON متوافق مع المخطط المحدد يحتوي على connectionNote وinMail وemail باللغة العربية. احرص على أن تكون connectionNote.text أقل من 280 حرفاً بدقة.`,
    }
  }

  return {
    system: `You are an elite career outreach strategist and executive copywriter specializing in high-conversion outreach for tech and corporate roles.

You generate three targeted cold outreach message variants based on the candidate's authentic profile and target job:
1. LinkedIn Connection Request Note (connectionNote):
   - CRITICAL CONSTRAINT: Must be strictly under 280 characters so it fits comfortably within LinkedIn's 300-character hard limit without truncation.
   - Punchy, high-context, mentions a specific common ground or value point, with a courteous invitation to connect.
2. LinkedIn InMail Pitch (inMail):
   - Compelling subject line and a structured body (120-220 words) articulating tangible value, relevant accomplishments, and a low-friction call to action.
3. Formal Cold Email (email):
   - Professional subject line and an email body with an opening hook, 2-3 tailored value bullets derived from authentic achievements, and a polite invitation for an intro call.

STRICT INVARIANTS:
- ${toneGuidelinesEn[params.tone]}
- ${recipientGuidelinesEn[params.recipientType]}
- ZERO HALLUCINATIONS: Ground all mentions strictly in the provided candidate achievements and context. Do not invent unearned claims or past employers.
- Write in clean, modern, natural English without corporate clichés or robotic phrasing.`,
    prompt: `Candidate and Target Role Context:
Candidate Name: ${params.candidateName || 'Candidate'}
Target Role Title: ${params.roleTitle}
Target Company: ${params.companyName}

Target Job Context & Requirements:
${params.jobContext}

Authentic Candidate Achievements & Background:
${achievementsList}

Generate the structured JSON payload containing connectionNote, inMail, and email in English. Ensure connectionNote.text is strictly under 280 characters.`,
  }
}

export function buildSingleVariantPrompt(params: BuildVariantRegeneratePromptParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'
  const isArabic = language === 'AR'

  const variantLabels = {
    connectionNote: isArabic
      ? 'ملاحظة اتصال لينكد إن (أقل من 280 حرفاً)'
      : 'LinkedIn connection request note (strictly under 280 characters)',
    inMail: isArabic
      ? 'رسالة لينكد إن إنميل (عنوان ونص)'
      : 'LinkedIn InMail pitch (subject and body)',
    email: isArabic ? 'بريد إلكتروني بارد (عنوان ونص)' : 'Cold email pitch (subject and body)',
  }

  if (isArabic) {
    return {
      system: `أنت خبير مراسلات مهنية تقنية. مهمتك إعادة صياغة خيار واحد فقط: ${variantLabels[params.variant]}.
الضوابط:
- النبرة: ${params.tone}
- الفئة المستهدفة: ${params.recipientType}
- منع اختلاق أي إنجازات وهمية.
${params.variant === 'connectionNote' ? '- شرط صارم: يجب أن يكون النص أقل من 280 حرفاً بدقة وبلا اقتطاع.' : ''}`,
      prompt: `المرشح: ${params.candidateName}
الوظيفة: ${params.roleTitle} في ${params.companyName}
السياق: ${params.jobContext}
الإنجازات: ${params.keyAchievements.join('; ')}

أعد توليد ${params.variant} فقط الآن باللغة العربية.`,
    }
  }

  return {
    system: `You are an elite career outreach strategist. Your task is to regenerate ONLY the single message variant: ${variantLabels[params.variant]}.
Invariants:
- Tone: ${params.tone}
- Recipient Type: ${params.recipientType}
- Zero hallucinations: ground strictly in authentic candidate achievements.
${params.variant === 'connectionNote' ? '- STRICT LIMIT: The note must be under 280 characters.' : ''}`,
    prompt: `Candidate: ${params.candidateName}
Role: ${params.roleTitle} at ${params.companyName}
Job Context: ${params.jobContext}
Achievements: ${params.keyAchievements.join('; ')}

Regenerate only the ${params.variant} variant now in English.`,
  }
}
