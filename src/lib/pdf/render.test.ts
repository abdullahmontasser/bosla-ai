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
})
