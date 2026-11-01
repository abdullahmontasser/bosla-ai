import { z } from 'zod'

export const OutreachToneSchema = z.enum(['PROFESSIONAL', 'CONFIDENT', 'CONVERSATIONAL'])
export type OutreachTone = z.infer<typeof OutreachToneSchema>

export const OutreachRecipientTypeSchema = z.enum(['RECRUITER', 'HIRING_MANAGER', 'PEER', 'ALUMNI'])
export type OutreachRecipientType = z.infer<typeof OutreachRecipientTypeSchema>

export const ConnectionNoteSchema = z.object({
  text: z.string().max(300, 'LinkedIn connection note must not exceed 300 characters'),
  charCount: z.number().int().nonnegative().max(300),
})
export type ConnectionNote = z.infer<typeof ConnectionNoteSchema>

export const OutreachMessageVariantSchema = z.object({
  subject: z.string(),
  body: z.string(),
})
export type OutreachMessageVariant = z.infer<typeof OutreachMessageVariantSchema>

export const OutreachMessagePayloadSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }).or(z.string()),
  updatedAt: z.string().datetime({ offset: true }).or(z.string()),
  language: z.enum(['EN', 'AR']),
  tone: OutreachToneSchema,
  recipientType: OutreachRecipientTypeSchema,
  connectionNote: ConnectionNoteSchema,
  inMail: OutreachMessageVariantSchema,
  email: OutreachMessageVariantSchema,
})
export type OutreachMessagePayload = z.infer<typeof OutreachMessagePayloadSchema>

export const GenerateOutreachInputSchema = z.object({
  tailoredResumeId: z.string().min(1, 'Tailored resume ID is required'),
  tone: OutreachToneSchema.default('PROFESSIONAL'),
  recipientType: OutreachRecipientTypeSchema.default('RECRUITER'),
  language: z.enum(['EN', 'AR']).optional(),
})
export type GenerateOutreachInput = z.infer<typeof GenerateOutreachInputSchema>

export const RegenerateOutreachVariantInputSchema = z.object({
  tailoredResumeId: z.string().min(1, 'Tailored resume ID is required'),
  variant: z.enum(['connectionNote', 'inMail', 'email']),
  tone: OutreachToneSchema.optional(),
  recipientType: OutreachRecipientTypeSchema.optional(),
  language: z.enum(['EN', 'AR']).optional(),
})
export type RegenerateOutreachVariantInput = z.infer<typeof RegenerateOutreachVariantInputSchema>

// Interview Prep Schemas
export const QuestionCategorySchema = z.enum(['BEHAVIORAL', 'TECHNICAL', 'SITUATIONAL', 'CUSTOM'])
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>

export const StarResponseSchema = z.object({
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
})
export type StarResponse = z.infer<typeof StarResponseSchema>

export const InterviewQuestionSchema = z
  .object({
    id: z.string().min(1),
    category: QuestionCategorySchema,
    customOrigin: z.boolean().default(false),
    question: z.string(),
    whyAsked: z.string().default(''),
    starResponse: StarResponseSchema,
    referencedSources: z.array(z.string()).default([]),
    missingMetricFlags: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.customOrigin && data.category !== 'CUSTOM') {
      if (!data.question || data.question.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question cannot be empty for AI generated questions',
          path: ['question'],
        })
      }
      if (!data.whyAsked || data.whyAsked.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'whyAsked cannot be empty for AI generated questions',
          path: ['whyAsked'],
        })
      }
      if (!data.starResponse.situation || data.starResponse.situation.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Situation cannot be empty for AI generated questions',
          path: ['starResponse', 'situation'],
        })
      }
      if (!data.starResponse.task || data.starResponse.task.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Task cannot be empty for AI generated questions',
          path: ['starResponse', 'task'],
        })
      }
      if (!data.starResponse.action || data.starResponse.action.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Action cannot be empty for AI generated questions',
          path: ['starResponse', 'action'],
        })
      }
      if (!data.starResponse.result || data.starResponse.result.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Result cannot be empty for AI generated questions',
          path: ['starResponse', 'result'],
        })
      }
    }
  })
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>

export const QuestionsToAskInterviewerSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  strategicGoal: z.string().min(1),
})
export type QuestionsToAskInterviewer = z.infer<typeof QuestionsToAskInterviewerSchema>

/**
 * Single source of truth for bilingual category labels, shared by the copy full sheet
 * assembly and the print route. StarQuestionCard keeps its own map because it adds
 * per-category UI colors.
 */
export const INTERVIEW_CATEGORY_LABELS: Record<QuestionCategory, { en: string; ar: string }> = {
  BEHAVIORAL: { en: 'Behavioral Question', ar: 'سؤال سلوكي' },
  TECHNICAL: { en: 'Technical Question', ar: 'سؤال تقني' },
  SITUATIONAL: { en: 'Situational Question', ar: 'سؤال موقفي' },
  CUSTOM: { en: 'Custom Question', ar: 'سؤال مخصص' },
}

export const InterviewPrepPayloadSchema = z
  .object({
    version: z.literal(2),
    generatedAt: z.string().datetime({ offset: true }).or(z.string()).nullable(),
    updatedAt: z.string().datetime({ offset: true }).or(z.string()),
    language: z.enum(['EN', 'AR']),
    roleTitle: z.string(),
    companyName: z.string(),
    questions: z.array(InterviewQuestionSchema),
    questionsToAskInterviewer: z.array(QuestionsToAskInterviewerSchema),
  })
  .refine((data) => data.questions.filter((q) => q.customOrigin).length <= 10, {
    message: 'At most 10 custom questions allowed per payload',
    path: ['questions'],
  })
export type InterviewPrepPayload = z.infer<typeof InterviewPrepPayloadSchema>

/**
 * Normalizes any interview prep payload (v1 or partial v2) to valid InterviewPrepPayload v2.
 * Backfills missing fields: customOrigin false, version 2, generatedAt nullable.
 */
export function normalizeInterviewPrepPayload(raw: unknown): InterviewPrepPayload | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const obj = raw as Record<string, unknown>
  const language = obj.language === 'AR' ? 'AR' : 'EN'
  const roleTitle = typeof obj.roleTitle === 'string' ? obj.roleTitle : ''
  const companyName = typeof obj.companyName === 'string' ? obj.companyName : ''
  const generatedAt = typeof obj.generatedAt === 'string' ? obj.generatedAt : null
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString()

  const rawQuestions = Array.isArray(obj.questions) ? obj.questions : []
  const questions = rawQuestions.map((q: unknown) => {
    if (!q || typeof q !== 'object') {
      return {
        id: crypto.randomUUID(),
        category: 'CUSTOM' as const,
        customOrigin: true,
        question: '',
        whyAsked: '',
        starResponse: { situation: '', task: '', action: '', result: '' },
        referencedSources: [],
        missingMetricFlags: [],
      }
    }
    const qObj = q as Record<string, unknown>
    const id = typeof qObj.id === 'string' && qObj.id.length > 0 ? qObj.id : crypto.randomUUID()

    let category: QuestionCategory = 'CUSTOM'
    if (
      qObj.category === 'BEHAVIORAL' ||
      qObj.category === 'TECHNICAL' ||
      qObj.category === 'SITUATIONAL' ||
      qObj.category === 'CUSTOM'
    ) {
      category = qObj.category
    }

    const customOrigin =
      typeof qObj.customOrigin === 'boolean'
        ? qObj.customOrigin
        : qObj.category === 'CUSTOM'
          ? true
          : false

    const question = typeof qObj.question === 'string' ? qObj.question : ''
    const whyAsked = typeof qObj.whyAsked === 'string' ? qObj.whyAsked : ''

    const starObj =
      qObj.starResponse && typeof qObj.starResponse === 'object'
        ? (qObj.starResponse as Record<string, unknown>)
        : {}

    const starResponse = {
      situation: typeof starObj.situation === 'string' ? starObj.situation : '',
      task: typeof starObj.task === 'string' ? starObj.task : '',
      action: typeof starObj.action === 'string' ? starObj.action : '',
      result: typeof starObj.result === 'string' ? starObj.result : '',
    }

    const referencedSources = Array.isArray(qObj.referencedSources)
      ? qObj.referencedSources.filter((s): s is string => typeof s === 'string')
      : []

    const missingMetricFlags = Array.isArray(qObj.missingMetricFlags)
      ? qObj.missingMetricFlags.filter((f): f is string => typeof f === 'string')
      : []

    return {
      id,
      category,
      customOrigin,
      question,
      whyAsked,
      starResponse,
      referencedSources,
      missingMetricFlags,
    }
  })

  const rawInterviewerQuestions = Array.isArray(obj.questionsToAskInterviewer)
    ? obj.questionsToAskInterviewer
    : []
  const questionsToAskInterviewer = rawInterviewerQuestions.map((qi: unknown) => {
    if (!qi || typeof qi !== 'object') {
      return {
        id: crypto.randomUUID(),
        question: '',
        strategicGoal: '',
      }
    }
    const qiObj = qi as Record<string, unknown>
    return {
      id: typeof qiObj.id === 'string' && qiObj.id.length > 0 ? qiObj.id : crypto.randomUUID(),
      question: typeof qiObj.question === 'string' ? qiObj.question : '',
      strategicGoal: typeof qiObj.strategicGoal === 'string' ? qiObj.strategicGoal : '',
    }
  })

  const candidate = {
    version: 2 as const,
    generatedAt,
    updatedAt,
    language,
    roleTitle,
    companyName,
    questions,
    questionsToAskInterviewer,
  }

  const parsed = InterviewPrepPayloadSchema.safeParse(candidate)
  if (parsed.success) {
    return parsed.data
  }
  return null
}

