# 0006. Resume parsing and ingestion

**Date**: 2026-10-25
**Status**: Accepted

## Summary

This spec covers how users upload existing resumes in PDF or Word format and convert them into structured candidate profiles. The pipeline extracts text locally in server memory using unpdf and mammoth, parses structured fields via Vercel AI SDK generateObject using your active AI provider key, and displays an interactive review screen. You can review, edit, and choose whether to replace, append, or skip individual sections before committing updates to your master profile. First time users without an existing profile receive a new default master profile automatically upon commit. Discarding uploaded file binaries after text extraction protects user privacy and avoids cloud storage costs.

## Requirements

**User stories**:

- As a job seeker, I want to upload my existing resume in PDF or Word format so that my profile is populated without manual data entry.
- As a bilingual applicant, I want the parser to understand Arabic and English documents accurately so that my career history preserves authentic phrasing.
- As an applicant with an existing profile, I want to review extracted fields and choose whether to replace or merge sections so that I stay in complete control of my career record.
- As a new applicant without an existing profile, I want the ingestion flow to create my initial master profile automatically without requiring preliminary manual setup.

**Acceptance criteria** (the contract, each independently checkable):

- **AC-1**: Users can upload PDF and DOCX files up to 10MB (supported by Next.js serverActions bodySizeLimit configuration), enforcing page limits for PDF files (up to 10 pages inspected via unpdf) and text volume limits for DOCX files (up to 50,000 characters via mammoth), receiving immediate client side and server side validation feedback on format and size violations.
- **AC-2**: The text extraction engine extracts raw text from PDF and DOCX files in memory using unpdf and mammoth, detecting documents with empty or unselectable text streams and recording extraction errors with guidance to upload a text selectable version.
- **AC-3**: Structured AI extraction automatically detects Arabic or English source language, returning typed JSON conforming to the candidate profile schema via Vercel AI SDK generateObject with an explicit 60 second timeout (AbortSignal.timeout) using the active user configured AI provider.
- **AC-4**: An interactive bilingual review screen displays parsed candidate details (personal info, experiences, education, skills, projects) wrapped in the document language direction using DirectionProvider, offering section level merge controls (replace, append, skip, with scalar profile details supporting replace or skip, and skills deduplicated by name on append) and inline field editing.
- **AC-5**: A commit Server Action executes an atomic database transaction that updates an existing profile or creates a new default profile if none exists, maps child records according to section merge rules, and marks the parsed resume status as APPLIED.
- **AC-6**: Failures during extraction record errorCode EXTRACTION_FAILED with guidance to upload a selectable file, while AI provider errors record errorCode AI_PROVIDER_ERROR with preserved raw text and an inline retry Server Action that re-runs AI extraction without re-uploading the file.
- **AC-7**: All upload, retry, and commit actions enforce user session authorization, rejecting unauthenticated requests and scoping database records strictly to the session user.

## Decision

**Chosen option**: Option 1: Two step extraction with local document text parsing (unpdf and mammoth) and structured Vercel AI SDK object generation using active user provider keys.

The pipeline extracts plain text locally in memory from uploaded files, validates content readability, streams typed JSON extraction via Vercel AI SDK generateObject with strict Zod validation against the active BYOK provider, and presents an interactive section level review screen before an atomic database commit.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

Enum additions and model adjustments in `prisma/schema.prisma`:

```prisma
enum ParsingStatus {
  PROCESSING
  REVIEWING
  APPLIED
  FAILED
}

model ParsedResume {
  id               String         @id @default(cuid())
  userId           String         @map("user_id")
  profileId        String?        @map("profile_id")
  originalFileName String         @map("original_file_name") @db.VarChar(255)
  fileFormat       DocumentFormat @map("file_format")
  status           ParsingStatus  @default(PROCESSING)
  errorCode        String?        @map("error_code") @db.VarChar(64)
  errorMessage     String?        @map("error_message") @db.Text
  rawText          String?        @map("raw_text") @db.Text
  parsedPayload    Json?          @map("parsed_payload")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  profile Profile? @relation(fields: [profileId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([profileId])
  @@map("parsed_resumes")
}
```

