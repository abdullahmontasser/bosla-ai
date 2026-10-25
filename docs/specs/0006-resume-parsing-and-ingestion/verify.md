# Verify: resume parsing and ingestion · spec 0006 · updated 2026-10-25

_Steps derived from spec 0006 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Navigate to `/[lang]/resume` in English and Arabic → page renders upload dropzone with 10MB limit and format hints → AC-1
- [ ] Drag or select a file exceeding 10MB → client displays immediate validation error and blocks upload → AC-1
- [ ] Drag or select an unsupported file type (e.g. `.png` or `.exe`) → client displays immediate format error → AC-1
- [ ] Upload a scanned PDF with no selectable text → system detects empty text stream, displays guidance banner explaining to upload a selectable digital file, and disables retry button → AC-2, AC-6
- [ ] Upload a valid English PDF resume (< 10 pages) with active AI provider → extracts raw text, detects language EN, displays interactive review workbench with `dir="ltr"` → AC-1, AC-3, AC-4
- [ ] Upload a valid Arabic DOCX resume (< 50,000 characters) with active AI provider → extracts raw text, detects language AR, displays interactive review workbench with `dir="rtl"` via DirectionProvider → AC-1, AC-3, AC-4
- [ ] In review workbench, edit personal details, add a work experience bullet, remove a skill chip, and add a new skill chip → fields update interactively in state → AC-4
- [ ] Test section merge controls: toggle experiences to Replace, skills to Append, and education to Skip → mergeConfig updates accordingly → AC-4
- [ ] Click "Commit to Master Profile" for a brand new user with no existing profile → atomic transaction creates a new default profile with child records and displays success banner with link to studio → AC-4, AC-5
- [ ] Click "Commit to Master Profile" for a user with existing profile using Append on skills with duplicate entries → new skills are appended with case-insensitive name deduplication and sortOrder preservation → AC-4, AC-5
- [ ] Simulate AI provider timeout or network error during parsing → record status updates to FAILED with errorCode `AI_PROVIDER_ERROR`, rawText is preserved, and clicking "Retry AI Extraction" retries without file re-upload → AC-3, AC-6

## Commands

- [x] `npm run test` → all 36 test suites pass including parsing, actions, review UI, and page tests → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- [x] `npx vitest run src/lib/parsing/extract.test.ts` → magic bytes validation, PDF page limits, DOCX character thresholds, and scanned file detection pass → AC-1, AC-2
- [x] `npx vitest run src/actions/resume-actions.test.ts` → upload authorization, file validation, error codes segregation, retry handling, and atomic commit pass → AC-1, AC-3, AC-5, AC-6, AC-7
- [x] `npx vitest run src/components/resume/resume-review.test.tsx` → dropzone validation, DirectionProvider bilingual switching, section merge toggles, and inline editing pass → AC-1, AC-2, AC-4
- [x] `npm run typecheck` → TypeScript compilation succeeds with zero errors across all layers → AC-1, AC-5
- [x] `npm run lint` → ESLint checks pass clean → AC-1
- [x] `npm run build` → Next.js production build compiles successfully with all routes rendered → AC-1, AC-4

## Value sourcing verification

- [x] User ID: Verify unauthenticated requests to upload, retry, or commit reject with 401 Unauthorized (`session.user.id`) → AC-7
- [x] AI credentials: Verify extraction resolves active provider and decrypts API key via `getActiveProviderSettings` → AC-3
- [x] Raw text: Verify raw resume text extracted in memory via `unpdf` or `mammoth` without cloud disk writes → AC-2
- [x] Document language: Verify language detected as EN or AR dynamically by prompt output → AC-3, AC-4
- [x] Parsing status lifecycle: Verify transitions `PROCESSING` → `REVIEWING` (or `FAILED` with specific `errorCode`) → `APPLIED` on commit → AC-5, AC-6
- [x] Retry persistence: Verify `retryParsingAction` reads stored `rawText` from `ParsedResume` without asking for file re-upload → AC-6
- [x] Profile fallback: Verify first-time user without prior profile gets initial `Profile` with `isDefault: true` created during commit → AC-5
- [x] Section merge semantics: Verify scalar personal info replace/skip, experience/education/project replace/append/skip, and skill name deduplication on append → AC-4, AC-5

## Acceptance-criteria coverage

- AC-1: Upload format & size limits (10MB, 10 pages, 50k chars) covered by dropzone manual test, extract unit tests, and actions tests
- AC-2: In-memory text extraction and unselectable text detection covered by scanned file upload test and `extract.test.ts`
- AC-3: AI structured extraction with 60s timeout and BYOK provider covered by PDF/DOCX upload tests and `resume-parser.test.ts`
- AC-4: Bilingual review workbench with DirectionProvider, section merge controls, and inline editing covered by review workbench manual tests and `resume-review.test.tsx`
- AC-5: Atomic commit transaction with new profile fallback, merge semantics, and APPLIED status covered by commit manual tests and actions tests
- AC-6: Error code segregation (`EXTRACTION_FAILED` vs `AI_PROVIDER_ERROR`) and inline retry covered by failure manual tests, retry tests, and dropzone tests
- AC-7: Session authorization and user-scoped data access covered by unauthenticated command tests and actions unit tests
