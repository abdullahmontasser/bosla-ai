# 0007. ATS resume engine and PDF export

**Date**: 2026-10-25
**Status**: Accepted

## Summary

This specification defines the ATS resume engine and PDF export system for CareerCraft AI. The engine analyzes target job descriptions against candidate profiles to compute an overall ATS match score with keyword breakdowns, rewrites experience bullets using the Google XYZ formula without hallucinating unearned metrics, and renders clean single column searchable PDF documents in English or Arabic. The system runs PDF generation ephemerally in server memory using React PDF (@react-pdf/renderer) paired with Arabic text shaping and embedded fonts, streaming documents directly to user browsers without retaining file binaries on disk.

## Requirements

**User stories**:

- As a job seeker, I want to see an ATS match score comparing my resume to a target job description so that I can identify critical missing skills before applying.
- As a job seeker, I want my experience bullet points rewritten into the Google XYZ formula so that hiring managers and automated applicant tracking systems see quantifiable accomplishments.
- As a candidate, I want bullet point improvements to stay grounded in my authentic history so that the AI never invents fake metrics or unearned responsibilities.
- As a bilingual applicant, I want to download an ATS compliant PDF in English or Arabic so that my resume parses cleanly in automated tracking systems without layout corruption.
- As a privacy conscious user, I want my generated PDF documents to stream directly to my browser without being saved or exposed on public cloud storage.

**Acceptance criteria** (the contract, each independently checkable):

- **AC-1**: Quantitative ATS scoring engine computes an overall match score from 0 to 100 via a deterministic formula (50% keyword match, 30% experience relevance, 20% formatting compliance) with zero latency, paired with an on demand AI deep scan that provides qualitative recommendations and skill categorizations.
- **AC-2**: Experience bullet optimization rewrites candidate experience bullets into the Google XYZ formula ("Accomplished [X] by doing [Z], resulting in [impact]"), grounding achievements strictly in candidate records and highlighting qualitative business results when numerical metrics do not exist without inventing artificial numbers.
- **AC-3**: Interactive ATS workbench in the studio displays the overall match score badge, category subscores, matched skills, and actionable improvement feedback, with interactive missing skill badges that users can click to either add to their candidate profile or dismiss.
- **AC-4**: Server Action `calculateAtsScoreAction` in `src/app/actions/ats-engine.ts` executes scoring calculations, persists `atsScore` and structured `atsBreakdown` to `TailoredResume`, and supports single bullet rewriting (`rewriteBulletWithXyzAction`) and missing skill management (`addMissingSkillAction`, `dismissMissingSkillAction`).
- **AC-5**: Route handler `GET /api/resumes/[id]/pdf` streams an ATS compliant PDF binary (`application/pdf`) with RFC 5987 UTF-8 encoded `Content-Disposition` attachment headers (`filename="Resume.pdf"; filename*=UTF-8''...`), rendering ephemerally in server memory without saving files to disk, and records `lastExportedAt` timestamp.
- **AC-6**: Bilingual PDF generation renders clean single column ATS compliant layouts with standard headings, selectable vector text, and 0.5 inch margins, embedding IBM Plex Sans Arabic with cursive shaping and bidi reordering that preserves logical Unicode character streams for ATS parsers alongside Geist Sans for English resumes.
- **AC-7**: Clean pagination logic in the PDF template applies wrapping boundaries at the individual job entry and bullet level (`wrap={false}`), preventing orphan section headers and awkwardly split paragraphs across multi page documents.
- **AC-8**: Graceful error handling falls back to deterministic keyword matching if the AI provider times out or fails, and strict session authorization ensures all scoring actions and PDF downloads require an active user session scoped to the resume owner.

## Decision

**Chosen option**: Option 1: Hybrid ATS scoring engine with zero hallucination Google XYZ bullet rewriting and server side React PDF export with Arabic bidi text shaping.

We will build the ATS engine as a hybrid analyzer combining deterministic keyword extraction with structured AI evaluation, pair it with Google XYZ bullet rewriting that respects authentic candidate experience, and deliver selectable vector PDFs through `@react-pdf/renderer` using server embedded fonts and Arabic cursive reshaping.

