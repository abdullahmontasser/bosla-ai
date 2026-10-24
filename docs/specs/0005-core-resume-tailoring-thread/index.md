# 0005. Core Resume Tailoring Thread

**Date**: 2026-10-25
**Status**: Accepted

## Summary

This specification defines the walking skeleton slice for CareerCraft AI, connecting user authentication, database persistence, AI streaming, and bilingual UI into one working vertical thread. Job seekers sign in, select or customize their candidate profile experience, input a target job description, and watch a tailored professional summary and targeted bullet points stream live in English or Arabic. Once streaming completes, the finalized snapshot is saved to PostgreSQL, establishing the core tailoring pipeline that all future resume parsing and export slices build upon.

## Requirements

**User stories**:

- As a job seeker, I want to sign in with simple credentials so that I can access my personalized career studio without external third party setup.
- As a job seeker, I want to load realistic sample experience or edit my background headline, summary, and work experience bullets so that the AI understands my real qualifications.
- As a job seeker, I want to paste a job posting title, company name, and description in English or Arabic so that the AI can target my qualifications to the employer's needs.
- As a job seeker, I want to watch my tailored summary and tailored bullet points stream live side by side so that I get immediate visual feedback without waiting for full generation.
- As a job seeker, I want my active AI provider and model to execute the generation using my saved key without exposing my credentials in browser network traffic.
- As a job seeker, I want my tailored resume and job posting records saved permanently in PostgreSQL when streaming finishes so that I can inspect my tailored history later.
- As a job seeker, I want clear guidance if I have not set up an AI provider key yet, with a direct link to settings so that I am never left wondering why generation is blocked.

**Acceptance criteria** (the contract, each independently checkable):

- **AC-1**: Credentials authentication in Auth.js v5 verifies user email and bcrypt password hashes, enabling local accounts and a seeded demo user (`demo@careercraft.ai`) to sign in and access authenticated studio routes.
- **AC-2**: A unified tailoring studio page at `/[lang]/tailor` renders an experience panel, a job description panel, an inline provider switcher, and a live streaming preview panel in both English and Arabic layouts.
- **AC-3**: Candidate profile actions allow users to fetch their default profile, update their headline and work experience bullets, or load realistic bilingual Senior Full Stack Engineer sample data with a single button click.
- **AC-4**: A streaming route handler at `POST /api/tailor` requires an authenticated session, validates the payload with Zod (valid `profileId` and `rawJobDescription` with at least 50 characters), and returns 401 for unauthenticated calls or 400 for invalid inputs.
- **AC-5**: The tailoring route loads the active `UserProviderSetting` for the session user, decrypts the API key in server memory via `src/lib/crypto.ts`, instantiates the corresponding Vercel AI SDK provider, and streams response tokens using standard text stream response.
- **AC-6**: The system prompt instructs the AI to generate tailored content strictly grounded in the candidate's provided experience without hallucinating unearned skills, formatting the stream with structured delimiters (`### SUMMARY` and `### BULLETS`) for live UI parsing.
- **AC-7**: On stream completion (`onFinish`), the server creates a `JobPosting` entity and transitions the `TailoredResume` record from `GENERATING` to `COMPLETED`, storing the structured JSON snapshot containing the tailored summary and experience bullets.
- **AC-8**: If the client aborts generation or an upstream provider error occurs, the server stops inference immediately, marks the `TailoredResume` status as `FAILED`, and the UI presents an actionable error alert with a retry action.
- **AC-9**: If a user visits the studio without an active configured provider, the tailor action is disabled and a warning banner provides a direct link to `/[lang]/settings/providers`.
- **AC-10**: The entire studio interface, streaming text render, and error states render seamlessly in left to right English and right to left Arabic using existing `DirectionProvider` and logical styling.

## Decision

**Chosen option**: Option 1: Unified studio route handler with Vercel AI SDK text streaming and post stream JSON persistence.

We will build the core tailoring thread as a unified bilingual studio page that pairs an editable profile and job posting form with a real time streaming preview, backed by a Next.js App Router route handler that decrypts active provider credentials in server memory, streams response tokens via Vercel AI SDK text stream, and automatically finalizes structured snapshots in PostgreSQL upon stream completion.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

```prisma
// Updates to prisma/schema.prisma

enum ResumeGenerationStatus {
  GENERATING
  COMPLETED
  FAILED
}

model User {
  // Existing fields preserved
  passwordHash String? @map("password_hash") @db.Text
  // Existing relations preserved
}

model TailoredResume {
  // Existing fields preserved
  status ResumeGenerationStatus @default(GENERATING) @map("status")
  // Existing relations preserved
}
```

The `tailoredContent` JSON field in `TailoredResume` stores the validated snapshot shape:

