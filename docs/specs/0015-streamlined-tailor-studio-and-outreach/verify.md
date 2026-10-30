# Verify: Streamlined tailor studio and outreach · spec 0015 · updated 2026-10-29

_Steps derived from spec 0015 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Visit `/[lang]/tailor` signed out -> expect redirect to login page with callbackUrl -> AC-1
- [x] Sign in with an account having no candidate profile and navigate to `/[lang]/tailor` -> expect friendly missing profile banner with button to `/profile` and disabled tailoring generate button -> AC-2
- [x] Sign in with an account having an existing candidate profile -> expect candidate headline badge with verified email status chip in header, with no inline profile editing forms rendered -> AC-3
- [x] Enter a job description with over 50 characters and click Generate Tailored Resume -> expect live response streaming into isolated preview island without input latency or layout thrashing -> AC-4
- [x] Observe generation completion -> expect ATS match score, skills gap summary, and XYZ bullet recommendations displayed in AtsWorkbench -> AC-5
- [x] Check AtsWorkbench header beside ATS score -> expect vector PDF export button, clicking downloads binary PDF from `/api/resumes/[id]/pdf` -> AC-6
- [x] Check post generation results section beneath AtsWorkbench -> expect Outreach accordion collapsed by default with Pending/Ready badge -> AC-7
- [x] Click Outreach accordion to expand -> expect lazy loaded outreach messages payload with InMail, connection notes, and email copy -> AC-7
- [x] Click Add to Tracker button in bottom action bar -> expect application saved optimistically, button toggles to View in Tracker without duplicate error -> AC-8
- [x] Click Practice STAR Interview Questions in bottom action bar -> expect deep link navigation to `/[lang]/career-prep?tailoredResumeId=[id]` -> AC-9
- [x] Toggle locale between English and Arabic -> expect mirrored RTL/LTR layout, correct font rendering, localized copy, and accessible keyboard focus navigation -> AC-10

## Commands

- [x] `npx prisma migrate status` -> expect database schema up to date with new index migration -> AC-1
- [x] `npm run test -- --run src/app/[lang]/tailor/ src/components/tailor/ src/app/actions/tailor.test.ts` -> expect 57 tests passing -> AC-10
- [x] `npm run lint` -> expect 0 errors and 0 warnings -> AC-10
- [x] `npm run build` -> expect production build successful -> AC-10

## Acceptance-criteria coverage

- AC-1: Covered by composite database index migration, dead payload elimination in `getTailorStudioInitialData`, and server component data prefetching in `page.tsx`.
- AC-2: Covered by `MissingProfileBanner` and disabled generate button when candidate profile is missing.
- AC-3: Covered by `CandidateBadge` in studio header with headline and verified email status, and removal of `ExperienceForm`.
- AC-4: Covered by isolated streaming token updates in `LiveTailorStream` and memoized `JobPostingForm`.
- AC-5: Covered by post generation `AtsWorkbench` rendering with match score, skills gaps, and Google XYZ bullets.
- AC-6: Covered by vector `PdfExportButton` docked inside `AtsWorkbench` header beside ATS match score.
- AC-7: Covered by collapsible `OutreachAccordion` with lazy loading trigger and `getOutreachMessageAction`.
- AC-8: Covered by `TailorActionBar` optimistic tracker save and graceful duplicate handling.
- AC-9: Covered by `TailorActionBar` deep link to `/[lang]/career-prep?tailoredResumeId=[id]`.
- AC-10: Covered by Arabic RTL / English LTR translations, accessible ARIA roles, and 57 unit/component tests.
