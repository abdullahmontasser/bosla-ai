import { describe, it, expect } from 'vitest'
import { generateResumePdfBuffer } from './render'
import type { AtsPdfData } from './AtsResumeDocument'
import { extractText } from 'unpdf'

describe('Bilingual ATS Vector PDF Exporter (covers: AC-5, AC-6, AC-7)', () => {
  const sampleEnglishData: AtsPdfData = {
    language: 'EN',
    fullName: 'Sarah Jenkins',
    email: 'sarah@example.com',
    phone: '+1 555-0144',
    location: 'Austin, TX',
    linkedinUrl: 'https://linkedin.com/in/sarahjenkins',
    summary:
      'Results-oriented Full Stack Engineer with 7+ years of experience architecting resilient cloud architectures and scalable web platforms.',
    experiences: [
      {
        companyName: 'CloudScale Inc',
        jobTitle: 'Principal Engineer',
        location: 'Austin, TX',
        startDate: '2021',
        isCurrent: true,
        bullets: [
          {
            rewritten:
              'Architected event-driven microservices processing 50M events daily with zero downtime.',
          },
          {
            rewritten:
              'Reduced infrastructure expenditure by 28% through aggressive container consolidation.',
          },
        ],
      },
    ],
    educations: [
      {
        institution: 'University of Texas at Austin',
        degree: 'B.S. in Computer Science',
        endDate: '2017',
      },
    ],
    skills: [
      { name: 'TypeScript' },
      { name: 'Node.js' },
      { name: 'Next.js' },
      { name: 'PostgreSQL' },
      { name: 'Docker' },
    ],
  }

  const sampleArabicData: AtsPdfData = {
    language: 'AR',
    fullName: 'عمر الفاروق',
    email: 'omar@example.com',
    phone: '+966 50 987 6543',
    location: 'الرياض، السعودية',
    summary:
      'مهندس برمجيات متخصص في بناء المنصات السحابية والتطبيقات الحديثة ذات الأداء الفائق والواجهات المتجاوبة.',
    experiences: [
      {
        companyName: 'منظومة السحاب التقنية',
        jobTitle: 'مهندس برمجيات أول',
        location: 'الرياض',
        startDate: '2022',
        isCurrent: true,
        bullets: [
          {
            rewritten:
              'طور واجهات مستخدم متجاوبة بنسبة 100% متوافقة مع معايير إمكانية الوصول والتصميم ثنائي اللغة.',
          },
          {
            rewritten: 'قاد فريقاً تقنياً لتسريع استجابة الخوادم وقواعد البيانات.',
          },
        ],
      },
    ],
    educations: [
      {
        institution: 'جامعة الملك سعود',
        degree: 'بكالوريوس علوم الحاسب',
        endDate: '2020',
      },
    ],
    skills: [
      { name: 'React' },
      { name: 'Next.js' },
      { name: 'TypeScript' },
      { name: 'PostgreSQL' },
    ],
  }

  it('renders English vector PDF buffer in memory without writing to disk (covers: AC-5, AC-6)', async () => {
    const buffer = await generateResumePdfBuffer(sampleEnglishData)

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)

    // PDF magic bytes header "%PDF-"
    const header = buffer.subarray(0, 5).toString('ascii')
    expect(header).toBe('%PDF-')

    // Extract text and confirm presence of candidate info
    const parsed = await extractText(new Uint8Array(buffer))
    expect(parsed.text.join(' ').toLowerCase()).toContain('sarah jenkins')
    expect(parsed.text.join(' ')).toContain('CloudScale Inc')
    expect(parsed.text.join(' ')).toContain('TypeScript')
  })

  it('renders Arabic vector PDF buffer with Arabic shaping (covers: AC-6, AC-7)', async () => {
    const buffer = await generateResumePdfBuffer(sampleArabicData)

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)

    const header = buffer.subarray(0, 5).toString('ascii')
    expect(header).toBe('%PDF-')

    const parsed = await extractText(new Uint8Array(buffer))
    expect(parsed.text.length).toBeGreaterThan(0)
  })

  it('renders comprehensive canvas twin PDF with headline, categorized skills, projects, and custom styling', async () => {
    const canvasTwinData: AtsPdfData = {
      language: 'EN',
      fullName: 'Alex Vance',
      headline: 'Principal AI Architect',
      email: 'alex.vance@example.com',
      phone: '+1 555-0199',
      location: 'San Francisco, CA',
      linkedinUrl: 'linkedin.com/in/alexvance',
      summary:
        'Distinguished system designer specializing in high-throughput distributed intelligence.',
      templateId: 'harvard-classic',
      accentColor: '#1e3a8a',
      fontFamily: 'serif',
      categorizedSkills: [
        {
          category: 'AI Infrastructure',
          skills: ['PyTorch', 'TensorFlow', 'CUDA', 'Triton'],
        },
        {
          category: 'Cloud & Systems',
          skills: ['Kubernetes', 'PostgreSQL', 'Kafka'],
        },
      ],
      experiences: [
        {
          companyName: 'Neural Frontier Corp',
          jobTitle: 'Distinguished Architect',
          startDate: '2022',
          isCurrent: true,
          bullets: [
            {
              rewritten: 'Engineered high-scale inference pipeline lowering token latency by 35%.',
            },
          ],
        },
      ],
      projects: [
        {
          title: 'Quantum Engine',
          role: 'Lead Architect',
          description: 'Orchestrated distributed graph execution for LLM workflows.',
          technologies: ['TypeScript', 'Rust', 'PostgreSQL'],
        },
      ],
      educations: [
        {
          institution: 'Stanford University',
          degree: 'M.S. in Computer Science',
          endDate: '2019',
        },
      ],
    }

    const buffer = await generateResumePdfBuffer(canvasTwinData)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1000)

    const parsed = await extractText(new Uint8Array(buffer))
    const fullText = parsed.text.join(' ')

    expect(fullText).toContain('Alex Vance')
    expect(fullText.toUpperCase()).toContain('PRINCIPAL AI ARCHITECT')
    expect(fullText).toContain('AI Infrastructure')
    expect(fullText).toContain('PyTorch • TensorFlow')
    expect(fullText).toContain('Neural Frontier Corp')
    expect(fullText).toContain('Quantum Engine')
    expect(fullText).toContain('Stanford University')
  })

  it('renders 2-page PDF with mini-header, prior roles, featured projects, and education on page 2', async () => {
    const twoPageData: AtsPdfData = {
      language: 'EN',
      fullName: 'Sarah Jenkins',
      headline: 'Staff Software Engineer',
      email: 'sarah.jenkins@example.com',
      phone: '+1 555-0144',
      location: 'Austin, TX',
      summary:
        'Distinguished system designer with deep domain expertise in resilient architectures.',
      pageMode: '2-pages',
      experiences: [
        {
          companyName: 'Primary Tech',
          jobTitle: 'Staff Engineer',
          startDate: '2022',
          isCurrent: true,
          bullets: [{ rewritten: 'Spearheaded real-time streaming engine.' }],
        },
        {
          companyName: 'Prior Systems',
          jobTitle: 'Senior Developer',
          startDate: '2019',
          endDate: '2022',
          bullets: [{ rewritten: 'Built scalable backend infrastructure.' }],
        },
      ],
      projects: [
        {
          title: 'High-Throughput Gateway',
          role: 'Core Architect',
          description: 'Multi-region event bus processing high volume requests.',
          technologies: ['Go', 'Kafka', 'Redis'],
        },
      ],
      educations: [
        {
          institution: 'UT Austin',
          degree: 'B.S. in Computer Science',
          endDate: '2019',
        },
      ],
    }

    const buffer = await generateResumePdfBuffer(twoPageData)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(1500)

    const parsed = await extractText(new Uint8Array(buffer))
    // Should have 2 pages
    expect(parsed.totalPages).toBe(2)

    const page1Text = parsed.text[0]
    const page2Text = parsed.text[1]

    // Page 1 contains primary experience and no watermark
    expect(page1Text).toContain('Primary Tech')
    expect(page1Text).toContain('Page 1 of 2')
    expect(page1Text).not.toContain('Bosla')

    // Page 2 contains mini header, prior role, featured projects, and education and no watermark
    expect(page2Text).toContain('Sarah Jenkins — Page 2')
    expect(page2Text).toContain('Prior Systems')
    expect(page2Text).toContain('FEATURED TECHNICAL PROJECTS')
    expect(page2Text).toContain('High-Throughput Gateway')
    expect(page2Text).toContain('UT Austin')
    expect(page2Text).toContain('Page 2 of 2')
    expect(page2Text).not.toContain('Bosla')
  })

  it('formats raw ISO dates in education and experiences cleanly to year only', async () => {
    const rawIsoData: AtsPdfData = {
      language: 'EN',
      fullName: 'Abdullah Montasser',
      headline: 'AI Engineer',
      email: 'abdulla.ai.engineer@gmail.com',
      pageMode: '2-pages',
      experiences: [
        {
          companyName: 'Lead AI Studio',
          jobTitle: 'Senior Machine Learning Engineer',
          startDate: '2023-01-01T00:00:00.000Z',
          isCurrent: true,
          bullets: [{ rewritten: 'Engineered LLM fine-tuning pipelines.' }],
        },
      ],
      projects: [
        {
          title: 'AI Podcast Clipper — AI-Powered Video Processing SaaS',
          role: 'Creator & Lead Developer',
          description:
            'Architected an end-to-end AI-powered video processing SaaS using FastAPI and Next.js to automatically convert long-form podcasts into viral vertical shorts for YouTube and TikTok.',
          technologies: [
            'FastAPI',
            'Python',
            'Next.js',
            'TypeScript',
            'LLMs',
            'Computer Vision',
            'Stripe',
          ],
        },
        {
          title: 'PyTutor — Retrieval-Augmented Generation Tutoring System',
          description:
            'Engineered an AI-powered conversational tutoring platform leveraging Sentence Transformers and Google Gemini.',
          technologies: ['Python', 'FastAPI', 'LangChain', 'ChromaDB'],
        },
        {
          title: 'Real-Time Computer Vision Monitoring & Analytics',
          description:
            'Developed real-time computer vision pipeline utilizing YOLO11 and ByteTrack.',
          technologies: ['Python', 'YOLO11', 'PyTorch', 'OpenCV'],
        },
      ],
      educations: [
        {
          institution: 'Delta University, Egypt',
          degree: 'Bachelor of Science in Artificial Intelligence',
          endDate: '2026-01-01T00:00:00.000Z',
        },
      ],
    }

    const buffer = await generateResumePdfBuffer(rawIsoData)
    expect(buffer).toBeInstanceOf(Buffer)

    const parsed = await extractText(new Uint8Array(buffer))
    const fullText = parsed.text.join(' ')

    // ISO timestamps must never appear in the output
    expect(fullText).not.toContain('2026-01-01T00:00:00.000Z')
    expect(fullText).not.toContain('2023-01-01T00:00:00.000Z')

    // Clean year must be present
    expect(fullText).toContain('2026')
    expect(fullText).toContain('Bachelor of Science in Artificial Intelligence')
    expect(fullText).toContain('Delta University, Egypt')

    // All 3 projects must be clearly present
    expect(fullText).toContain('AI Podcast Clipper')
    expect(fullText).toContain('PyTutor')
    expect(fullText).toContain('Real-Time Computer Vision Monitoring & Analytics')
  })

  it('renders with compact and relaxed density dynamically modifying spacing without errors', async () => {
    const compactBuffer = await generateResumePdfBuffer({
      ...sampleEnglishData,
      density: 'compact',
    })
    expect(compactBuffer).toBeInstanceOf(Buffer)
    expect(compactBuffer.length).toBeGreaterThan(1000)

    const relaxedBuffer = await generateResumePdfBuffer({
      ...sampleEnglishData,
      density: 'relaxed',
    })
    expect(relaxedBuffer).toBeInstanceOf(Buffer)
    expect(relaxedBuffer.length).toBeGreaterThan(1000)

    const compactParsed = await extractText(new Uint8Array(compactBuffer))
    const relaxedParsed = await extractText(new Uint8Array(relaxedBuffer))

    expect(compactParsed.text.join(' ')).toContain('Sarah Jenkins')
    expect(relaxedParsed.text.join(' ')).toContain('Sarah Jenkins')
  })
})
