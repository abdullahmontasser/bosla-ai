# 0015. Streamlined Tailor Studio and Outreach (Rationale)

## Context

In Slice 1 of CareerCraft AI, the tailoring studio at `/tailor` was created as the initial walking skeleton. At that time, candidate profile management had not yet been built as an independent tool, so `StudioContainer` included an inline `ExperienceForm` allowing users to edit their headline, career summary, and past work experiences directly beside the job description input.

With the release of Slice 8 Feature 15 (`0013-candidate-profile-and-photo-management`), candidate master profiles and avatars were decoupled into a dedicated focus workspace at `/profile`. Leaving full experience editing forms embedded inside `/tailor` introduced severe visual clutter, duplicated state management, and created ambiguity about whether edits made in the tailor studio updated the global profile or only that single tailoring run.

Simultaneously, the tailor studio accumulated multiple heavy tabs across ATS optimization, career outreach generation, and interview preparation. As interview preparation transitions into its own dedicated focus hub at `/career-prep` (Slice 8 Feature 18), the studio requires refactoring to focus tightly on its core job: accepting job posting requirements, executing live AI tailoring, scoring ATS compatibility, providing instant vector PDF export, and offering clean handoffs to downstream tracking and interview prep.

Furthermore, initial page loads currently fetch full JSON blobs for both outreach and interview prep even when users only came to view or export their tailored resume. Establishing efficient data access boundaries and isolated streaming state is necessary to keep the studio fast, responsive, and maintainable.

## Options considered

### Option 1: In place refactor with decoupled profile state, lazy loaded outreach accordion, and unified handoff action bar (Chosen)

Refactor `StudioContainer` in place. Replace the bulky `ExperienceForm` with a read only candidate badge in the header, while displaying a friendly alert banner with a link to `/profile` if no profile exists. Dock the ATS score card and vector PDF export button at the top of generation results, nest outreach messages inside a collapsible accordion that lazy loads message content on demand, and provide a unified bottom action bar for Kanban tracker and interview prep handoffs.

**Pros**:

- Solves cognitive overload immediately by removing hundreds of lines of inline profile form inputs.
- Preserves the existing `/tailor` route and user familiarity while dramatically accelerating initial page render.
- Drastically reduces database query payload by dropping dead interview prep fields and lazy loading outreach JSON.
- Provides a direct, predictable workflow connecting tailoring results to both application tracking and interview practice.

**Cons**:

- Users wanting to tweak their base bullet points must navigate to `/profile` rather than making ad hoc edits in the studio.
- Expanding the outreach accordion introduces an asynchronous loading state.

### Option 2: Multi step wizard modal

Convert the tailoring flow into a multi step wizard dialog (Step 1: Confirm Profile, Step 2: Job Description, Step 3: Stream and ATS Score, Step 4: Outreach and Tracker).

**Pros**:

- Isolates each user decision into a distinct dialog step.

**Cons**:

- Introduces modal lock in, preventing candidates from comparing the job posting against the live streaming resume side by side.
- Adds unnecessary wizard navigation friction for experienced candidates running multiple tailoring jobs in sequence.
- Increases client component bundle complexity.

### Option 3: Retain existing tabs layout with minor styling cleanup

Keep the three tab layout (ATS, Outreach, Interview Prep) inside `/tailor`, only hiding `ExperienceForm` behind a collapsible toggle.

**Pros**:

- Requires fewer component structure modifications.

**Cons**:

- Keeps duplicate interview prep code alive in two locations once the dedicated `/career-prep` hub launches.
- Fails to fix the initial database payload bloat from querying unneeded interview prep JSON.
- Keeps outreach buried under a tab switch rather than offering a clean, progressive disclosure accordion directly attached to the tailored document.

## Rationale

Option 1 provides the cleanest architecture and the best developer and user experience.

Decoupling candidate profile editing from `/tailor` aligns directly with the single responsibility principle. Now that candidates have `/profile` for maintaining their master resume, avatar, and work history, the tailoring studio functions as a specialized job pipeline. Candidates who arrive without a master profile receive clear guidance and an immediate path to create one, which prevents low quality AI generations based on empty candidate data.

Docking the ATS score card and the vector PDF export button prominently at the top of the completed studio delivers immediate feedback on resume match quality and instant access to download the final document. Placing outreach in a collapsible accordion honors user attention: candidates who only need the resume can export it without distraction, while those wanting to send connection notes or recruiter messages can expand the accordion in place.

From an operational and performance perspective, eliminating `interviewPrep` from `getTailorStudioInitialData` and lazy loading `outreachMessage` slashes initial database response size and client memory footprint. Adding the composite index on `[userId, createdAt]` ensures that users with long tailoring histories experience instant initial page loads without sequential table scans.
