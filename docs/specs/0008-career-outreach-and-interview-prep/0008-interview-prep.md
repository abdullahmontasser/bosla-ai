# 0008. Interview prep (Child spec)

## Summary

This child specification defines the interview preparation engine for CareerCraft AI. The engine generates an interview preparation cheat sheet containing exactly three categorized questions (one Behavioral, one Technical, one Situational) with structured STAR responses (Situation, Task, Action, Result) grounded strictly in authentic candidate profile data. It also generates exactly three strategic questions to ask the interviewer. All generation runs through Server Actions using the Vercel AI SDK generateObject function, validated with Zod, and persisted to TailoredResume.interviewPrep. The studio interface provides in place editing, one click clipboard copy, and print stylesheet rules for clean PDF printing.

## Requirements

**User stories**:

- As a job candidate, I want an interview preparation cheat sheet tailored to a target job description so that I can prepare for recruiter interviews.
- As an interview applicant, I want suggested answers structured in the STAR framework (Situation, Task, Action, Result) drawn strictly from my authentic projects and work history so that I never speak to fabricated accomplishments.
- As an applicant with missing project metrics, I want localized bracketed placeholders rather than invented numbers so that I know exactly which real data points to supply.
- As an interview candidate, I want strategic questions to ask the interviewer so that I demonstrate deep role understanding.
- As a bilingual applicant, I want all interview questions and answers available in Arabic or English matching my tailored resume with right to left layout fidelity.
- As a candidate in the studio, I want to edit questions and answers in place, save adjustments automatically, and print the cheat sheet cleanly.

**Acceptance criteria**:

- **AC-IP-1**: Interview preparation generator produces exactly 3 categorized interview questions (1 Behavioral, 1 Technical, 1 Situational), question intent analysis ("why asked"), model STAR responses grounded strictly in the candidate's authentic projects and work history, and a curated list of exactly 3 strategic questions to ask the interviewer.
- **AC-IP-2**: Zero hallucination constraint strictly prohibits the AI from inventing unearned metrics, past employers, or accomplishments; when candidate profile items lack quantifiable numbers, the engine inserts localized bracketed placeholders (such as `[insert latency reduction %]` in English or `[أدخل نسبة تحسين الأداء]` in Arabic wrapped in `<bdi>` isolation tags) highlighting where the candidate can supply authentic data.
- **AC-IP-3**: Studio user interface adds an Interview Prep tab inside the Tailor Studio with interactive question cards, in place text editing with a 1000 millisecond autosave debounce, one click clipboard copy for each STAR answer, and print stylesheet rules (`@media print`) for clean cheat sheet PDF printing.
- **AC-IP-4**: Server Actions `generateInterviewPrepAction`, `saveInterviewPrepAction`, and `regenerateInterviewQuestionAction` in `src/app/actions/interview-prep-actions.ts` execute generation and updates, persisting validated JSON payloads to `TailoredResume.interviewPrep` and replacing single questions atomically.
- **AC-IP-5**: Strict session validation via `auth()` verifies resume ownership, decrypts BYOK provider keys ephemerally via `src/lib/crypto.ts` with zero logging, and displays an instructional guidance banner when the candidate profile contains zero recorded projects or experiences.

## Decision

**Chosen option**: Focused Server Actions with Vercel AI SDK generateObject, bounded question counts, atomic JSON persistence, and printable studio cards.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Decoupling interview preparation into a dedicated child spec isolates question generation, STAR framing, and anti hallucination logic from outreach messaging. Bounding the question set to exactly three categorized questions and three interviewer questions prevents server action timeouts on serverless runtimes, limits BYOK token consumption, and yields a focused cheat sheet candidates can review quickly before an interview.

## Feature design

**Data model sketch**:

```typescript
export interface InterviewPrepPayload {
  version: 1
  generatedAt: string // ISO 8601
  updatedAt: string // ISO 8601
  language: 'EN' | 'AR'
  roleTitle: string
  companyName: string
  questions: Array<{
    id: string // generated via crypto.randomUUID()
    category: 'BEHAVIORAL' | 'TECHNICAL' | 'SITUATIONAL'
    question: string
    whyAsked: string
    starResponse: {
      situation: string
      task: string
      action: string
      result: string
    }
    referencedSources: string[] // project names or employer names from work experiences
    missingMetricFlags: string[] // localized bracketed tags reminding candidate to provide metrics
  }>
  questionsToAskInterviewer: Array<{
    id: string // generated via crypto.randomUUID()
    question: string
    strategicGoal: string
  }>
}
```

**API surface**:

| Action                              | Invocation                                                  | Key inputs                                                  | Key outputs                                     | Auth                                | Key errors                                                                |
| ----------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `generateInterviewPrepAction`       | Server Action (`src/app/actions/interview-prep-actions.ts`) | `tailoredResumeId: string`, `options: { language? }`        | `{ success: true, data: InterviewPrepPayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 422 Invalid Input, 502 AI Provider Error |
| `saveInterviewPrepAction`           | Server Action (`src/app/actions/interview-prep-actions.ts`) | `tailoredResumeId: string`, `payload: InterviewPrepPayload` | `{ success: true, data: InterviewPrepPayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 422 Validation Error                     |
| `regenerateInterviewQuestionAction` | Server Action (`src/app/actions/interview-prep-actions.ts`) | `tailoredResumeId: string`, `questionId: string`            | `{ success: true, data: InterviewPrepPayload }` | Authenticated session, resume owner | 401 Unauthorized, 404 Not Found, 502 AI Provider Error                    |

**Value sourcing**:

| Action / Read Path                  | Value produced / displayed            | Source                                                                                                       |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `StudioContainer` initial load      | `interviewPrep`                       | Read from database query on `TailoredResume` via `getTailorStudioInitialData`                                |
| `generateInterviewPrepAction`       | `roleTitle` and `companyName`         | `JobPosting.title` and `JobPosting.companyName` from database record                                         |
| `generateInterviewPrepAction`       | Exactly 3 categorized `questions`     | Generated by AI SDK (1 Behavioral, 1 Technical, 1 Situational) with `id` via `crypto.randomUUID()`           |
| `generateInterviewPrepAction`       | `starResponse`                        | Grounded strictly in `Profile.projects` and `Profile.workExperiences`                                        |
| `generateInterviewPrepAction`       | `referencedSources`                   | Project names from `Profile.projects` or employer names from `Profile.workExperiences`                       |
| `generateInterviewPrepAction`       | `missingMetricFlags`                  | Localized bracketed placeholders generated by AI when achievements lack numbers                              |
| `generateInterviewPrepAction`       | Exactly 3 `questionsToAskInterviewer` | Generated by AI SDK with `id` via `crypto.randomUUID()`                                                      |
| `generateInterviewPrepAction`       | `version`, `generatedAt`, `updatedAt` | Literal `1`, stamped with `new Date().toISOString()`                                                         |
| `saveInterviewPrepAction`           | Updated `interviewPrep` in database   | Zod validated payload from client with server updated `updatedAt: new Date().toISOString()`                  |
| `regenerateInterviewQuestionAction` | Merged `interviewPrep`                | Read existing record, regenerate single question matching `questionId`, replace in array, update `updatedAt` |
| All generation actions              | Decrypted API key                     | `UserProviderSetting.encryptedKey` via `decryptApiKey` from `src/lib/crypto.ts`                              |
| All generation actions              | Output language                       | Target `TailoredResume.language` (`EN` or `AR`)                                                              |

**Key invariants**:

- The generator must produce exactly 3 categorized questions and exactly 3 interviewer questions to keep latency predictable and avoid server action timeouts.
- AI prompts must strictly forbid inventing unearned metrics or non existent projects; missing numbers trigger localized bracketed placeholders.
- In Arabic mode, bracketed placeholders are localized (such as `[أدخل نسبة تحسين الأداء]`) and wrapped with `<bdi>` isolation tags.
- The studio flushes pending autosaves before triggering single question regeneration to prevent race conditions.
- Print stylesheets format the cheat sheet cleanly across pages with page breaks avoided inside question cards (`break-inside-avoid`).

**Critical test scenarios**:

- Happy path: Generating interview prep creates exactly 3 categorized questions with authentic STAR answers and 3 interviewer questions, verifies **AC-IP-1**, **AC-IP-4**.
- Anti hallucination check: STAR answers for projects without numbers output localized bracketed placeholders without fabricated numbers, verifies **AC-IP-2**.
- Single question regeneration: Regenerating Question 2 replaces that question while preserving edits on Questions 1 and 3, verifies **AC-IP-4**.
- Print layout styling: Print stylesheet classes apply cleanly in print media preview, verifies **AC-IP-3**.
- Empty profile handling: Candidate with zero projects sees an instructional guidance banner without system crash, grounding STAR answers in work experience where available, verifies **AC-IP-5**.

## Build plan

- [x] 1. Define Zod validation schemas and TypeScript interfaces for interview prep in `src/lib/validations/career-prep.ts`, satisfies **AC-IP-1**, **AC-IP-2**.
- [x] 2. Implement AI prompt templates and anti hallucination instructions for STAR questions and interviewer inquiries in `src/lib/ai/prompts/interview-prep.ts`, satisfies **AC-IP-1**, **AC-IP-2**.
- [x] 3. Create Server Actions for interview prep generation, saving, and single question regeneration in `src/app/actions/interview-prep-actions.ts`, satisfies **AC-IP-1**, **AC-IP-4**, **AC-IP-5**.
- [x] 4. Build interactive interview prep studio components (`InterviewPrepWorkbench`, `StarQuestionCard`, `InterviewerQuestionsList`) with print styles in `src/components/interview-prep/`, satisfies **AC-IP-3**.
- [x] 5. Write Vitest unit and integration test suites for interview prep actions and UI components, satisfies **AC-IP-1**, **AC-IP-2**, **AC-IP-3**, **AC-IP-4**, **AC-IP-5**.
