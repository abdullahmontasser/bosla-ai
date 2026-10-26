# Verify: Career outreach and interview prep · spec 0008 · updated 2026-10-26

_Steps derived from spec 0008 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Navigate to `/[lang]/tailor` with a tailored resume, click the Outreach Messages tab → verify LinkedIn connection note displays live counter with `X / 300` and warning states → AC-1, AC-3, AC-4, AC-CO-3
- [x] In Outreach Messages tab, select tone (Confident) and recipient (Hiring Manager), then click Generate Outreach Messages → expect 3 variants generated and persisted to database → AC-1, AC-5, AC-CO-1, AC-CO-2, AC-CO-4
- [x] In Outreach Messages tab, edit InMail body in place and wait 1000 milliseconds → expect autosave indicator "Saved" and database updated with new timestamp → AC-4, AC-CO-3, AC-CO-4
- [x] In Outreach Messages tab, click Regenerate on InMail card → expect pending autosave to flush first, InMail content updated, and connection note and email preserved → AC-1, AC-4, AC-CO-4
- [x] In Tailoring Studio, click Interview Prep tab → verify status badge and 3 categorized questions (1 Behavioral, 1 Technical, 1 Situational) plus 3 interviewer questions rendered → AC-2, AC-3, AC-IP-1, AC-IP-3
- [x] In Interview Prep tab, inspect questions for candidate with missing metrics → expect localized bracketed placeholders such as `[insert latency reduction %]` in English or `<bdi>[أدخل نسبة تحسين الأداء]</bdi>` in Arabic with zero unearned numbers → AC-2, AC-IP-2
- [x] In Interview Prep tab, click Print Cheat Sheet (PDF) → expect print media styling applied cleanly with interactive UI buttons hidden and cards kept intact (`break-inside-avoid`) → AC-2, AC-4, AC-IP-3
- [x] In Tailoring Studio for candidate with 0 recorded experiences or projects, visit Interview Prep tab → verify informational guidance banner rendered without error → AC-5, AC-IP-5

## Commands

- [x] `npm run lint && npx tsc --noEmit` → exit code 0, zero errors → AC-1, AC-2, AC-3, AC-4, AC-5
- [x] `npx vitest run src/lib/validations/career-prep.test.ts src/lib/ai/prompts/outreach.test.ts src/lib/ai/prompts/interview-prep.test.ts src/app/actions/outreach-actions.test.ts src/app/actions/interview-prep-actions.test.ts src/components/outreach/outreach.test.tsx src/components/interview-prep/interview-prep.test.tsx src/components/tailor/StudioContainer.test.tsx` → all unit and integration tests pass → AC-1, AC-2, AC-3, AC-4, AC-5
- [x] `npm run build` → Next.js production build completes cleanly → AC-1, AC-2, AC-3, AC-4, AC-5

## Acceptance-criteria coverage

- AC-1 covered by UI steps 1, 2, 4 and Command steps 1, 2, 3
- AC-2 covered by UI steps 5, 6, 7 and Command steps 1, 2, 3
- AC-3 covered by UI steps 1, 5 and Command steps 1, 2, 3
- AC-4 covered by UI steps 1, 3, 4, 7 and Command steps 1, 2, 3
- AC-5 covered by UI steps 2, 8 and Command steps 1, 2, 3