/**
 * Assembles a localized plain text cheat sheet for copying full sheet content.
 * Labels follow payload.language to prevent mixing RTL and LTR scripts.
 */
export function assembleFullSheetText(payload: InterviewPrepPayload): string {
  const isAr = payload.language === 'AR'
  const lines: string[] = []

  if (isAr) {
    lines.push(`ورقة التحضير للمقابلة: ${payload.roleTitle} - ${payload.companyName}`)
    lines.push('')
    lines.push('--- أسئلة المقابلة ونموذج STAR ---')
    lines.push('')

    payload.questions.forEach((q, idx) => {
      const categoryLabel = INTERVIEW_CATEGORY_LABELS[q.category][isAr ? 'ar' : 'en']

      lines.push(`${idx + 1}. ${q.question} [${categoryLabel}]`)
      if (q.whyAsked) {
        lines.push(`هدف المقابِل: ${q.whyAsked}`)
      }
      lines.push(`الموقف: ${q.starResponse.situation}`)
      lines.push(`المهمة: ${q.starResponse.task}`)
      lines.push(`الإجراء: ${q.starResponse.action}`)
      lines.push(`النتيجة: ${q.starResponse.result}`)
      lines.push('')
    })

    if (payload.questionsToAskInterviewer.length > 0) {
      lines.push('--- أسئلة تطرحها على المقابِل ---')
      lines.push('')
      payload.questionsToAskInterviewer.forEach((qi, idx) => {
        lines.push(`${idx + 1}. ${qi.question}`)
        if (qi.strategicGoal) {
          lines.push(`الهدف الاستراتيجي: ${qi.strategicGoal}`)
        }
        lines.push('')
      })
    }
  } else {
    lines.push(`Interview Prep Cheat Sheet: ${payload.roleTitle} - ${payload.companyName}`)
    lines.push('')
    lines.push('--- Interview Questions & STAR Responses ---')
    lines.push('')

    payload.questions.forEach((q, idx) => {
      const categoryLabel = INTERVIEW_CATEGORY_LABELS[q.category][isAr ? 'ar' : 'en']

      lines.push(`${idx + 1}. ${q.question} [${categoryLabel}]`)
      if (q.whyAsked) {
        lines.push(`Interviewer Intent: ${q.whyAsked}`)
      }
      lines.push(`Situation: ${q.starResponse.situation}`)
      lines.push(`Task: ${q.starResponse.task}`)
      lines.push(`Action: ${q.starResponse.action}`)
      lines.push(`Result: ${q.starResponse.result}`)
      lines.push('')
    })

    if (payload.questionsToAskInterviewer.length > 0) {
      lines.push('--- Questions to Ask the Interviewer ---')
      lines.push('')
      payload.questionsToAskInterviewer.forEach((qi, idx) => {
        lines.push(`${idx + 1}. ${qi.question}`)
        if (qi.strategicGoal) {
          lines.push(`Strategic Goal: ${qi.strategicGoal}`)
        }
        lines.push('')
      })
    }
  }

  return lines.join('\n').trim()
}

