import type { QuestionCategory } from '@/lib/validations/career-prep'

export interface BuildInterviewPrepPromptParams {
  candidateName: string
  roleTitle: string
  companyName: string
  jobContext: string
  workExperiences: Array<{
    companyName: string
    jobTitle: string
    bullets: string[]
  }>
  projects?: Array<{
    name: string
    description?: string | null
    technologies?: string[]
  }>
  language?: 'EN' | 'AR'
}

export interface BuildSingleQuestionPromptParams extends BuildInterviewPrepPromptParams {
  category: QuestionCategory
  existingQuestionText?: string
}

export function buildInterviewPrepPrompts(params: BuildInterviewPrepPromptParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'
  const isArabic = language === 'AR'

  const experiencesText =
    params.workExperiences.length > 0
      ? params.workExperiences
          .map(
            (w) =>
              `- ${w.companyName} (${w.jobTitle}):\n  ${w.bullets.map((b) => `* ${b}`).join('\n  ')}`,
          )
          .join('\n\n')
      : isArabic
        ? 'لا توجد خبرات سابقة مسجلة'
        : 'No previous work experience recorded'

  const projectsText =
    params.projects && params.projects.length > 0
      ? params.projects
          .map(
            (p) =>
              `- ${p.name}: ${p.description || ''} [Technologies: ${p.technologies?.join(', ') || 'N/A'}]`,
          )
          .join('\n')
      : isArabic
        ? 'لا توجد مشاريع مسجلة'
        : 'No projects recorded'

  if (isArabic) {
    return {
      system: `أنت كبير مهندسي المقابلات التقنية ومدرب وظيفي معتمد في كبرى شركات التقنية.

المطلوب إعداد ورقة تحضير للمقابلة (Interview Prep Cheat Sheet) مخصصة بدقة للوظيفة المستهدفة استناداً إلى بيانات المرشح الحقيقية فقط.

المخرجات المطلوبة بدقة:
1. بالضبط 3 أسئلة مقابلة موزعة حسب الفئات:
   - سؤال سلوكي واحد (BEHAVIORAL)
   - سؤال تقني واحد (TECHNICAL)
   - سؤال موقفي واحد (SITUATIONAL)
   لكل سؤال يجب تقديم:
   - نص السؤال (question)
   - سبب طرح السؤال وهدفه التقييمي (whyAsked)
   - إجابة نموذجية بهيكل STAR الصارم (situation, task, action, result)
   - المصادر المستند إليها من خبرات أو مشاريع المرشح (referencedSources)
   - مصفوفة تنبيهات الأرقام المفقودة (missingMetricFlags)

2. بالضبط 3 أسئلة استراتيجية يطرحها المرشح على مسؤول المقابلة (questionsToAskInterviewer):
   - نص السؤال الذكي (question)
   - الهدف الاستراتيجي من طرحه لإبراز عمق المرشح (strategicGoal)

قاعدة منع الهلوسة الصارمة (ZERO HALLUCINATIONS):
- يُحظر تماماً اختلاق أي أرقام أو إحصاءات أو شركات لم ترد في سيرة المرشح.
- إذا كان إنجاز المرشح يفتقر لأرقام دقيقة، لا تخترع رقماً إطلاقاً؛ بل ضع عنصراً نائباً محصوراً بين أقواس مع وسم العزل الاتجاهي مثل:
  <bdi>[أدخل نسبة تحسين الأداء]</bdi> أو <bdi>[أدخل حجم التوفير المالي]</bdi>
  وقم بتسجيل هذا العنصر في مصفوفة missingMetricFlags.
- إذا كانت خبرات المرشح خالية، قم بصياغة الإجابات لتوجيه المرشح لكيفية استثمار مهاراته العامة مع وضع عناصر نائبة واضحة للتخصيص.`,
      prompt: `بيانات المرشح والوظيفة المستهدفة:
المرشح: ${params.candidateName || 'مرشح تقني'}
المسمى الوظيفي: ${params.roleTitle}
الشركة المستهدفة: ${params.companyName}

سياق ومتطلبات الوظيفة المستهدفة:
${params.jobContext}

الخبرات المهنية المعتمدة للمرشح:
${experiencesText}

المشاريع المعتمدة للمرشح:
${projectsText}

قم بتوليد كائن JSON متكامل مطابق لمخطط InterviewPrepPayload باللغة العربية، يحتوي على بالضبط 3 أسئلة موزعة (1 سلوكي، 1 تقني، 1 موقفي) مع إجابات STAR وبضبط 3 أسئلة للمحاور.`,
    }
  }

  return {
    system: `You are a Principal Engineering Interview Bar Raiser and Executive Career Coach.

You generate an authentic, targeted Interview Prep Cheat Sheet strictly grounded in the candidate's authentic background and the target role description.

EXACT BOUNDED OUTPUTS:
1. Exactly 3 categorized interview questions:
   - Exactly 1 BEHAVIORAL question
   - Exactly 1 TECHNICAL question
   - Exactly 1 SITUATIONAL question
   For each question:
   - "question": High-signal question matching target job requirements.
   - "whyAsked": Strategic analysis of what the interviewer is evaluating.
   - "starResponse": Complete, structured response formatted as { situation, task, action, result }.
   - "referencedSources": Names of authentic companies or projects cited in the answer.
   - "missingMetricFlags": Array of bracketed placeholders inserted wherever real metrics were not in the candidate's record.

2. Exactly 3 strategic questions for the candidate to ask the interviewer (questionsToAskInterviewer):
   - "question": High-caliber question demonstrating senior architectural or product insight.
   - "strategicGoal": Explanation of how this question positions the candidate favorably.

STRICT ZERO-HALLUCINATION INVARIANTS:
- NEVER invent unearned metrics, arbitrary percentages (e.g., "reduced latency by 45%"), or past employers.
- When an authentic achievement lacks quantified metrics, insert localized bracketed placeholders such as "[insert latency reduction %]" or "[insert user adoption count]" indicating where the candidate should supply their own authentic number.
- Record any such placeholder in the "missingMetricFlags" array.
- If the candidate profile has no recorded projects or experiences, ground questions in the core job requirements and guide the candidate with clear placeholder prompts.`,
    prompt: `Candidate and Target Role Context:
Candidate Name: ${params.candidateName || 'Candidate'}
Target Role Title: ${params.roleTitle}
Target Company: ${params.companyName}

Target Job Requirements & Context:
${params.jobContext}

Candidate Verified Work Experiences:
${experiencesText}

Candidate Verified Projects:
${projectsText}

Generate the structured JSON payload matching the InterviewPrepPayload schema in English with exactly 3 categorized questions (1 Behavioral, 1 Technical, 1 Situational) and exactly 3 interviewer questions.`,
  }
}