Target `Profile` model and associated child collections populated on commit:

- `Profile` (personal details, language, fullName, headline, summary, email, phone, location, links)
- `WorkExperience` (companyName, jobTitle, location, startDate, endDate, isCurrent, bullets, sortOrder)
- `Education` (institution, degree, fieldOfStudy, startDate, endDate, isCurrent, grade, sortOrder)
- `Skill` (name, category, proficiency, sortOrder)
- `Project` (name, description, role, technologies, url, sortOrder)

**Merge semantics**:

- Scalar profile fields (fullName, headline, summary, email, phone, location, websiteUrl, linkedinUrl, githubUrl):
  - `replace`: Overwrites target profile scalar values with the reviewed parsed fields.
  - `skip`: Keeps existing scalar values on the target profile untouched.
- Work experiences, Educations, and Projects:
  - `replace`: Deletes existing records for this profile and inserts the reviewed parsed records with `sortOrder` starting at 0.
  - `append`: Preserves existing records and appends the reviewed parsed records with `sortOrder` starting from `(max existing sortOrder + 1)`.
  - `skip`: Keeps existing records and ignores parsed entries for this section.
- Skills:
  - `replace`: Deletes existing skills for this profile and inserts the reviewed parsed skills.
  - `append`: Appends parsed skills with case insensitive name deduplication against existing skills for this profile, avoiding duplicate entries while maintaining correct order.
  - `skip`: Keeps existing skills untouched.

**State transitions**:

Lifecycle for `ParsedResume`:

- `Upload started` -> `PROCESSING` (record created with status PROCESSING, rawText null, parsedPayload null).
- If text extraction fails (empty stream, scanned image, corrupt file):
  `PROCESSING` -> `FAILED` (status FAILED, errorCode `EXTRACTION_FAILED`, rawText null, UI presents explanation to upload a selectable file, retry button disabled).
- If text extraction succeeds:
  `rawText` saved to record. AI model invoked with 60 second timeout.
- If AI call fails or times out:
  `PROCESSING` -> `FAILED` (status FAILED, errorCode `AI_PROVIDER_ERROR`, rawText preserved in database, UI presents inline retry action).
- User clicks retry on AI failure:
  `FAILED` -> `PROCESSING` (`retryParsingAction` re invokes generateObject using the saved rawText without asking for a file re upload).
- If AI call succeeds:
  `PROCESSING` -> `REVIEWING` (status REVIEWING, parsedPayload saved, UI displays interactive review workbench).
- User commits review:
  `REVIEWING` -> `APPLIED` (`commitParsedResumeAction` writes updates in an atomic database transaction).

**API surface**:

| Endpoint / Action          | Method               | Key inputs                                                                                                                                                   | Key outputs                                                                                                    | Auth                                 | Key errors                                                                                              |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `parseResumeAction`        | Server Action (POST) | `formData: FormData` containing `file: File`                                                                                                                 | `{ success: boolean, parsedResumeId: string, data?: ParsedResumePayload, errorCode?: string, error?: string }` | Authenticated session                | 401 Unauthorized, 400 Invalid format, 413 File too large, 422 Unselectable text, 502 Extraction failure |
| `retryParsingAction`       | Server Action (POST) | `parsedResumeId: string`                                                                                                                                     | `{ success: boolean, data?: ParsedResumePayload, errorCode?: string, error?: string }`                         | Authenticated session (record owner) | 401 Unauthorized, 404 Not found, 400 Missing raw text, 502 AI provider failure                          |
| `commitParsedResumeAction` | Server Action (POST) | `parsedResumeId: string`, `targetProfileId?: string`, `mergeConfig: Record<SectionName, 'replace' \| 'append' \| 'skip'>`, `editedData: ParsedResumePayload` | `{ success: boolean, profileId: string, error?: string }`                                                      | Authenticated session (record owner) | 401 Unauthorized, 404 Not found, 422 Invalid payload, 500 Transaction failed                            |

**Value sourcing**:

