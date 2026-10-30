# 0015. Streamlined Tailor Studio and Outreach

**Date**: 2026-10-29  
**Status**: Accepted

## Summary

This decision refactors the tailoring studio at `/tailor` to focus strictly on job input, live AI streaming, job specific ATS match scoring, vector PDF export, and a collapsible outreach accordion. Inline profile editing is completely removed because candidate data is now managed in the dedicated profile hub, removing clutter and form overhead. Users without a master profile see a friendly alert banner directing them to create one before tailoring, while completed results link directly to the job tracker and career prep with one click handoffs.

## Requirements

**User stories**:

- As a job seeker with an existing candidate profile, I want a clean tailor studio focused purely on job inputs so that I can generate tailored resumes rapidly without navigating inline profile fields.
- As a candidate who just tailored a resume, I want to see my ATS match score and download my vector PDF immediately, with optional outreach messages collapsed until I need them.
- As an applicant moving through hiring stages, I want one click actions to save my tailored application to the Kanban tracker and open interview prep practice for this exact job.

**Acceptance criteria**:

- **AC-1**: Query performance on `getTailorStudioInitialData` is optimized with a composite database index on `[userId, language, createdAt(sort: Desc)]`, dead payload elimination (`interviewPrep` removed), and server component data prefetching in `page.tsx`.
- **AC-2**: When candidate profile is missing, the studio displays a clear alert banner prompting the user to create a master profile, provides a direct button to `/profile`, and keeps the tailoring generate button disabled.
- **AC-3**: When candidate profile exists, the studio displays a compact badge in the studio header showing candidate headline and verified email status (`User.emailVerified !== null`), without rendering inline profile form fields.
- **AC-4**: Initiating resume tailoring streams live response text smoothly into the preview island, isolating token chunk rendering so surrounding inputs and forms do not experience layout thrashing.
- **AC-5**: Upon generation completion, job specific ATS match score, skills gap summary, and XYZ bullet recommendations display prominently in `AtsWorkbench` (hydrated from `tailoredContent.workExperiences` or `calculateAtsScoreAction`).
- **AC-6**: The vector PDF export button embedded within `AtsWorkbench` header sits directly beside the ATS match score, streaming the downloadable PDF from `/api/resumes/[id]/pdf`.
- **AC-7**: Outreach messaging is embedded as a collapsible accordion beneath the ATS workbench, defaulting to collapsed with an accurate status badge (Pending when ungenerated, Ready when existing), and lazy loading full message payload upon first expand.
- **AC-8**: The unified bottom action bar provides a one click action to save the tailored resume to the application tracker (hydrated with initial `hasApplication` status), updating state to "View in Tracker" without throwing duplicate errors if already saved.
- **AC-9**: The unified bottom action bar provides a "Practice STAR Interview Questions" button that deep links directly to `/career-prep?tailoredResumeId=[id]` passing complete job context.
- **AC-10**: The studio interface operates bilingually with full right to left layout in Arabic and left to right in English, meets accessibility standards for keyboard navigation, and passes all unit and component tests.

## Decision

**Chosen option**: Option 1: In place refactor with decoupled profile state, lazy loaded outreach accordion, and unified handoff action bar.

Refactor `/tailor` into a focused job tailoring workstation that consumes master profile data as read only input, isolates live streaming performance, integrates ATS scoring and vector PDF export into the main results view, tucks outreach into a collapsible lazy loaded accordion, and provides dedicated handoff links to the tracker and career prep hub.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:
Existing entities are reused without new tables. One targeted composite index is added to PostgreSQL schema via Prisma:

```prisma
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
  @@index([userId, language, createdAt(sort: Desc)])
  @@map("tailored_resumes")
}
```

**State transitions**:

- Page load:
  - If `profile === null`: State is `MISSING_PROFILE`. Banner displayed, Generate button disabled.
  - If `profile !== null` and no prior resume: State is `READY_TO_TAILOR`. Minimal candidate badge shown, job form active.
  - If `latestTailoredResume` exists: State is `COMPLETED`. Job form populated from `latestTailoredResume.jobPosting`, results workbench visible with ATS score and PDF download.
- Generation cycle:
  - User submits job posting: State transitions to `GENERATING`. AbortController armed.
  - Live token streaming: Preview updates incrementally in isolated component.
  - Generation complete: State transitions to `COMPLETED`. `tailoredResumeId` stored in state, `AtsWorkbench` triggers `calculateAtsScoreAction(tailoredResumeId)` client side automatically if score is null, outreach ready badge enabled, action bar available.
  - User stops generation: State transitions to `FAILED` with user stopped notice, retry button active.
