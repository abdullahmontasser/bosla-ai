# 0016. Dedicated career prep and STAR hub

**Date**: 2026-10-30
**Status**: Proposed

## Summary

The interview STAR practice lives today inside a tailor studio tab. This spec gives it a dedicated focus page at `/career-prep` where a job selector lists every tailored job, and the STAR questions, answers, and interviewer questions render in a calm single column. The page reuses the existing interview prep engine, and adds user authored custom questions, a full sheet copy, and a dedicated printable sheet route. The tailor studio's own Interview Prep tab shrinks to a single button that opens the hub, so editing lives in exactly one place. The stored shape of the prep payload moves to version 2 with a tolerant read of version 1, so no tables or columns change.

## Requirements

**User stories**:

- As a candidate preparing for an interview, I want one dedicated page where I can pick any past tailored job and see its STAR questions and answers in a focused view, so that I practice with zero navigation friction.
- As a candidate returning from the tailor studio, I want a deep link to land directly on the prep of that exact job, so that the practice context is one click away.
- As a candidate with an interview tomorrow, I want to copy the whole cheat sheet or single STAR parts and print a clean dressed sheet, so that I can rehearse away from the screen.
- As a candidate with questions the engine did not cover, I want to add my own questions in the STAR skeleton, so that my sheet covers the gap.
- As a first time visitor with no tailored jobs yet, I want a friendly empty state that points me to the tailor studio, so that I know what to do next.

**Acceptance criteria** (the contract):

- **AC-1**: A dedicated `/career-prep` page shows a job selector listing every `JobPosting` the user has at least one tailored resume for, newest first, one row per posting pointing at its newest tailored version, each row showing company, role title, and a prep status hint (generated or not). Opening the page directly defaults the selection to the newest job.
- **AC-2**: Selecting a job whose `TailoredResume.interviewPrep` payload does not yet exist shows an inline generate CTA wired to the existing `generateInterviewPrepAction`; on success the payload persists and the question cards render in place. A deep link arrival shows the same explicit CTA and waits for the click (no auto start). When the candidate profile has zero projects and zero work experiences, the reused instructional guidance banner (spec 0008, AC-IP-5) appears beside the CTA.
- **AC-3**: The hub supports full editing parity with the studio: in place editing of questions, STAR parts, why asked, and interviewer questions with debounced autosave through the existing `saveInterviewPrepAction`, plus single question regeneration through `regenerateInterviewQuestionAction`. The hub reuses the shared component set (`StarQuestionCard`, `InterviewerQuestionsList`, the normalizer and actions), so there is exactly one editing implementation.
- **AC-4**: A user can add custom questions: each gets a fresh `crypto.randomUUID`, `category: 'CUSTOM'`, `customOrigin: true`, an empty STAR skeleton (empty situation, task, action, result strings the user then fills), and an optional own why asked. At most 10 custom questions per payload. Custom questions are editable and deletable. AI generated questions stay editable and regenerable and are never deletable.
- **AC-5**: The stored `interviewPrep` payload schema is version 2 and reading tolerates version 1 payloads by normalizing inline (missing fields backfilled: `customOrigin` false, `version` treated as 2). Generation keeps the existing invariant: exactly 3 categorized questions (1 behavioral, 1 technical, 1 situational) and exactly 3 interviewer questions. An empty questions array is valid before the first generation (for example after adding a custom question first).
- **AC-6**: Copy actions: one click clipboard copy per STAR element (reuse of the existing per element copy) and a copy full sheet action producing a localized plain text sheet (all questions with their STAR parts, why asked, and the interviewer questions with strategic goals), assembled client side from the payload with labels in the payload language (`payload.language`) so the copied text never mixes RTL and LTR directions.
- **AC-7**: A dedicated print route `/[lang]/career-prep/print?tailoredResumeId=...` renders the dressed printable cheat sheet: a sheet header with company, role, and date, no page chrome, statements that keep question cards whole across page breaks (`break-inside: avoid`), and correct RTL layout and Arabic shaping when the content language is Arabic. The print route is auth walled like the hub.
- **AC-8**: Access and failure handling: the hub and the print route both sit behind the shared session guard and every read is user scoped. A `?tailoredResumeId` param that is unknown, deleted, or owned by another user degrades gracefully: a friendly notice that the linked job is gone, falling back to the default selection (newest job), no crash. A user with zero tailored jobs sees an empty state CTA linking to the tailor studio.
- **AC-9**: Language: generated prep content follows the target `TailoredResume.language` (same rule as the studio, generation is not rerun on locale switch); the hub chrome (labels, buttons, empty states) follows the page locale from the workspace bilingual dictionaries, with RTL and LTR layout correctness in both.
- **AC-10**: The job list caps initial load at the 50 newest postings with a load more step, keeping the first paint light on heavy accounts.
- **AC-11**: The shared workspace navigation gains a Career Prep link next to the apply board link, with bilingual labels and an active state on `/career-prep`.
- **AC-12**: The tailor studio's Interview Prep tab is replaced with a single handoff CTA that opens the hub for the current tailored job (`/career-prep?tailoredResumeId=<current>`), with no preview and no editing inside the studio; the tab acts as a signpost only, and the in studio editing surface is retired into the hub.