```typescript
export interface TailoredExperienceBullet {
  original?: string
  tailored: string
  skills?: string[]
}

export interface TailoredExperienceItem {
  companyName: string
  jobTitle: string
  bullets: TailoredExperienceBullet[]
}

export interface TailoredResumeContentSnapshot {
  tailoredSummary: string
  matchScore?: number
  experiences: TailoredExperienceItem[]
}
```

**State transitions**:

```
TailoredResume Record Lifecycle:
[User Submits Form] -> GENERATING (record created with draft status)
                             |
         +-------------------+-------------------+
         |                                       |
  [Stream Finishes]                      [Abort / Provider Error]
         |                                       |
         v                                       v
     COMPLETED                                FAILED
(snapshot saved in JSON)              (partial text, retry enabled)
```

**API surface**:

| Endpoint / Action                      | Method        | Key inputs                                                                                                            | Key outputs                                          | Auth             | Key errors                                                                                   |
| -------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `/api/tailor`                          | POST          | `profileId: string`, `jobTitle: string`, `companyName: string`, `rawJobDescription: string`, `language: 'EN' \| 'AR'` | Text stream (`text/plain; charset=utf-8`)            | Session required | 401 Unauthorized, 400 Validation failure, 400 Missing active provider, 502 Upstream AI error |
| `getCandidateProfile(language)`        | Server Action | `language: Language`                                                                                                  | `Profile & { workExperiences: WorkExperience[] }`    | Session required | 401 Unauthorized, 404 Profile not found                                                      |
| `saveCandidateProfile(data)`           | Server Action | `headline: string`, `summary: string`, `experiences: Array<{ companyName, jobTitle, bullets }>`                       | `{ success: true, profileId: string }`               | Session required | 401 Unauthorized, 400 Validation failure                                                     |
| `loadSampleCandidateProfile(language)` | Server Action | `language: Language`                                                                                                  | `ProfileData` (realistic Senior Full Stack Engineer) | Session required | 401 Unauthorized                                                                             |
| `signInCredentials(email, password)`   | Server Action | `email: string`, `password: string`                                                                                   | `{ success: boolean, error?: string }`               | Public           | 401 Invalid credentials, 400 Missing fields                                                  |

**Value sourcing**:

| Action                        | Value produced / displayed                | Source                                                                                             |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `signInCredentials`           | Session token and authenticated user      | Input email and password checked against `User.passwordHash` via bcrypt                            |
| `getCandidateProfile`         | Default candidate profile and experiences | `Profile` and `WorkExperience` rows matching `(userId, language, isDefault)`                       |
| `loadSampleCandidateProfile`  | Realistic candidate experience            | Predefined bilingual Senior Full Stack Engineer fixtures in `src/lib/fixtures/sample-candidate.ts` |
| `POST /api/tailor`            | Active AI provider key and model          | Decrypted from `UserProviderSetting` row where `(userId, isActive = true)` via `src/lib/crypto.ts` |
| `POST /api/tailor`            | Candidate background context              | `Profile` and `WorkExperience` fetched by input `profileId` verified for `userId`                  |
| `POST /api/tailor`            | Streamed tokens                           | Real time output from Vercel AI SDK `streamText` pipe                                              |
| `POST /api/tailor` (onFinish) | Saved `JobPosting` record                 | Created from input `jobTitle`, `companyName`, and `rawJobDescription`                              |
| `POST /api/tailor` (onFinish) | Saved `TailoredResume` snapshot           | Parsed from accumulated markdown stream (`### SUMMARY` and `### BULLETS`) into structured JSON     |
| Studio Warning Banner         | Missing provider alert                    | Derived from `getProviderConfigurations` checking if any provider has `isActive = true`            |

**Key invariants**:

- Every query and mutation is strictly scoped by `userId: session.user.id`. Accessing another user's profile or resume returns an immediate 404 or 401.
- Decrypted AI provider API keys exist only in server memory during the lifetime of the route handler request; they are never passed to the client, logged, or stored unencrypted.
- A tailoring request requires an active provider setting; requests dispatched without an active provider fail with a structured 400 error before invoking inference.
- Job descriptions must meet a minimum length threshold of 50 characters to ensure the model has meaningful context to tailor against.
- The system prompt strictly prohibits fabricating unearned skills, experiences, or certifications, grounding all bullet points in the candidate's original history.
- The `TailoredResume` record transitions from `GENERATING` to either `COMPLETED` or `FAILED`; it never remains in an ambiguous state on stream closure.

**Security model**:

- Session authentication enforced on all tailoring endpoints and profile actions using Auth.js v5 `auth()`.
- Symmetric decryption of provider API keys (AES 256 GCM) using server side master key `ENCRYPTION_KEY`.
- User passwords hashed with bcrypt using 10 salt rounds; plain text passwords never persisted or logged.
- Input sanitization and validation on all strings using Zod schemas before database insertion or AI prompt interpolation.

**Configuration required**:

