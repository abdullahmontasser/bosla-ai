import type { Locale } from './content'

export interface ShowcaseSample {
  workspace: {
    breadcrumb: string
    targetRole: string
    company: string
    status: string
  }
  job: {
    sectionLabel: string
    title: string
    company: string
    meta: string
    intro: string
    responsibilitiesLabel: string
    responsibilities: string[]
    requirementsLabel: string
    requirements: string[]
    signalsLabel: string
    signals: string[]
    briefLabel: string
    brief: { label: string; value: string }[]
    note: string
  }
  resume: {
    eyebrow: string
    name: string
    headline: string
    summary: string
    experienceLabel: string
    experience: { role: string; company: string; dates: string; bullets: string[] }[]
    statusLabel: string
    alignmentLabel: string
    alignment: { label: string; value: string; tone: 'good' | 'attention' }[]
    noteTitle: string
    noteBody: string
    note: string
  }
  ats: {
    eyebrow: string
    title: string
    subtitle: string
    scoreLabel: string
    score: string
    scoreSuffix: string
    meterLabel: string
    coverageLabel: string
    coverage: { label: string; value: string; tone: 'good' | 'attention' }[]
    matchedLabel: string
    matched: string[]
    attentionLabel: string
    attention: string[]
    fixLabel: string
    fixes: string[]
    caveat: string
  }
  achievement: {
    eyebrow: string
    title: string
    beforeLabel: string
    before: string
    afterLabel: string
    after: string
    arrowLabel: string
    changesLabel: string
    changes: string[]
    evidenceLabel: string
    evidence: { label: string; value: string }[]
    caveat: string
  }
  interview: {
    eyebrow: string
    title: string
    questionLabel: string
    question: string
    starLabel: string
    star: { letter: string; label: string; text: string }[]
    nextLabel: string
    next: string[]
    evidenceLabel: string
    evidence: string[]
    caveat: string
  }
  final: {
    eyebrow: string
    title: string
    body: string
    cta: string
    note: string
  }
}