| Action                     | Value produced / displayed                      | Source                                                                                                                  |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `parseResumeAction`        | User ID                                         | Auth.js session `session.user.id`                                                                                       |
| `parseResumeAction`        | Active AI provider, model, and decrypted key    | `getActiveUserProvider(userId)` from spec 0004 and crypto helper `decryptSecret` from spec 0002                         |
| `parseResumeAction`        | Raw resume text                                 | Extracted in memory via `unpdf` or `mammoth` from uploaded `File` buffer                                                |
| `parseResumeAction`        | Detected document language                      | Inferred by AI prompt and `generateObject` Zod schema output (`Language` enum `EN` or `AR`)                             |
| `parseResumeAction`        | Structured candidate payload                    | Derived by Vercel AI SDK `generateObject` conforming to Zod schema                                                      |
| `parseResumeAction`        | Parsing status and error codes                  | Initialized to `PROCESSING`, updated to `REVIEWING` on success or `FAILED` with `errorCode` on error                    |
| `retryParsingAction`       | Stored raw resume text                          | Read directly from `ParsedResume.rawText` where `userId = session.user.id`                                              |
| `commitParsedResumeAction` | Target profile ID                               | Client parameter verified against user ownership in database; if omitted or not found, a new default Profile is created |
| `commitParsedResumeAction` | Section merge configuration                     | Client selection per section (`replace`, `append`, `skip`)                                                              |
| `commitParsedResumeAction` | Experience, Education, Skills, Projects records | Client approved payload mapped into Prisma upsert / create / delete inputs with deduplication                           |
| `commitParsedResumeAction` | Profile scalar fields                           | Client approved values applied to Profile scalar columns                                                                |
| `commitParsedResumeAction` | Updated parsing status                          | Set to `APPLIED` in the atomic transaction                                                                              |

**Key invariants**:

- Uploaded binary buffers are held in memory only during text extraction and never stored on disk or blob storage.
- All database reads, writes, and transactions are strictly scoped to the authenticated `session.user.id`.
- The review workbench card layout direction is governed by the detected document language using `DirectionProvider` (`dir="rtl"` for Arabic, `dir="ltr"` for English) while keeping the surrounding application navigation in the current user interface locale.
- Committing parsed data to a profile executes in an atomic database `$transaction`; if any child record write fails, all changes rollback.
- When a user has no prior profile and provides no `targetProfileId`, `commitParsedResumeAction` creates an initial `Profile` with `isDefault: true` before linking child records.
- If text extraction fails, `errorCode` is set to `EXTRACTION_FAILED` and retry is disabled; if AI provider calls fail or time out, `errorCode` is set to `AI_PROVIDER_ERROR` and stored `rawText` enables seamless retry.

**Security model**:

- File validation: Magic bytes inspection (`%PDF` for PDF, `PK\x03\x04` for DOCX) rejects spoofed file extensions.
- File size limit: Hard 10MB limit enforced on client side and configured on server side via Next.js `serverActions.bodySizeLimit`.
- API keys: Provider keys remain encrypted with AES 256 GCM at rest, decrypted only in server memory for the duration of the `generateObject` call.
- Data ownership: Prisma queries enforce `{ userId: session.user.id }` across all operations.

**Configuration required**:

In `next.config.ts`:

```ts
experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
  },
},
```

Reuses existing `DATABASE_URL`, `AUTH_SECRET`, and `ENCRYPTION_SECRET` from specs 0001, 0002, and 0004.

**Critical test scenarios**:

