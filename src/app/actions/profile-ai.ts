'use server'

import { auth } from '@/auth'
import { getActiveProviderSettings } from '@/lib/db/provider-settings'
import { getProviderModel } from '@/lib/ai/provider-client'
import { generateText } from 'ai'

export interface EnhanceProjectDescriptionInput {
  name: string
  role?: string | null
  technologies?: string[]
  currentDescription: string
  language: 'EN' | 'AR'
}

export interface EnhanceProfileSummaryInput {
  fullName?: string
  headline?: string
  currentSummary: string
  language: 'EN' | 'AR'
}

export async function enhanceProjectDescriptionAction(
  params: EnhanceProjectDescriptionInput,
): Promise<{ success: boolean; enhancedDescription?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const { name, role, technologies = [], currentDescription, language } = params
  const isAr = language === 'AR'

  try {
    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (activeSettings.length > 0 && activeSettings[0].apiKey) {
      const model = getProviderModel(activeSettings[0])

      const system = isAr
        ? 'أنت خبير صياغة سير ذاتية تقنية وأنظمة ATS. مهمتك تحسين وصف المشروع ليكون واضحاً ومقنعاً، يبرز دور المرشح وأدواته والأثر المحقق بالأرقام والأفعال القوية، في فقرة من 2 إلى 3 جمل متماسكة.'
        : 'You are an expert technical resume writer and ATS strategist. Your task is to enhance the project description to be high-impact, professional, and ATS-optimized in 2 to 3 concise sentences highlighting architectural role, tech stack, and measurable impact.'

      const prompt = isAr
        ? `اسم المشروع: ${name || 'مشروع تقني'}
الدور: ${role || 'مطور رئيسي'}
التقنيات: ${technologies.join(', ') || 'تقنيات حديثة'}
الوصف الحالي للمرشح: "${currentDescription || 'مشروع برمجي متكامل'}"

اكتب وصفاً احترافياً محسناً للمشروع باللغة العربية في 2-3 جمل بدون مقدمات أو عناوين إضافية.`
        : `Project Name: ${name || 'Technical Project'}
Role: ${role || 'Lead Engineer'}
Technologies: ${technologies.join(', ') || 'Modern stack'}
Current Draft Description: "${currentDescription || 'Comprehensive software system'}"

Provide an enhanced, high-impact professional project description in 2-3 sentences. Do not add conversational prefixes or labels.`

      const result = await generateText({
        model,
        system,
        prompt,
        temperature: 0.4,
      })

      const text = result.text.trim().replace(/^["']|["']$/g, '')
      if (text) {
        return { success: true, enhancedDescription: text }
      }
    }
  } catch (err) {
    console.warn('AI project description enhancement fallback:', err)
  }

  // Deterministic high-quality fallback per Tracer Bullet approach
  const techStr =
    technologies.length > 0 ? technologies.join(', ') : isAr ? 'أحدث التقنيات' : 'modern tools'
  const fallback = isAr
    ? `قاد وتولى تصميم وتطوير "${name || 'المشروع'}" باستخدام ${techStr}. ساهم في بناء هيكلية برمجية مرنة وموثوقة حسّنت من سرعة الاستجابة وكفاءة الأداء وسلاسة تجربة المستخدم.`
    : `Architected and developed ${name || 'the project'} utilizing ${techStr}. Implemented high-performance scalable services, significantly streamlining workflows and boosting user engagement.`

  return { success: true, enhancedDescription: fallback }
}

export async function enhanceProfileSummaryAction(
  params: EnhanceProfileSummaryInput,
): Promise<{ success: boolean; enhancedSummary?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const { fullName, headline, currentSummary, language } = params
  const isAr = language === 'AR'

  try {
    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (activeSettings.length > 0 && activeSettings[0].apiKey) {
      const model = getProviderModel(activeSettings[0])

      const system = isAr
        ? 'أنت خبير صياغة السير الذاتية وكتابة النبذة المهنية التنفيذية المتوافقة مع ATS. اكتب ملخصاً مهنياً قوياً وموجزاً في 3-4 جمل يبرز الخبرة والمهارات الأساسية والقيمة المضافة.'
        : 'You are an executive resume writer and ATS specialist. Write a compelling, 3-4 sentence professional career summary tailored for ATS systems, highlighting domain expertise, technical leadership, and proven impact.'

      const prompt = isAr
        ? `المرشح: ${fullName || 'المرشح'}
المسمى المهني: ${headline || 'مهندس برمجيات'}
المسودة الحالية: "${currentSummary || 'متخصص ذو خبرة في بناء الأنظمة وإدارة الحلول'}"

اكتب ملخصاً مهنياً احترافياً متقناً بالعربية بدون مقدمات أو فذلكة.`
        : `Candidate: ${fullName || 'Candidate'}
Headline: ${headline || 'Software Engineer'}
Current Summary Draft: "${currentSummary || 'Experienced professional with a proven track record in architecting modern solutions.'}"

Provide an enhanced 3-4 sentence executive resume summary. Return pure text without prefixes.`

      const result = await generateText({
        model,
        system,
        prompt,
        temperature: 0.4,
      })

      const text = result.text.trim().replace(/^["']|["']$/g, '')
      if (text) {
        return { success: true, enhancedSummary: text }
      }
    }
  } catch (err) {
    console.warn('AI summary enhancement fallback:', err)
  }

  const fallback = isAr
    ? `${headline || 'متخصص متمرس'} ذو سجل حافل في بناء الحلول الموثوقة وقيادة المبادرات التقنية عالية الأثر. يتمتع بقدرة استثنائية على حل التحديات المعقدة والتعاون عبر الفرق لتحقيق أهداف المؤسسة بكفاءة واحترافية.`
    : `Results-driven ${headline || 'Professional'} with a demonstrated track record in architecting scalable solutions and delivering impactful technical initiatives. Adept at cross-functional collaboration, problem-solving, and driving organizational success through engineering excellence.`

  return { success: true, enhancedSummary: fallback }
}

export interface EnhanceExperienceBulletInput {
  jobTitle?: string
  companyName?: string
  currentBullet: string
  language: 'EN' | 'AR'
}

export async function enhanceExperienceBulletAction(
  params: EnhanceExperienceBulletInput,
): Promise<{ success: boolean; enhancedBullet?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const { jobTitle, companyName, currentBullet, language } = params
  const isAr = language === 'AR'

  try {
    const activeSettings = await getActiveProviderSettings(session.user.id)
    if (activeSettings.length > 0 && activeSettings[0].apiKey) {
      const model = getProviderModel(activeSettings[0])

      const system = isAr
        ? 'أنت خبير صياغة السير الذاتية وصيغة Google XYZ. مهمتك إعادة صياغة إنجاز وظيفي ليبدأ بفعل إنجاز قيادي قوي ويوضح أثراً أو نتيجة ملموسة متوافقة مع أنظمة الفرز (ATS).'
        : 'You are an expert resume writer specializing in the Google XYZ formula (Accomplished [X] by doing [Y] as measured by [Z]). Rewrite this work experience bullet with a commanding action verb and impactful phrasing.'

      const prompt = isAr
        ? `المسمى الوظيفي: ${jobTitle || 'مهندس برمجيات'}
الشركة: ${companyName || 'شركة تقنية'}
النص الحالي: "${currentBullet}"

أعد صياغة هذا الإنجاز في نقطة واحدة احترافية متماسكة باللغة العربية تبدأ بفعل ماضٍ قوي. أعد النقطة فقط بدون مقدمات.`
        : `Job Title: ${jobTitle || 'Software Engineer'}
Company: ${companyName || 'Technology Company'}
Current Bullet: "${currentBullet}"

Rewrite this bullet into a single high-impact professional achievement bullet starting with a strong past-tense action verb. Return pure text only.`

      const result = await generateText({
        model,
        system,
        prompt,
        temperature: 0.4,
      })

      const text = result.text
        .trim()
        .replace(/^["'•\-*]|["'•\-*]$/g, '')
        .trim()
      if (text) {
        return { success: true, enhancedBullet: text }
      }
    }
  } catch (err) {
    console.warn('AI bullet enhancement fallback:', err)
  }

  // Fallback
  const fallback = isAr
    ? `قاد وأشرف على تطوير وتنفيذ ${currentBullet.replace(/^[•\-*]\s*/, '')}، مما ساهم في رفع كفاءة الأداء وسرعة الاستجابة التشغيلية.`
    : `Spearheaded and executed ${currentBullet.replace(/^[•\-*]\s*/, '')}, optimizing performance and delivering scalable results.`

  return { success: true, enhancedBullet: fallback }
}