- Outreach accordion:
  - Default: `COLLAPSED`. No outreach JSON loaded on initial page load.
  - Toggle open: If `hasOutreach` is true, fetches outreach payload via `getOutreachMessageAction(tailoredResumeId)` if not already cached. If `hasOutreach` is false, displays generator controls (tone selector, recipient type selector, "Generate Outreach" CTA button) to create messages on demand.

**API surface**:

| Endpoint or Action           | Method        | Key inputs                                                                                                | Key outputs                                                                                                                                                                                                                  | Auth             | Key errors                                                 |
| ---------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| `getTailorStudioInitialData` | Server Action | `language: Language`                                                                                      | `session, profile (compact with headline and emailVerified), activeProvider, defaultModel, configuredProviders, latestTailoredResume (id, atsScore, atsBreakdown, hasOutreach, hasApplication, tailoredSummary, jobPosting)` | Session required | 401 Unauthorized                                           |
| `getOutreachMessageAction`   | Server Action | `tailoredResumeId: string`                                                                                | `success: boolean, data: OutreachMessagePayload`                                                                                                                                                                             | Session required | 401 Unauthorized, 404 Not Found                            |
| `/api/tailor`                | POST          | `profileId: string, jobTitle: string, companyName: string, rawJobDescription: string, language: Language` | ReadableStream of text/event-stream                                                                                                                                                                                          | Session required | 400 Invalid input, 401 Unauthorized, 404 Profile not found |
| `/api/resumes/[id]/pdf`      | GET           | `lang: string`                                                                                            | Application/pdf binary stream                                                                                                                                                                                                | Session required | 401 Unauthorized, 404 Not Found                            |
| `createApplication`          | Server Action | `title: string, companyName: string, status: SAVED, tailoredResumeId: string`                             | `success: boolean, application`                                                                                                                                                                                              | Session required | 401 Unauthorized                                           |

**Value sourcing**:

| Action                       | Value produced or displayed              | Source                                                                            |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `getTailorStudioInitialData` | Candidate name and headline badge        | Profile table `headline`, User table `name`                                       |
| `getTailorStudioInitialData` | Configured AI provider status            | ProviderSettings table `isActive`, `provider`                                     |
| `getTailorStudioInitialData` | Latest resume identification             | TailoredResume table `id`, `atsScore`, `atsBreakdown`                             |
| `getTailorStudioInitialData` | Left column job form prefilled values    | JobPosting relation on TailoredResume `title`, `companyName`, `rawDescription`    |
| `getTailorStudioInitialData` | Outreach presence indicator              | Derived: boolean test on TailoredResume `outreachMessage !== null`                |
| `/api/tailor` POST           | Generated tailored summary and bullets   | AI SDK streamText derived from Profile experiences and raw job posting            |
| `getOutreachMessageAction`   | InMail, connection notes, and email copy | TailoredResume table `outreachMessage` JSON column                                |
| PDF Export Button            | Downloadable vector PDF document         | Generated server side by React PDF route reading TailoredResume `tailoredContent` |
| Add to Tracker Button        | Linked application record                | Application table linked to `jobPostingId` and `tailoredResumeId`                 |
| Career Prep Deep Link        | Navigation URL                           | Client route: `/${lang}/career-prep?tailoredResumeId=${tailoredResumeId}`         |

**Key invariants**:

- Tailoring cannot execute without an active master profile associated with the user session.
- Live streaming tokens update only the preview sub-tree to prevent keystroke or form lag.
- Interview prep data is never queried or transmitted on `/tailor`, preserving bandwidth for the dedicated career prep hub.
- Opening and closing the outreach accordion does not trigger a re-run of the ATS calculation or resume generator.

**Security model**:

- Route guard `requireSession` redirects unauthenticated visitors to login with return path set to `/${lang}/tailor`.
- All Server Actions and API handlers verify `session.user.id` ownership against the target `TailoredResume` and `Profile` records before returning data.
- Job descriptions and generated outputs are scoped strictly to the authenticated tenant user.

**Configuration required**:

- None. Reuses existing environment keys (`DATABASE_URL`, `AUTH_SECRET`, AI provider keys).