- Happy path: User uploads valid English or Arabic PDF, text extracts cleanly, AI returns structured JSON, user reviews and commits with section merge options, profile updates successfully, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**.
- First time user path: Brand new user with no existing profile uploads resume and commits, system automatically creates default profile record and populates all child collections, verifies **AC-4**, **AC-5**.
- Failure case (scanned image): User uploads a scanned PDF with no extractable text, system detects empty text stream, sets `errorCode: 'EXTRACTION_FAILED'`, and presents guidance to upload a text selectable file, verifies **AC-2**, **AC-6**.
- Failure case (AI timeout or quota exhaustion): User uploads document, active AI provider times out after 60 seconds (caught by AbortSignal), record status updates to FAILED with `errorCode: 'AI_PROVIDER_ERROR'`, raw text is preserved, and UI offers inline retry action that succeeds on subsequent attempt, verifies **AC-3**, **AC-6**.
- Merge rules verification: User with existing profile commits parsed resume with replace on experience, append on skills, and skip on education; existing experience is replaced, existing skills are preserved with duplicates skipped, and education is untouched, verifies **AC-4**, **AC-5**.
- Auth and permissions: Unauthenticated user or request with mismatched userId attempts upload, retry, or commit action, server rejects with 401 Unauthorized, verifies **AC-7**.

## Build plan

1. [x] Add `ParsingStatus` enum and `status`, `errorCode`, `errorMessage`, `rawText String?`, `parsedPayload Json?`, `updatedAt DateTime @updatedAt` columns to `ParsedResume` in `prisma/schema.prisma` and run migration, satisfies **AC-5**, **AC-6**.
2. [x] Configure `serverActions.bodySizeLimit: '10mb'` in `next.config.ts`, satisfies **AC-1**.
3. [x] Install `unpdf` and `mammoth` packages and create text extraction service with file magic bytes validation, PDF page limits (up to 10 pages), and DOCX length thresholds (up to 50,000 characters) in `src/lib/parsing/`, satisfies **AC-1**, **AC-2**.
4. [x] Create candidate extraction prompt and Zod schema in `src/lib/ai/prompts/resume-parser.ts` using Vercel AI SDK `generateObject` with 60 second timeout (`AbortSignal.timeout(60000)`) and active user provider configuration, satisfies **AC-3**, **AC-6**.
5. [x] Build `parseResumeAction` and `retryParsingAction` Server Actions in `src/actions/resume-actions.ts` orchestrating validation, extraction, database record creation, distinct error code tracking, and retry execution, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**.
6. [x] Build `commitParsedResumeAction` Server Action executing atomic profile updates with fallback profile creation for new users, scalar replace or skip rules, and child record deduplication and append ordering, satisfies **AC-4**, **AC-5**, **AC-7**.
7. [x] Build bilingual upload dropzone and interactive review screen component island in `src/components/resume/` using `DirectionProvider` for localized document layout, section controls, inline editing, and error recovery, satisfies **AC-1**, **AC-2**, **AC-4**.
8. [x] Colocate unit and component test suites beside implementation files (`src/lib/parsing/extract.test.ts`, `src/actions/resume-actions.test.ts`, `src/components/resume/resume-review.test.tsx`, `src/app/[lang]/resume/page.test.tsx`) covering valid parsing, scanned file detection, bilingual payload mapping, and merge transactions, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:

- Users bootstrap rich career profiles in seconds from existing resumes without manual data entry.
- Brand new users can onboard directly through resume upload without needing prior manual profile setup.
- Direct memory extraction eliminates external cloud storage dependencies and costs.
- Bilingual parsing preserves authentic Arabic and English phrasing in native script and layout.
- Section level review with explicit merge semantics prevents accidental loss or duplication of existing profile data.
- Clear error segregation distinguishes non retryable corrupt files from retryable AI provider network issues.

**Negative / tradeoffs**:

- Scanned PDF resumes without a text layer cannot be parsed without a future OCR service.
- Discarding uploaded binary files means users cannot download their original uploaded file again later.
- Large resumes with extensive experience sections consume noticeable LLM input tokens on user BYOK keys.

**Neutral**:

- Requires adding `unpdf` and `mammoth` npm dependencies.
- Added database migration for `ParsingStatus` enum, error codes, and nullable payload fields on `ParsedResume`.
- Added `serverActions.bodySizeLimit: '10mb'` to `next.config.ts`.

## Follow-up

- [ ] Monitor user feedback on scanned PDF failure rates to evaluate whether adding an optional OCR vision pipeline is warranted in a future slice.
- [ ] Add translation helper in Slice 3 if users desire cross language resume generation (for example generating English resumes from Arabic parsed profiles).