export const GenerateInterviewPrepInputSchema = z.object({
  tailoredResumeId: z.string().min(1, 'Tailored resume ID is required'),
  language: z.enum(['EN', 'AR']).optional(),
})
export type GenerateInterviewPrepInput = z.infer<typeof GenerateInterviewPrepInputSchema>

export const RegenerateInterviewQuestionInputSchema = z.object({
  tailoredResumeId: z.string().min(1, 'Tailored resume ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  language: z.enum(['EN', 'AR']).optional(),
})
export type RegenerateInterviewQuestionInput = z.infer<
  typeof RegenerateInterviewQuestionInputSchema
>

// Bilingual Mock Fixtures
export const mockOutreachPayloadEn: OutreachMessagePayload = {
  version: 1,
  generatedAt: '2026-10-26T00:00:00.000Z',
  updatedAt: '2026-10-26T00:00:00.000Z',
  language: 'EN',
  tone: 'PROFESSIONAL',
  recipientType: 'RECRUITER',
  connectionNote: {
    text: "Hi Sarah, noticed your focus on scalable AI infrastructure at CloudScale. I recently engineered streaming AI pipelines with Vercel AI SDK and Next.js, cutting latency by 60%. Would love to connect and follow your team's work.",
    charCount: 228,
  },
  inMail: {
    subject: 'Senior Full Stack Engineer exploring AI engineering at CloudScale',
    body: "Hi Sarah,\n\nI hope this week is going well. I have been following CloudScale's expansion in generative AI tooling with great enthusiasm.\n\nOver the past 6 years, I have architected high-throughput cloud web applications with Next.js App Router, TypeScript, and PostgreSQL. Recently at TechVanguard, I engineered a bilingual streaming agent using Vercel AI SDK that reduced end-to-end response latency by 60% while optimizing database throughput.\n\nGiven CloudScale's current opening for a Senior Full Stack Engineer, I would welcome the opportunity to discuss how my hands-on background in TypeScript architecture and AI integration aligns with your technical roadmap.\n\nBest regards,\nAlex Chen",
  },
  email: {
    subject: 'Application & Technical Intro: Alex Chen for Senior Full Stack Engineer',
    body: "Dear Sarah,\n\nI am writing to express my strong interest in the Senior Full Stack Engineer position at CloudScale.\n\nWith extensive experience in TypeScript, React Server Components, and PostgreSQL, I specialize in building reliable, low-latency applications that integrate modern AI capabilities. In my previous role at TechVanguard, I led the development of a career orchestration platform that handled thousands of concurrent resume transformations with zero data leakage.\n\nI have attached my tailored resume for your consideration and would welcome a brief conversation regarding how my technical background matches your team's goals.\n\nThank you for your time and consideration.\n\nSincerely,\nAlex Chen\nhttps://linkedin.com/in/alexchen",
  },
}

export const mockOutreachPayloadAr: OutreachMessagePayload = {
  version: 1,
  generatedAt: '2026-10-26T00:00:00.000Z',
  updatedAt: '2026-10-26T00:00:00.000Z',
  language: 'AR',
  tone: 'PROFESSIONAL',
  recipientType: 'RECRUITER',
  connectionNote: {
    text: 'مرحباً سارة، لفت انتباهي تركيزكم على بنية الذكاء الاصطناعي في كلاود سكيل. طوّرت مؤخراً خطوط معالجة ذكاء اصطناعي تدفقية باستخدام Next.js خفّضت زمن الاستجابة بنسبة 60%. يسعدني التواصل معكم ومتابعة إنجازات الفريق.',
    charCount: 222,
  },
  inMail: {
    subject: 'مهندس برمجيات متكامل أول مهتم بتطوير الذكاء الاصطناعي في كلاود سكيل',
    body: 'مرحباً سارة،\n\nأتمنى لكِ أسبوعاً مثمراً. تابعت باهتمام توسع كلاود سكيل في أدوات الذكاء الاصطناعي التوليدي.\n\nعلى مدار 6 سنوات، عملت على هندسة تطبيقات سحابية عالية الأداء باستخدام Next.js App Router وTypeScript وPostgreSQL. ومؤخراً قمت بهندسة خطوط معالجة تدفقية خفضت زمن الاستجابة بنسبة 60% مع تعزيز كفاءة قواعد البيانات.\n\nيسعدني جداً بحث سبل التعاون وكيف تتوافق خبرتي مع الشاغر الحالي لديكم.\n\nمع خالص التقدير،\nأحمد المنصور',
  },
  email: {
    subject: 'مقدم طلب وهندسة تقنية: أحمد المنصور لوظيفة مهندس برمجيات متكامل أول',
    body: 'الأستاذة الفاضلة سارة،\n\nأود التعبير عن اهتمامي الشديد بالانضمام إلى فريق كلاود سكيل في منصب مهندس برمجيات متكامل أول.\n\nبفضل خبرتي المعمقة في بناء التطبيقات السحابية الموثوقة ومعالجة البيانات المتزامنة، حققت تحسينات ملموسة في أداء الأنظمة وتجربة المستخدمين ثنائيي اللغة.\n\nأرفق سيرتي الذاتية المخصصة للاطلاع، ويسعدني إجراء محادثة موجزة لمناقشة كيف يمكنني المساهمة في أهداف فريقكم التقنية.\n\nشاكراً لكِ وقتكِ واهتمامكِ.\n\nمع وافر الاحترام،\nأحمد المنصور',
  },
}

export const mockInterviewPrepPayloadEn: InterviewPrepPayload = {
  version: 2,
  generatedAt: '2026-10-26T00:00:00.000Z',
  updatedAt: '2026-10-26T00:00:00.000Z',
  language: 'EN',
  roleTitle: 'Senior Full Stack Engineer (AI Integration)',
  companyName: 'CloudScale Technologies',
  questions: [
    {
      id: 'q-1',
      category: 'BEHAVIORAL',
      customOrigin: false,
      question:
        'Tell me about a time you handled competing priorities when shipping a critical product feature under tight deadlines.',
      whyAsked:
        'Evaluates your ability to balance technical debt, scope negotiation, and team delivery velocity.',
      starResponse: {
        situation:
          'At TechVanguard Systems, our team faced a tight 3-week deadline to launch an enterprise resume parser while integrating a new streaming AI provider.',
        task: 'As lead engineer, I had to ensure zero downtime for existing users while delivering the new streaming capabilities on schedule.',
        action:
          'I broke the delivery into a tracer bullet slice, created feature flags to isolate AI provider streaming, and automated regression testing across our bilingual pipeline.',
        result:
          'We shipped on schedule without regressions, achieving a [insert latency reduction %] decrease in user turnaround time and maintaining 99.9% uptime.',
      },
      referencedSources: ['TechVanguard Systems', 'Resume Ingestion Pipeline'],
      missingMetricFlags: ['[insert latency reduction %]'],
    },
    {
      id: 'q-2',
      category: 'TECHNICAL',
      customOrigin: false,
      question:
        'How do you design and optimize AI streaming pipelines in Next.js App Router to avoid server action timeouts and memory leaks?',
      whyAsked:
        'Assesses deep knowledge of React Server Components, HTTP chunked streaming, and backpressure handling.',
      starResponse: {
        situation:
          'Our application was experiencing high latency and potential timeouts when processing lengthy resume evaluations through heavy LLM prompts.',
        task: 'Design an end-to-end streaming architecture that streams response tokens incrementally without blocking serverless execution limits.',
        action:
          'I integrated Vercel AI SDK with a dedicated route handler, utilizing ReadableStream and TextDecoder to push chunks immediately while storing final snapshots in PostgreSQL asynchronously.',
        result:
          'Decreased time-to-first-token to under 800ms and eliminated serverless timeout errors completely.',
      },
      referencedSources: ['Streaming AI Engine', 'Next.js App Router'],
      missingMetricFlags: [],
    },
    {
      id: 'q-3',
      category: 'SITUATIONAL',
      customOrigin: false,
      question:
        'If an AI provider experiences sudden rate limiting or an outage in production, how would you ensure user continuity?',
      whyAsked:
        'Tests your resilience mindset, fallback system design, and graceful user error communication.',
      starResponse: {
        situation:
          'During peak recruitment season, commercial AI provider quotas could be exhausted abruptly, causing failed tailoring requests.',
        task: 'Implement a resilient multi-provider failover mechanism with clear, transparent user feedback.',
        action:
          'I built dynamic BYOK provider switching, caching model configurations with AES-256 encrypted keys and adding deterministic client-side fallbacks.',
        result:
          'Users could seamlessly switch to alternative providers within 2 clicks without losing draft work, protecting critical application workflows.',
      },
      referencedSources: ['BYOK Multi-Provider Architecture'],
      missingMetricFlags: [],
    },
  ],
  questionsToAskInterviewer: [
    {
      id: 'qi-1',
      question:
        'How does your engineering team balance rapid AI experimentation with production reliability and strict latency SLAs?',
      strategicGoal:
        'Demonstrates focus on operational excellence, testing rigor, and scalable system architecture.',
    },
    {
      id: 'qi-2',
      question:
        'What are the primary technical bottlenecks currently facing your streaming data and LLM orchestration layer?',
      strategicGoal:
        'Positions you as a collaborative problem solver ready to tackle immediate high-impact challenges.',
    },
    {
      id: 'qi-3',
      question:
        'How do product and engineering collaborate when defining guardrails against LLM hallucinations in customer-facing outputs?',
      strategicGoal:
        'Highlights your commitment to AI ethics, output verification, and candidate data integrity.',
    },
  ],
}

export const mockInterviewPrepPayloadAr: InterviewPrepPayload = {
  version: 2,
  generatedAt: '2026-10-26T00:00:00.000Z',
  updatedAt: '2026-10-26T00:00:00.000Z',
  language: 'AR',
  roleTitle: 'مهندس برمجيات متكامل أول (تكامل الذكاء الاصطناعي)',
  companyName: 'تقنيات كلاود سكيل',
  questions: [
    {
      id: 'q-ar-1',
      category: 'BEHAVIORAL',
      customOrigin: false,
      question:
        'حدثني عن موقف واجهت فيه أولويات متضاربة أثناء تسليم ميزة حاسمة تحت ضغط زمني مرتفع.',
      whyAsked:
        'يقيس قدرتك على الموازنة بين الديون التقنية، وإدارة نطاق المشروع، وسرعة تسليم الفريق.',
      starResponse: {
        situation:
          'في أنظمة تك فانجارد، كان أمام فريقنا مهلة 3 أسابيع لإطلاق محلل سيرة ذاتية متقدم بالتزامن مع دمج مزود ذكاء اصطناعي تدفقي.',
        task: 'كانت مسؤوليتي كمهندس رئيسي ضمان استقرار الخدمة دون انقطاع مع تسليم إمكانات التدفق في الموعد المحدد.',
        action:
          'قسّمت العمل إلى شرائح عمودية متكاملة، واستخدمت أعلام الميزات لعزل التدفق، وأتمتت اختبارات الانحدار للنظام ثنائي اللغة.',
        result:
          'أطلقنا الميزة في الموعد المحدد دون أخطاء، محققين <bdi>[أدخل نسبة تحسين الأداء]</bdi> مع الحفاظ على جاهزية بلغت 99.9%.',
      },
      referencedSources: ['أنظمة تك فانجارد', 'خط معالجة السير الذاتية'],
      missingMetricFlags: ['<bdi>[أدخل نسبة تحسين الأداء]</bdi>'],
    },
    {
      id: 'q-ar-2',
      category: 'TECHNICAL',
      customOrigin: false,
      question:
        'كيف تصمم وتحسّن خطوط التدفق في Next.js App Router لتجنب انتهاء مهلة إجراءات الخادم وتسرب الذاكرة؟',
      whyAsked:
        'يختبر فهمك العميق لمكونات خادم React ومعالجة التدفق المجزأ HTTP وإدارة الضغط الخلفي.',
      starResponse: {
        situation:
          'واجه تطبيقنا تباطؤاً ملحوظاً عند معالجة تقييمات السير الذاتية الطويلة باستخدام نماذج لغوية كبيرة.',
        task: 'تصميم معمارية تدفقية متكاملة ترسل الرموز تدريجياً للعميل دون تجاوز قيود الخوادم اللامركزية.',
        action:
          'دمجت حزمة Vercel AI SDK مع معالج مسار مخصص يعتمد ReadableStream لدفع الأجزاء مباشرة مع حفظ اللقطة في PostgreSQL بشكل غير متزامن.',
        result:
          'انخفض وقت استلام أول رمز إلى أقل من 800 مللي ثانية وتم القضاء على أخطاء انتهاء المهلة تماماً.',
      },
      referencedSources: ['محرك الذكاء الاصطناعي التدفقي', 'Next.js App Router'],
      missingMetricFlags: [],
    },
    {
      id: 'q-ar-3',
      category: 'SITUATIONAL',
      customOrigin: false,
      question:
        'في حال حدوث حظر غير متوقع أو انقطاع لمزود الذكاء الاصطناعي في بيئة الإنتاج، كيف تضمن استمرارية الخدمة؟',
      whyAsked:
        'يقيم جاهزيتك للتعامل مع الأعطال وتصميم أنظمة احتياطية والتواصل الواضح مع المستخدمين.',
      starResponse: {
        situation:
          'خلال فترات الذروة، قد تنفد حصة مزود الذكاء الاصطناعي التجاري بشكل مفاجئ مما يهدد عمليات التخصيص.',
        task: 'بناء آلية تحويل احتياطي مرنة بين عدة مزودين مع توفير تجربة استخدام شفافة.',
        action:
          'طوّرت نظام تبديل ديناميكي للمزودين مع تشفير المفاتيح بـ AES-256 وحفظ التكوينات وتوفير مسارات احتياطية حتمية.',
        result: 'تمكن المستخدمون من التبديل بين المزودين خلال نقرتين دون فقدان أي بيانات مسودة.',
      },
      referencedSources: ['معمارية المزودين المتعددين BYOK'],
      missingMetricFlags: [],
    },
  ],
  questionsToAskInterviewer: [
    {
      id: 'qi-ar-1',
      question:
        'كيف يوازن فريقكم الهندسي بين سرعة تجربة ميزات الذكاء الاصطناعي وموثوقية الإنتاج واتفاقيات مستوى الخدمة الصارمة؟',
      strategicGoal: 'يبرز اهتمامك بالتميز التشغيلي وجودة الاختبارات وقابلية التوسع للنظام.',
    },
    {
      id: 'qi-ar-2',
      question:
        'ما هي أهم التحديات التقنية التي تواجهونها حالياً في طبقة تنسيق ومعالجة النماذج اللغوية التدفقية؟',
      strategicGoal: 'يظهرك كمبادر ومحلل للمشاكل مستعد للمساهمة في التحديات الفنية الحقيقية.',
    },
    {
      id: 'qi-ar-3',
      question:
        'كيف يتعاون فريقا المنتج والهندسة لوضع الضوابط الاحترازية ضد هلوسة النماذج اللغوية في مخرجات العملاء؟',
      strategicGoal: 'يؤكد التزامك بأمان ومصداقية مخرجات الذكاء الاصطناعي وسلامة بيانات المرشحين.',
    },
  ],
}
