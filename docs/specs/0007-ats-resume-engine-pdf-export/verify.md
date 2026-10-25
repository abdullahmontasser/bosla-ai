# Verify: ATS resume engine and PDF export · spec 0007 · updated 2026-10-25

_Steps derived from spec 0007 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Navigate to `/[lang]/tailor` in English and Arabic with an existing tailored resume → page renders ATS Score Card displaying overall match score and category subscores → AC-1, AC-3
- [x] Inspect missing skills section → missing skills render as clickable badges with plus icons to add to profile or dismiss → AC-3
- [x] Click an interactive missing skill badge → skill is added to candidate profile and score updates with fresh match calculation → AC-3, AC-4
- [x] Select an experience bullet point and trigger Google XYZ rewrite → bullet rewrites into Accomplished X by doing Z with qualitative impact without inventing fake metrics → AC-2
- [x] Click "Export ATS PDF" with language selector set to English → downloads clean single column vector PDF with Geist Sans typography and selectable text → AC-5, AC-6
- [x] Click "Export ATS PDF" with language selector set to Arabic → downloads clean single column vector PDF with IBM Plex Sans Arabic typography, correct cursive joining, and right to left text direction → AC-5, AC-6
- [x] Inspect multi page resume PDF export → verify page breaks occur between jobs or bullet points without split lines or orphan headers → AC-7
- [x] Simulate external AI provider timeout during ATS analysis → system falls back to deterministic keyword matching score, displays warning banner, and enables retry button → AC-8
- [x] Attempt to access `GET /api/resumes/[id]/pdf` without authenticated session or with unauthorized resume ID → endpoint returns 401 Unauthorized or 404 Not Found → AC-8

## Commands

- [x] `npm run test` → all unit and integration test suites pass including ATS scoring, bullet rewriting, and PDF generation → AC-1, AC-2, AC-5, AC-6, AC-8
- [x] `npx vitest run src/lib/ats/scoring.test.ts` → deterministic keyword matching and weighted scoring algorithms pass with expected values → AC-1, AC-4
- [x] `npx vitest run src/lib/ai/ats-prompt.test.ts` → Google XYZ bullet rewriting passes without metric hallucination → AC-2
- [x] `npx vitest run "src/app/api/resumes/[id]/pdf/route.test.ts"` → PDF route returns valid application/pdf binary stream with proper headers and session checks → AC-5, AC-8
- [x] `npx vitest run src/app/actions/ats-engine.test.ts` → ATS server actions calculate scores and update skills → AC-3, AC-4, AC-8
- [x] `npx vitest run src/components/ats/AtsWorkbench.test.tsx` → interactive ATS workbench renders and handles user actions → AC-3
- [x] `npx vitest run src/lib/pdf/render.test.ts` → bilingual PDF engine renders English and Arabic vector PDFs in memory → AC-5, AC-6, AC-7
- [x] `npm run typecheck` → TypeScript compilation succeeds with zero errors across all layers → AC-1, AC-5
- [x] `npm run lint` → ESLint checks pass clean → AC-1
- [x] `npm run build` → Next.js production build compiles successfully with all routes rendered → AC-1, AC-5

## Value sourcing verification

- [x] User ID: Verify unauthenticated requests to scoring actions or PDF export reject with 401 Unauthorized (`session.user.id`) → AC-8
- [x] ATS score: Verify computed from weighted formula (50% keywords + 30% experience + 20% formatting) → AC-1, AC-4
- [x] Missing skills: Verify calculated by subtracting candidate profile skills from required job posting skills → AC-1, AC-3
- [x] PDF binary delivery: Verify stream delivers vector PDF in memory without persisting binary files to server disk → AC-5
- [x] Arabic text shaping: Verify Arabic letters are shaped using `arabic-persian-reshaper` and reordered with `bidi-js` before drawing → AC-6

## Acceptance criteria coverage

- AC-1: Hybrid ATS scoring and keyword extraction covered by scoring unit tests and ATS workbench manual verification
- AC-2: Google XYZ bullet optimization with zero hallucination covered by bullet prompt unit tests and manual rewrite inspection
- AC-3: Interactive ATS studio workbench and missing skill badges covered by studio page manual tests and component tests
- AC-4: Server Action `calculateAtsScoreAction` and cooldown covered by actions tests and database transaction verification
- AC-5: Ephemeral PDF binary streaming route covered by route tests and browser download manual testing
- AC-6: Bilingual PDF generation with embedded fonts and Arabic shaping covered by PDF renderer unit tests and visual inspection
- AC-7: Clean pagination rules preventing orphan items covered by multi page PDF export manual tests
- AC-8: Graceful fallback on AI failure and strict session authorization covered by failure simulation and auth tests
