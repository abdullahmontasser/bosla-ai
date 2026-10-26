# 0009. Job application kanban tracker

**Date**: 2026-10-26
**Status**: Accepted

## Summary

This specification defines the job application kanban tracker for CareerCraft AI. It gives candidates a visual five column board to track their job hunt progress from saved posting to final offer. Each card connects directly to tailored resumes, applicant tracking system match scores, generated outreach notes, and interview preparation materials. Building this vertical slice introduces accessible drag and drop reordering with optimistic updates, fractional index ranking, and full right to left layout mirroring for Arabic users.

## Requirements

**User stories**:

- As a job seeker, I want to organize my job applications on a visual kanban board across standard hiring stages so that I always know the status of every role.
- As a job seeker, I want to move application cards between stages with smooth drag and drop gestures or accessible keyboard shortcuts so that updating my pipeline is quick and effortless.
- As a job seeker, I want each card to connect to its tailored resume, match score, and outreach notes so that I have all application materials in one place.
- As an Arabic speaking candidate, I want the kanban columns to flow naturally from right to left with full interface mirroring so that tracking matches my native reading habits.

**Acceptance criteria**:

- **AC-1**: Render a responsive kanban board at `/[lang]/tracker` with five standard columns (`Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`), supporting bilingual layouts where columns progress right to left in Arabic and left to right in English.
- **AC-2**: Support accessible drag and drop reordering between and within columns using `@dnd-kit`, including a pointer sensor activation constraint of eight pixels, keyboard sensor with sortable coordinates inverted for Arabic right to left progression, and live accessibility announcements.
- **AC-3**: Compute card placement using fractional indexing midpoint math on the client, persisting updated `sortOrder` and `status` values to PostgreSQL through authenticated Server Actions without mass renumbering.
- **AC-4**: Provide instantaneous optimistic card updates in the user interface using React 19 `useOptimistic`, rolling back smoothly to the previous column and displaying an accessible error toast notification if the server mutation fails.
- **AC-5**: Automatically record the `appliedAt` timestamp when an application card transitions into the `Applied` column for the first time, preserving existing timestamps on subsequent moves.
- **AC-6**: Provide quick card actions directly on cards, including a status change dropdown menu, an ATS score badge linking to analysis or creation, and a one click copy button for the LinkedIn connection note variant.
- **AC-7**: Open an interactive slide over drawer when clicking an application card, presenting full job posting details, attached tailored resume breakdown, editable compensation, location, interview date, recruiter contact info, and personal notes.
- **AC-8**: Display visual follow up indicators on application cards that remain in `Applied` status past seven days since applied or in `Interviewing` status past their scheduled interview date.
- **AC-9**: Provide a real time toolbar with text search across company and role title, minimum ATS match score filtering, and a toggle to isolate applications requiring follow up attention, safely disabling drag gestures while active to preserve underlying card ordering.
- **AC-10**: Support quick application creation through a modal dialog on the kanban board with default descriptions and initial sort spacing, and provide an Add to Tracker action within the Tailor Studio to instantly link a freshly tailored resume.

## Decision

**Chosen option**: Option 1: Modular `@dnd-kit` kanban board with fractional indexing, slide over details drawer, and React 19 optimistic updates.

This architecture delivers a lightweight, highly accessible, and modular kanban interface. It reuses existing PostgreSQL relational models while adding structured tracking fields, avoiding full database table renumbers through floating point midpoint sorting.