export const showcaseSample: Record<Locale, ShowcaseSample> = {
  en: {
    workspace: {
      breadcrumb: 'Workspace / Meridian / Senior Product Engineer',
      targetRole: 'Senior Product Engineer',
      company: 'Meridian',
      status: 'Sample',
    },
    job: {
      sectionLabel: 'The role',
      title: 'Senior Product Engineer',
      company: 'Meridian',
      meta: 'Remote · Product engineering · Full time',
      intro:
        'We are looking for a product engineer who can move between interface craft and system thinking. You will work with design and data to ship surfaces that feel simple, fast, and accessible.',
      responsibilitiesLabel: 'What you will do',
      responsibilities: [
        'Own end-to-end product surfaces across web and mobile.',
        'Partner with design and data to ship measurable improvements.',
        'Raise the bar for frontend architecture and accessibility.',
      ],
      requirementsLabel: 'What the role asks for',
      requirements: [
        '6+ years building React and TypeScript products.',
        'Strong design-system fluency and product judgment.',
        'Experience taking a feature from zero to one.',
        'Accessibility as a default, not a final pass.',
      ],
      signalsLabel: 'Signals Bosla will look for',
      signals: ['React', 'TypeScript', 'Design systems', 'Accessibility', 'Product strategy'],
      briefLabel: 'Tailoring brief',
      brief: [
        { label: 'Lead with', value: 'Design systems and accessibility' },
        { label: 'Prove', value: 'A zero-to-one launch' },
        { label: 'Avoid', value: 'Duty-only language' },
      ],
      note: 'Illustrative job description. Not a live vacancy.',
    },
    resume: {
      eyebrow: 'Tailored draft',
      name: 'Tarek Mansour',
      headline: 'Product Engineer · Design Systems',
      summary:
        'Product engineer with seven years building customer-facing web applications. I work at the seam between design and engineering, turning ambiguous problems into accessible interfaces.',
      experienceLabel: 'Relevant experience',
      experience: [
        {
          role: 'Senior Product Engineer',
          company: 'Sample company',
          dates: '2022 — Present',
          bullets: [
            'Led a **multi-surface onboarding redesign**, aligning product, design, and engineering around one system.',
            'Built and maintained a **shared component library** used across three product areas.',
          ],
        },
        {
          role: 'Product Engineer',
          company: 'Sample company',
          dates: '2019 — 2022',
          bullets: [
            'Partnered with data to **instrument release decisions** and iterate on the highest-impact paths.',
          ],
        },
      ],
      alignmentLabel: 'Aligned to the role',
      alignment: [
        { label: 'Product surfaces', value: 'Covered', tone: 'good' },
        { label: 'Design systems', value: 'Covered', tone: 'good' },
        { label: 'Accessibility', value: 'Covered', tone: 'good' },
        { label: 'Zero to one', value: 'Needs evidence', tone: 'attention' },
      ],
      statusLabel: 'Grounded',
      noteTitle: 'Bosla note',
      noteBody: 'The zero-to-one requirement needs a concrete example before you apply.',
      note: 'Drafted from the experience you provide. You approve every line.',
    },
    ats: {
      eyebrow: 'Match analysis',
      title: 'Requirement coverage',
      subtitle: 'A clear read on where the draft stands—before you send it.',
      scoreLabel: 'Evidence coverage',
      score: '8',
      scoreSuffix: '/10',
      meterLabel: 'Two gaps still need evidence',
      coverageLabel: 'How the draft reads',
      coverage: [
        { label: 'Keyword coverage', value: '86%', tone: 'good' },
        { label: 'Relevant experience', value: 'Strong', tone: 'good' },
        { label: 'Formatting', value: 'Parser-safe', tone: 'good' },
        { label: 'Zero to one evidence', value: 'Add detail', tone: 'attention' },
      ],
      matchedLabel: 'Matched in your draft',
      matched: ['React', 'TypeScript', 'Design systems', 'Accessibility', 'Product strategy'],
      attentionLabel: 'Needs attention',
      attention: ['Performance budgets', 'Zero-to-one launch'],
      fixLabel: 'Fix before you send',
      fixes: [
        'Add a concrete zero-to-one example.',
        'Name the performance budget you worked within.',
      ],
      caveat:
        'Illustrative analysis. Coverage is a signal for your draft, not a prediction of hiring outcomes.',
    },
    achievement: {
      eyebrow: 'Achievement rewrite',
      title: 'From a duty to a defensible line.',
      beforeLabel: 'Duty statement',
      before: 'Responsible for improving the onboarding experience across the product.',
      afterLabel: 'Evidence-based achievement',
      after:
        'Rebuilt onboarding into a guided setup flow, reducing the path from eight steps to three and making every screen keyboard accessible.',
      arrowLabel: 'Evidence moves forward',
      changesLabel: 'What changed',
      changes: [
        'Action-led opening',
        'Specific scope and system',
        'Measurable path reduction',
        'Accessibility evidence',
      ],
      evidenceLabel: 'Evidence in the line',
      evidence: [
        { label: 'Scope', value: 'Onboarding, product-wide' },
        { label: 'Change', value: 'Eight steps to three' },
        { label: 'Standard', value: 'Keyboard access' },
      ],
      caveat: 'Illustrative rewrite. Bosla drafts only from the details you provide.',
    },
    interview: {
      eyebrow: 'Interview preparation',
      title: 'Prepare for the conversation, not just the application.',
      questionLabel: 'Likely question',
      question: 'Tell me about a time you shipped a product under a tight deadline.',
      starLabel: 'Your story, shaped into STAR',
      star: [
        {
          letter: 'S',
          label: 'Situation',
          text: 'A release date moved up two weeks while scope stayed fixed.',
        },
        {
          letter: 'T',
          label: 'Task',
          text: 'Protect the launch without trading away accessibility or quality.',
        },
        {
          letter: 'A',
          label: 'Action',
          text: 'Sequenced the critical path, cut low-value polish, and paired on the riskiest work.',
        },
        {
          letter: 'R',
          label: 'Result',
          text: 'Shipped on the new date with no critical regressions.',
        },
      ],
      nextLabel: 'Next steps',
      next: [
        'Review the role’s top themes',
        'Practice the story out loud',
        'Add the application to your tracker',
      ],
      evidenceLabel: 'Evidence to have ready',
      evidence: [
        'One measurable result',
        'The constraint you worked within',
        'Who you paired with',
      ],
      caveat: 'Built from your experience, not a generic answer bank.',
    },
    final: {
      eyebrow: 'Your next move',
      title: 'Make it a draft you can defend.',
      body: 'Start with your experience. Add the role. See exactly what changes.',
      cta: 'Tailor a resume free',
      note: 'Sample workspace ends here. The real work starts with your experience.',
    },
  },
  ar: {
    workspace: {
      breadcrumb: 'مساحة العمل / ميريديان / مهندس منتج أول',
      targetRole: 'مهندس منتج أول',
      company: 'ميريديان',
      status: 'نموذج',
    },
    job: {
      sectionLabel: 'الوظيفة',
      title: 'مهندس منتج أول',
      company: 'ميريديان',
      meta: 'عن بُعد · هندسة المنتجات · دوام كامل',
      intro:
        'نبحث عن مهندس منتج ينتقل بسهولة بين حِرفية الواجهة والتفكير المنظومي. ستعمل مع التصميم والبيانات لإطلاق واجهات بسيطة وسريعة وسهلة الاستخدام.',
      responsibilitiesLabel: 'ما ستقوم به',
      responsibilities: [
        'امتلاك واجهات المنتج من البداية إلى النهاية عبر الويب والجوال.',
        'العمل مع التصميم والبيانات لإطلاق تحسينات قابلة للقياس.',
        'رفع مستوى معمارية الواجهة الأمامية والإتاحة الرقمية.',
      ],
      requirementsLabel: 'ما تطلبه الوظيفة',
      requirements: [
        'خبرة تزيد عن 6 سنوات في بناء منتجات React وTypeScript.',
        'إلمام قوي بأنظمة التصميم وحُسن الحكم على المنتج.',
        'خبرة في نقل ميزة من الصفر إلى الإطلاق.',
        'الإتاحة الرقمية كأساس، لا كخطوة أخيرة.',
      ],
      signalsLabel: 'الإشارات التي ستبحث عنها بوصلة',
      signals: ['React', 'TypeScript', 'أنظمة التصميم', 'الإتاحة', 'استراتيجية المنتج'],
      briefLabel: 'ملخص التخصيص',
      brief: [
        { label: 'ابدأ بـ', value: 'أنظمة التصميم والإتاحة' },
        { label: 'أثبت', value: 'إطلاق منتج من الصفر' },
        { label: 'تجنّب', value: 'صياغة المهام فقط' },
      ],
      note: 'وصف وظيفة توضيحي. ليس إعلاناً حقيقياً.',
    },
    resume: {
      eyebrow: 'مسودة مخصّصة',
      name: 'طارق منصور',
      headline: 'مهندس منتج · أنظمة تصميم',
      summary:
        'مهندس منتج بخبرة سبع سنوات في بناء تطبيقات ويب موجهة للعملاء. أعمل عند التقاء التصميم بالهندسة، وأحوّل المشكلات الغامضة إلى واجهات سهلة الاستخدام.',
      experienceLabel: 'الخبرة الأكثر صلة',
      experience: [
        {
          role: 'مهندس منتج أول',
          company: 'شركة توضيحية',
          dates: '2022 — الآن',
          bullets: [
            'قدت **إعادة تصميم رحلة الإعداد الأولى عبر عدة واجهات**، ووحّدت المنتج والتصميم والهندسة حول نظام واحد.',
            'بنيت وصنت **مكتبة مكونات مشتركة** تُستخدم عبر ثلاث مساحات منتج.',
          ],
        },
        {
          role: 'مهندس منتج',
          company: 'شركة توضيحية',
          dates: '2019 — 2022',
          bullets: [
            'عملت مع البيانات لـ**قياس قرارات الإطلاق** والتحسين على المسارات الأكثر أثراً.',
          ],
        },
      ],
      alignmentLabel: 'متوافق مع الدور',
      alignment: [
        { label: 'واجهات المنتج', value: 'مغطّى', tone: 'good' },
        { label: 'أنظمة التصميم', value: 'مغطّى', tone: 'good' },
        { label: 'الإتاحة الرقمية', value: 'مغطّى', tone: 'good' },
        { label: 'من الصفر إلى الإطلاق', value: 'يحتاج دليلاً', tone: 'attention' },
      ],
      statusLabel: 'مستند',
      noteTitle: 'ملاحظة بوصلة',
      noteBody: 'متطلب «من الصفر إلى الإطلاق» يحتاج مثالاً ملموساً قبل أن تتقدّم.',
      note: 'مكتوبة من الخبرة التي تقدّمها. أنت تعتمد كل سطر.',
    },
    ats: {
      eyebrow: 'تحليل التوافق',
      title: 'تغطية المتطلبات',
      subtitle: 'قراءة واضحة لموقف المسودة—قبل أن ترسلها.',
      scoreLabel: 'تغطية الأدلة',
      score: '8',
      scoreSuffix: '/10',
      meterLabel: 'فجوتان تحتاجان إلى دليل',
      coverageLabel: 'كيف تُقرأ المسودة',
      coverage: [
        { label: 'تغطية الكلمات المفتاحية', value: '86%', tone: 'good' },
        { label: 'الخبرة ذات الصلة', value: 'قوية', tone: 'good' },
        { label: 'التنسيق', value: 'آمن للقراءة', tone: 'good' },
        { label: 'دليل الصفر إلى الإطلاق', value: 'أضف تفاصيل', tone: 'attention' },
      ],
      matchedLabel: 'متوافق في مسودتك',
      matched: ['React', 'TypeScript', 'أنظمة التصميم', 'الإتاحة', 'استراتيجية المنتج'],
      attentionLabel: 'يحتاج انتباهاً',
      attention: ['ميزانيات الأداء', 'إطلاق من الصفر'],
      fixLabel: 'أصلح قبل الإرسال',
      fixes: ['أضف مثالاً ملموساً للإطلاق من الصفر.', 'اذكر ميزانية الأداء التي عملت ضمنها.'],
      caveat: 'تحليل توضيحي. التغطية مؤشر للمسودة، وليست تنبؤاً بنتيجة التوظيف.',
    },
    achievement: {
      eyebrow: 'إعادة صياغة الإنجاز',
      title: 'من مهمة إلى سطر يمكن الدفاع عنه.',
      beforeLabel: 'صياغة المهمة',
      before: 'مسؤول عن تحسين تجربة الإعداد الأولى عبر المنتج.',
      afterLabel: 'إنجاز قائم على دليل',
      after:
        'أعدت بناء الإعداد الأولي كمسار إرشادي موحّد، فقلّصت الطريق من ثماني خطوات إلى ثلاث، وجعلت كل شاشة قابلة للاستخدام بلوحة المفاتيح.',
      arrowLabel: 'الدليل يتقدّم',
      changesLabel: 'ما الذي تغيّر',
      changes: ['بداية بفعل واضح', 'نطاق ونظام محددان', 'تقليل قابل للقياس', 'دليل على الإتاحة'],
      evidenceLabel: 'الدليل داخل السطر',
      evidence: [
        { label: 'النطاق', value: 'الإعداد الأولي عبر المنتج' },
        { label: 'التغيير', value: 'من ثماني خطوات إلى ثلاث' },
        { label: 'المعيار', value: 'إتاحة لوحة المفاتيح' },
      ],
      caveat: 'إعادة صياغة توضيحية. تكتب بوصلة من التفاصيل التي تقدّمها فقط.',
    },
    interview: {
      eyebrow: 'التحضير للمقابلة',
      title: 'استعد للمحادثة، لا للطلب فقط.',
      questionLabel: 'سؤال محتمل',
      question: 'حدّثني عن وقت أطلقت فيه منتجاً تحت موعد ضاغط.',
      starLabel: 'قصتك، بصيغة STAR',
      star: [
        { letter: 'S', label: 'الموقف', text: 'تقدّم موعد الإطلاق أسبوعين مع بقاء النطاق ثابتاً.' },
        { letter: 'T', label: 'المهمة', text: 'حماية الإطلاق دون التضحية بالإتاحة أو الجودة.' },
        {
          letter: 'A',
          label: 'الإجراء',
          text: 'رتّبت المسار الحرج، وقلّلت التحسينات منخفضة القيمة، وعملت بشكل مزدوج على أخطر المهام.',
        },
        { letter: 'R', label: 'النتيجة', text: 'أُطلق في الموعد الجديد دون أخطاء حرجة.' },
      ],
      nextLabel: 'الخطوات التالية',
      next: ['راجع أهم موضوعات الدور', 'تدرّب على القصة بصوت مسموع', 'أضف الطلب إلى لوحة التتبع'],
      evidenceLabel: 'أدلة جهّزها',
      evidence: ['نتيجة واحدة قابلة للقياس', 'القيد الذي عملت ضمنه', 'من عملت معه'],
      caveat: 'مبنية على خبرتك، لا على بنك إجابات عام.',
    },
    final: {
      eyebrow: 'خطوتك التالية',
      title: 'اجعلها مسودة تستطيع الدفاع عنها.',
      body: 'ابدأ بخبرتك. أضف الوظيفة. شاهد ما يتغيّر بالضبط.',
      cta: 'خصّص سيرتك مجاناً',
      note: 'تنتهي مساحة العمل التوضيحية هنا. العمل الحقيقي يبدأ بخبرتك.',
    },
  },
}

export function getShowcaseSample(lang: string): ShowcaseSample {
  return lang === 'ar' ? showcaseSample.ar : showcaseSample.en
}
