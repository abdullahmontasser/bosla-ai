import { notFound, redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { isSupportedLocale } from '@/lib/i18n/config'
import { requireSession } from '@/lib/auth/require-session'
import { getCareerPrepPrintData } from '@/lib/db/career-prep'
import { INTERVIEW_CATEGORY_LABELS } from '@/lib/validations/career-prep'
import { PrintControls } from './PrintControls'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Layers, MessageSquareQuote } from 'lucide-react'

export const instant = false

export interface CareerPrepPrintPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ tailoredResumeId?: string }>
}

export default async function CareerPrepPrintPage({
  params,
  searchParams,
}: CareerPrepPrintPageProps) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const session = await requireSession(lang, `/${lang}/career-prep/print`)
  const userId = session.user?.id
  if (!userId) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const tailoredResumeId = resolvedSearchParams?.tailoredResumeId

  if (!tailoredResumeId) {
    redirect(`/${lang}/career-prep?invalid=1`)
    return null
  }

  const data = await getCareerPrepPrintData(userId, tailoredResumeId)
  if (!data || !data.payload) {
    redirect(`/${lang}/career-prep?invalid=1`)
    return null
  }

  const dict = await getDictionary(lang)
  const t = dict.careerPrep ?? {}

  const isAr = data.payload.language === 'AR'
  const contentDir = isAr ? 'rtl' : 'ltr'

  const dateStr = data.generatedAt || data.updatedAt
  const formattedDate = dateStr
    ? new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date(dateStr))
    : ''

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 max-w-4xl mx-auto">
      <PrintControls
        lang={lang}
        tailoredResumeId={data.id}
        backLabel={
          t.backToHub || (lang === 'ar' ? 'العودة إلى التحضير للمقابلات' : 'Back to Career Prep')
        }
        printLabel={t.printCheatSheet || (lang === 'ar' ? 'طباعة الورقة' : 'Print Cheat Sheet')}
      />

      <div dir={contentDir} className="space-y-6">
        {/* Dressed Sheet Header */}
        <header className="border-b-2 border-primary/20 pb-4 space-y-1">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {data.roleTitle}
              </h1>
              <p className="text-sm font-semibold text-primary">{data.companyName}</p>
            </div>
            {formattedDate && (
              <span className="text-xs text-muted-foreground font-mono">{formattedDate}</span>
            )}
          </div>
        </header>

        {/* STAR Questions */}
        <div className="space-y-6">
          {data.payload.questions.map((q, idx) => {
            const cat = INTERVIEW_CATEGORY_LABELS[q.category]
            return (
              <article
                key={q.id || idx}
                className="p-4 rounded-lg border border-border/80 bg-card/60 space-y-3 break-inside-avoid print:border-neutral-300 print:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
                    {idx + 1}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase py-0">
                    {isAr ? cat.ar : cat.en}
                  </Badge>
                </div>

                <h2 className="text-sm font-bold text-foreground leading-snug">{q.question}</h2>

                {q.whyAsked && (
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/40 text-xs text-muted-foreground">
                    <HelpCircle className="size-3.5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground/90 me-1">
                        {isAr ? 'هدف المقابِل:' : 'Interviewer Intent:'}
                      </span>
                      <span>{q.whyAsked}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Layers className="size-3.5 text-primary" />
                    <span>{isAr ? 'نموذج STAR' : 'STAR Model Response'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded border border-border/50 bg-background/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                        {isAr ? 'الموقف (Situation)' : 'Situation'}
                      </span>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {q.starResponse.situation}
                      </p>
                    </div>

                    <div className="p-2.5 rounded border border-border/50 bg-background/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                        {isAr ? 'المهمة (Task)' : 'Task'}
                      </span>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {q.starResponse.task}
                      </p>
                    </div>

                    <div className="p-2.5 rounded border border-border/50 bg-background/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                        {isAr ? 'الإجراء (Action)' : 'Action'}
                      </span>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {q.starResponse.action}
                      </p>
                    </div>

                    <div className="p-2.5 rounded border border-border/50 bg-background/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                        {isAr ? 'النتيجة (Result)' : 'Result'}
                      </span>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {q.starResponse.result}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Strategic Questions to Ask the Interviewer */}
        {data.payload.questionsToAskInterviewer.length > 0 && (
          <section className="p-4 rounded-lg border border-border/80 bg-card/60 space-y-3 break-inside-avoid print:border-neutral-300 print:bg-transparent">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {isAr
                  ? 'أسئلة استراتيجية تطرحها على المحاور'
                  : 'Strategic Questions to Ask the Interviewer'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {data.payload.questionsToAskInterviewer.map((qi, idx) => (
                <div
                  key={qi.id || idx}
                  className="p-3 rounded border border-border/60 bg-background/50 space-y-2 flex flex-col justify-between"
                >
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {idx + 1}. {qi.question}
                  </p>
                  {qi.strategicGoal && (
                    <div className="text-[11px] text-muted-foreground p-1.5 rounded bg-muted/40">
                      <span className="font-semibold text-foreground/80 me-1">
                        {isAr ? 'الهدف:' : 'Goal:'}
                      </span>
                      <span>{qi.strategicGoal}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
