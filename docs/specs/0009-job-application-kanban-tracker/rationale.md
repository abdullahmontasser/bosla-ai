# 0009. Job application kanban tracker: Decision record

## Context

Job seekers applying to dozens of opportunities experience cognitive overload keeping track of application dates, resume variants, recruiter messages, and upcoming interview appointments. In CareerCraft AI, users can generate ATS optimized resumes, connection pitches, and interview prep cheat sheets. However, without a central tracking hub, these tailored assets remain disconnected from the actual application lifecycle.

Building a tracking surface introduces several architectural forces. First, the experience must feel immediate and responsive; dragging a card between stages should not stutter or freeze while waiting on server round trips. Second, database updates must be efficient. Re ordering cards within a stage should not require locking or rewriting integer indexes across hundreds of database rows. Third, accessibility and internationalization are foundational requirements in this repository. The tracker must support full right to left progression in Arabic, full keyboard navigation, and clear screen reader announcements for visually impaired candidates.

Finally, the application tracker must integrate cleanly with the existing Resume Tailoring Studio. Candidates should be able to create an application directly from the board or promote a freshly generated resume into their tracked pipeline with a single click.

## Options considered

### Option 1: Modular `@dnd-kit` kanban board with fractional indexing and slide over drawer

A client side kanban board powered by `@dnd-kit/core` and `@dnd-kit/sortable`. Card positions within columns use floating point fractional indexing (calculating the midpoint between adjacent cards). Clicking a card opens a slide over drawer containing job posting details, attached resume analytics, and editable metadata. Moving cards triggers optimistic updates using React 19 `useOptimistic` backed by Next.js Server Actions.

**Pros**:

- Excellent accessibility with native keyboard sensors and ARIA announcements.
- Fractional indexing allows single row database updates without cascading transactions.
- Slide over drawer keeps the candidate in the board context without full page reloads.
- `@dnd-kit` modular architecture easily accommodates right to left layout mirroring.

**Cons**:

- Adds external dependencies for drag interactions.
- Fractional math requires a re balancing safety mechanism if cards are repeatedly placed in the same exact gap hundreds of times.

### Option 2: Table and list view with status dropdowns and full page detail routes

A traditional data table or segmented list where candidates change application status through dropdown menus rather than spatial drag and drop gestures. Clicking an application navigates to a dedicated full page URL (`/[locale]/tracker/[id]`) for editing metadata and inspecting attached resumes.

**Pros**:

- Zero additional drag and drop dependencies, keeping JavaScript bundle sizes minimal.
- Simple integer ordering or pure timestamp sorting without fractional math.
- Deep linking to specific application records via unique URLs.

**Cons**:

- Less intuitive and less visual for candidates who prefer kanban board mental models.
- Context switching to dedicated full pages slows down rapid review across multiple applications.
- Changing statuses through dropdowns takes more clicks and feels mechanical.

### Option 3: Heavy enterprise kanban board with custom dynamic columns and tag engines

A complex board architecture supporting arbitrary user created stages, custom tag coloring, multi selection bulk actions, and rich text note editors.

**Pros**:

- Highly customizable for power users who want tailored stage names or complex interview funnels.
- Granular categorization through custom tags and labels.

**Cons**:

- Significantly increases schema complexity, requiring new tables for custom columns, colors, and tag mappings.
- Overwhelms candidates who need a clean, standard workflow matching real world hiring stages.
- Much slower to implement, delaying core vertical slice delivery.

## Rationale

Option 1 is selected because it matches the core product vision of CareerCraft AI: providing a clean, accessible, and fast career management workflow.

The existing Prisma schema already models `Application` records with a floating point `sortOrder` and an `ApplicationStatus` enum representing the five standard stages. Option 1 takes advantage of this established schema, requiring only minor column additions for interview dates and contact details without disrupting relational integrity.

Using `@dnd-kit` ensures full compliance with our bilingual and accessibility standards. By configuring pointer constraints and keyboard sensors, keyboard users and mobile touch users enjoy first class support. Combining fractional indexing with React 19 `useOptimistic` guarantees instant visual feedback while keeping database writes down to a single row update per drag action.
