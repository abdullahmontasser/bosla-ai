export interface BenchmarkPreset {
  id: string
  roleTitle: {
    en: string
    ar: string
  }
  company: string
  overallScore: number
  keywordScore: number
  relevanceScore: number
  formattingScore: number
  matchedSkills: string[]
  missingSkills: string[]
  beforeBullet: {
    en: string
    ar: string
  }
  afterBullet: {
    en: string
    ar: string
  }
  metricTag: {
    en: string
    ar: string
  }
}

export const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  {
    id: 'fullstack',
    roleTitle: {
      en: 'Senior Full-Stack Engineer',
      ar: 'مهندس برمجيات أول شامل',
    },
    company: 'Vercel / Cloudflare Partner',
    overallScore: 94,
    keywordScore: 96,
    relevanceScore: 92,
    formattingScore: 98,
    matchedSkills: [
      'Next.js 16',
      'TypeScript',
      'PostgreSQL',
      'Prisma',
      'Tailwind CSS v4',
      'Auth.js',
    ],
    missingSkills: ['Redis Streams', 'ClickHouse'],
    beforeBullet: {
      en: 'Worked on building modern web applications and fixed bugs across the backend and frontend stack.',
      ar: 'عملت على تطوير تطبيقات ويب حديثة وإصلاح المشاكل البرمجية عبر واجهة وتطبيقات الواجهة الخلفية.',
    },
    afterBullet: {
      en: 'Architected high-throughput AI streaming studio with Next.js 16 App Router and Prisma, cutting page latency by 42% across 14,000 monthly active candidate sessions.',
      ar: 'قمت بتصميم وتطوير استوديو ذكاء اصطناعي فائق السرعة باستخدام Next.js 16 وPrisma، مما قلل زمن استجابة الصفحة بنسبة 42% عبر 14,000 جلسة مرشح نشطة شهرياً.',
    },
    metricTag: {
      en: '+42% Latency Reduction (Google XYZ)',
      ar: '+42% تحسين السرعة (صيغة جوجل XYZ)',
    },
  },
  {
    id: 'product-lead',
    roleTitle: {
      en: 'Technical Product Lead',
      ar: 'قائد منتج تقني',
    },
    company: 'Enterprise SaaS Solutions',
    overallScore: 88,
    keywordScore: 90,
    relevanceScore: 85,
    formattingScore: 95,
    matchedSkills: ['Roadmapping', 'User Analytics', 'A/B Testing', 'AI Integration', 'Telemetry'],
    missingSkills: ['SOC2 Compliance', 'Mixpanel Custom Events'],
    beforeBullet: {
      en: 'Managed the product lifecycle and tracked team delivery deadlines with Jira and Notion.',
      ar: 'قمت بإدارة دورة حياة المنتج ومتابعة مواعيد تسليم الفريق باستخدام Jira وNotion.',
    },
    afterBullet: {
      en: 'Led cross-functional rollout of candidate telemetry and BYOK provider features, accelerating product activation by 3.4x within two release cycles.',
      ar: 'قدت إطلاق نظام القياس عن بُعد وميزات جلب المفتاح الخاص، مما سرّع تفعيل المنتج بمعدل 3.4 أضعاف خلال دورتي إصدار.',
    },
    metricTag: {
      en: '3.4x Activation Velocity (Google XYZ)',
      ar: '3.4x تسريع التفعيل (صيغة جوجل XYZ)',
    },
  },
  {
    id: 'ai-engineer',
    roleTitle: {
      en: 'Applied AI & RAG Engineer',
      ar: 'مهندس ذكاء اصطناعي وتطبيقات RAG',
    },
    company: 'Autonomous Systems Lab',
    overallScore: 96,
    keywordScore: 98,
    relevanceScore: 95,
    formattingScore: 97,
    matchedSkills: [
      'Vercel AI SDK',
      'Vector PDF Extraction',
      'Structured Outputs',
      'Prompt Defense',
      'Zod',
    ],
    missingSkills: ['LangChain Hub'],
    beforeBullet: {
      en: 'Created prompts to parse resumes and extract keywords into JSON structures.',
      ar: 'كتبت أوامر نصية لاستخراج بيانات السير الذاتية وتحويلها إلى هياكل JSON.',
    },
    afterBullet: {
      en: 'Engineered zero-hallucination Google XYZ resume optimizer with Vercel AI SDK v7, reducing formatting parsing errors from 18% to 0.4% across bilingual DOCX/PDF uploads.',
      ar: 'طوّرت محرك تحسين السير الذاتية المانع للهلوسة بصيغة جوجل XYZ باستخدام Vercel AI SDK v7، مما خفض أخطاء التحليل من 18% إلى 0.4% عبر مستندات PDF وDOCX ثنائية اللغة.',
    },
    metricTag: {
      en: '0.4% Error Floor (Google XYZ)',
      ar: '0.4% خفض نسبة الخطأ (صيغة جوجل XYZ)',
    },
  },
]
