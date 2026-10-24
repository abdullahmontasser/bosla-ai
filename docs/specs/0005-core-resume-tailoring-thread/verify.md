# Verify: Core Resume Tailoring Thread · spec 0005 · updated 2026-10-25

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Visit `/[lang]/tailor` unauthenticated -> renders credentials sign-in card with demo login -> AC-1
- [x] Sign in with `demo@careercraft.ai` and `password123` -> redirects or refreshes into authenticated studio -> AC-1
- [x] In studio, observe two column workbench with Experience panel, Job Posting panel, Provider Switcher, and Live Preview panel -> AC-2
- [x] Click "Load Sample Candidate" -> populates headline, summary, and experience bullets with realistic bilingual Senior Full Stack Engineer qualifications -> AC-3
- [x] Edit headline or experience bullets and click "Save Experience Profile" -> persists candidate changes to database -> AC-3
- [x] Submit job description with fewer than 50 characters -> validation blocks submission and displays minimum character counter warning -> AC-4
- [x] When no active AI provider is selected -> studio displays warning alert banner linking to settings and disables generation button -> AC-9
- [x] Switch active provider via top inline ProviderSwitcher -> updates active model indicator -> AC-2, AC-5
- [x] Click "Generate Tailored Resume" with valid job posting -> streams tailored summary and bullet points live with section headers -> AC-5, AC-6
- [x] When streaming finishes -> live preview displays "Completed & Saved" badge and database record transitions to `COMPLETED` -> AC-7
- [x] Click "Stop Generation" during active stream or trigger provider error -> aborts stream immediately, sets status to `FAILED`, and displays actionable retry alert -> AC-8
- [x] Switch language between English (`/en/tailor`) and Arabic (`/ar/tailor`) -> layout, fonts, and directional styling mirror seamlessly -> AC-10

## Commands

- [x] `npm run test -- src/auth.test.ts src/app/actions/auth.test.ts` -> passes credentials verification and authorize logic -> AC-1
- [x] `npm run test -- src/app/actions/tailor.test.ts` -> passes profile fetch, update, and sample loading tests -> AC-3
- [x] `npm run test -- src/app/api/tailor/route.test.ts` -> passes route authentication, validation, streaming, onFinish, and abort tests -> AC-4, AC-5, AC-7, AC-8
- [x] `npm run test -- src/lib/ai/tailor-prompt.test.ts` -> passes anti-hallucination prompt and stream delimiter parser tests -> AC-6
- [x] `npm run test -- 'src/app/[lang]/tailor/page.test.tsx'` -> passes bilingual studio rendering and interaction tests -> AC-2, AC-9, AC-10
- [x] `npm run build` -> compiles Next.js App Router production build with partial prerendering without error -> AC-2, AC-10
- [x] `psql -U careercraft -d careercraft_db -c "SELECT id, status, language FROM tailored_resumes;"` -> confirms database records persisted live -> AC-7

## Acceptance-criteria coverage

- AC-1 Credentials auth: covered by `src/auth.test.ts`, `src/app/actions/auth.test.ts`, and manual sign in step
- AC-2 Studio page layout: covered by `src/app/[lang]/tailor/page.test.tsx` and manual UI inspection
- AC-3 Candidate profile actions: covered by `src/app/actions/tailor.test.ts` and sample data loading
- AC-4 Route handler validation: covered by `src/app/api/tailor/route.test.ts`
- AC-5 Provider decryption and streaming: covered by `src/app/api/tailor/route.test.ts` and live streaming test
- AC-6 Prompt engine and delimiters: covered by `src/lib/ai/tailor-prompt.test.ts`
- AC-7 Post-stream persistence: covered by `src/app/api/tailor/route.test.ts` and database query step
- AC-8 Error handling and abort: covered by `src/app/api/tailor/route.test.ts` and abort test
- AC-9 Missing provider guard: covered by `src/app/api/tailor/route.test.ts` and studio container warning
- AC-10 Bilingual LTR and RTL: covered by `src/app/[lang]/tailor/page.test.tsx` and English/Arabic inspection