**Implementation skills**: `react-pdf-kit-nextjs-app-router` (`react-pdf-kit/agent-skills`, `.agents/skills/react-pdf-kit-nextjs-app-router/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

The implementation enriches the existing `TailoredResume` entity in `prisma/schema.prisma` without introducing unneeded auxiliary tables, removing the obsolete `pdfExportPath` column:

```prisma
// Modifications to TailoredResume in prisma/schema.prisma
model TailoredResume {
  id              String                 @id @default(cuid())
  userId          String                 @map("user_id")
  profileId       String                 @map("profile_id")
  jobPostingId    String                 @map("job_posting_id")
  status          ResumeGenerationStatus @default(GENERATING) @map("status")
  language        Language               @default(EN)
  title           String                 @db.VarChar(255)
  atsScore        Float?                 @map("ats_score")
  missingSkills   String[]               @map("missing_skills")
  atsBreakdown    Json?                  @map("ats_breakdown")
  tailoredSummary String?                @map("tailored_summary") @db.Text
  tailoredContent Json                   @map("tailored_content")
  outreachMessage Json?                  @map("outreach_message")
  interviewPrep   Json?                  @map("interview_prep")
  lastExportedAt  DateTime?              @map("last_exported_at")
  createdAt       DateTime               @default(now()) @map("created_at")
  updatedAt       DateTime               @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  profile      Profile       @relation(fields: [profileId], references: [id], onDelete: Cascade)
  jobPosting   JobPosting    @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  applications Application[]

  @@index([userId, jobPostingId])
  @@index([profileId])
  @@index([missingSkills], type: Gin)
  @@map("tailored_resumes")
}
```

The `atsBreakdown` JSON adheres to this typed structure:

```ts
export interface AtsBreakdown {
  overallScore: number
  categorySubscores: {
    keywordMatch: number // 50% weight: exact & stemmed skill token overlap
    experienceRelevance: number // 30% weight: skill density in experience bullets
    formattingCompliance: number // 20% weight: presence of summary, contact info, standard headings
  }
  matchedSkills: string[]
  missingSkills: string[]
  dismissedSkills: string[]
  actionableFeedback: string[]
  isStale: boolean
  evaluatedAt: string
}
```

The `tailoredContent` JSON stores a self contained snapshot so the PDF exporter never joins against mutable or deleted profile data:

```ts
export interface TailoredResumeContentSnapshot {
  targetRole: string
  tailoredSummary: string
  candidateHeader: {
    fullName: string
    email: string
    phone?: string
    location?: string
    linkedinUrl?: string
    githubUrl?: string
    websiteUrl?: string
  }
  tailoredExperiences: Array<{
    companyName: string
    jobTitle: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    bullets: Array<{
      original?: string
      rewritten: string
      matchedKeywords: string[]
    }>
  }>
  educations: Array<{
    institution: string
    degree: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
  }>
  skills: Array<{
    name: string
    category?: string
  }>
}
```

**State transitions**:

Tailored resume records manage scoring and export state transitions:

- Status begins as `GENERATING` during initial stream, advancing to `COMPLETED` on stream finish.
- Initial deterministic score calculation runs immediately on stream finish, creating `atsBreakdown` with `isStale: false`.
- When users edit tailored bullets in the studio workbench, `atsBreakdown.isStale` becomes `true`, prompting the user to recalculate.
- When users click an interactive missing skill to add it, `addMissingSkillAction` inserts the skill into `Profile.skills`, appends to `tailoredContent.skills`, and recalculates `atsBreakdown` without requiring an AI round trip.
- When users click dismiss on a missing skill, `dismissMissingSkillAction` moves the skill to `dismissedSkills` in `atsBreakdown`.
- When users trigger PDF export, `lastExportedAt` is stamped with the current timestamp.

**API surface**:

| Surface                      | Method        | Key inputs                                                        | Key outputs                                                       | Auth             | Key errors                                             |
| ---------------------------- | ------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------- | ------------------------------------------------------ |
| `calculateAtsScoreAction`    | Server Action | `tailoredResumeId: string, runAiDeepScan?: boolean`               | `{ success: boolean, atsScore: number, breakdown: AtsBreakdown }` | Session required | 401 Unauthorized, 404 Not Found, 429 Cooldown Active   |
| `rewriteBulletWithXyzAction` | Server Action | `tailoredResumeId: string, expIndex: number, bulletIndex: number` | `{ success: boolean, rewrittenBullet: string }`                   | Session required | 401 Unauthorized, 404 Not Found, 502 AI Provider Error |
| `addMissingSkillAction`      | Server Action | `tailoredResumeId: string, skillName: string`                     | `{ success: boolean, updatedSkills: string[], atsScore: number }` | Session required | 401 Unauthorized, 404 Not Found                        |
| `dismissMissingSkillAction`  | Server Action | `tailoredResumeId: string, skillName: string`                     | `{ success: boolean, dismissedSkills: string[] }`                 | Session required | 401 Unauthorized, 404 Not Found                        |
| `/api/resumes/[id]/pdf`      | GET           | URL param `id: string`, query param `lang?: en \| ar`             | `application/pdf` binary stream                                   | Session required | 401 Unauthorized, 404 Not Found, 500 Generation Failed |

**Value sourcing**:

| Action                       | Value produced / displayed            | Source                                                                                                                                |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `calculateAtsScoreAction`    | `keywordMatch` subscore (50%)         | Ratio of `JobPosting.parsedSkills` matched against candidate skills and experience text                                               |
| `calculateAtsScoreAction`    | `experienceRelevance` subscore (30%)  | Ratio of job requirements explicitly present in experience bullets (fallback) or semantic relevance score (AI scan)                   |
| `calculateAtsScoreAction`    | `formattingCompliance` subscore (20%) | Deterministic checklist: summary present (30%), contact info complete (30%), action verb bullets (40%)                                |
| `calculateAtsScoreAction`    | `overallScore` (0 to 100)             | Sum of weighted category subscores: (0.50 * keywordMatch) + (0.30 * experienceRelevance) + (0.20 * formattingCompliance)              |
| `calculateAtsScoreAction`    | `matchedSkills` list                  | Derived by matching `JobPosting.parsedSkills` against candidate profile skills and experience text                                    |
| `calculateAtsScoreAction`    | `missingSkills` list                  | Derived by subtracting matched candidate skills and dismissed skills from required job posting skills                                 |
| `rewriteBulletWithXyzAction` | `rewrittenBullet`                     | Generated by AI SDK prompt restructuring single bullet into Google XYZ format, falling back to qualitative impact if no numbers exist |
| `addMissingSkillAction`      | `updatedSkills`                       | Appended to `Profile.skills` in DB and `tailoredContent.skills` in snapshot                                                           |
| `/api/resumes/[id]/pdf`      | PDF candidate contact header          | Sourced directly from `TailoredResume.tailoredContent.candidateHeader` snapshot                                                       |
| `/api/resumes/[id]/pdf`      | PDF tailored summary                  | Sourced from `TailoredResume.tailoredSummary`                                                                                         |
| `/api/resumes/[id]/pdf`      | PDF experience and bullets            | Sourced from `TailoredResume.tailoredContent.tailoredExperiences` snapshot                                                            |
| `/api/resumes/[id]/pdf`      | PDF skills section                    | Sourced from `TailoredResume.tailoredContent.skills` snapshot                                                                         |
| `/api/resumes/[id]/pdf`      | PDF education section                 | Sourced from `TailoredResume.tailoredContent.educations` snapshot                                                                     |
| `/api/resumes/[id]/pdf`      | HTTP Content-Disposition header       | Sourced as `filename="Resume.pdf"; filename*=UTF-8''` + URL encoded candidate name and company title                                  |

**Key invariants**:

- Zero hallucination policy: the AI prompt and post generation validator must reject or remove any metrics or skills absent from authentic candidate records, defaulting to qualitative impact phrasing.
- Self contained resume snapshot: `TailoredResume.tailoredContent` contains all required dates, locations, credentials, and bullets so the PDF generator never performs outer joins against mutable profile tables.
- Standard ATS typography: PDF exports use standard fonts (Geist Sans for English, IBM Plex Sans Arabic for Arabic) embedded as vector glyphs, never raster images.
- Logical text stream preservation: Arabic PDF generation shapes cursive glyphs while preserving logical Unicode reading order in the underlying text layer so ATS parsers extract correct text without reversed words.
- Single column layout: PDF templates enforce a strict single column vertical flow with standard section headers, prohibiting multi column floating boxes that disrupt ATS parsing order.
- Ephemeral generation: PDF binaries are never persisted to disk or cloud buckets; they are synthesized in memory and piped straight to the HTTP response stream.
- User isolation: every action and export route strictly verifies that `session.user.id` equals `TailoredResume.userId`.

**Security model**:

- Session authentication required on all Server Actions and the PDF export route handler.
- Ownership verification guarantees users can only access or export resumes belonging to their own user ID.
- AI provider keys are decrypted strictly in server memory via symmetric AES-256-GCM, never transmitted to browser clients.
- PDF downloads set `Cache-Control: private, no-store, must-revalidate` to prevent intermediate proxy caching of sensitive career data.

**Configuration required**:

No new environment variables required. The feature reuses existing BYOK provider configurations (`UserProviderSetting`) and database connections.

**Critical test scenarios**:

- Happy path: User opens tailored resume, inspects deterministic 85 ATS score, runs AI deep scan for qualitative feedback, rewrites an experience bullet using Google XYZ format, and downloads an ATS compliant Arabic PDF, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
- Missing skills interaction: User clicks an interactive missing skill badge to add it, verifying immediate profile persistence, snapshot update, and instant score recalculation without AI latency, verifies **AC-3**, **AC-4**.
- Failure case (AI timeout): External AI provider times out during deep scan or bullet rewrite; system falls back cleanly to deterministic scores and preserves authentic bullet text, verifies **AC-8**.
- Arabic text extraction verification: Text copied or extracted by CLI parsers from the generated Arabic PDF maintains correct logical word order, verifies **AC-6**.
- Auth/permission: Unauthenticated visitor or a user attempting to download another candidate's PDF receives a 401 Unauthorized or 404 Not Found error, verifies **AC-8**.

## Build plan

The build plan follows the Tracer Bullet approach, standing up a thin vertical thread through scoring, bullet rewriting, and PDF export first, then polishing bilingual layouts and edge cases.

1. [x] Create Prisma migration for `atsBreakdown` and `lastExportedAt` columns on `TailoredResume` (removing obsolete `pdfExportPath`), update Zod schemas and DB repository helpers, satisfies **AC-1**, **AC-4**.
2. [x] Implement deterministic ATS scoring engine in `src/lib/ats/scoring.ts` with keyword tokenizer, subscore weighting, and formatting checks, satisfies **AC-1**, **AC-4**.
3. [x] Implement AI deep scan and Google XYZ single bullet rewriting prompt engine with zero hallucination constraints in `src/lib/ai/ats-prompt.ts`, satisfies **AC-1**, **AC-2**.
4. [x] Create Server Actions in `src/app/actions/ats-engine.ts` for scoring, single bullet rewriting, missing skill addition, and missing skill dismissal, satisfies **AC-3**, **AC-4**, **AC-8**.
5. [x] Build bilingual ATS PDF document components using `@react-pdf/renderer` with embedded Geist Sans and IBM Plex Sans Arabic fonts and Arabic bidi shaping with logical stream preservation, satisfies **AC-6**, **AC-7**.
6. [x] Build route handler `GET /api/resumes/[id]/pdf` with RFC 5987 header encoding for streaming vector PDF binaries with session verification, satisfies **AC-5**, **AC-8**.
7. [x] Create interactive ATS workbench components in `src/components/ats/` (ATS score card, subscore bars, missing skill badges, bullet rewrite triggers) and integrate them into the studio page at `/[lang]/tailor`, satisfies **AC-3**.
8. [x] Build comprehensive unit and integration test suite with Vitest verifying scoring formulas, XYZ bullet rewriting, PDF route streaming, and Arabic text shaping, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-6**, **AC-8**.

## Consequences

**Positive**:

- Job seekers receive instant, deterministic feedback on keyword match and formatting without incurring AI API token costs or latency on routine edits.
- AI deep scanning and Google XYZ bullet restructuring run on demand with zero hallucination enforcement, ensuring professional impact without deception.
- Candidates download professional, ATS searchable PDF documents in both English and Arabic that preserve logical character order for automated parsers.
- Self contained resume snapshots ensure PDF exports remain consistent and resilient over time even if candidate master profiles change.
- User privacy is preserved by keeping PDF generation strictly ephemeral in server memory.

**Negative / tradeoffs**:

- Server side PDF generation using `@react-pdf/renderer` requires font file embedding and runtime memory during document compilation.
- Arabic text shaping requires additional font metrics handling to ensure perfect glyph connectivity while maintaining logical stream extraction.
- Cooldown timers on AI deep scans prevent rapid successive recalculations, requiring users to wait briefly between deep analyses.

**Neutral**:

- `@react-pdf/renderer` and Arabic text shaping utilities (`arabic-persian-reshaper`, `bidi-js`) must be added to package dependencies.
- Next.js Webpack configuration must support bundling font assets and `@react-pdf/renderer` node runtime components.

## Follow-up

- [ ] Add `react-pdf-kit-nextjs-app-router` and `arabic-rtl-best-practices` skill conventions to `src/components/AGENTS.md` and root `AGENTS.md`.
- [ ] Monitor memory usage of server side PDF compilation under high concurrency in production environments.
