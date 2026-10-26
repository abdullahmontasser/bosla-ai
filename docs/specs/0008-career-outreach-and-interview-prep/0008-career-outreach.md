# 0008. Career outreach (Child spec)

## Summary

This child specification defines the cold career outreach generator for CareerCraft AI. The engine generates three targeted message variants for hiring contacts (a short LinkedIn connection note strictly under 300 characters, a comprehensive LinkedIn InMail pitch, and a formal cold email with subject line). All variants are generated through Server Actions using the Vercel AI SDK generateObject function, validated with Zod, and persisted to TailoredResume.outreachMessage. The user interface provides interactive editing, a live character counter with warning thresholds, and one click copy to clipboard in English and Arabic.

## Requirements

**User stories**:

- As a job seeker, I want to generate targeted outreach messages for a target job posting so that I can initiate contact with hiring managers and recruiters.
- As an applicant, I want a concise LinkedIn connection note capped strictly under 300 characters so that I can send personal connection invitations on LinkedIn without truncation.
- As an applicant, I want tone controls (Professional, Confident, Conversational) and recipient targeting (Recruiter, Hiring Manager, Peer, or Alumni) so that my messaging matches the recipient context.
- As a bilingual candidate, I want outreach copy in English or Arabic with seamless right to left layout support matching my tailored resume.
- As a user in the studio, I want to edit generated messages in place, save adjustments automatically, and copy snippets with one click.

**Acceptance criteria**:

- **AC-CO-1**: Outreach generation creates three distinct message variants: a LinkedIn connection request note strictly under 300 characters, a LinkedIn InMail pitch with subject and body, and a formal cold email with subject and body.
- **AC-CO-2**: Outreach generation supports candidate tone selection (Professional, Confident, Conversational) and recipient targeting (Recruiter, Hiring Manager, Peer, or Alumni), matching the target tailored resume language (English or Arabic) with full bidirectional layout support.
- **AC-CO-3**: Studio user interface adds an Outreach Messages tab inside the Tailor Studio with interactive message cards, in place text editing with a 1000 millisecond autosave debounce, a live character counter for LinkedIn connection notes (displaying `X / 300` with warning states when exceeding 300 characters), and one click copy to clipboard.
- **AC-CO-4**: Server Actions `generateOutreachAction`, `saveOutreachAction`, and `regenerateOutreachVariantAction` in `src/app/actions/outreach-actions.ts` execute generation and updates, persisting validated JSON payloads to `TailoredResume.outreachMessage` and merging single variant regenerations atomically.
- **AC-CO-5**: Strict session validation via `auth()` verifies resume ownership, decrypts BYOK provider keys ephemerally via `src/lib/crypto.ts` with zero logging, and enforces server side word boundary trimming if the AI output initially exceeds 300 characters.

## Decision

**Chosen option**: Focused Server Actions with Vercel AI SDK generateObject, atomic JSON persistence, and integrated studio tab with live character counter.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Decoupling outreach into a dedicated child spec keeps LinkedIn and email messaging rules separate from interview cheat sheet logic. Server Actions using generateObject ensure that the three variants are validated as a coherent typed object before saving to PostgreSQL, avoiding messy streaming states or partially completed drafts.

## Feature design

**Data model sketch**:

```typescript
export interface OutreachMessagePayload {
  version: 1
  generatedAt: string // ISO 8601
  updatedAt: string // ISO 8601
  language: 'EN' | 'AR'
  tone: 'PROFESSIONAL' | 'CONFIDENT' | 'CONVERSATIONAL'
  recipientType: 'RECRUITER' | 'HIRING_MANAGER' | 'PEER' | 'ALUMNI'
  connectionNote: {
    text: string
    charCount: number // must be <= 300
  }
  inMail: {
    subject: string
    body: string
  }
  email: {
    subject: string
    body: string
  }
}
```

**API surface**:

