import { prisma } from '../src/lib/prisma'
import { encryptSecret } from '../src/lib/crypto'

async function main() {
  console.log('🌱 Starting CareerCraft AI database seed...')

  // Clean existing demo data if any
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@careercraft.ai' },
  })

  if (existingUser) {
    console.log('Cleaning existing demo user...')
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  // 1. Create Demo User
  const user = await prisma.user.create({
    data: {
      email: 'demo@careercraft.ai',
      name: 'Tarek Mansour',
      image: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    },
  })
  console.log(`✓ Created demo user: ${user.email} (${user.id})`)

  // 2. Configure Sample BYOK Provider Setting (Encrypted key)
  const sampleEncrypted = encryptSecret(
    'sk-demo-openai-key-for-local-testing',
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  )
  await prisma.userProviderSetting.create({
    data: {
      userId: user.id,
      provider: 'OPENAI',
      defaultModel: 'gpt-4o',
      encryptedKey: sampleEncrypted.encryptedKey,
      iv: sampleEncrypted.iv,
      authTag: sampleEncrypted.authTag,
      isActive: true,
    },
  })
  console.log('✓ Configured encrypted OpenAI provider setting')

  // 3. Create English Master Profile
  const englishProfile = await prisma.profile.create({
    data: {
      userId: user.id,
      language: 'EN',
      fullName: 'Tarek Mansour',
      headline: 'Senior Full Stack Engineer & AI Systems Architect',
      summary:
        'Full stack engineer with 6+ years experience architecting cloud applications, streaming AI pipelines, and high throughput database systems.',
      email: 'tarek.mansour@example.com',
      phone: '+20 100 123 4567',
      location: 'Cairo, Egypt (Remote)',
      githubUrl: 'https://github.com/careercraft-ai',
      linkedinUrl: 'https://linkedin.com/in/careercraft',
      isDefault: true,
      workExperiences: {
        create: [
          {
            companyName: 'TechVanguard Systems',
            jobTitle: 'Senior Full Stack Engineer',
            location: 'Remote',
            startDate: new Date('2022-01-15'),
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
            startDate: new Date('2019-06-01'),
            endDate: new Date('2021-12-31'),
            isCurrent: false,
            bullets: [
              'Developed RESTful microservices and PostgreSQL schemas handling over 2M daily transactions with sub 50ms latency.',
              'Mentored junior developers and instituted automated TypeScript testing with Vitest and Playwright.',
            ],
            sortOrder: 1,
          },
        ],
      },
      educations: {
        create: [
          {
            institution: 'Cairo University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2015-09-01'),
            endDate: new Date('2019-06-30'),
            grade: 'Very Good with Honors',
            sortOrder: 0,
          },
        ],
      },
      skills: {
        create: [
          { name: 'TypeScript', category: 'Languages', proficiency: 'Expert', sortOrder: 0 },
          {
            name: 'Next.js (App Router)',
            category: 'Frameworks',
            proficiency: 'Expert',
            sortOrder: 1,
          },
          { name: 'PostgreSQL 16', category: 'Databases', proficiency: 'Advanced', sortOrder: 2 },
          { name: 'Prisma ORM', category: 'Databases', proficiency: 'Advanced', sortOrder: 3 },
          { name: 'Vercel AI SDK', category: 'AI & ML', proficiency: 'Advanced', sortOrder: 4 },
          { name: 'Tailwind CSS v4', category: 'Frontend', proficiency: 'Expert', sortOrder: 5 },
          { name: 'Docker', category: 'DevOps', proficiency: 'Intermediate', sortOrder: 6 },
        ],
      },
      projects: {
        create: [
          {
            name: 'CareerCraft AI',
            description:
              'Open source autonomous career agent supporting BYOK multi provider AI keys and single column ATS resume export.',
            role: 'Lead Architect & Maintainer',
            technologies: ['Next.js 15', 'PostgreSQL', 'Prisma', 'Auth.js v5', 'Tailwind CSS'],
            url: 'https://github.com/careercraft-ai/careercraft',
            sortOrder: 0,
          },
        ],
      },
    },
  })
  console.log(`✓ Created English profile: ${englishProfile.fullName}`)

  // 4. Create Arabic Master Profile
  const arabicProfile = await prisma.profile.create({
    data: {
      userId: user.id,
      language: 'AR',
      fullName: 'طارق منصور',
      headline: 'مهندس برمجيات أول ومطور بنية الذكاء الاصطناعي',
      summary:
        'مهندس برمجيات بخبرة تزيد عن 6 سنوات في بناء التطبيقات السحابية وحلول تدفق الذكاء الاصطناعي وقواعد البيانات المتقدمة.',
      email: 'tarek.mansour@example.com',
      phone: '+20 100 123 4567',
      location: 'القاهرة، مصر (عن بعد)',
      isDefault: true,
      workExperiences: {
        create: [
          {
            companyName: 'تك فانجارد سيستمز',
            jobTitle: 'مهندس برمجيات أول',
            location: 'عن بعد',
            startDate: new Date('2022-01-15'),
            isCurrent: true,
            bullets: [
              'بناء وتطوير وكيل وظيفي ذكي ثنائي اللغة لمعالجة السير الذاتية وتخصيصها لأنظمة ATS باستخدام Next.js 15 و PostgreSQL.',
              'تطوير مسار تدفق ردود الذكاء الاصطناعي عبر Vercel AI SDK مع تقليل زمن الاستجابة بنسبة 60% لـ 5 مزودي نماذج.',
            ],
            sortOrder: 0,
          },
        ],
      },
      educations: {
        create: [
          {
            institution: 'جامعة القاهرة',
            degree: 'بكالوريوس علوم الحاسب',
            fieldOfStudy: 'هندسة البرمجيات',
            startDate: new Date('2015-09-01'),
            endDate: new Date('2019-06-30'),
            grade: 'جيد جداً مع مرتبة الشرف',
            sortOrder: 0,
          },
        ],
      },
      skills: {
        create: [
          { name: 'تايب سكريبت', category: 'لغات البرمجة', proficiency: 'خبير', sortOrder: 0 },
          { name: 'نكست جي إس', category: 'أطر العمل', proficiency: 'خبير', sortOrder: 1 },
          {
            name: 'بوستجريس كيو إل',
            category: 'قواعد البيانات',
            proficiency: 'متقدم',
            sortOrder: 2,
          },
          { name: 'بريسمَا', category: 'قواعد البيانات', proficiency: 'متقدم', sortOrder: 3 },
          {
            name: 'الذكاء الاصطناعي',
            category: 'الذكاء الاصطناعي',
            proficiency: 'متقدم',
            sortOrder: 4,
          },
        ],
      },
    },
  })
  console.log(`✓ Created Arabic profile: ${arabicProfile.fullName}`)

  // 5. Create Target Job Posting
  const jobPosting = await prisma.jobPosting.create({
    data: {
      userId: user.id,
      title: 'Senior Full Stack Engineer (AI Integration)',
      companyName: 'Anthropic Labs Partner',
      jobUrl: 'https://example.com/jobs/senior-full-stack-ai',
      rawDescription: `
We are looking for a Senior Full Stack Engineer with strong experience in Next.js App Router, TypeScript, and PostgreSQL.
Key Responsibilities:
- Build high performance user interfaces with Tailwind CSS and React 19.
- Integrate multi provider AI models via Vercel AI SDK with live response streaming.
- Design normalized PostgreSQL schemas with Prisma ORM.
Requirements:
- 5+ years of full stack software engineering experience.
- Deep expertise in TypeScript, Next.js, and relational databases.
- Familiarity with ATS friendly document generation and prompt engineering.
      `.trim(),
      parsedSkills: [
        'Next.js',
        'TypeScript',
        'PostgreSQL',
        'Prisma',
        'React',
        'Tailwind CSS',
        'Vercel AI SDK',
      ],
    },
  })
  console.log(`✓ Created Job Posting: ${jobPosting.title} at ${jobPosting.companyName}`)

  // 6. Create Tailored Resume Snapshot
  const tailoredResume = await prisma.tailoredResume.create({
    data: {
      userId: user.id,
      profileId: englishProfile.id,
      jobPostingId: jobPosting.id,
      language: 'EN',
      title: `${jobPosting.companyName} - ${jobPosting.title}`,
      atsScore: 94.0,
      missingSkills: ['Kubernetes', 'Redis'],
      tailoredSummary:
        'Senior Full Stack Engineer with 6+ years specializing in Next.js 15 App Router architectures, PostgreSQL 16 schema design, and high throughput Vercel AI SDK streaming integration.',
      tailoredContent: {
        targetRole: jobPosting.title,
        tailoredExperiences: [
          {
            companyName: 'TechVanguard Systems',
            jobTitle: 'Senior Full Stack Engineer',
            bullets: [
              {
                rewritten:
                  'Engineered autonomous career tailoring platform utilizing Next.js 15, PostgreSQL 16, and Vercel AI SDK, increasing applicant response rates by 35%.',
                matchedKeywords: ['Next.js', 'PostgreSQL', 'Vercel AI SDK'],
              },
              {
                rewritten:
                  'Spearheaded multi provider AI streaming architecture with strict BYOK encryption, reducing token latency by 60%.',
                matchedKeywords: ['AI Integration', 'TypeScript'],
              },
            ],
          },
        ],
        recommendedSkills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Vercel AI SDK'],
      },
      outreachMessage: {
        linkedinConnectionNote:
          'Hi! I saw the Senior Full Stack role at Anthropic Labs Partner and wanted to connect. I recently built CareerCraft AI using Next.js 15 and multi provider streaming.',
        coldEmail: {
          subject: 'Senior Full Stack Engineer Application - Tarek Mansour',
          body: 'Dear Hiring Team,\n\nI was excited to see your Senior Full Stack opening...',
        },
      },
      interviewPrep: {
        behavioralQuestions: [
          {
            question: 'Tell me about a time you had to optimize high throughput database queries.',
            suggestedStarAnswer: {
              situation:
                'At TechVanguard, our database queries were bottlenecking during peak traffic.',
              task: 'Optimize PostgreSQL execution plans and connection pooling without adding Redis caching.',
              action:
                'Analyzed query explain plans in Prisma, added composite B-tree indexes, and optimized connection limits.',
              result:
                'Reduced query latency by 70% and supported 3x higher concurrent request volume.',
            },
          },
        ],
      },
    },
  })
  console.log(`✓ Created Tailored Resume Snapshot: ${tailoredResume.title}`)

  // 7. Create Kanban Job Application
  const application = await prisma.application.create({
    data: {
      userId: user.id,
      jobPostingId: jobPosting.id,
      tailoredResumeId: tailoredResume.id,
      status: 'INTERVIEWING',
      sortOrder: 1.0,
      appliedAt: new Date(),
      notes: 'Passed technical take-home test. System design interview scheduled for next week.',
    },
  })
  console.log(`✓ Created Kanban Application: ${application.id} in stage ${application.status}`)

  console.log('✅ CareerCraft AI database seed finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