- Existing environment variables re-used: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`.
- No new external third party credentials required; users supply their own provider keys via the BYOK settings page.

**Critical test scenarios**:

- Happy path: Authenticated user with active provider submits candidate experience and job description, receives streaming tokens with section markers, and database records transition to `COMPLETED`, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-10**.
- Failure case (Abort): User aborts active stream or closes connection, server catches signal, halts AI inference, and marks record as `FAILED`, verifies **AC-8**.
- Failure case (Upstream error): Invalid provider key or rate limit triggers structured error payload, sets status to `FAILED`, and shows retry alert, verifies **AC-8**.
- Guard case (Missing provider): User without configured provider visits studio, sees warning alert, and tailor trigger is disabled, verifies **AC-9**.
- Auth scoping: Attempting to invoke tailoring with another user's `profileId` returns 404 without invoking AI models, verifies **AC-4**.

## Build plan

Ordered build tasks derived through the Tracer Bullet delivery approach (standing up an end to end vertical thread across auth, database, streaming, and UI first, then refining):

- [x] Task 1: Credentials authentication and demo user seed (satisfies **AC-1**)
  - [x] Add `passwordHash` field to `User` model in `prisma/schema.prisma` and create database migration
  - [x] Configure Credentials provider in `src/auth.ts` with bcrypt password verification and session token enrichment
  - [x] Update `prisma/seed.ts` to insert demo user `demo@careercraft.ai` with hashed password
  - [x] Colocate unit test suite in `src/auth.test.ts` verifying valid credentials, invalid passwords, and missing user handling

- [x] Task 2: Candidate profile management and sample data actions (satisfies **AC-3**, **AC-10**)
  - [x] Define Zod validation schemas in `src/lib/validations/tailor.ts` for candidate profiles and job posting inputs
  - [x] Create bilingual Senior Full Stack Engineer sample candidate fixtures in `src/lib/fixtures/sample-candidate.ts`
  - [x] Implement Server Actions in `src/app/actions/tailor.ts` for fetching profile, saving background, and loading sample data
  - [x] Colocate unit test suite in `src/app/actions/tailor.test.ts` verifying profile persistence and sample loading

- [x] Task 3: Tailoring prompt engine and AI streaming route handler (satisfies **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**)
  - [x] Add `ResumeGenerationStatus` enum and `status` column to `TailoredResume` in `prisma/schema.prisma`
  - [x] Build prompt generator in `src/lib/ai/tailor-prompt.ts` with anti hallucination rules and section delimiters
  - [x] Implement streaming route handler `src/app/api/tailor/route.ts` with active provider decryption, Vercel AI SDK text stream, `onFinish` database snapshot creation, and abort handling
  - [x] Colocate integration tests in `src/app/api/tailor/route.test.ts` verifying authentication guards, payload validation, stream responses, and error handling

- [x] Task 4: Bilingual studio page and live streaming components (satisfies **AC-2**, **AC-9**, **AC-10**)
  - [x] Build client components: `ExperienceForm`, `JobPostingForm`, `LiveTailorStream`, and `StudioContainer` in `src/components/tailor/`
  - [x] Integrate `ProviderSwitcher` and missing provider warning banner linking to `/[lang]/settings/providers`
  - [x] Create page view at `src/app/[lang]/tailor/page.tsx` with responsive side by side studio layout
  - [x] Add bilingual dictionary keys to `src/dictionaries/en.json` and `src/dictionaries/ar.json`
  - [x] Colocate component test suite in `src/app/[lang]/tailor/page.test.tsx` verifying English and Arabic rendering and interactions

- [x] Task 5: End to end verification and test suite (satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**)
  - [x] Verify full vertical slice from credentials login to live stream to saved database snapshot
  - [x] Ensure complete test pass across unit and component test suites with `npm run test`

## Consequences

**Positive**:

- Proves the entire product loop early with real user authentication, database entities, active provider decryption, and live AI streaming.
- Eliminates external OAuth service dependencies for local development and review testing by including a built in credentials provider.
- Provides immediate value to job seekers by generating tailored summaries and bullet points before the more complex PDF parser (Slice 2) is tackled.
- Keeps provider keys strictly secure on the server side while supporting all five configured providers (OpenAI, Anthropic, Gemini, Groq, Ollama).

**Negative**:

- Requires an initial migration to add `passwordHash` to `User` and `status` to `TailoredResume`.
- Streaming text parsing requires standardized markdown delimiters (`### SUMMARY` and `### BULLETS`) which necessitates defensive fallback parsing if the model produces non conforming headings.

**Neutral**:

- Resume parsing from uploaded documents remains deferred to Slice 2; users enter or load candidate experience via form controls for this slice.
- PDF export remains deferred to Slice 3; users review tailored output in the studio screen.

## Follow-up

- [x] Enroll Slice 1 build tasks in `docs/scope/scope.md` and begin implementation via `/develop`
- [ ] Proceed to Slice 2 (Resume parsing and ingestion) once this core tailoring thread is built and verified
