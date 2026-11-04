export type ResumeTemplateId =
  | 'harvard-classic'
  | 'tech-minimalist'
  | 'modern-editorial'
  | 'executive-navy'
  | 'wall-street-finance'
  | 'compact-one-page'
  | 'startup-builder'
  | 'bilingual-mirror'
  | 'data-ai-specialist'
  | 'cybersecurity-ops'
  | 'product-strategy'
  | 'consultant-deliverable'
  | 'engineering-manager'
  | 'clean-monochrome'
  | 'hybrid-functional'
  | 'executive-classic' // legacy alias for executive-navy

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId
  nameEn: string
  nameAr: string
  personaEn: string
  personaAr: string
  descriptionEn: string
  descriptionAr: string
  traitsEn: string
  traitsAr: string
  fontFamily: 'serif' | 'sans' | 'mono'
  accentColor: string
  borderColor: string
  bgClass: string
  layoutType:
    'standard' | 'centered' | 'skills-first' | 'projects-first' | 'compact' | 'monochrome' | 'navy'
  padding: number // in pt for PDF
}

export const RESUME_TEMPLATES: ResumeTemplateDefinition[] = [
  {
    id: 'harvard-classic',
    nameEn: 'Harvard Academic Classic',
    nameAr: 'هارفارد الأكاديمي الكلاسيكي',
    personaEn: 'Law, Academia, Management Consulting',
    personaAr: 'القانون، الأوساط الأكاديمية، والاستشارات الإدارية',
    descriptionEn:
      'Horizontal hairline dividers, centered header, 10pt compact body, classical academic prestige.',
    descriptionAr:
      'فواصل دقيقة ورفيعة، ترويسة مركزية كلاسيكية، وهيكل تقليدي عريق ومعتمد أكاديمياً.',
    traitsEn:
      'Serif (Times/Amiri), horizontal hairline dividers, centered header, 10pt compact body',
    traitsAr: 'خط كلاسيكي رصين، فواصل أفقية رفيعة، رأس صفحة متوسّط، نص مدمج 10pt',
    fontFamily: 'serif',
    accentColor: '#111827',
    borderColor: '#9CA3AF',
    bgClass: 'bg-white text-neutral-900',
    layoutType: 'centered',
    padding: 36,
  },
  {
    id: 'tech-minimalist',
    nameEn: 'Tech Minimalist (High-Density)',
    nameAr: 'التقني عالي الكثافة',
    personaEn: 'Software Engineers, Architects, DevOps',
    personaAr: 'مهندسو البرمجيات، المعماريون، وفرق DevOps',
    descriptionEn:
      'Monospace header accents, bold XYZ metric callouts, skills-first matrix, zero fluff.',
    descriptionAr: 'عناصر تقنية دقيقة، إبراز مؤشرات الأداء بصيغة XYZ، ومصفوفة مهارات مركزة.',
    traitsEn: 'Monospace accents, bold XYZ metric callouts, skills-first matrix, zero fluff',
    traitsAr: 'لمسات خطوط أحادية المسافة، إبراز أرقام XYZ، مصفوفة المهارات أولاً، خالٍ من الحشو',
    fontFamily: 'sans',
    accentColor: '#0f172a',
    borderColor: '#E2E8F0',
    bgClass: 'bg-background text-foreground',
    layoutType: 'skills-first',
    padding: 32,
  },
  {
    id: 'modern-editorial',
    nameEn: 'Modern Editorial',
    nameAr: 'التحريري المعاصر',
    personaEn: 'Product Managers, Tech Leads, Directors',
    personaAr: 'مديرو المنتجات، القادة التقنيون، والمديرون التنفيذيون',
    descriptionEn: 'Warm paper tone (#FDFDFC), elegant serif titles, generous line measure (65ch).',
    descriptionAr: 'درجات ورق دافئة، عناوين أنيقة رصينة، ومسافات قراءة مريحة للعين.',
    traitsEn: 'Warm paper tone (#FDFDFC), elegant serif titles, generous line measure (65ch)',
    traitsAr: 'ورق دافئ (#FDFDFC)، خطوط عناوين راقية، ومسافات أسطر متوازنة (65ch)',
    fontFamily: 'serif',
    accentColor: '#1e293b',
    borderColor: '#CBD5E1',
    bgClass: 'bg-[#faf9f6] text-neutral-900',
    layoutType: 'standard',
    padding: 36,
  },
  {
    id: 'executive-navy',
    nameEn: 'Executive Leadership',
    nameAr: 'القيادي التنفيذي',
    personaEn: 'VPs, Directors, C-Suite Executives',
    personaAr: 'نواب الرئيس، المديرون، والقيادات العليا (C-Suite)',
    descriptionEn:
      'Deep navy accent rules (#1E3A8A), executive summary emphasis, board/advisory section.',
    descriptionAr: 'فواصل كحلية ملكية عميقة، تركيز على الملخص التنفيذي والإشراف الاستراتيجي.',
    traitsEn: 'Deep navy accent rules (#1E3A8A), executive summary emphasis, corporate weight',
    traitsAr: 'فواصل كحلية داكنة (#1E3A8A)، تركيز على القيادة الاستراتيجية ومجالس الإدارة',
    fontFamily: 'sans',
    accentColor: '#1e3a8a',
    borderColor: '#1e3a8a',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'navy',
    padding: 36,
  },
  {
    id: 'wall-street-finance',
    nameEn: 'Wall Street Finance',
    nameAr: 'وول ستريت المالي',
    personaEn: 'Investment Banking, Quant, Private Equity',
    personaAr: 'بنوك الاستثمار، التحليل الكمي، والملكية الخاصة',
    descriptionEn:
      'High contrast, tight tracking, currency & percentage metric emphasis, strict chronological order.',
    descriptionAr:
      'تباين حاد، تقارب خطي منظم، إبراز المؤشرات المالية والنسب المئوية، وترتيب زمني صارم.',
    traitsEn:
      'High contrast, tight tracking, currency & percentage metric emphasis, strict chronology',
    traitsAr: 'تباين عالي، تتبع مكثف، إبراز العملات والنسب، وترتيب زمني دقيق',
    fontFamily: 'serif',
    accentColor: '#09090b',
    borderColor: '#71717A',
    bgClass: 'bg-white text-black',
    layoutType: 'standard',
    padding: 30,
  },
  {
    id: 'compact-one-page',
    nameEn: 'Compact Single-Page',
    nameAr: 'الصفحة الواحدة المكثفة',
    personaEn: 'Junior/Mid Engineers, Career Switchers',
    personaAr: 'المهندسون في بداية ومنتصف المسار، والمتحولون مهنياً',
    descriptionEn:
      'Compressed 0.9em margins, inline skill tags, strict single-page budget compliance.',
    descriptionAr: 'هوامش مدمجة ومدروسة، وسوم مهارات مضغوطة، والتزام كامل بحدود الصفحة الواحدة.',
    traitsEn: 'Compressed margins (24pt), inline skill tags, strict single-page compliance',
    traitsAr: 'هوامش مضغوطة (24pt)، وسوم مهارات مدمجة، وحجم مثالي لصفحة واحدة',
    fontFamily: 'sans',
    accentColor: '#27272a',
    borderColor: '#E4E4E7',
    bgClass: 'bg-white text-zinc-900',
    layoutType: 'compact',
    padding: 24,
  },
  {
    id: 'startup-builder',
    nameEn: 'Startup Builder & Innovator',
    nameAr: 'مبتكر الشركات الناشئة',
    personaEn: 'Founding Engineers, Full-Stack Developers',
    personaAr: 'المهندسون المؤسسون، ومطورو Full-Stack',
    descriptionEn: 'Project-first hierarchy, GitHub/live URL links, modern sans-serif readability.',
    descriptionAr: 'أولوية للمشاريع والإنجازات البرمجية، روابط حيّة وGitHub، وقراءة سريعة واضحة.',
    traitsEn: 'Project-first hierarchy, GitHub/live URL links, modern sans-serif typography',
    traitsAr: 'المشاريع أولاً، دعم روابط GitHub، وخطوط معاصرة مرنة',
    fontFamily: 'sans',
    accentColor: '#2563eb',
    borderColor: '#93C5FD',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'projects-first',
    padding: 34,
  },
  {
    id: 'bilingual-mirror',
    nameEn: 'Bilingual Symmetry',
    nameAr: 'التناظر ثنائي اللغة',
    personaEn: 'Middle East & Global Multinational Roles',
    personaAr: 'أدوار الشرق الأوسط والشركات العالمية متعددة الجنسيات',
    descriptionEn:
      'Identical structural balance between Arabic RTL and English LTR, dual-language contact info.',
    descriptionAr:
      'تطابق معماري وبصري بين العربية والإنجليزية، وتنسيق يعزز الحضور الإقليمي والدولي.',
    traitsEn:
      'Identical structural balance between Arabic RTL and English LTR, dual-language contact info',
    traitsAr: 'تناظر هيكلي متكامل بين العربية والإنجليزية، وتوازن بصري مدروس',
    fontFamily: 'sans',
    accentColor: '#0f766e',
    borderColor: '#99F6E4',
    bgClass: 'bg-white text-stone-900',
    layoutType: 'standard',
    padding: 36,
  },
  {
    id: 'data-ai-specialist',
    nameEn: 'Data Science & AI Specialist',
    nameAr: 'علوم البيانات والذكاء الاصطناعي',
    personaEn: 'ML Engineers, Data Scientists, AI Researchers',
    personaAr: 'مهندسو تعلم الآلة، علماء البيانات، وباحثو الذكاء الاصطناعي',
    descriptionEn: 'Model deployment metrics, parameter scale, Python/PyTorch/SQL taxonomy block.',
    descriptionAr:
      'إبراز مقاييس تدريب ونشر النماذج، مقاييس زمن الاستجابة، وتصنيف الأدوات والمكتبات.',
    traitsEn: 'Model deployment metrics, parameter scale, Python/PyTorch/SQL taxonomy block',
    traitsAr: 'مقاييس حجم النماذج والبيانات، تصنيف أدوات AI/ML، وتركيز على النتائج',
    fontFamily: 'sans',
    accentColor: '#4f46e5',
    borderColor: '#C7D2FE',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'skills-first',
    padding: 32,
  },
  {
    id: 'cybersecurity-ops',
    nameEn: 'Cybersecurity & Cloud Ops',
    nameAr: 'الأمن السيبراني والبنية التحتية',
    personaEn: 'SecOps, Cloud Architects, SysAdmins',
    personaAr: 'فرق الأمن، معماريو السحابة، ومديرو الأنظمة',
    descriptionEn:
      'Prominent security clearance/certs banner (CISSP, AWS), 99.99% uptime metrics focus.',
    descriptionAr:
      'إبراز الشهادات الاحترافية والتصاريح الأمنية، والتركيز على موثوقية الأنظمة (99.99%).',
    traitsEn: 'Prominent certifications banner (CISSP, AWS), 99.99% uptime metrics focus',
    traitsAr: 'إبراز شهادات الأمان والسحابة، ومؤشرات الجاهزية والاستجابة للحوادث',
    fontFamily: 'sans',
    accentColor: '#15803d',
    borderColor: '#BBF7D0',
    bgClass: 'bg-white text-zinc-900',
    layoutType: 'standard',
    padding: 34,
  },
  {
    id: 'product-strategy',
    nameEn: 'Product Strategy & Design',
    nameAr: 'استراتيجية المنتجات والتصميم',
    personaEn: 'Group PMs, Design Leads, Growth Strategists',
    personaAr: 'قادة المنتجات، مدراء التصميم، وخبراء النمو',
    descriptionEn:
      'Outcome & KPI-driven structure (ARR, Retention, MAU), cross-functional leadership bullets.',
    descriptionAr:
      'هيكلية مرتكزة على مؤشرات الأداء ومؤشرات النمو، وتأثير القيادة المشتركة بين الفرق.',
    traitsEn: 'Outcome & KPI-driven structure (ARR, Retention, MAU), cross-functional bullets',
    traitsAr: 'هيكل مدفوع بنتائج الأعمال ومؤشرات النمو، وتأثير الفرق المشتركة',
    fontFamily: 'sans',
    accentColor: '#c2410c',
    borderColor: '#FED7AA',
    bgClass: 'bg-white text-stone-900',
    layoutType: 'standard',
    padding: 36,
  },
  {
    id: 'consultant-deliverable',
    nameEn: 'Consultant & Engagement Case',
    nameAr: 'المستشار وحلول الأعمال',
    personaEn: 'Big 4, Strategy Consultants, Contractors',
    personaAr: 'شركات Big 4، مستشارو الاستراتيجية، وأصحاب التعاقدات',
    descriptionEn:
      'Client engagement blocks, scope of impact, deliverables-focused bullet taxonomy.',
    descriptionAr:
      'تنظيم قائم على المشاريع الاستشارية والعملاء، نطاق الأثر، ومخرجات الأعمال المباشرة.',
    traitsEn: 'Client engagement blocks, scope of impact, deliverables-focused taxonomy',
    traitsAr: 'تقسيم قائم على مهام العملاء، حجم المشروع، ومخرجات الحلول المسلّمة',
    fontFamily: 'serif',
    accentColor: '#334155',
    borderColor: '#94A3B8',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'standard',
    padding: 36,
  },
  {
    id: 'engineering-manager',
    nameEn: 'Engineering Management',
    nameAr: 'الإدارة الهندسية',
    personaEn: 'Engineering Managers, Directors of Eng',
    personaAr: 'مديرو الفرق الهندسية، ورؤساء الهندسة',
    descriptionEn:
      'Team scaling numbers (e.g. 10 to 45 devs), agile transformation, org efficiency metrics.',
    descriptionAr:
      'أرقام توسع الفرق وتوظيف المهندسين، مؤشرات كفاءة التسليم والتحول الرشيق (Agile).',
    traitsEn:
      'Team scaling numbers (e.g. 10 to 45 devs), agile transformation, org efficiency metrics',
    traitsAr: 'أرقام توسع الفرق البرمجية، تحسين سرعة التسليم، ومقاييس الكفاءة الهيكلية',
    fontFamily: 'sans',
    accentColor: '#0369a1',
    borderColor: '#BAE6FD',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'standard',
    padding: 34,
  },
  {
    id: 'clean-monochrome',
    nameEn: 'Clean Monochrome',
    nameAr: 'الأبيض والأسود النقي',
    personaEn: 'Universal ATS Standard',
    personaAr: 'المعيار القياسي الشامل لأنظمة ATS',
    descriptionEn:
      'Zero color tints (100% black/white contrast), universally parsed by legacy 1990s-era ATS scanners.',
    descriptionAr:
      'خالٍ تماماً من التدرجات اللونية (أبيض وأسود نقي 100%)، متوافق مع كافة أنظمة الفحص القديمة والحديثة.',
    traitsEn:
      'Zero color tints (100% black/white contrast), universally parsed by legacy ATS scanners',
    traitsAr: 'أبيض وأسود نقي بدون ألوان إضافية، أعلى دقة قراءة بنسبة 100% لأي نظام فحص',
    fontFamily: 'sans',
    accentColor: '#000000',
    borderColor: '#000000',
    bgClass: 'bg-white text-black',
    layoutType: 'monochrome',
    padding: 36,
  },
  {
    id: 'hybrid-functional',
    nameEn: 'Hybrid Functional-Chronological',
    nameAr: 'المركب الوظيفي الزمني',
    personaEn: 'Career Changers, Experienced Specialists',
    personaAr: 'المتحولون مهنياً، والمتخصصون متعددو المجالات',
    descriptionEn:
      'Top section clusters competencies by functional domain, followed by abbreviated work history.',
    descriptionAr: 'يبدأ بتصنيف الكفاءات والقدرات الوظيفية ثم يستعرض التسلسل المهني باختصار مقاس.',
    traitsEn: 'Top section clusters competencies by domain, followed by work history',
    traitsAr: 'تجميع الكفاءات حسب التخصص الوظيفي، يليه التسلسل الزمني المكثف',
    fontFamily: 'sans',
    accentColor: '#475569',
    borderColor: '#CBD5E1',
    bgClass: 'bg-white text-slate-900',
    layoutType: 'skills-first',
    padding: 34,
  },
]

export function getResumeTemplate(id: ResumeTemplateId): ResumeTemplateDefinition {
  const normalizedId = id === 'executive-classic' ? 'executive-navy' : id
  const found = RESUME_TEMPLATES.find((t) => t.id === normalizedId)
  return found || RESUME_TEMPLATES[0]
}