**Implementation skills**: `web-dnd-dnd-kit` (`agents-inc/skills`, `.agents/skills/web-dnd-dnd-kit/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md)

## Feature design

**Data model sketch**:
The feature enhances the existing Prisma `Application` model with structured job hunt metadata while maintaining foreign keys to `JobPosting`, `TailoredResume`, and `User`.

```prisma
model Application {
  id               String            @id @default(cuid())
  userId           String            @map("user_id")
  jobPostingId     String            @map("job_posting_id")
  tailoredResumeId String?           @map("tailored_resume_id")
  status           ApplicationStatus @default(SAVED)
  sortOrder        Float             @default(0) @map("sort_order")
  appliedAt        DateTime?         @map("applied_at")
  interviewDate    DateTime?         @map("interview_date")
  compensation     String?           @db.VarChar(128)
  location         String?           @db.VarChar(128)
  contactName      String?           @map("contact_name") @db.VarChar(128)
  contactEmail     String?           @map("contact_email") @db.VarChar(255)
  notes            String?           @db.Text
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPosting     JobPosting      @relation(fields: [jobPostingId], references: [id], onDelete: Restrict)
  tailoredResume TailoredResume? @relation(fields: [tailoredResumeId], references: [id], onDelete: SetNull)

  @@unique([userId, jobPostingId])
  @@index([userId, status, sortOrder])
  @@index([userId, interviewDate])
  @@index([jobPostingId])
  @@index([tailoredResumeId])
  @@map("applications")
}
```

**State transitions and card placement math**:

- Valid statuses: `SAVED` -> `APPLIED` -> `INTERVIEWING` -> `OFFER` or `REJECTED`.
- When an application transitions into `APPLIED` and `appliedAt` is null, the action automatically assigns `appliedAt = now()`.
- Top insertion: if a card is placed before the first card with `sortOrder = X`, new `sortOrder` is `X > 0 ? X / 2 : X - 1000.0`.
- Bottom insertion: if placed after the last card with `sortOrder = Y`, new `sortOrder` is `Y + 1000.0`.
- Between two cards: midpoint `(previousSortOrder + nextSortOrder) / 2`.
- Empty column: default `sortOrder = 1000.0`.
- Re balancing safeguard: if the delta between adjacent cards falls below `0.0001`, all cards in that single column are re spaced at increments of `1000.0`.

**API surface**:
All mutations and queries use Server Actions located in `src/app/actions/application-actions.ts`.

| Action                            | Method        | Key inputs                                                                | Key outputs                                | Auth                  | Key errors                                           |
| :-------------------------------- | :------------ | :------------------------------------------------------------------------ | :----------------------------------------- | :-------------------- | :--------------------------------------------------- |
| `getApplications`                 | Server Action | None (scoped to session)                                                  | `applications: ApplicationWithRelations[]` | Authenticated session | 401 Unauthorized                                     |
| `updateApplicationStatusAndOrder` | Server Action | `applicationId: string`, `status: ApplicationStatus`, `sortOrder: number` | `application: Application`                 | Authenticated session | 401 Unauthorized, 404 Not Found                      |
| `createApplication`               | Server Action | `payload: CreateApplicationInput`                                         | `application: Application`                 | Authenticated session | 400 Validation Error, 401 Unauthorized, 409 Conflict |
| `updateApplicationDetails`        | Server Action | `payload: UpdateApplicationDetailsInput`                                  | `application: Application`                 | Authenticated session | 401 Unauthorized, 404 Not Found                      |
| `deleteApplication`               | Server Action | `applicationId: string`                                                   | `success: boolean`                         | Authenticated session | 401 Unauthorized, 404 Not Found                      |

Type definitions:

- `ApplicationWithRelations`: includes `jobPosting: { id, title, companyName, jobUrl, rawDescription }` and `tailoredResume: { id, atsScore, atsBreakdown, outreachMessage }`.
- `CreateApplicationInput`: either `{ jobPostingId: string, tailoredResumeId?: string, status?: ApplicationStatus }` (from Tailor Studio) OR `{ title: string, companyName: string, rawDescription?: string, jobUrl?: string, status?: ApplicationStatus }` (from quick add modal; defaults `rawDescription` to title if omitted).
- `UpdateApplicationDetailsInput`: `{ applicationId: string, title?: string, companyName?: string, jobUrl?: string, compensation?: string, location?: string, interviewDate?: string | null, contactName?: string, contactEmail?: string, notes?: string }`.

**Value sourcing**:

| Action                            | Value produced / displayed                                                          | Source                                                                                                                    |
| :-------------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `updateApplicationStatusAndOrder` | `status`                                                                            | Dropped column identifier from `@dnd-kit` drag event                                                                      |
| `updateApplicationStatusAndOrder` | `sortOrder`                                                                         | Client fractional index midpoint between adjacent cards in target column                                                  |
| `updateApplicationStatusAndOrder` | `appliedAt`                                                                         | Current timestamp generated on server if entering `APPLIED` and `appliedAt` is null                                       |
| `createApplication`               | `jobPostingId`                                                                      | Existing `jobPostingId` from studio or newly inserted `JobPosting` record id                                              |
| `createApplication`               | `rawDescription`                                                                    | Supplied form text or fallback string generated from job title                                                            |
| `createApplication`               | `sortOrder`                                                                         | Calculated on server as `max(sortOrder in column) + 1000.0`                                                               |
| `createApplication`               | `tailoredResumeId`                                                                  | Selected resume id from studio action or optional drawer picker                                                           |
| `updateApplicationDetails`        | `title`, `companyName`, `jobUrl`                                                    | Form inputs in drawer, persisted to linked `JobPosting` record                                                            |
| `updateApplicationDetails`        | `compensation`, `location`, `interviewDate`, `contactName`, `contactEmail`, `notes` | Form input values in the slide over drawer, persisted to `Application`                                                    |
| Board card view                   | `atsScore`                                                                          | Attached `TailoredResume.atsScore` relation; shows attach prompt if null                                                  |
| Board card view                   | Outreach copy text                                                                  | `TailoredResume.outreachMessage.connectionNoteText` with fallback to `inMail.body`                                        |
| Board card view                   | `followUpRequired`                                                                  | Derived client boolean (`APPLIED` with `appliedAt` older than 7 days, or `INTERVIEWING` with `interviewDate` in the past) |

**Key invariants**:

- Every application record is strictly scoped to `userId` from the authenticated session.
- A user cannot create duplicate application records for the exact same `jobPostingId` (enforced by database unique constraint `[userId, jobPostingId]`).
- Secondary query sort: `getApplications` orders by `sortOrder ASC`, followed by `createdAt ASC` as a deterministic tie breaker.
- Drag gestures are disabled during active search or staleness filtering to prevent visual reordering from corrupting positions of hidden cards.
- Deleting an application deletes the `Application` record while keeping the `JobPosting` and `TailoredResume` records intact.

**Security model**:

- Every database query and mutation enforces user ownership (`where: { id: applicationId, userId: session.user.id }`).
- Anonymous visitors are redirected to sign in before viewing the tracker.
- Input validation uses strict Zod schemas with sanitized string bounds to prevent injection.

**Configuration required**:

- None. Reuses existing PostgreSQL database and environment settings. Staleness threshold preference is stored in client browser storage.

**Critical test scenarios**:

- Happy path: User creates an application, drags it from Saved to Applied, verifies `appliedAt` auto populates, and inspects details in the drawer, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-7**.
- Drag rollback on failure: Server action fails or network disconnects during drop; board rolls back card to original column and displays error message, verifies **AC-4**.
- Arabic right to left layout: Board renders in Arabic locale at `/[lang]/tracker`, columns order right to left (`Saved` on right, `Offer` on left), and keyboard navigation respects inverted horizontal steps, verifies **AC-1**, **AC-2**.
- Pointer activation constraint: Clicking a card with mouse movement under eight pixels opens the drawer without initiating a drag event, verifies **AC-2**, **AC-7**.
- Quick outreach copy: User clicks copy outreach button on card, clipboard receives saved connection note from tailored resume, verifies **AC-6**.
- Staleness badge trigger: Card with `appliedAt` older than seven days in `Applied` displays follow up badge and responds to toolbar filter, verifies **AC-8**, **AC-9**.
- Studio integration: User tailors resume in studio, clicks Add to Tracker, and confirms card appears in kanban tracker linked to existing job posting without duplication, verifies **AC-10**.

## Build plan

- [x] 1. Database migration: Update Prisma schema with new `Application` fields (`interviewDate`, `compensation`, `location`, `contactName`, `contactEmail`), add indexes, generate Prisma client, and run migration, satisfies **AC-3**, **AC-5**.
- [x] 2. Application Server Actions: Implement `src/app/actions/application-actions.ts` with Zod validation schemas, user session authentication checks, fractional index calculations, and automated `appliedAt` setting, satisfies **AC-3**, **AC-5**.
- [x] 3. Kanban layout primitives and column shell: Create bilingual kanban page route `/[lang]/tracker` and container components supporting right to left and left to right column ordering, satisfies **AC-1**.
- [x] 4. Drag and drop integration with optimistic updates: Wire `@dnd-kit/core` and `@dnd-kit/sortable` multi container context, DragOverlay, keyboard sensor with Arabic coordinate inversion, and React 19 `useOptimistic` hook with rollback handling, satisfies **AC-2**, **AC-4**.
- [x] 5. Application card and quick actions: Build interactive kanban card component displaying company name, role title, ATS score badge, quick status change menu, and one click outreach copy button, satisfies **AC-6**, **AC-8**.
- [x] 6. Slide over details drawer: Implement accessible drawer sheet displaying full job description, attached resume breakdown, recruiter contact fields, and editable notes with auto saving Server Actions, satisfies **AC-7**.
- [x] 7. Filter toolbar and empty states: Build board header with live text search, ATS score threshold slider, follow up staleness filter toggle, and empty column drop targets, satisfies **AC-8**, **AC-9**.
- [x] 8. Quick add modal and Studio integration: Implement quick create modal on the board, and add Add to Tracker button in the Tailor Studio action bar linking generated resumes to tracked applications, satisfies **AC-10**.
- [x] 9. Verification and tests: Write unit and component tests with Vitest covering fractional indexing calculations, optimistic rollbacks, staleness filtering, and bilingual rendering, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.

## Consequences

**Positive**:

- Provides job seekers with an intuitive visual overview of their job hunt pipeline.
- Tight integration with tailored resumes and outreach messages turns passive tracking into an actionable career workflow.
- Fractional indexing prevents expensive database re ordering transactions on every card movement.
- Full bilingual right to left support ensures Arabic native users enjoy a first class experience.

**Negative / tradeoffs**:

- Floating point fractional math requires a re balancing fallback if cards are repeatedly inserted into identical positions hundreds of times.
- Adding drag and drop dependencies (`@dnd-kit`) adds approximately 15 kilobytes to client bundle size on the tracker route.

**Neutral**:

- Requires running one Prisma migration on the PostgreSQL database to add five optional columns to the `applications` table.

## Follow-up

- [ ] Update root `AGENTS.md` to reference newly installed community skill `web-dnd-dnd-kit` in `.agents/skills/web-dnd-dnd-kit/`.
