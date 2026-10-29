export type Locale = 'en' | 'ar'

export interface NavLink {
  href: string
  label: string
}

export interface LandingCopy {
  nav: {
    links: NavLink[]
    workspace: string
    start: string
    signIn: string
    menu: string
    menuLabel: string
    theme: {
      label: string
      toLight: string
      toDark: string
    }
  }
  hero: {
    eyebrow: string
    headline: {
      lines: string[]
      accent: string
      tail: string
    }
    lead: string
    primaryCta: string
    secondaryCta: string
    microProof: string[]
    sampleLabel: string
    scrollCue: string
    visual: {
      roleLabel: string
      role: string
      company: string
      meta: string
      requirementsLabel: string
      requirements: string[]
      matchedLabel: string
      matched: string[]
      resumeLabel: string
      resumeName: string
      resumeRole: string
      resumeSummary: string
      resumeBullet: string
      coverageLabel: string
      coverageValue: string
      coverageNote: string
    }
  }
  trust: {
    title: string
    items: { title: string; body: string }[]
    footnote: string
  }
  how: {
    label: string
    title: string
    body: string
    steps: { title: string; body: string; link: string; href: string }[]
  }
  showcase: {
    label: string
    title: string
    body: string
    sampleNote: string
    sampleShort: string
    scrollHint: string
    stages: { title: string; summary: string }[]
    final: {
      title: string
      body: string
      cta: string
      note: string
    }
  }
  features: {
    label: string
    title: string
    body: string
    tailor: FeatureBlock
    ats: FeatureBlock
    evidence: FeatureBlock
    conversation: {
      kicker: string
      title: string
      body: string
      outreach: { title: string; body: string; note: string }
      interview: { title: string; body: string; question: string }
      link: string
    }
    foundationLabel: string
    foundation: { title: string; body: string; link: string; href: string }[]
  }
  comparison: {
    label: string
    title: string
    body: string
    headers: { without: string; with: string }
    rows: { dimension: string; without: string; with: string }[]
    footnote: string
  }
  cta: {
    label: string
    title: string
    body: string
    button: string
    notes: string[]
  }
  footer: {
    tagline: string
    columns: { title: string; links: NavLink[] }[]
    note: string
    rights: string
  }
}

export interface FeatureBlock {
  kicker: string
  title: string
  body: string
  bullets: string[]
  link: string
  href: string
}