| Action                            | Invocation                                            | Key inputs                                                                                | Key outputs                                       | Auth                                | Key errors                                                                   |
| --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `generateOutreachAction`          | Server Action (`src/app/actions/outreach-actions.ts`) | `tailoredResumeId: string`, `options: { tone, recipientType, language? }`                 | `{ success: true, data: OutreachMessagePayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 422 Invalid Input, 502 AI Provider Error    |
| `saveOutreachAction`              | Server Action (`src/app/actions/outreach-actions.ts`) | `tailoredResumeId: string`, `payload: OutreachMessagePayload`                             | `{ success: true, data: OutreachMessagePayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 422 Validation Error (e.g. charCount > 300) |
| `regenerateOutreachVariantAction` | Server Action (`src/app/actions/outreach-actions.ts`) | `tailoredResumeId: string`, `variant: 'connectionNote' \| 'inMail' \| 'email'`, `options` | `{ success: true, data: OutreachMessagePayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 502 AI Provider Error                       |

**Value sourcing**:

| Action / Read Path                | Value produced / displayed            | Source                                                                                                               |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `StudioContainer` initial load    | `outreachMessage`                     | Read from database query on `TailoredResume` via `getTailorStudioInitialData`                                        |
| `generateOutreachAction`          | `candidateName`                       | `Profile.fullName` from database record                                                                              |
| `generateOutreachAction`          | `roleTitle`                           | `JobPosting.title` from database record                                                                              |
| `generateOutreachAction`          | `companyName`                         | `JobPosting.companyName` from database record                                                                        |
| `generateOutreachAction`          | `jobContext`                          | `JobPosting.rawDescription` and `JobPosting.parsedSkills`                                                            |
| `generateOutreachAction`          | `keyAchievements`                     | `Profile.workExperiences.bullets` and `Profile.projects`                                                             |
| `generateOutreachAction`          | `connectionNote` text                 | Generated by AI SDK with prompt cap of 280 chars; if output exceeds 300 chars, server trims cleanly at word boundary |
| `generateOutreachAction`          | `connectionNote.charCount`            | Computed server side via string length (`connectionNote.text.length`)                                                |
| `generateOutreachAction`          | `inMail` and `email`                  | Generated by AI SDK matching tone and recipient type                                                                 |
| `generateOutreachAction`          | `version`, `generatedAt`, `updatedAt` | Literal `1`, stamped with `new Date().toISOString()`                                                                 |
| `saveOutreachAction`              | Updated `outreachMessage` in database | Zod validated payload from client, recomputed `charCount`, updated `new Date().toISOString()`                        |
| `regenerateOutreachVariantAction` | Merged `outreachMessage`              | Read existing record from database, regenerate chosen variant via AI, recompute `charCount`, update `updatedAt`      |
| All generation actions            | Decrypted API key                     | `UserProviderSetting.encryptedKey` via `decryptApiKey` from `src/lib/crypto.ts`                                      |
| All generation actions            | Output language                       | Target `TailoredResume.language` (`EN` or `AR`)                                                                      |

**Key invariants**:

- Connection request notes must never exceed 300 characters when saved or displayed.
- If AI generation exceeds 300 characters, the server action automatically trims at the last complete word boundary before 300 characters.
- Live client editing enforces a 1000 millisecond debounce and displays a red warning state when character count exceeds 300.
- Pending autosave debounces are flushed before initiating any single variant regeneration.

**Critical test scenarios**:

- Happy path: Generating outreach messages produces valid connection note, InMail, and email matching selected tone and recipient type, verifies **AC-CO-1**, **AC-CO-2**, **AC-CO-4**.
- Length limit test: LinkedIn connection note prompt cap and server word boundary trimmer ensure character length never exceeds 300, verifies **AC-CO-1**, **AC-CO-5**.
- Single variant regeneration: Regenerating only the InMail variant updates the InMail text while keeping existing connection note and email edits intact, verifies **AC-CO-4**.
- In place editing and autosave: Modifying text triggers debounced save and updates `updatedAt` timestamp, verifies **AC-CO-3**, **AC-CO-4**.
- Authorization and isolation: Unauthenticated requests or attempts to access another user's resume are rejected with 401 or 404, verifies **AC-CO-5**.

## Build plan

- [x] 1. Define Zod validation schemas and TypeScript interfaces for outreach messages in `src/lib/validations/career-prep.ts`, satisfies **AC-CO-1**, **AC-CO-2**.
- [x] 2. Implement AI prompt templates for LinkedIn notes, InMail pitches, and cold emails in `src/lib/ai/prompts/outreach.ts`, satisfies **AC-CO-1**, **AC-CO-2**.
- [x] 3. Create Server Actions for outreach generation, saving, and single variant regeneration in `src/app/actions/outreach-actions.ts`, satisfies **AC-CO-1**, **AC-CO-4**, **AC-CO-5**.
- [x] 4. Build interactive outreach studio components (`OutreachCard`, `ConnectionNoteEditor`, `InMailCard`, `EmailCard`) with character counters and copy feedback in `src/components/outreach/`, satisfies **AC-CO-3**.
- [x] 5. Write Vitest unit and integration test suites for outreach actions and UI components, satisfies **AC-CO-1**, **AC-CO-2**, **AC-CO-3**, **AC-CO-4**, **AC-CO-5**.