export function buildSingleQuestionPrompt(params: BuildSingleQuestionPromptParams): {
  system: string
  prompt: string
} {
  const language = params.language || 'EN'
  const isArabic = language === 'AR'

  if (isArabic) {
    return {
      system: `أنت خبير إعداد مقابلات تقنية. مهمتك إعادة توليد سؤال واحد فقط من فئة: ${params.category}.
شروط صارمة:
- منع اختلاق أي أرقام أو شركات غير موجودة في خبرات المرشح.
- استخدام عناصر نائبة مثل <bdi>[أدخل النسبة]</bdi> عند غياب الأرقام.
- تقديم إجابة كاملة بهيكل STAR ومصادر محددة.`,
      prompt: `المسمى الوظيفي: ${params.roleTitle} في ${params.companyName}
الفئة المطلوبة: ${params.category}
${params.existingQuestionText ? `السؤال السابق للاستبدال: ${params.existingQuestionText}` : ''}
سياق الوظيفة: ${params.jobContext}

قم بتوليد السؤال الجديد مع إجابة STAR ومصادر الإسناد باللغة العربية ككائن JSON وحيد.`,
    }
  }

  return {
    system: `You are an executive interview coach. Your task is to regenerate ONLY a single question of category: ${params.category}.
STRICT INVARIANTS:
- Zero hallucinations: ground strictly in authentic candidate experiences and projects.
- Insert bracketed placeholders like "[insert percentage %]" if quantitative metrics are missing.
- Format response with full STAR framework and authentic source references.`,
    prompt: `Role: ${params.roleTitle} at ${params.companyName}
Category: ${params.category}
${params.existingQuestionText ? `Previous Question to Replace: ${params.existingQuestionText}` : ''}
Job Context: ${params.jobContext}

Regenerate a single question object with whyAsked, starResponse (situation, task, action, result), referencedSources, and missingMetricFlags in English.`,
  }
}