export const landingCopy: Record<Locale, LandingCopy> = {
  en: {
    nav: {
      links: [
        { href: '#how', label: 'How it works' },
        { href: '#workflow', label: 'Workflow' },
        { href: '#capabilities', label: 'Capabilities' },
        { href: '#compare', label: 'Why Bosla' },
      ],
      workspace: 'Open workspace',
      start: 'Tailor a resume',
      signIn: 'Sign in',
      menu: 'Menu',
      menuLabel: 'Open navigation',
      theme: {
        label: 'Appearance',
        toLight: 'Switch to light theme',
        toDark: 'Switch to dark theme',
      },
    },
    hero: {
      eyebrow: 'Career intelligence, without the noise',
      headline: {
        lines: ['A sharper resume', 'for the role you'],
        accent: 'actually',
        tail: 'want.',
      },
      lead: 'Paste a job description. Bosla AI maps it to your real experience, sharpens the language, and shows you what to fix before you apply—grounded in what you have actually done.',
      primaryCta: 'Tailor a resume free',
      secondaryCta: 'See the workflow',
      microProof: ['Grounded in your experience', 'Your keys, your provider', 'Arabic & English'],
      sampleLabel: 'Illustrative workspace',
      scrollCue: 'Scroll to orient',
      visual: {
        roleLabel: 'Target role',
        role: 'Senior Product Engineer',
        company: 'Meridian',
        meta: 'Remote · Product engineering',
        requirementsLabel: 'What the role asks for',
        requirements: [
          'React and TypeScript at product scale',
          'Design systems and accessibility',
          'From zero to one, with evidence',
        ],
        matchedLabel: 'Matched to your experience',
        matched: ['Design systems', 'Accessibility', 'Product delivery'],
        resumeLabel: 'Tailored draft',
        resumeName: 'Tarek Mansour',
        resumeRole: 'Product Engineer · Design Systems',
        resumeSummary:
          'I work where design and engineering meet, turning ambiguous problems into accessible product surfaces.',
        resumeBullet:
          'Led a multi-surface onboarding redesign, aligning product, design, and engineering around one system.',
        coverageLabel: 'Requirement coverage',
        coverageValue: '8/10',
        coverageNote: 'A drafting signal, not a hiring guarantee.',
      },
    },
    trust: {
      title: 'The details that make the difference',
      items: [
        {
          title: 'Your keys, your models',
          body: 'Bring your own provider—OpenAI, Anthropic, Google, Groq, or local Ollama. Keys are encrypted at rest.',
        },
        {
          title: 'Arabic and English, native',
          body: 'RTL typography and PDF shaping are part of the workspace, not an afterthought.',
        },
        {
          title: 'Grounded in your experience',
          body: 'Every draft starts from the details you provide. You review and approve the final line.',
        },
        {
          title: 'A clean PDF at the end',
          body: 'Single-column, searchable, and designed for the systems that read it first.',
        },
      ],
      footnote:
        'Bosla is a drafting and preparation workspace. It does not apply to jobs for you, guarantee interviews, or invent experience.',
    },
    how: {
      label: '02 / Orientation',
      title: 'A clear path from posting to preparation.',
      body: 'Bosla follows the real sequence of a job application. One source of truth for your experience, one target role at a time.',
      steps: [
        {
          title: 'Start with your experience.',
          body: 'Upload an existing resume or write your background once. This becomes the source of truth for every draft.',
          link: 'Add your experience',
          href: '/resume',
        },
        {
          title: 'Aim it at the role.',
          body: 'Paste the job description. The tailor studio writes around the role’s language, using only what you have given it.',
          link: 'Open the tailor studio',
          href: '/tailor',
        },
        {
          title: 'Inspect, export, prepare.',
          body: 'Review ATS coverage, strengthen the evidence, export a clean PDF, build interview stories, and track the application.',
          link: 'See the application tracker',
          href: '/tracker',
        },
      ],
    },
    showcase: {
      label: '03 / The workflow',
      title: 'One role. The whole sequence.',
      body: 'Follow a sample application from job description to interview preparation. The interface changes as the work changes—because the work does.',
      sampleNote: 'Illustrative sample · Not a real candidate or employer',
      sampleShort: 'Illustrative sample',
      scrollHint: 'Scroll to move through the workflow',
      stages: [
        {
          title: 'The job description',
          summary: 'Start with the role’s actual requirements, not a generic template.',
        },
        {
          title: 'A tailored resume',
          summary: 'Relevant experience comes forward. The language follows the role.',
        },
        {
          title: 'ATS alignment',
          summary: 'See what is covered, what needs evidence, and what to fix.',
        },
        {
          title: 'Stronger achievements',
          summary: 'Turn a duty into a specific, evidence-based statement.',
        },
        {
          title: 'Interview preparation',
          summary: 'Build the story from your own work and the role’s themes.',
        },
      ],
      final: {
        title: 'Your next move',
        body: 'Make it a draft you can defend.',
        cta: 'Tailor a resume free',
        note: 'Start with your experience. Add the role. See what changes.',
      },
    },
    features: {
      label: '04 / Capabilities',
      title: 'Everything between the job post and the conversation.',
      body: 'A focused set of tools, each built to reduce the distance between your real experience and the role in front of you.',
      tailor: {
        kicker: 'Tailoring',
        title: 'A draft with a spine.',
        body: 'A summary and bullets written around the role’s language, not a generic rewrite. Every line starts from the experience you provide.',
        bullets: ['Live streaming output', 'Role-specific emphasis', 'Editable before export'],
        link: 'Open the tailor studio',
        href: '/tailor',
      },
      ats: {
        kicker: 'Alignment',
        title: 'See the gap before they do.',
        body: 'Inspect keyword coverage, evidence gaps, and formatting. The score is a drafting signal, not a prediction of hiring outcomes.',
        bullets: ['Requirement coverage', 'Missing-evidence flags', 'Parser-safe formatting'],
        link: 'Run an ATS scan',
        href: '/resume',
      },
      evidence: {
        kicker: 'Evidence',
        title: 'Weak verbs do not survive.',
        body: 'Turn duties into specific, verifiable achievements. Bosla drafts from your details and will not invent the number you did not provide.',
        bullets: ['Action-led rewriting', 'Concrete scope', 'Your facts, not filler'],
        link: 'Strengthen your bullets',
        href: '/tailor',
      },
      conversation: {
        kicker: 'Next steps',
        title: 'From sent to prepared.',
        body: 'Draft a short, specific recruiter note. Then rehearse interview answers built from your own projects—not a generic question bank.',
        outreach: {
          title: 'Recruiter outreach',
          body: 'Write a note with a reason to reply.',
          note: '“I led the onboarding system your team is hiring around. I would value five minutes to compare notes on the accessibility work.”',
        },
        interview: {
          title: 'Interview preparation',
          body: 'Build STAR answers from your real stories.',
          question: 'Tell me about a time you shipped under a tight deadline.',
        },
        link: 'Prepare for the conversation',
      },
      foundationLabel: 'The foundation',
      foundation: [
        {
          title: 'Clean PDF export',
          body: 'Single-column, searchable, and shaped for Arabic and English.',
          link: 'Export from the ATS engine',
          href: '/resume',
        },
        {
          title: 'Application tracker',
          body: 'Keep the role, the draft, and the next follow-up in one place.',
          link: 'Open the tracker',
          href: '/tracker',
        },
        {
          title: 'Privacy by design',
          body: 'Bring your own AI provider. Keys are encrypted at rest and stay yours.',
          link: 'Configure providers',
          href: '/settings/providers',
        },
        {
          title: 'Bilingual by default',
          body: 'Arabic RTL and English LTR, from the interface to the exported PDF.',
          link: 'Open the workspace',
          href: '/tailor',
        },
      ],
    },
    comparison: {
      label: '05 / The difference',
      title: 'Same effort. Different direction.',
      body: 'The work is still yours. Bosla removes the guesswork around it.',
      headers: { without: 'Without a compass', with: 'With Bosla' },
      rows: [
        {
          dimension: 'Tailoring',
          without: 'Rewrite from scratch for every role.',
          with: 'Start from your experience and adapt it to the role.',
        },
        {
          dimension: 'Screening',
          without: 'Guess which keywords matter.',
          with: 'Inspect requirement coverage and parser-safe formatting.',
        },
        {
          dimension: 'Evidence',
          without: 'List responsibilities and hope they land.',
          with: 'Turn real work into specific, evidence-based achievements.',
        },
        {
          dimension: 'Preparation',
          without: 'Search for generic interview questions.',
          with: 'Prepare from your own projects and the role’s themes.',
        },
        {
          dimension: 'Follow-through',
          without: 'Lose track across documents and inboxes.',
          with: 'Keep the role, draft, and next step in one workspace.',
        },
      ],
      footnote:
        'Bosla does not apply to jobs for you, guarantee interviews, or invent experience. It gives you a clearer way to do the work.',
    },
    cta: {
      label: '06 / Next',
      title: 'Make the next application your clearest one.',
      body: 'Start with your experience. Add the role. See exactly what changes.',
      button: 'Tailor a resume free',
      notes: ['Bring your own AI provider', 'Arabic & English', 'Private by design'],
    },
    footer: {
      tagline: 'A calmer, sharper way to apply.',
      columns: [
        {
          title: 'Product',
          links: [
            { href: '/tailor', label: 'Tailor studio' },
            { href: '/resume', label: 'ATS engine' },
            { href: '/tracker', label: 'Tracker' },
            { href: '/settings/providers', label: 'Providers' },
          ],
        },
        {
          title: 'Explore',
          links: [
            { href: '#how', label: 'How it works' },
            { href: '#workflow', label: 'Workflow' },
            { href: '#capabilities', label: 'Capabilities' },
            { href: '#compare', label: 'Why Bosla' },
          ],
        },
        {
          title: 'Elsewhere',
          links: [
            {
              href: 'https://github.com/abdullahmontasser/careercraft-ai',
              label: 'GitHub',
            },
            { href: '/design-system', label: 'Design system' },
          ],
        },
      ],
      note: 'Built for the work behind the application.',
      rights: '© 2026 Bosla AI',
    },
  },
  ar: {
    nav: {
      links: [
        { href: '#how', label: 'كيف تعمل' },
        { href: '#workflow', label: 'سير العمل' },
        { href: '#capabilities', label: 'القدرات' },
        { href: '#compare', label: 'لماذا بوصلة' },
      ],
      workspace: 'افتح مساحة العمل',
      start: 'خصّص سيرتك',
      signIn: 'تسجيل الدخول',
      menu: 'القائمة',
      menuLabel: 'فتح التنقل',
      theme: {
        label: 'المظهر',
        toLight: 'التبديل إلى المظهر الفاتح',
        toDark: 'التبديل إلى المظهر الداكن',
      },
    },
    hero: {
      eyebrow: 'ذكاء مهني، بلا ضجيج',
      headline: {
        lines: ['سيرةٌ أدقّ', 'للوظيفة التي'],
        accent: 'تريدها',
        tail: 'حقاً.',
      },
      lead: 'الصق وصف الوظيفة. توائم بوصلة AI متطلباتها مع خبرتك الحقيقية، وتصقل الصياغة، وتوضح ما يحتاج إلى دليل قبل أن تتقدّم—دون اختلاق أي خبرة.',
      primaryCta: 'خصّص سيرتك مجاناً',
      secondaryCta: 'شاهد طريقة العمل',
      microProof: ['مبنية على خبرتك', 'مفاتيحك ومزوّدك', 'عربية وإنجليزية'],
      sampleLabel: 'مساحة عمل توضيحية',
      scrollCue: 'مرّر لتحديد الاتجاه',
      visual: {
        roleLabel: 'الوظيفة المستهدفة',
        role: 'مهندس منتج أول',
        company: 'ميريديان',
        meta: 'عن بُعد · هندسة المنتجات',
        requirementsLabel: 'ما تطلبه الوظيفة',
        requirements: [
          'خبرة في React وTypeScript على نطاق منتج',
          'أنظمة تصميم وإتاحة رقمية',
          'بناء من الصفر إلى الإطلاق، بأدلة',
        ],
        matchedLabel: 'متوافق مع خبرتك',
        matched: ['أنظمة التصميم', 'الإتاحة الرقمية', 'تسليم المنتجات'],
        resumeLabel: 'مسودة مخصّصة',
        resumeName: 'طارق منصور',
        resumeRole: 'مهندس منتج · أنظمة تصميم',
        resumeSummary:
          'أعمل حيث يلتقي التصميم بالهندسة، وأحوّل المشكلات الغامضة إلى واجهات منتج سهلة الاستخدام.',
        resumeBullet:
          'قدت إعادة تصميم رحلة الإعداد الأولى عبر عدة واجهات، ووحّدت المنتج والتصميم والهندسة حول نظام واحد.',
        coverageLabel: 'تغطية المتطلبات',
        coverageValue: '8/10',
        coverageNote: 'مؤشر للمسودة، وليس ضماناً للتوظيف.',
      },
    },
    trust: {
      title: 'التفاصيل التي تصنع الفرق',
      items: [
        {
          title: 'مفاتيحك، ونماذجك',
          body: 'استخدم مزوّدك الخاص—OpenAI أو Anthropic أو Google أو Groq أو Ollama المحلي. المفاتيح مشفّرة أثناء التخزين.',
        },
        {
          title: 'عربية وإنجليزية، بأصالة',
          body: 'تنسيق RTL وتشكيل الحروف في PDF جزء من مساحة العمل، وليس إضافة لاحقة.',
        },
        {
          title: 'مبنية على خبرتك',
          body: 'كل مسودة تبدأ من التفاصيل التي تقدّمها. أنت تراجع السطر الأخير وتعتمده.',
        },
        {
          title: 'PDF نظيف في النهاية',
          body: 'عمود واحد، قابل للبحث، ومصمّم للأنظمة التي تقرأه أولاً.',
        },
      ],
      footnote:
        'بوصلة مساحة للصياغة والتحضير. لا تتقدّم بالوظائف نيابة عنك، ولا تضمن المقابلات، ولا تختلق الخبرات.',
    },
    how: {
      label: '02 / التوجيه',
      title: 'مسار واضح من الإعلان إلى التحضير.',
      body: 'تتبع بوصلة التسلسل الحقيقي لطلب الوظيفة: مصدر واحد لخبرتك، ووظيفة مستهدفة في كل مرة.',
      steps: [
        {
          title: 'ابدأ بخبرتك.',
          body: 'ارفع سيرتك الحالية أو اكتب خلفيتك مرة واحدة. تصبح هذه هي المرجع لكل مسودة.',
          link: 'أضف خبرتك',
          href: '/resume',
        },
        {
          title: 'وجّهها نحو الوظيفة.',
          body: 'الصق وصف الوظيفة. يكتب استوديو التخصيص بلغة الدور، باستخدام ما قدّمته فقط.',
          link: 'افتح استوديو التخصيص',
          href: '/tailor',
        },
        {
          title: 'راجع، صدّر، استعد.',
          body: 'راجع تغطية ATS، وقوِّ الأدلة، وصدّر PDF نظيفاً، وابنِ قصص المقابلة، وتابع الطلب.',
          link: 'شاهد لوحة التتبع',
          href: '/tracker',
        },
      ],
    },
    showcase: {
      label: '03 / سير العمل',
      title: 'وظيفة واحدة. التسلسل كاملاً.',
      body: 'تابع طلباً توضيحياً من وصف الوظيفة إلى التحضير للمقابلة. تتغيّر الواجهة مع تغيّر العمل—لأن العمل يتغيّر فعلاً.',
      sampleNote: 'نموذج توضيحي · ليس مرشحاً أو صاحب عمل حقيقياً',
      sampleShort: 'نموذج توضيحي',
      scrollHint: 'مرّر للتنقل عبر سير العمل',
      stages: [
        {
          title: 'وصف الوظيفة',
          summary: 'ابدأ من متطلبات الدور الفعلية، لا من قالب عام.',
        },
        {
          title: 'سيرة مخصّصة',
          summary: 'تتقدّم الخبرة الأكثر صلة. وتتبع الصياغة لغة الوظيفة.',
        },
        {
          title: 'توافق ATS',
          summary: 'اعرف ما تمت تغطيته، وما يحتاج دليلاً، وما يجب إصلاحه.',
        },
        {
          title: 'إنجازات أقوى',
          summary: 'حوّل المهمة إلى عبارة محددة قائمة على دليل.',
        },
        {
          title: 'التحضير للمقابلة',
          summary: 'ابنِ القصة من عملك الحقيقي وموضوعات الدور.',
        },
      ],
      final: {
        title: 'خطوتك التالية',
        body: 'اجعلها مسودة تستطيع الدفاع عنها.',
        cta: 'خصّص سيرتك مجاناً',
        note: 'ابدأ بخبرتك. أضف الوظيفة. شاهد ما يتغيّر.',
      },
    },
    features: {
      label: '04 / القدرات',
      title: 'كل ما بين إعلان الوظيفة والمحادثة.',
      body: 'مجموعة مركّزة من الأدوات، بُنيت لتقليص المسافة بين خبرتك الحقيقية والوظيفة أمامك.',
      tailor: {
        kicker: 'التخصيص',
        title: 'مسودة لها عمود فقري.',
        body: 'ملخص ونقاط مكتوبة بلغة الدور، لا إعادة صياغة عامة. كل سطر يبدأ من الخبرة التي تقدّمها.',
        bullets: ['بث مباشر للمخرجات', 'تركيز على متطلبات الدور', 'قابلة للتعديل قبل التصدير'],
        link: 'افتح استوديو التخصيص',
        href: '/tailor',
      },
      ats: {
        kicker: 'المواءمة',
        title: 'اعرف الفجوة قبل أن يراها غيرك.',
        body: 'راجع تغطية الكلمات المفتاحية، وفجوات الأدلة، والتنسيق. الدرجة مؤشر للمسودة، وليست تنبؤاً بنتيجة التوظيف.',
        bullets: ['تغطية المتطلبات', 'تنبيهات الأدلة الناقصة', 'تنسيق آمن للقراءة الآلية'],
        link: 'شغّل فحص ATS',
        href: '/resume',
      },
      evidence: {
        kicker: 'الأدلة',
        title: 'الأفعال الضعيفة لا تصمد.',
        body: 'حوّل المهام إلى إنجازات محددة وقابلة للتحقق. تكتب بوصلة من تفاصيلك، ولا تختلق الرقم الذي لم تقدّمه.',
        bullets: ['صياغة تبدأ بفعل', 'نطاق ملموس', 'حقائقك، لا حشو'],
        link: 'قوِّ نقاط إنجازك',
        href: '/tailor',
      },
      conversation: {
        kicker: 'الخطوات التالية',
        title: 'من الإرسال إلى الاستعداد.',
        body: 'اكتب رسالة قصيرة ومحددة لمسؤول التوظيف. ثم تدرّب على إجابات مقابلة مبنية على مشاريعك الحقيقية—لا على بنك أسئلة عام.',
        outreach: {
          title: 'التواصل مع مسؤول التوظيف',
          body: 'اكتب رسالة لها سبب للرد.',
          note: '«قدت نظام الإعداد الأولي الذي يوظّف فريقي حوله. يسعدني خمس دقائق لمقارنة الملاحظات حول عمل الإتاحة.»',
        },
        interview: {
          title: 'التحضير للمقابلة',
          body: 'ابنِ إجابات STAR من قصصك الحقيقية.',
          question: 'حدّثني عن وقت أطلقت فيه منتجاً تحت موعد ضاغط.',
        },
        link: 'استعد للمحادثة',
      },
      foundationLabel: 'الأساس',
      foundation: [
        {
          title: 'تصدير PDF نظيف',
          body: 'عمود واحد، قابل للبحث، ومصمّم للعربية والإنجليزية.',
          link: 'صدّر من محرك ATS',
          href: '/resume',
        },
        {
          title: 'لوحة متابعة الطلبات',
          body: 'احتفظ بالوظيفة والمسودة والخطوة التالية في مكان واحد.',
          link: 'افتح لوحة التتبع',
          href: '/tracker',
        },
        {
          title: 'الخصوصية بالتصميم',
          body: 'استخدم مزوّد الذكاء الاصطناعي الخاص بك. المفاتيح مشفّرة أثناء التخزين وتبقى لك.',
          link: 'إعداد المزوّدات',
          href: '/settings/providers',
        },
        {
          title: 'ثنائية اللغة افتراضياً',
          body: 'العربية RTL والإنجليزية LTR، من الواجهة إلى ملف PDF المصدَّر.',
          link: 'افتح مساحة العمل',
          href: '/tailor',
        },
      ],
    },
    comparison: {
      label: '05 / الفرق',
      title: 'الجهد نفسه. الاتجاه مختلف.',
      body: 'العمل يبقى عملك. بوصلة تزيل التخمين من حوله.',
      headers: { without: 'بلا بوصلة', with: 'مع بوصلة' },
      rows: [
        {
          dimension: 'التخصيص',
          without: 'أعد الكتابة من الصفر لكل وظيفة.',
          with: 'ابدأ من خبرتك وكيّفها مع الوظيفة.',
        },
        {
          dimension: 'الفرز',
          without: 'خمّن الكلمات المفتاحية المهمة.',
          with: 'راجع تغطية المتطلبات والتنسيق الآمن للقراءة.',
        },
        {
          dimension: 'الأدلة',
          without: 'اسرد المسؤوليات وانتظر أن تصل.',
          with: 'حوّل العمل الحقيقي إلى إنجازات محددة قائمة على دليل.',
        },
        {
          dimension: 'التحضير',
          without: 'ابحث عن أسئلة مقابلات عامة.',
          with: 'استعد من مشاريعك وموضوعات الدور.',
        },
        {
          dimension: 'المتابعة',
          without: 'افقد المسار بين الملفات والبريد.',
          with: 'احتفظ بالوظيفة والمسودة والخطوة التالية في مساحة واحدة.',
        },
      ],
      footnote:
        'بوصلة لا تتقدّم بالوظائف نيابة عنك، ولا تضمن المقابلات، ولا تختلق الخبرات. إنها تمنحك طريقة أوضح للقيام بالعمل.',
    },
    cta: {
      label: '06 / التالي',
      title: 'اجعل طلبك القادم أوضح طلباتك.',
      body: 'ابدأ بخبرتك. أضف الوظيفة. شاهد ما يتغيّر بالضبط.',
      button: 'خصّص سيرتك مجاناً',
      notes: ['استخدم مزوّد الذكاء الاصطناعي الخاص بك', 'عربية وإنجليزية', 'الخصوصية بالتصميم'],
    },
    footer: {
      tagline: 'طريقة أهدأ وأدقّ للتقديم.',
      columns: [
        {
          title: 'المنتج',
          links: [
            { href: '/tailor', label: 'استوديو التخصيص' },
            { href: '/resume', label: 'محرك ATS' },
            { href: '/tracker', label: 'لوحة التتبع' },
            { href: '/settings/providers', label: 'المزوّدات' },
          ],
        },
        {
          title: 'استكشف',
          links: [
            { href: '#how', label: 'كيف تعمل' },
            { href: '#workflow', label: 'سير العمل' },
            { href: '#capabilities', label: 'القدرات' },
            { href: '#compare', label: 'لماذا بوصلة' },
          ],
        },
        {
          title: 'روابط',
          links: [
            {
              href: 'https://github.com/abdullahmontasser/careercraft-ai',
              label: 'GitHub',
            },
            { href: '/design-system', label: 'نظام التصميم' },
          ],
        },
      ],
      note: 'مبنية للعمل الذي يقف خلف الطلب.',
      rights: '© 2026 بوصلة AI',
    },
  },
}

export function getLandingCopy(lang: string): LandingCopy {
  return lang === 'ar' ? landingCopy.ar : landingCopy.en
}