Every task in the build plan references the ACs it satisfies; the critical test scenarios map back to these IDs.

## Decision

**Chosen option**: Option 1: Reuse the interview prep engine, hub it over the existing payload, and extend the payload to version 2 for custom questions.

The dedicated hub is a new server prefetched page plus a client focus view over `TailoredResume.interviewPrep`. Generation, save, and regenerate stay the existing Server Actions, extended in two small ways: generation merges instead of overwriting (custom questions survive), and save rejects a stale `updatedAt` with 409. Custom questions are persisted inside the same payload (version 2), so custom content and AI content ship together in one cheat sheet. Deletion of custom questions applies client side and persists through the existing save action; no delete action is added. The print surface is a separate route that reads one owned payload and renders for paper. The tailor studio's Interview Prep tab becomes a single handoff CTA to the hub, so exactly one editing implementation survives.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

No new tables and no new columns. `TailoredResume.interviewPrep` (JSON) evolves to version 2:

```typescript
interface InterviewPrepPayloadV2 {
  version: 2
  generatedAt: string | null // ISO 8601, null until the first generation
  updatedAt: string // ISO 8601
  language: 'EN' | 'AR' // mirrors TailoredResume.language
  roleTitle: string // from JobPosting.title
  companyName: string // from JobPosting.companyName
  questions: Array<{
    id: string // crypto.randomUUID()
    category: 'BEHAVIORAL' | 'TECHNICAL' | 'SITUATIONAL' | 'CUSTOM'
    customOrigin: boolean // true for user authored questions
    question: string
    whyAsked: string // optional intent note; user may leave it empty on custom
    starResponse: {
      situation: string
      task: string
      action: string
      result: string // all four may be empty strings on a fresh custom question
    }
    referencedSources: string[] // grounded AI questions only, empty for custom
    missingMetricFlags: string[] // localized bracket tags, empty for custom
  }>
  questionsToAskInterviewer: Array<{
    id: string
    question: string
    strategicGoal: string
  }>
}
```

Version 2 with tolerant read (a normalizer called on every read path): a version 1 payload becomes a version 2 shape in memory with `customOrigin: false` on every question and `category` unchanged. New writes are always version 2. Two schema notes: the Zod schema relaxes its `min(1)` STAR and why asked rules conditionally, only when `customOrigin: true` (fresh custom questions legitimately start empty); and a draft payload created before the first generation sources `roleTitle`, `companyName`, and `language` from the tailored resume's `JobPosting` and `TailoredResume.language`. This is a data contract change only, so there is no database migration.

**State transitions** (payload lifecycle):

- absent: no `interviewPrep` on the tailored resume → the hub shows the generate CTA (AC-2)
- draft: payload exists with custom questions only (`generatedAt` null, empty AI set is valid until generation, AC-5)
- generated: after one generation: exactly 3 AI questions plus 3 interviewer questions; further edits mutate content (AC-3)
- per question: AI questions are editable and regenerable; custom questions are editable and deletable; nothing else (AC-4)

**API surface**:

| Surface                                                | Type                                | Key inputs                         | Key outputs                                        | Auth                       | Key errors                                               |
| ------------------------------------------------------ | ----------------------------------- | ---------------------------------- | -------------------------------------------------- | -------------------------- | -------------------------------------------------------- |
| `/[lang]/career-prep`                                  | Server Component read               | session, `?tailoredResumeId` (opt) | selector rows (50 newest), active payload          | session guard, user scoped | 401 sign in, invalid param falls back with notice (AC-8) |
| `/[lang]/career-prep/print`                            | Server Component read, paper render | session, `tailoredResumeId`        | dressed sheet of one owned payload                 | session guard, user scoped | 401, 404 falls back or friendly empty sheet (AC-7, AC-8) |
| `generateInterviewPrepAction` (existing, reused)       | Server Action                       | `tailoredResumeId`                 | persisted v2 payload                               | session, resume owner      | 401, 404, 422, 502 provider error (unchanged)            |
| `saveInterviewPrepAction` (existing, reused)           | Server Action                       | `tailoredResumeId`, v2 payload     | persisted v2 payload                               | session, resume owner      | 401, 404, 422 validation                                 |
| `regenerateInterviewQuestionAction` (existing, reused) | Server Action                       | `tailoredResumeId`, `questionId`   | payload with that one question regenerated         | session, resume owner      | 404, 502; 422 when the target is a custom question       |
| `getCareerPrepSelectorRowsAction` (new, read only)     | Server Action                       | session, `offset: number` (opt)    | next selector chunk (rows newest first, prep flag) | session, user scoped       | 401 sign in                                              |

Read helpers added in `src/lib/db/career-prep.ts` and one slim read action in `src/app/actions/career-prep-actions.ts`: one returns the selector rows (newest tailored version per posting, prep flag computed, cap 50 per chunk), one resolves one owned payload by param and computes the grounding flag (`Profile.workExperiences.length + Profile.projects.length > 0`), one returns the next chunk for load more. No new mutation action exists. Selection lives in the URL (`?tailoredResumeId`): switching runs `router.push` with `scroll: false` after an autosave flush, so Server Component prefetching supplies each payload and deep links plus the back button behave identically.

**Value sourcing** (every value the ACs need, and where it comes from):

| Action or read       | Value produced or displayed                                  | Source                                                                                                                                   |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| selector read        | company, role title, prep status per row                     | `JobPosting.companyName`, `JobPosting.title`, `TailoredResume.interviewPrep` null check (DB columns)                                     |
| selector read        | newest first order, 50 row cap, load more                    | ordered by tailored version creation, `take: 50` (query shape, this spec)                                                                |
| selector read        | default selection                                            | `?tailoredResumeId` param, else the newest row (param, then DB order)                                                                    |
| selector read        | load more chunk                                              | `offset` param to the read action, same query with `skip` and `take: 50` (this spec)                                                     |
| hub read             | hasGrounding banner flag                                     | `Profile.workExperiences.length + Profile.projects.length > 0` (DB, spec 0008 AC-IP-5 reuse)                                             |
| hub read             | normalized payload v2                                        | `TailoredResume.interviewPrep` through the v1 to v2 normalizer (this spec)                                                               |
| hub generate CTA     | generated payload                                            | existing `generateInterviewPrepAction` (spec 0008 engine; grounding from `Profile.projects` and `Profile.workExperiences` per spec 0008) |
| custom add           | new question `id`                                            | `crypto.randomUUID()` (client)                                                                                                           |
| custom add           | cap check (10)                                               | count of `customOrigin === true` in the current payload (derived)                                                                        |
| edit and save        | `updatedAt`                                                  | `new Date().toISOString()` server side in the existing save action                                                                       |
| generation merge     | preserved custom questions                                   | `payload.questions.filter(q => q.customOrigin)` from the existing payload (this spec)                                                    |
| draft bootstrap      | role title, company, language for a custom before generation | `JobPosting.title`, `JobPosting.companyName`, `TailoredResume.language` (DB)                                                             |
| copy full sheet      | label language for the plain text sheet                      | `payload.language` (this spec, consistent with AC-9)                                                                                     |
| copy full sheet      | localized plain text sheet                                   | payload fields plus labels in `payload.language` (client derived)                                                                        |
| print route          | sheet header company, role                                   | `JobPosting.companyName`, `JobPosting.title` (DB)                                                                                        |
| print route          | sheet header date                                            | payload `generatedAt` else `updatedAt`, formatted with the page locale                                                                   |
| hub and print chrome | labels, empty states                                         | bilingual dictionaries (existing i18n loader, spec 0003)                                                                                 |
| content language     | prep content language                                        | `TailoredResume.language` (AC-9, same as the studio)                                                                                     |
| nav link             | label, active state                                          | workspace dictionaries and active path matching (this spec)                                                                              |