**Critical test scenarios**:

- Happy path: User with master profile enters job description, initiates tailoring, observes live streaming, receives ATS score with PDF download button, expands outreach accordion, and clicks "Add to Tracker", verifies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.
- Missing profile flow: User without candidate profile visits `/tailor`, observes alert banner with link to `/profile`, confirms generate button is disabled, verifies **AC-2**.
- Streaming isolation: High frequency streaming token delivery does not cause input latency or re-render cycles in adjacent job form components, verifies **AC-4**.
- Deep link handoff: Clicking "Practice STAR Interview Questions" navigates to `/career-prep` with matching query parameter `tailoredResumeId`, verifies **AC-9**.
- Duplicate tracker guard: Clicking "Add to Tracker" on an application that is already present succeeds gracefully and toggles to "View in Tracker", verifies **AC-8**.
- Bilingual rendering: Interface correctly switches layout direction and typography when toggling between Arabic and English, verifies **AC-10**.

## Build plan

The build plan follows Tracer Bullet ordering, standing up a lean end to end thread through schema and state first, then refining the UI islands and handoffs.

- [x] 1. Create Prisma migration for `@@index([userId, language, createdAt(sort: Desc)])` on `TailoredResume` and update `getTailorStudioInitialData` to include `jobPosting` details, remove `interviewPrep` from initial select, and return `hasOutreach` boolean, satisfies **AC-1**
- [x] 2. Refactor `StudioContainer` to remove `ExperienceForm`, adding the friendly missing profile alert banner and minimal candidate header badge, satisfies **AC-2**, **AC-3**
- [x] 3. Create lightweight `getOutreachMessageAction` Server Action for on demand outreach payload fetching, satisfies **AC-7**
- [x] 4. Update `LiveTailorStream` component and parent container to isolate streaming state and prevent layout thrashing, satisfies **AC-4**
- [x] 5. Streamline the post generation workbench by docking `AtsWorkbench` and `PdfExportButton` side by side at the top of results, satisfies **AC-5**, **AC-6**
- [x] 6. Implement the collapsible `OutreachAccordion` component beneath ATS metrics with lazy loading trigger and state badge, satisfies **AC-7**
- [x] 7. Build the unified bottom action bar with optimistic "Add to Tracker" flow and deep link button to `/career-prep`, satisfies **AC-8**, **AC-9**
- [x] 8. Add Arabic and English dictionary strings for the new alert banners, badge hints, and handoff actions, satisfies **AC-10**
- [x] 9. Write unit and component tests verifying profile guard states, accordion expansion, and action bar navigation, satisfies **AC-10**

## Consequences

**Positive**:

- Eliminates redundant profile editing inputs from the tailoring workspace.
- Faster page load and lower database throughput by eliminating dead `interviewPrep` queries and lazy loading outreach JSON.
- Higher visual focus on the core value proposition: ATS match scoring and vector PDF download.
- Seamless navigation flow connecting tailoring results to application tracking and interview preparation.

**Negative / tradeoffs**:

- Users must visit `/profile` if they wish to adjust experience bullets before tailoring, adding one navigation step.
- Expanding the outreach accordion introduces a small loading spinner while fetching message text on demand.

**Neutral**:

- Requires one forward safe database index migration on PostgreSQL.
- Deprecates inline use of `ExperienceForm` inside the tailor module.

## Migration plan

**Strategy**: Strangler in place. The refactor modifies the existing `/tailor` route without breaking database compatibility or existing tailored resume records.

**Phases**:

1. Phase 1: Apply Prisma index migration for `TailoredResume`. Existing records remain untouched.
2. Phase 2: Deploy updated Server Action `getTailorStudioInitialData` with dead payload removal and `hasOutreach` boolean flag.
3. Phase 3: Replace `StudioContainer` inline profile forms with the minimal badge, alert banner, and lazy loaded accordion.
4. Phase 4: Verify test suite and run end to end browser check.

**Rollback**:

- Revert application code commit. The added database index is purely additive and causes no breaking changes to previous code versions.

**Risks**:

- Users with older cached client bundles during deploy might make an initial call with outdated payload expectations. Mitigated by Next.js version skew mitigation and backward compatible Server Action signatures.

## Follow-up

- [ ] Complete Slice 8 feature 18 (`0016-dedicated-career-prep-and-star-hub`) to consume the `tailoredResumeId` deep link parameter implemented in this studio.
