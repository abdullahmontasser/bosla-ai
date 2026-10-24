export interface SampleExperience {
  companyName: string
  jobTitle: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent: boolean
  bullets: string[]
  sortOrder: number
}

export interface SampleCandidate {
  fullName: string
  headline: string
  summary: string
  email: string
  phone: string
  location: string
  workExperiences: SampleExperience[]
}

export const SAMPLE_CANDIDATE_EN: SampleCandidate = {
  fullName: 'Tarek Mansour',
  headline: 'Senior Full Stack Engineer & AI Systems Architect',
  summary:
    'Full stack engineer with 6+ years experience architecting cloud applications, streaming AI pipelines, and high throughput database systems.',
  email: 'tarek.mansour@example.com',
  phone: '+20 100 123 4567',
  location: 'Cairo, Egypt (Remote)',
  workExperiences: [
    {
      companyName: 'TechVanguard Systems',
      jobTitle: 'Senior Full Stack Engineer',
      location: 'Remote',
      startDate: '2022-01-15',
      isCurrent: true,
      bullets: [
        'Architected bilingual career agent handling automated resume ingestion and ATS tailoring using Next.js 15 and PostgreSQL.',
        'Engineered AI response streaming pipelines using Vercel AI SDK, reducing time to first token by 60% across 5 AI providers.',
        'Optimized Prisma ORM database queries and connection pooling, scaling platform throughput to 10,000 requests per minute.',
      ],
      sortOrder: 0,
    },
    {
      companyName: 'Apex Data Labs',
      jobTitle: 'Software Engineer',
      location: 'Cairo, Egypt',
      startDate: '2019-06-01',
      endDate: '2021-12-31',
      isCurrent: false,
      bullets: [
        'Developed RESTful microservices and PostgreSQL schemas handling over 2M daily transactions with sub 50ms latency.',
        'Mentored junior developers and instituted automated TypeScript testing with Vitest and Playwright.',
      ],
      sortOrder: 1,
    },
  ],
}

export const SAMPLE_CANDIDATE_AR: SampleCandidate = {
  fullName: 'طارق منصور',
  headline: 'مهندس برمجيات أول ومطور بنية الذكاء الاصطناعي',
  summary:
    'مهندس برمجيات بخبرة تزيد عن 6 سنوات في بناء التطبيقات السحابية وحلول تدفق الذكاء الاصطناعي وقواعد البيانات المتقدمة.',
  email: 'tarek.mansour@example.com',
  phone: '+20 100 123 4567',
  location: 'القاهرة، مصر (عن بعد)',
  workExperiences: [
    {
      companyName: 'تك فانجارد سيستمز',
      jobTitle: 'مهندس برمجيات أول',
      location: 'عن بعد',
      startDate: '2022-01-15',
      isCurrent: true,
      bullets: [
        'بناء وتطوير وكيل وظيفي ذكي ثنائي اللغة لمعالجة السير الذاتية وتخصيصها لأنظمة ATS باستخدام Next.js 15 و PostgreSQL.',
        'تطوير مسار تدفق ردود الذكاء الاصطناعي عبر Vercel AI SDK مع تقليل زمن الاستجابة بنسبة 60% لـ 5 مزودي نماذج.',
        'تحسين استعلامات Prisma ORM وإدارة تجمعات الاتصال لقاعدة البيانات لتتحمل 10,000 طلب في الدقيقة.',
      ],
      sortOrder: 0,
    },
    {
      companyName: 'أبيكس داتا لابس',
      jobTitle: 'مهندس برمجيات',
      location: 'القاهرة، مصر',
      startDate: '2019-06-01',
      endDate: '2021-12-31',
      isCurrent: false,
      bullets: [
        'تطوير خدمات مصغرة ومخططات قواعد بيانات PostgreSQL لمعالجة أكثر من 2 مليون معاملة يومية بزمن وصول أقل من 50 ميلي ثانية.',
        'تدريب المطورين الجدد وتأسيس اختبارات تايب سكريبت المؤتمتة باستخدام Vitest و Playwright.',
      ],
      sortOrder: 1,
    },
  ],
}

export function getSampleCandidate(language: 'EN' | 'AR' = 'EN'): SampleCandidate {
  return language === 'AR' ? SAMPLE_CANDIDATE_AR : SAMPLE_CANDIDATE_EN
}