**Key invariants**:

- Generation produces exactly 3 categorized STAR questions and exactly 3 interviewer questions (carried from spec 0008, never relaxed).
- At most 10 questions with `customOrigin: true` per payload; the add control disables at the cap.
- Deletion applies only when `customOrigin: true`; AI questions are never deletable.
- Every read and every action is user scoped (`userId` filter or ownership check); a param never bypasses scoping (AC-8).
- Reads tolerate version 1 payloads; every persisted write is version 2 (AC-5).
- Pending autosave flushes before the selection switches jobs or a regeneration runs (carry over of the existing studio guard, AC-3 in both directions); a `beforeunload` guard flushes best effort.
- Selection lives in the URL (`?tailoredResumeId`); switching jobs is a `router.push` with `scroll: false` after the flush, so Server Component prefetching supplies every payload.
- Generation merges instead of overwrites: it keeps every `customOrigin: true` question untouched, replaces only the 3 AI questions and the 3 interviewer questions, stamps `generatedAt`, and writes version 2.
- `saveInterviewPrepAction` rejects a save whose submitted `updatedAt` is older than the stored value with 409, so no entrance clobbers a newer edit.
- The copy full sheet labels follow `payload.language` (AC-6 with AC-9).
- The print button flushes pending autosave, then opens the print route in a new tab; the print route with a missing, unknown, or unowned param redirects to the hub with a friendly notice, never printing a fallback job.
- Custom questions may exist before the first generation; the empty AI set is a legal state (AC-5).

**Security model**:

- Session guard via the shared `requireSession` pattern on both new routes (same as tracker, tailor, resumes).
- All queries and actions scope by the session user; a second user's `tailoredResumeId` resolves as unknown and falls back with the AC-8 notice.
- BYOK provider keys are decrypted ephemerally inside the existing generation action only; no key handling moves into the hub.
- The print route is auth walled and renders one owned payload; it is never publicly indexed (no SEO surface for these routes).
- No new environment variables, secrets, or third party credentials are required.

**Critical test scenarios** (each maps to an AC in Requirements):

- Happy path: open `/career-prep`, the newest job selects itself, its generated payload renders 3 STAR cards and 3 interviewer questions, an edit autosaves and survives reload, verifies **AC-1**, **AC-3**.
- Generate from a draft: select a job without a payload, the inline CTA generates and cards render; on a deep linked arrival the same explicit CTA waits for the click, verifies **AC-2**, **AC-5**.
- Custom question flow: add 3 custom questions with empty STAR skeletons, fill them in, autosave persists version 2, delete one custom question, the payload stays valid and AI questions stay undeletable; a later generation preserves every custom question its edits intact, verifies **AC-4**, **AC-5**.
- Version 1 tolerance: feed a stored version 1 payload to the hub, it renders identically with normalized questions, saves back as version 2, verifies **AC-5**.
- Copy and print: full sheet copy yields localized plain text with all content in the payload language; the hub button flushes then opens the print route in a new tab, the dressed sheet breaks cleanly, and mirrors RTL for Arabic, verifies **AC-6**, **AC-7**.
- Ownership and stale link: second user's resume id or a deleted resume id shows the friendly notice and falls back to the newest job, and the print route with the same bad param redirects to the hub instead of printing a fallback, verifies **AC-8**.
- Failure case: a provider 502 surfaces the existing localized error mapping with a retry on the CTA, autosave flushes before job switching and regeneration, a stale save carrying an expired `updatedAt` returns 409 and the client refetches instead of clobbering, verifies **AC-2**, **AC-3**.
- Density: a heavy account shows the 50 newest rows and load more extends the list, verifies **AC-10**; the nav link highlights on the hub route, verifies **AC-11**.

## Build plan

Build approach: Tracer Bullet (the project default from the scope header, no row override). The plan opens with one thin end to end thread (read path, schema v2, hub shell, existing engine wired in), then thickens with custom questions, print, and nav.

1. Tracer bullet foundation: update the Zod payload schema to version 2 in `src/lib/validations/career-prep.ts` (tolerant read normalizer, conditional empty field rules when `customOrigin: true`), the selector read helper plus one owned payload resolver with the grounding flag in `src/lib/db/career-prep.ts`, and the read only `getCareerPrepSelectorRowsAction(offset)` in `src/app/actions/career-prep-actions.ts` for load more, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-10**
2. Hub page and client shell: the server prefetched `/[lang]/career-prep` page, URL driven selection (`?tailoredResumeId` validated, fallback notice on unknown, deleted, or unowned), `router.push` switching with `scroll: false` after a flush, the `beforeunload` best effort guard, the missing prep inline generate CTA wired to `generateInterviewPrepAction`, and the guidance banner when grounding is empty, satisfies **AC-1**, **AC-2**, **AC-8**
3. Focus view editing: embed the shared component set (`StarQuestionCard`, `InterviewerQuestionsList`) with in place editing, debounced autosave through `saveInterviewPrepAction`, per question regeneration, the per element copy, and the localized copy full sheet action labeled by `payload.language`, satisfies **AC-3**, **AC-6**
4. Custom questions and engine contract: the add question builder (CUSTOM category, customOrigin, empty STAR skeleton, draft bootstrap values from `JobPosting` and `TailoredResume.language`), the cap enforcement at 10, the delete flow persisted through the save action, the stale save 409 guard on `saveInterviewPrepAction`, and the generation merge preserving custom questions while writing version 2, satisfies **AC-4**, **AC-5**
5. Print route: `/[lang]/career-prep/print` rendering the dressed sheet header, no chrome, `break-inside: avoid` pagination, and RTL parity for Arabic, with the invalid param redirect to the hub and the hub button flushing then opening it in a new tab, satisfies **AC-7**
6. Workspace integration: the bilingual nav link with active state via `WorkspaceNavProps.labels` (`careerPrep` key), hub dictionaries for both locales, empty state and notice copy, and the tailor studio Interview Prep tab replaced by the single handoff CTA to the hub, satisfies **AC-8**, **AC-11**, **AC-12**
7. Vitest suites for the schema normalizer (including a version 1 payload that already holds CUSTOM values), read helpers, URL selection and switching, custom flows, the generation merge, the stale save 409, copy sheet assembly, and print route, plus build and lint clean, satisfies **AC-5**, **AC-8** and regression safety for **AC-1** through **AC-12**

## Consequences

**Positive**:

- One dedicated practice surface matches the STAR flow end to end; reaching the practice view is one click from a deep link or the nav.
- The engine, actions, and component set stay single source; no parallel implementation to drift.
- Custom questions extend the sheet without schema surgery: one payload, versioned.
- The list cap keeps the first paint bounded on heavy accounts.

**Negative / tradeoffs**:

- The tailor studio loses its in place interview prep editing; candidates who edited there now use the hub, a behavior change to the delivered scope of feature 9.
- The shared actions gain merge and stale save logic, so the engine contract in spec 0008 grows a little.
- Print styling moves from the studio cards to the print route; the reused components must keep their print rules coherent in the hub, the print route, and nowhere else.

**Neutral**:

- Dictionary files gain a `careerPrep` namespace for both locales, and `WorkspaceNavProps.labels` gains a `careerPrep` key.
- The selector needs an "open in studio" affordance so the tailor entry stays discoverable from the hub.
- The versioned tolerant read is a permanent pattern; every future payload change must respect the normalizer.
- Deferred roadmap items (voice mock interviews, practice state persistence) stay out of this spec.

## Follow-up

- [ ] Consider surfacing the hub deep link from `ApplicationCards` in the tracker when a linked application lacks prep (cheap win, mirror of the tailor handoff)
- [ ] `tailwind-4-docs` conventions live in root `AGENTS.md`; verify a phone sized print sanity pass during `/check verify` (paper and print emulation)
